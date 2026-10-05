//Path: apps/kafka-service/src/user-events-consumer.ts
//consumes buyer interaction events from `users-events` and turns them into analytics.
//
//Delivery design (at-least-once):
//  1. Messages are buffered in memory and processed in a batch every BATCH_INTERVAL_MS (fewer, bigger database passes).
//  2. Offsets are committed MANUALLY, and only after a batch has been fully handled. The default auto-commit would
//     acknowledge a message as soon as it was buffered, so a crash with a full buffer lost those events for good.
//  3. If the service dies before the commit, Kafka redelivers the batch, and the eventId check in Redis (see
//     idempotency.ts) stops it being counted twice.
//  4. An event that keeps failing is retried with backoff, then parked in the dead-letter queue. It never blocks the
//     events behind it and is never silently dropped.
import type { Consumer } from "kafkajs";
import { kafka } from "@packages/utils/kafka";
import { sendToDlq } from "@packages/utils/kafka/dlq";
import { withRetry, RetriesExhaustedError } from "@packages/utils/kafka/retry";
import redis from "@packages/libs/redis";
import { updateUserAnalytics, updateProductAnalytics, updateShopAnalytics } from "./services/analytics.services";
import { createEventDeduper } from "./idempotency";

export const TOPIC = "users-events";
export const GROUP_ID = "user-events-group";
//how often the buffer is drained; also the worst-case extra latency before an event shows up in the analytics
export const BATCH_INTERVAL_MS = 3000;
const RETRIES = 3; //200ms, 400ms, 800ms backoff
const VALID_ACTIONS = ["add_to_wishlist", "product_view", "add_to_cart", "remove_from_wishlist", "remove_from_cart"];

interface Pending {
  topic: string;
  partition: number;
  offset: string;
  raw: string | null;
}

const queue: Pending[] = [];
const deduper = createEventDeduper(redis);

//counters, used by the health endpoint and by the integration test
export const stats = { received: 0, processed: 0, duplicatesSkipped: 0, deadLettered: 0, commits: 0 };

let consumer: Consumer | null = null;
let timer: NodeJS.Timeout | null = null;
let flushing: Promise<void> | null = null;
let crashed: string | null = null;

export const consumerState = () => ({ running: consumer !== null && crashed === null, crashed, queued: queue.length, ...stats });

type Step = [name: string, run: () => Promise<void>];

const deadLetter = async (item: Pending, error: unknown, failedStep: string, attempts?: number) => {
  stats.deadLettered++;
  await sendToDlq({
    originalTopic: item.topic,
    groupId: currentGroupId,
    payload: item.raw,
    error,
    failedStep,
    attempts,
    partition: item.partition,
    offset: item.offset,
  });
};

let currentGroupId = GROUP_ID;

//applies one buffered message. Never throws: every outcome is "applied", "skipped as a duplicate" or "dead-lettered".
async function handle(item: Pending): Promise<void> {
  if (item.raw === null) return; //an empty message carries nothing to apply

  let event: any;
  try {
    event = JSON.parse(item.raw);
  } catch (error) {
    return deadLetter(item, error, "invalid-json");
  }
  if (!event || typeof event !== "object") return deadLetter(item, new Error("event is not a JSON object"), "invalid-event");

  const eventId: string | null = typeof event.eventId === "string" ? event.eventId : null;
  if (eventId && (await deduper.alreadyProcessed(eventId))) {
    stats.duplicatesSkipped++;
    return;
  }

  //a visit only touches shop analytics; every other action updates the user's history and then the product counters
  let steps: Step[];
  if (event.action === "shop_visit") {
    steps = [["shop-analytics", () => updateShopAnalytics(event)]];
  } else if (VALID_ACTIONS.includes(event.action)) {
    steps = [
      ["user-analytics", () => updateUserAnalytics(event)],
      ["product-analytics", () => updateProductAnalytics(event)],
    ];
  } else {
    return deadLetter(item, new Error(`Invalid event action: ${event.action}`), "invalid-action");
  }

  //each step is retried on its own, so a failure in step 2 never re-runs step 1 (which would duplicate its write)
  for (const [name, run] of steps) {
    try {
      await withRetry(run, {
        retries: RETRIES,
        onRetry: (error, retryNumber, delay) =>
          console.warn(`[users-events] ${name} failed (${(error as Error)?.message ?? error}), retry ${retryNumber}/${RETRIES} in ${delay}ms`),
      });
    } catch (error) {
      const attempts = error instanceof RetriesExhaustedError ? error.attempts : undefined;
      return deadLetter(item, error instanceof RetriesExhaustedError ? error.lastError : error, name, attempts);
    }
  }

  if (eventId) await deduper.markProcessed(eventId);
  stats.processed++;
}

//Kafka commits "the next offset to read", so the highest handled offset + 1 per partition
async function commit(handled: Pending[]): Promise<void> {
  if (!consumer || handled.length === 0) return;
  const highest = new Map<string, { topic: string; partition: number; offset: bigint }>();
  for (const item of handled) {
    const key = `${item.topic}:${item.partition}`;
    const offset = BigInt(item.offset);
    const current = highest.get(key);
    if (!current || offset > current.offset) highest.set(key, { topic: item.topic, partition: item.partition, offset });
  }
  try {
    await consumer.commitOffsets([...highest.values()].map((h) => ({ topic: h.topic, partition: h.partition, offset: (h.offset + 1n).toString() })));
    stats.commits++;
  } catch (error) {
    //not fatal: the batch will simply be redelivered, and the eventId check makes that harmless
    console.error("[users-events] offset commit failed, the batch will be redelivered:", (error as Error)?.message ?? error);
  }
}

//drains the buffer. Calls overlap safely: a second call waits for the one already running.
export function flushQueue(): Promise<void> {
  if (flushing) return flushing;
  const run = (async () => {
    while (queue.length > 0) {
      const batch = queue.splice(0, queue.length);
      for (const item of batch) {
        try {
          await handle(item);
        } catch (error) {
          //handle() should never throw, but if it does the offset must still move on or the pipeline would stall
          console.error("[users-events] unexpected error while handling an event:", error);
        }
      }
      await commit(batch);
    }
  })();
  flushing = run;
  //clear the guard only AFTER it has been set. Doing it inside the async function runs it synchronously whenever the
  //queue is empty (an idle tick), i.e. BEFORE the assignment above, which would leave the guard stuck forever and make
  //every later flush a silent no-op.
  void run.finally(() => {
    if (flushing === run) flushing = null;
  });
  return run;
}

//fromBeginning only matters for a partition that has NO committed offset yet: it then starts at the oldest retained
//message instead of the newest. With manual commits that is the safe choice. Otherwise events received before the
//first-ever commit on a partition are lost if the service crashes (a restart would skip straight to "latest").
//Partitions that already have a committed offset always resume from it, so existing deployments are unaffected.
//Tests that use a brand-new consumer group pass fromBeginning: false so they don't replay the whole topic.
export async function startUserEventsConsumer(options: { groupId?: string; fromBeginning?: boolean } = {}): Promise<void> {
  currentGroupId = options.groupId ?? GROUP_ID;
  crashed = null;

  const instance = kafka.consumer({ groupId: currentGroupId });
  consumer = instance;
  instance.on(instance.events.CRASH, (event) => {
    crashed = event.payload.error?.message ?? "consumer crashed";
    console.error("[users-events] consumer crashed:", crashed);
  });
  const joined = new Promise<void>((resolve) => instance.on(instance.events.GROUP_JOIN, () => resolve()));
  //joining the group isn't enough: a group with no committed offset only fixes its starting position when the first
  //fetch begins, so anything produced before that point would be skipped. Wait for the first fetch too.
  const fetching = new Promise<void>((resolve) => instance.on(instance.events.FETCH_START, () => resolve()));

  await instance.connect();
  await instance.subscribe({ topic: TOPIC, fromBeginning: options.fromBeginning ?? true });
  await instance.run({
    autoCommit: false, //we commit ourselves, after processing
    eachMessage: async ({ topic, partition, message }) => {
      stats.received++;
      queue.push({ topic, partition, offset: message.offset, raw: message.value ? message.value.toString() : null });
    },
  });

  //wait until we are actually consuming (partitions assigned AND fetching), so callers know messages will arrive
  await Promise.race([Promise.all([joined, fetching]), new Promise<void>((resolve) => setTimeout(resolve, 30_000))]);
  timer = setInterval(() => void flushQueue(), BATCH_INTERVAL_MS);
}

//stops taking new messages, handles and commits everything already buffered, then leaves the group
export async function stopUserEventsConsumer(): Promise<void> {
  if (timer) clearInterval(timer);
  timer = null;
  const instance = consumer;
  if (!instance) return;

  //pause first: committing is only possible while we still belong to the group, so don't leave it yet
  instance.pause([{ topic: TOPIC }]);
  await flushQueue();
  await instance.stop();
  await instance.disconnect();
  consumer = null;
}
