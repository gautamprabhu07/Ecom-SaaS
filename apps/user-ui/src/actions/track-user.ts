//path: apps/user-ui/src/actions/track-user.ts
"use server";
<<<<<<< HEAD
import {kafka} from "../../../../packages/utils/kafka/index";
=======
import {kafka} from "../../../../packages/utils/kafka";
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394

const producer = kafka.producer();

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
      await producer.connect();
      await producer.send({
<<<<<<< HEAD
         topic: "users-events",
=======
         topic: "user-events",
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
         messages: [
            { value: JSON.stringify(eventData) },
         ],
      });
   }
   catch (error) {
      console.error(`Error sending Kafka event: ${error}`);
   }
<<<<<<< HEAD
   
=======
   finally {
      await producer.disconnect();
   }
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
};