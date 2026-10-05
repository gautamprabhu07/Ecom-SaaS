//Path: apps/logger-service/src/logger-consumer.ts
//reads application logs from the `logs` topic and forwards them to the dashboards watching over WebSocket.
//
//Logs are live telemetry, not business data, so this consumer keeps Kafka's default auto-commit: if the service
//restarts, a few seconds of log lines may be skipped, and that is an acceptable trade for simplicity here.
import WebSocket from 'ws';
import { Consumer } from 'kafkajs';
import { kafka } from '@packages/utils/kafka';
import { clients } from './clients';

export const GROUP_ID = 'logger-events-group';
const FLUSH_INTERVAL_MS = 3000;

let consumer: Consumer | null = null;
let timer: NodeJS.Timeout | null = null;
let crashed: string | null = null;
const logQueue: string[] = [];

export const consumerState = () => ({ running: consumer !== null && crashed === null, crashed, queued: logQueue.length, clients: clients.size });

//send everything queued to every connected dashboard
export const processLogs = () => {
   if (logQueue.length === 0) return;

   console.log(`Processing ${logQueue.length} logs...`);
   const logs = logQueue.splice(0, logQueue.length);
   clients.forEach((client) => {
      //a client that is closing must not stop the others from getting their logs
      if (client.readyState !== WebSocket.OPEN) return;
      logs.forEach((log) => {
         try {
            client.send(log);
         } catch (error) {
            console.warn('Could not send a log line to a client:', (error as Error)?.message ?? error);
         }
      });
   });
};

//consume kafka messages
export const consumeKafkaMessages = async () => {
   crashed = null;
   const instance = kafka.consumer({ groupId: GROUP_ID });
   consumer = instance;
   instance.on(instance.events.CRASH, (event) => {
      crashed = event.payload.error?.message ?? 'consumer crashed';
      console.error('Log consumer crashed:', crashed);
   });

   await instance.connect();
   await instance.subscribe({ topic: 'logs', fromBeginning: false });
   await instance.run({
      eachMessage: async ({ message }) => {
         if (!message.value) return;
         logQueue.push(message.value.toString());
      },
   });
   timer = setInterval(processLogs, FLUSH_INTERVAL_MS);
};

//deliver whatever is queued, then leave the group
export const stopLogConsumer = async () => {
   if (timer) clearInterval(timer);
   timer = null;
   processLogs();
   const instance = consumer;
   consumer = null;
   if (!instance) return;
   await instance.stop();
   await instance.disconnect();
};
