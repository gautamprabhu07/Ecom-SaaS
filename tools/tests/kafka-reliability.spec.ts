//Path: tools/tests/kafka-reliability.spec.ts
//unit tests for the pieces that make the Kafka pipeline safe: retry, dead-letter handling, idempotency, shutdown
import { withRetry, RetriesExhaustedError } from "../../packages/utils/kafka/retry";
import { createEventDeduper, KeyValueStore, PROCESSED_TTL_SECONDS } from "../../apps/kafka-service/src/idempotency";
import { createShutdownManager } from "../../packages/utils/kafka/shutdown";
import { buildDeadLetter, dlqTopicFor, sendToDlq, setDeadLetterFallback, __resetDlqForTests } from "../../packages/utils/kafka/dlq";
import { runChecks } from "../../packages/utils/kafka/health";
import { getProducer } from "../../packages/utils/kafka/producer";

jest.mock("../../packages/utils/kafka/producer", () => ({ getProducer: jest.fn() }));
const mockedGetProducer = getProducer as jest.Mock;

describe("withRetry", () => {
  it("returns the result without waiting when the first attempt works", async () => {
    const sleep = jest.fn().mockResolvedValue(undefined);
    await expect(withRetry(async () => "ok", { sleep })).resolves.toBe("ok");
    expect(sleep).not.toHaveBeenCalled();
  });

  it("backs off 200ms, 400ms, 800ms between the four attempts, then gives up", async () => {
    const delays: number[] = [];
    const task = jest.fn().mockRejectedValue(new Error("db down"));
    const error = await withRetry(task, { sleep: async (ms) => void delays.push(ms) }).catch((e) => e);

    expect(delays).toEqual([200, 400, 800]);
    expect(task).toHaveBeenCalledTimes(4); //1 attempt + 3 retries
    expect(error).toBeInstanceOf(RetriesExhaustedError);
    expect(error.attempts).toBe(4);
    expect(error.lastError.message).toBe("db down");
  });

  it("stops retrying as soon as an attempt succeeds", async () => {
    const delays: number[] = [];
    const task = jest.fn().mockRejectedValueOnce(new Error("blip")).mockRejectedValueOnce(new Error("blip")).mockResolvedValue("recovered");
    await expect(withRetry(task, { sleep: async (ms) => void delays.push(ms) })).resolves.toBe("recovered");
    expect(task).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([200, 400]);
  });

  it("reports each retry", async () => {
    const seen: [number, number][] = [];
    await withRetry(jest.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValue(1), {
      sleep: async () => undefined,
      onRetry: (_error, retryNumber, delay) => seen.push([retryNumber, delay]),
    });
    expect(seen).toEqual([[1, 200]]);
  });
});

describe("createEventDeduper", () => {
  const memoryStore = () => {
    const data = new Map<string, { value: string; ttl: number }>();
    const store: KeyValueStore = {
      exists: async (key) => (data.has(key) ? 1 : 0),
      set: async (key, value, _mode, seconds) => void data.set(key, { value, ttl: seconds }),
    };
    return { store, data };
  };

  it("recognises an event only after it has been marked as processed", async () => {
    const { store } = memoryStore();
    const deduper = createEventDeduper(store);
    expect(await deduper.alreadyProcessed("evt-1")).toBe(false);
    await deduper.markProcessed("evt-1");
    expect(await deduper.alreadyProcessed("evt-1")).toBe(true);
    expect(await deduper.alreadyProcessed("evt-2")).toBe(false);
  });

  it("remembers an id for 24 hours", async () => {
    const { store, data } = memoryStore();
    await createEventDeduper(store).markProcessed("evt-1");
    expect(PROCESSED_TTL_SECONDS).toBe(86_400);
    expect(data.get("kafka:processed:evt-1")?.ttl).toBe(86_400);
  });

  it("fails open: if Redis is down the event is processed rather than blocked", async () => {
    const errors: unknown[] = [];
    const broken: KeyValueStore = {
      exists: async () => {
        throw new Error("redis down");
      },
      set: async () => {
        throw new Error("redis down");
      },
    };
    const deduper = createEventDeduper(broken, { onError: (e) => errors.push(e) });
    expect(await deduper.alreadyProcessed("evt-1")).toBe(false);
    await expect(deduper.markProcessed("evt-1")).resolves.toBeUndefined(); //must not throw either
    expect(errors).toHaveLength(2);
  });
});

describe("dead letters", () => {
  beforeEach(() => {
    __resetDlqForTests();
    mockedGetProducer.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  const input = { originalTopic: "users-events", groupId: "user-events-group", payload: "{bad", error: new Error("boom"), failedStep: "invalid-json", partition: 2, offset: "41" };

  it("names the topic <topic>.dlq and records what failed and when", () => {
    expect(dlqTopicFor("users-events")).toBe("users-events.dlq");
    const letter = buildDeadLetter(input, new Date("2026-01-02T03:04:05Z"));
    expect(letter).toMatchObject({ originalTopic: "users-events", groupId: "user-events-group", payload: "{bad", error: "boom", failedStep: "invalid-json", partition: 2, offset: "41" });
    expect(letter.failedAt).toBe("2026-01-02T03:04:05.000Z");
  });

  it("publishes to the DLQ topic when it exists", async () => {
    const send = jest.fn().mockResolvedValue([]);
    mockedGetProducer.mockResolvedValue({ send });
    const fallback = jest.fn();
    setDeadLetterFallback(fallback);

    expect(await sendToDlq(input)).toBe("kafka");
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].topic).toBe("users-events.dlq");
    expect(JSON.parse(send.mock.calls[0][0].messages[0].value)).toMatchObject({ payload: "{bad", error: "boom" });
    expect(fallback).not.toHaveBeenCalled();
  });

  it("falls back to the durable sink when the DLQ topic doesn't exist, and stops retrying Kafka for a minute", async () => {
    const missing = Object.assign(new Error("This server does not host this topic-partition"), { type: "UNKNOWN_TOPIC_OR_PARTITION" });
    const send = jest.fn().mockRejectedValue(missing);
    mockedGetProducer.mockResolvedValue({ send });
    const fallback = jest.fn().mockResolvedValue(undefined);
    setDeadLetterFallback(fallback);

    let clock = 1_000_000;
    expect(await sendToDlq(input, () => clock)).toBe("fallback");
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(fallback.mock.calls[0][0]).toMatchObject({ payload: "{bad", failedStep: "invalid-json" });

    //second dead letter within the minute: no new Kafka attempt (the producer's retries would stall the consumer)
    expect(await sendToDlq(input, () => (clock += 5_000))).toBe("fallback");
    expect(send).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledTimes(2);

    //after the minute, Kafka is tried again (the topic may have been created by now)
    await sendToDlq(input, () => (clock += 70_000));
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("does not let a hung DLQ publish stall the consumer: after 5 seconds the fallback takes over", async () => {
    jest.useFakeTimers();
    try {
      mockedGetProducer.mockResolvedValue({ send: () => new Promise(() => undefined) }); //never settles
      const fallback = jest.fn().mockResolvedValue(undefined);
      setDeadLetterFallback(fallback);

      const result = sendToDlq(input);
      await jest.advanceTimersByTimeAsync(5_000);
      expect(await result).toBe("fallback");
      expect(fallback).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("falls back when Kafka is unreachable, and never throws even if the fallback fails too", async () => {
    mockedGetProducer.mockRejectedValue(new Error("broker unreachable"));
    setDeadLetterFallback(jest.fn().mockRejectedValue(new Error("mongo down")));
    await expect(sendToDlq(input)).resolves.toBe("log"); //last resort: a structured log line with the full payload
    expect((console.error as jest.Mock).mock.calls.flat().join(" ")).toContain("{bad");
  });
});

describe("shutdown manager", () => {
  it("runs the steps in order, then exits 0", async () => {
    const order: string[] = [];
    const exit = jest.fn();
    const { onShutdown, shutdown } = createShutdownManager({ exit, log: () => undefined });
    onShutdown("flush", async () => void order.push("flush"));
    onShutdown("disconnect", async () => void order.push("disconnect"));

    await shutdown("SIGTERM");
    expect(order).toEqual(["flush", "disconnect"]);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it("keeps going when a step fails, so one failure can't skip the buffer flush", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const order: string[] = [];
    const exit = jest.fn();
    const { onShutdown, shutdown } = createShutdownManager({ exit, log: () => undefined });
    onShutdown("broken", async () => {
      throw new Error("nope");
    });
    onShutdown("flush", async () => void order.push("flush"));

    await shutdown("SIGINT");
    expect(order).toEqual(["flush"]);
    expect(exit).toHaveBeenCalledWith(0);
    jest.restoreAllMocks();
  });

  it("ignores a second signal while shutting down", async () => {
    const run = jest.fn().mockResolvedValue(undefined);
    const exit = jest.fn();
    const { onShutdown, shutdown } = createShutdownManager({ exit, log: () => undefined });
    onShutdown("step", run);
    await Promise.all([shutdown("SIGTERM"), shutdown("SIGINT")]);
    expect(run).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it("gives up and exits non-zero if a step hangs past the timeout", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const exit = jest.fn();
    const { onShutdown, shutdown } = createShutdownManager({ exit, timeoutMs: 30, log: () => undefined });
    onShutdown("hangs", () => new Promise<void>(() => undefined));
    await shutdown("SIGTERM");
    expect(exit).toHaveBeenCalledWith(1);
    jest.restoreAllMocks();
  });
});

describe("runChecks", () => {
  it("reports each dependency separately and is ok only if all are", async () => {
    const report = await runChecks({
      kafka: async () => "group ok",
      database: async () => {
        throw new Error("connection refused");
      },
    });
    expect(report.ok).toBe(false);
    expect(report.checks.kafka).toMatchObject({ ok: true, detail: "group ok" });
    expect(report.checks.database).toMatchObject({ ok: false, detail: "connection refused" });
  });

  it("treats a hanging dependency as failed instead of hanging the endpoint", async () => {
    const report = await runChecks({ slow: () => new Promise<void>(() => undefined) }, 20);
    expect(report.ok).toBe(false);
    expect(report.checks.slow.detail).toContain("timed out");
  });
});
