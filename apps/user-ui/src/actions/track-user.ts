//path: apps/user-ui/src/actions/track-user.ts
"use server";
import { randomUUID } from "crypto";
import {kafka} from "../../../../packages/utils/kafka/index";

const producer = kafka.producer();

//connect once and reuse the connection for every event; sharing the promise means concurrent
//calls don't each open their own connection, and a failed attempt is retried on the next call
let connection: Promise<void> | null = null;
const ensureConnected = () => {
   if (!connection) {
      connection = producer.connect().catch((error) => {
         connection = null;
         throw error;
      });
   }
   return connection;
};

export async function sendKafkaEvent(eventData:{
   userId? : string,
   productId? : string,
   shopId? : string,
   action? : string,
   device? : string,
   country? : string,
   city? : string,
}) {
   try {
      await ensureConnected();
      //eventId is created once per event, before the send. If the message is delivered more than once (a producer retry,
      //or a consumer crash and redelivery) the consumer sees the same id again and skips the duplicate.
      const payload = { ...eventData, eventId: randomUUID() };
      await producer.send({
         topic: "users-events",
         messages: [
            //keyed by buyer so all of one buyer's events land on the same partition and are processed in order
            { key: eventData.userId ?? eventData.shopId, value: JSON.stringify(payload) },
         ],
      });
   }
   catch (error) {
      console.error(`Error sending Kafka event: ${error}`);
   }

};
