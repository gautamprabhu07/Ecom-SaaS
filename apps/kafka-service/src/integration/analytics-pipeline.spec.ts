//Path: apps/kafka-service/src/integration/analytics-pipeline.spec.ts
//End-to-end test of the users-events pipeline against the REAL Confluent Cloud cluster, MongoDB and Redis.
//The consumer runs inside this test process under its own throwaway consumer group, so it never disturbs a
//kafka-service you may have running. Every row and Redis key the test creates is removed afterwards.
//Skips itself (cleanly) when the Kafka / database / Redis credentials are not configured.
//run with: npm run test:integration:kafka
import crypto from "crypto";
import { Kafka, Producer } from "kafkajs";
import prisma from "@packages/libs/prisma";
import redis from "@packages/libs/redis";
import { disconnectProducer } from "@packages/utils/kafka/producer";
import { setDeadLetterFallback } from "@packages/utils/kafka/dlq";
import { saveDeadLetter, DEAD_LETTER_COLLECTION } from "@packages/libs/prisma/dead-letters";
import { startUserEventsConsumer, stopUserEventsConsumer, flushQueue, stats, TOPIC, BATCH_INTERVAL_MS } from "../user-events-consumer";

const configured = ["KAFKA_API_KEY", "KAFKA_API_SECRET", "DATABASE_URL", "REDIS_DATABASE_URL"].every((name) => Boolean(process.env[name]));
const suite = configured ? describe : describe.skip;
if (!configured) console.warn("Skipping the Kafka pipeline integration test: KAFKA_API_KEY, KAFKA_API_SECRET, DATABASE_URL or REDIS_DATABASE_URL is not set.");

const objectId = () => crypto.randomBytes(12).toString("hex");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

//poll until `check` returns something truthy, or fail after `timeoutMs`
async function eventually<T>(label: string, check: () => Promise<T | false | null | undefined>, timeoutMs = 15_000): Promise<T> {
   const started = Date.now();
   for (;;) {
      const value = await check();
      if (value) return value;
      if (Date.now() - started > timeoutMs) throw new Error(`timed out after ${timeoutMs}ms waiting for: ${label}`);
      await sleep(500);
   }
}

suite("users-events pipeline (live Kafka, MongoDB, Redis)", () => {
   const groupId = `user-events-it-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
   const kafka = new Kafka({
      clientId: "kafka-service-integration-test",
      brokers: ["pkc-41p56.asia-south1.gcp.confluent.cloud:9092"],
      ssl: true,
      sasl: { mechanism: "plain", username: process.env.KAFKA_API_KEY!, password: process.env.KAFKA_API_SECRET! },
      connectionTimeout: 15_000,
      requestTimeout: 25_000,
      logLevel: 0,
   });
   let producer: Producer;

   //everything this test creates, so afterAll can remove it
   const created = { productIds: [] as string[], userIds: [] as string[], eventIds: [] as string[], markers: [] as string[] };

   const makeEvent = (action: string) => {
      const event = {
         eventId: crypto.randomUUID(),
         userId: objectId(),
         productId: objectId(),
         shopId: objectId(),
         action,
         country: "India",
         city: "Pune",
         device: "Chrome on Windows (desktop)",
      };
      created.productIds.push(event.productId);
      created.userIds.push(event.userId);
      created.eventIds.push(event.eventId);
      return event;
   };
   const publish = (value: string, key?: string) => producer.send({ topic: TOPIC, messages: [{ key, value }] });

   beforeAll(async () => {
      //dead letters that can't go to a Kafka DLQ topic are kept in MongoDB, exactly as the service does
      setDeadLetterFallback(saveDeadLetter);
      producer = kafka.producer();
      await producer.connect();
      //a brand-new group with fromBeginning: false starts at the end of the topic, so it only sees this test's events
      await startUserEventsConsumer({ groupId, fromBeginning: false });
   });

   afterAll(async () => {
      await stopUserEventsConsumer().catch(() => undefined);
      await producer?.disconnect().catch(() => undefined);
      await disconnectProducer();
      await prisma.productAnalytics.deleteMany({ where: { productId: { in: created.productIds } } });
      await prisma.userAnalytics.deleteMany({ where: { userId: { in: created.userIds } } });
      await prisma.$runCommandRaw({ delete: DEAD_LETTER_COLLECTION, deletes: [{ q: { payload: { $regex: created.markers.join("|") || "^$" } }, limit: 0 }] }).catch(() => undefined);
      for (const id of created.eventIds) await redis.del(`kafka:processed:${id}`);
      await prisma.$disconnect();
      redis.disconnect();
      //the admin client used to clean up the throwaway consumer group
      const admin = kafka.admin();
      await admin.connect().catch(() => undefined);
      await admin.deleteGroups([groupId, `${groupId}-dlq-reader`]).catch(() => undefined);
      await admin.disconnect().catch(() => undefined);
   });

   //regression test: an idle batch tick (nothing queued) once left the flush guard stuck, which silently stopped every
   //later flush. So: sit idle through two ticks first, then rely on the timer alone, with no manual flush, to apply an event.
   it("keeps processing after sitting idle through several batch ticks", async () => {
      await sleep(BATCH_INTERVAL_MS * 2 + 1000);

      const event = makeEvent("product_view");
      await publish(JSON.stringify(event), event.userId);

      const row = await eventually("the batch timer to apply the event on its own", async () => {
         const found = await prisma.productAnalytics.findUnique({ where: { productId: event.productId } });
         return found?.views === 1 ? found : false;
      });
      expect(row.views).toBe(1);
   });

   it("applies a product_view exactly once, and ignores a redelivered copy of the same event", async () => {
      const event = makeEvent("product_view");
      const body = JSON.stringify(event);
      const receivedBefore = stats.received;

      await publish(body, event.userId);
      await flushQueueWhen(() => stats.received >= receivedBefore + 1);

      const row = await eventually("productAnalytics.views to become 1", async () => {
         const found = await prisma.productAnalytics.findUnique({ where: { productId: event.productId } });
         return found?.views === 1 ? found : false;
      });
      expect(row.views).toBe(1);

      //Kafka delivers the SAME event again (same eventId), as after a crash, a rebalance or a producer retry
      const skippedBefore = stats.duplicatesSkipped;
      await publish(body, event.userId);
      await flushQueueWhen(() => stats.received >= receivedBefore + 2);
      await flushQueue();

      const after = await prisma.productAnalytics.findUnique({ where: { productId: event.productId } });
      expect(after?.views).toBe(1); //not 2
      expect(stats.duplicatesSkipped).toBeGreaterThan(skippedBefore);
      expect(await redis.exists(`kafka:processed:${event.eventId}`)).toBe(1);
   });

   it("parks a malformed message in the dead-letter queue instead of dropping it", async () => {
      const marker = `IT-POISON-${crypto.randomBytes(4).toString("hex")}`;
      created.markers.push(marker);
      const deadBefore = stats.deadLettered;

      await publish(`${marker} this is not json{`);
      await flushQueueWhen(() => stats.deadLettered >= deadBefore + 1);
      await flushQueue();
      expect(stats.deadLettered).toBeGreaterThan(deadBefore);

      //the Kafka DLQ topic has to be created by hand in the Confluent console. If it exists the letter went there;
      //if not, the MongoDB fallback must hold it. Either way it is not lost.
      const admin = kafka.admin();
      await admin.connect();
      const topics = await admin.listTopics();
      await admin.disconnect();

      if (topics.includes(`${TOPIC}.dlq`)) {
         const dlqConsumer = kafka.consumer({ groupId: `${groupId}-dlq-reader` });
         await dlqConsumer.connect();
         await dlqConsumer.subscribe({ topic: `${TOPIC}.dlq`, fromBeginning: true });
         const seen: string[] = [];
         await dlqConsumer.run({ eachMessage: async ({ message }) => void seen.push(message.value?.toString() ?? "") });
         try {
            await eventually("the dead letter on the Kafka DLQ topic", async () => seen.some((value) => value.includes(marker)));
         } finally {
            await dlqConsumer.disconnect();
         }
      } else {
         const letter = await eventually("the dead letter in MongoDB", async () => {
            const result: any = await prisma.$runCommandRaw({ find: DEAD_LETTER_COLLECTION, filter: { payload: { $regex: marker } } });
            return result.cursor.firstBatch[0];
         });
         expect(letter).toMatchObject({ originalTopic: TOPIC, failedStep: "invalid-json", status: "unprocessed" });
         expect(letter.groupId).toBe(groupId);
      }
   });

   it("writes what is buffered and commits its offsets when asked to stop (graceful shutdown)", async () => {
      const events = [makeEvent("product_view"), makeEvent("add_to_cart"), makeEvent("add_to_wishlist")];
      const receivedBefore = stats.received;
      const processedBefore = stats.processed;
      const sent: { partition: number; offset: string }[] = [];
      for (const event of events) {
         const [meta] = await publish(JSON.stringify(event), event.userId);
         sent.push({ partition: meta.partition, offset: meta.baseOffset! });
      }

      //wait until all three are in the consumer's memory, then stop straight away. The 3 second batch timer has almost
      //certainly not fired yet, so shutting down is what has to write them. (If the timer did win the race the
      //assertions below still hold: the point is that nothing buffered is lost or left uncommitted.)
      await eventually("all three events to reach the consumer", async () => stats.received >= receivedBefore + 3, 15_000);
      await stopUserEventsConsumer();
      expect(stats.processed).toBeGreaterThanOrEqual(processedBefore + 3);

      for (const event of events) {
         const row = await prisma.productAnalytics.findUnique({ where: { productId: event.productId } });
         expect(row).not.toBeNull(); //written during shutdown, not lost
      }

      //and their offsets were committed, so a restart will not replay them
      const admin = kafka.admin();
      await admin.connect();
      const committed = (await admin.fetchOffsets({ groupId, topics: [TOPIC] }))[0].partitions;
      await admin.disconnect();
      for (const { partition, offset } of sent) {
         const partitionState = committed.find((p) => p.partition === partition);
         expect(Number(partitionState?.offset)).toBeGreaterThan(Number(offset));
      }
   });

   //the 3 second batch timer would do this on its own; calling it speeds the test up without changing what is tested
   async function flushQueueWhen(received: () => boolean) {
      await eventually("the consumer to receive the message", async () => received());
      await flushQueue();
   }
});
