//Path: apps/chatting-service/src/chat-message.consumer.ts
//persists chat messages published to `chat_new_message` and keeps the unread counters in Redis.
//
//Delivery design (at-least-once, same idea as the analytics consumer):
//  * messages are buffered and written in one createMany every BATCH_INTERVAL_MS;
//  * offsets are committed manually, only after the batch is safely stored (or parked in the dead-letter queue), so a
//    crash with a full buffer no longer loses chat messages;
//  * a redelivered message is harmless: the unique index on (conversation, sender, content, createdAt) rejects the copy,
//    and we treat that rejection as "already stored" instead of failing the whole batch (which used to wedge the
//    pipeline in an endless retry loop);
//  * a message the database refuses for good (malformed id, bad data) goes to the dead-letter queue; a failure that
//    looks temporary (database unreachable) is retried on the next flush and nothing is committed meanwhile.
import { kafka } from '@packages/utils/kafka';
import { sendToDlq } from '@packages/utils/kafka/dlq';
import prisma from '@packages/libs/prisma';
import { Prisma } from '@prisma/client';
import { Consumer } from 'kafkajs';
import { incrementUnseenCount } from '@packages/libs/redis/message.redis';

interface BufferedMessage {
   conversationId: string;
   senderId: string;
   senderType: string;
   content: string;
   createdAt: string;
}

interface Pending {
   topic: string;
   partition: number;
   offset: string;
   raw: string | null;
   message?: BufferedMessage;
   parseError?: unknown;
   //how many flushes have failed for a reason that looks temporary
   attempts: number;
}

export const TOPIC = "chat_new_message";
export const GROUP_ID = "chatting-message-db-writer";
const BATCH_INTERVAL_MS = 3000; // 3 seconds
//a message that keeps failing for "temporary" reasons is eventually treated as poison rather than blocking forever
const MAX_TRANSIENT_ATTEMPTS = 10;

let buffer: Pending[] = [];
let flushTimer: NodeJS.Timeout | null = null;
let flushing: Promise<void> | null = null;
let consumer: Consumer | null = null;
let crashed: string | null = null;

export const stats = { received: 0, stored: 0, duplicatesSkipped: 0, deadLettered: 0, commits: 0 };
export const consumerState = () => ({ running: consumer !== null && crashed === null, crashed, buffered: buffer.length, ...stats });

type Outcome = 'duplicate' | 'poison' | 'transient';

const classify = (error: unknown): Outcome => {
   if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return error.code === 'P2002' ? 'duplicate' : 'poison';
   }
   if (error instanceof Prisma.PrismaClientValidationError) return 'poison';
   return 'transient'; //initialization errors, timeouts, anything else: assume the database is just having a bad moment
};

const toRow = (msg: BufferedMessage) => ({
   conversationId: msg.conversationId,
   senderId: msg.senderId,
   senderType: msg.senderType,
   content: msg.content,
   createdAt: new Date(msg.createdAt),
});

const deadLetter = async (item: Pending, error: unknown, failedStep: string) => {
   stats.deadLettered++;
   await sendToDlq({
      originalTopic: item.topic,
      groupId: GROUP_ID,
      payload: item.raw,
      error,
      failedStep,
      attempts: item.attempts || undefined,
      partition: item.partition,
      offset: item.offset,
   });
};

//the unread badge is a convenience: a Redis hiccup must never undo or repeat a message that is already stored
const bumpUnseen = async (msg: BufferedMessage) => {
   try {
      const receiverType = msg.senderType === 'user' ? 'seller' : 'user';
      await incrementUnseenCount(receiverType, msg.conversationId);
   } catch (error) {
      console.warn('Could not update the unseen counter:', (error as Error)?.message ?? error);
   }
};

async function commit(handled: Pending[]) {
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
      console.error('Offset commit failed, the batch will be redelivered (duplicates are ignored):', (error as Error)?.message ?? error);
   }
}

//flush the buffer to the database. Exported so the shutdown path can call it directly.
export function flushBufferToDb(): Promise<void> {
   if (flushing) return flushing;
   const run = (async () => {
      try {
         if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
         }
         const batch = buffer.splice(0, buffer.length); //take everything, leaving the buffer free for new messages
         if (batch.length === 0) return;

         const done: Pending[] = [];

         //anything that wasn't valid JSON can never succeed
         const valid: Pending[] = [];
         for (const item of batch) {
            if (item.message) valid.push(item);
            else if (item.raw === null) done.push(item); //empty message, nothing to store
            else {
               await deadLetter(item, item.parseError ?? new Error('unparseable message'), 'invalid-json');
               done.push(item);
            }
         }

         if (valid.length > 0) {
            try {
               //fast path: one round trip for the whole batch
               await prisma.message.createMany({ data: valid.map((item) => toRow(item.message!)) });
               stats.stored += valid.length;
               for (const item of valid) await bumpUnseen(item.message!);
               done.push(...valid);
               console.log(`Flushed ${valid.length} messages to database and updated unseen counts`);
            } catch (batchError) {
               //something in the batch was rejected. Find out which messages, one at a time, so a single bad or repeated
               //message can't hold back the rest. (A duplicate partway through a createMany can leave the messages before
               //it already stored; those show up as duplicates below and their unseen badge is not bumped a second time.)
               console.warn('Batch write failed, falling back to one-by-one writes:', (batchError as Error)?.message ?? batchError);
               const retryLater: Pending[] = [];
               for (const item of valid) {
                  try {
                     await prisma.message.create({ data: toRow(item.message!) });
                     stats.stored++;
                     await bumpUnseen(item.message!);
                     done.push(item);
                  } catch (error) {
                     const outcome = classify(error);
                     if (outcome === 'duplicate') {
                        stats.duplicatesSkipped++;
                        done.push(item);
                     } else if (outcome === 'poison' || ++item.attempts >= MAX_TRANSIENT_ATTEMPTS) {
                        await deadLetter(item, error, outcome === 'poison' ? 'database-rejected' : 'retries-exhausted');
                        done.push(item);
                     } else {
                        retryLater.push(item);
                     }
                  }
               }
               if (retryLater.length > 0) buffer.unshift(...retryLater);
            }
         }

         //only what is safely stored (or parked) is acknowledged; messages kept for a retry stay uncommitted
         await commit(done);
      } finally {
         //more to do (new messages arrived, or some are waiting for a retry): schedule the next pass
         if (buffer.length > 0 && !flushTimer && consumer) flushTimer = setTimeout(flushBufferToDb, BATCH_INTERVAL_MS);
      }
   })();
   flushing = run;
   //clear the guard only AFTER it has been set. Clearing it inside the async function runs it synchronously whenever
   //there is nothing to flush, i.e. BEFORE the assignment above, which would leave the guard stuck forever and make
   //every later flush a silent no-op.
   void run.finally(() => {
      if (flushing === run) flushing = null;
   });
   return run;
}

//Initialize Kafka consumer
export async function startConsumer() {
   crashed = null;
   const instance: Consumer = kafka.consumer({ groupId: GROUP_ID });
   consumer = instance;
   instance.on(instance.events.CRASH, (event) => {
      crashed = event.payload.error?.message ?? 'consumer crashed';
      console.error('Chat consumer crashed:', crashed);
   });

   await instance.connect();
   //fromBeginning only applies to a partition with no committed offset (it then starts at the oldest retained message
   //instead of the newest), so messages received before the first-ever commit survive a crash. Replays are harmless:
   //the unique index on messages ignores a copy that is already stored.
   await instance.subscribe({ topic: TOPIC, fromBeginning: true });
   console.log(`Kafka consumer connected and subscribed to topic: ${TOPIC}`);

   await instance.run({
      autoCommit: false, //offsets are committed after the database write, see flushBufferToDb
      eachMessage: async ({ topic, partition, message }) => {
         stats.received++;
         const raw = message.value ? message.value.toString() : null;
         const item: Pending = { topic, partition, offset: message.offset, raw, attempts: 0 };
         if (raw !== null) {
            try {
               item.message = JSON.parse(raw) as BufferedMessage;
            } catch (error) {
               item.parseError = error;
            }
         }
         buffer.push(item);

         //first message into an empty buffer starts the timer
         if (!flushTimer && !flushing) flushTimer = setTimeout(flushBufferToDb, BATCH_INTERVAL_MS);
      },
   });
}

//stop taking new messages, write and commit what is buffered, then leave the group
export async function stopConsumer() {
   if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
   }
   const instance = consumer;
   if (!instance) return;

   //pause first: committing is only possible while we still belong to the group
   instance.pause([{ topic: TOPIC }]);
   //a few passes, in case a batch is only partly written (e.g. the database is slow) when we are asked to stop
   for (let pass = 0; pass < 3 && (buffer.length > 0 || flushing); pass++) await flushBufferToDb();
   if (buffer.length > 0) console.error(`Shutting down with ${buffer.length} message(s) not stored. They stay uncommitted and Kafka will redeliver them.`);

   consumer = null; //from here on no new flush timers are scheduled
   if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
   }
   await instance.stop();
   await instance.disconnect();
}
