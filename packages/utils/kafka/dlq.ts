//Path: packages/utils/kafka/dlq.ts
//dead-letter handling: an event that can't be processed is parked somewhere durable instead of being dropped.
//
//Primary home: the Kafka topic `<topic>.dlq`. That topic has to be created by hand in the Confluent Cloud console
//(the cluster has topic auto-creation switched off and the API key is not allowed to create topics).
//Fallback: until it exists, or if Kafka itself is unreachable, the dead letter goes to whatever sink the service
//registered with setDeadLetterFallback (the services use a MongoDB collection). The last resort is a structured log
//line carrying the full payload, so the event can still be recovered from the logs.
import { getProducer } from "./producer";

export interface DeadLetter {
  originalTopic: string;
  groupId: string;
  //the message exactly as it arrived (null for an empty message)
  payload: string | null;
  error: string;
  //which processing step failed, e.g. "user-analytics", or why it was rejected, e.g. "invalid-json"
  failedStep?: string;
  attempts?: number;
  partition?: number;
  offset?: string;
  failedAt: string;
}

export type DeadLetterInput = Omit<DeadLetter, "failedAt" | "error"> & { error: unknown };

export const dlqTopicFor = (topic: string): string => `${topic}.dlq`;

export const buildDeadLetter = (input: DeadLetterInput, now: Date = new Date()): DeadLetter => ({
  ...input,
  error: input.error instanceof Error ? input.error.message : String(input.error),
  failedAt: now.toISOString(),
});

export type DeadLetterSink = (letter: DeadLetter) => Promise<void>;

const logSink: DeadLetterSink = async (letter) => {
  console.error(JSON.stringify({ level: "ERROR", message: "dead letter with no durable sink", ...letter }));
};
let fallbackSink: DeadLetterSink = logSink;

export const setDeadLetterFallback = (sink: DeadLetterSink): void => {
  fallbackSink = sink;
};

//Publishing to a topic that doesn't exist makes kafkajs retry the metadata lookup with growing backoff, which can take
//tens of seconds. The consumer waits for the dead letter to be recorded before moving on, so a slow DLQ must never be
//allowed to stall the healthy events queued behind it: the Kafka attempt gets a hard time limit, after which the
//durable fallback sink takes over.
const KAFKA_PUBLISH_TIMEOUT_MS = 5_000;
//after a failure, skip Kafka for a while so a broken or missing DLQ costs one slow attempt, not one per dead letter
const SKIP_KAFKA_FOR_MISSING_TOPIC_MS = 60_000;
const SKIP_KAFKA_AFTER_OTHER_FAILURE_MS = 10_000;
const kafkaSkippedUntil = new Map<string, number>();

const withTimeout = <T>(promise: Promise<T>, ms: number, what: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${what} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

const isMissingTopic = (error: any): boolean =>
  error?.type === "UNKNOWN_TOPIC_OR_PARTITION" ||
  /does not host this topic-partition|unknown topic/i.test(String(error?.message ?? error));

export type DeadLetterDestination = "kafka" | "fallback" | "log";

//never throws: the caller is already handling a failure and must be able to carry on
export async function sendToDlq(input: DeadLetterInput, now: () => number = Date.now): Promise<DeadLetterDestination> {
  const letter = buildDeadLetter(input, new Date(now()));
  const topic = dlqTopicFor(letter.originalTopic);

  if ((kafkaSkippedUntil.get(topic) ?? 0) <= now()) {
    try {
      await withTimeout(
        (async () => {
          const producer = await getProducer();
          await producer.send({
            topic,
            messages: [
              {
                key: letter.partition === undefined ? undefined : `${letter.partition}:${letter.offset}`,
                value: JSON.stringify(letter),
                headers: { "original-topic": letter.originalTopic, "consumer-group": letter.groupId, "failed-step": letter.failedStep ?? "" },
              },
            ],
          });
        })(),
        KAFKA_PUBLISH_TIMEOUT_MS,
        `publishing to ${topic}`,
      );
      return "kafka";
    } catch (error) {
      kafkaSkippedUntil.set(topic, now() + (isMissingTopic(error) ? SKIP_KAFKA_FOR_MISSING_TOPIC_MS : SKIP_KAFKA_AFTER_OTHER_FAILURE_MS));
      console.error(`could not publish to ${topic}, using the fallback sink instead: ${(error as Error)?.message ?? error}`);
    }
  }

  try {
    await fallbackSink(letter);
    return fallbackSink === logSink ? "log" : "fallback";
  } catch (error) {
    await logSink(letter);
    console.error(`fallback dead-letter sink failed too: ${(error as Error)?.message ?? error}`);
    return "log";
  }
}

//test helper
export const __resetDlqForTests = (): void => {
  kafkaSkippedUntil.clear();
  fallbackSink = logSink;
};
