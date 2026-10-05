//Path: apps/kafka-service/src/idempotency.ts
//Kafka delivery is at-least-once: after a crash, a rebalance or a failed offset commit the same event arrives again.
//Every event carries a unique `eventId` created by the producer; once an event has been applied we remember its id in
//Redis, and skip any later copy.
//
//Known limits (deliberate, and documented in docs/kafka.md):
//  * the memory lasts 24 hours. A copy that arrives later than that is applied again. Kafka redelivery happens within
//    seconds to minutes of the original, so the window is generous, but it is a window.
//  * the id is recorded AFTER the work succeeds. A crash in the instant between "analytics written" and "id recorded"
//    can still apply that one event twice. Closing that gap needs the write and the record in one transaction.
//  * if Redis is unreachable we process the event anyway (fail open): a rare double count is better than a stalled
//    pipeline for an analytics counter.
//  * events without an eventId (older producers) are processed without this protection.

//the two Redis commands we use, so tests can pass a fake
export interface KeyValueStore {
  exists(key: string): Promise<number>;
  set(key: string, value: string, mode: "EX", seconds: number): Promise<unknown>;
}

export const PROCESSED_TTL_SECONDS = 24 * 60 * 60;

export interface EventDeduper {
  alreadyProcessed(eventId: string): Promise<boolean>;
  markProcessed(eventId: string): Promise<void>;
}

export const createEventDeduper = (
  store: KeyValueStore,
  options: { ttlSeconds?: number; prefix?: string; onError?: (error: unknown) => void } = {},
): EventDeduper => {
  const { ttlSeconds = PROCESSED_TTL_SECONDS, prefix = "kafka:processed:", onError = console.warn } = options;

  return {
    async alreadyProcessed(eventId) {
      try {
        return (await store.exists(`${prefix}${eventId}`)) > 0;
      } catch (error) {
        onError(error);
        return false;
      }
    },
    async markProcessed(eventId) {
      try {
        await store.set(`${prefix}${eventId}`, "1", "EX", ttlSeconds);
      } catch (error) {
        onError(error);
      }
    },
  };
};
