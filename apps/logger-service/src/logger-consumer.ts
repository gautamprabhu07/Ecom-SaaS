//Path: apps/logger-service/src/logger-consumer.ts
import {kafka} from '@packages/utils/kafka';
import {clients} from "./main";


const consumer = kafka.consumer({ groupId: 'logger-events-group' });
const logQueue: string[] = [];

const processLogs = () => {
   if(logQueue.length === 0) return;

   console.log(`Processing ${logQueue.length} logs...`);
   const logs = [...logQueue];
   logQueue.length = 0; // Clear the queue
   clients.forEach((client) => {
      logs.forEach((log) => {
         client.send(log);
      });
   });
};

setInterval(processLogs, 3000); // Process logs every second

//consume kafka messages
export const consumeKafkaMessages = async () => {
   await consumer.connect();
   await consumer.subscribe({ topic: 'logs', fromBeginning: false });
   await consumer.run({
      eachMessage: async ({message }) => {
         if (!message.value) return;
         const log = message.value.toString();
         logQueue.push(log);
      }
   });
};

//start kafka consumer
consumeKafkaMessages().catch(console.error);
