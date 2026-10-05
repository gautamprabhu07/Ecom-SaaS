//Path: apps/chatting-service/src/main.ts
import express from 'express';
import cookieParser from 'cookie-parser';
import prisma from '@packages/libs/prisma';
import redis from '@packages/libs/redis';
import { saveDeadLetter } from '@packages/libs/prisma/dead-letters';
import { setDeadLetterFallback } from '@packages/utils/kafka/dlq';
import { disconnectProducer } from '@packages/utils/kafka/producer';
import { onShutdown } from '@packages/utils/kafka/shutdown';
import { checkConsumerGroup, runChecks } from '@packages/utils/kafka/health';
import { GROUP_ID, consumerState, flushBufferToDb, startConsumer, stopConsumer } from './chat-message.consumer';
import { createWebSocketServer, closeWebSocketServer } from './websocket';
import router from './routes/chat.routes';

//messages that can't be published to the Kafka DLQ topic are kept in MongoDB instead of being lost
setDeadLetterFallback(saveDeadLetter);

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send({ message: 'Welcome to chatting-service!' });
});

//liveness: only fails if the Kafka consumer has crashed, so an orchestrator knows to restart us
app.get('/health', (_req, res) => {
  const state = consumerState();
  res.status(state.crashed ? 503 : 200).json({ status: state.crashed ? 'unhealthy' : 'ok', service: 'chatting-service', uptime: process.uptime(), consumer: state });
});

//readiness: broker + our consumer group, MongoDB and Redis
app.get('/ready', async (_req, res) => {
  const report = await runChecks({
    kafka: () => checkConsumerGroup(GROUP_ID),
    database: async () => {
      await prisma.$runCommandRaw({ ping: 1 });
    },
    redis: async () => {
      await redis.ping();
    },
  });
  res.status(report.ok ? 200 : 503).json({ status: report.ok ? 'ready' : 'not-ready', service: 'chatting-service', ...report });
});

//routes
app.use('/api', router);

const port = process.env.PORT || 6006;

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
//connect websocket server
createWebSocketServer(server);

//start kafka consumer
startConsumer().catch((error) => {
  console.error('Error starting Kafka consumer:', error);

});


server.on('error', console.error);

//SIGTERM / SIGINT: stop taking messages, store and commit what is buffered, then disconnect and exit 0
onShutdown('chat consumer (write buffered messages, commit offsets)', async () => {
  await stopConsumer();
  await flushBufferToDb(); //belt and braces: nothing left behind if a message arrived during the stop
});
onShutdown('websocket server', closeWebSocketServer);
onShutdown('shared Kafka producer', disconnectProducer);
onShutdown('http server', () => new Promise<void>((resolve) => server.close(() => resolve())));
