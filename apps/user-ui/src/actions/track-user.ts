//path: apps/user-ui/src/actions/track-user.ts
"use server";
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
      await producer.send({
         topic: "users-events",
         messages: [
            { value: JSON.stringify(eventData) },
         ],
      });
   }
   catch (error) {
      console.error(`Error sending Kafka event: ${error}`);
   }

};
