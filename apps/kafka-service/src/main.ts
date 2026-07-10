//path: apps/kafka-service/src/main.ts
import {kafka} from "@packages/utils/kafka";
import { updateUserAnalytics } from "./services/analytics.services";

const consumer = kafka.consumer({ groupId: "user-events-group" });

const eventQueue: any[]=[];

const processQueue = async() => {
   if(eventQueue.length===0) return;
   
   const events = [...eventQueue];
   eventQueue.length=0;

   for(const event of events){
      if(event.action==="shop_visit"){
         continue;
         //update shop analytics
      }

      const validActions = ["add_to_wishlist", "product_view", "add_to_cart", "remove_from_wishlist","remove_from_cart" ];

      if(!event.action || !validActions.includes(event.action)){
         console.log(`Invalid event action: ${event.action}`);
         continue;
      }

      try{
         await updateUserAnalytics(event);
      }
      catch(err){
         console.error(`Error processing event: ${err}`);
      }
   }
};

setInterval(processQueue, 3000);

//kafka consumer for user events
export const consumerKafkaMessages = async () => {
   await consumer.connect();
   await consumer.subscribe({ topic: "users-events", fromBeginning: false });

   await consumer.run({
      eachMessage: async ({message }) => {
         if(!message.value) return;
         const event = JSON.parse(message.value.toString());
            console.log("Received kafka event:", event); // temp debug log

         eventQueue.push(event);
      }
   });
};

consumerKafkaMessages().catch(err => {
   console.error("Kafka consumer failed to start:", err);
});