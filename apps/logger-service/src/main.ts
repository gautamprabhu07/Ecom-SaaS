//Path: apps/logger-service/src/main.ts
import express from 'express';
import WebSocket from 'ws';
import http from 'http';
import { onShutdown } from '@packages/utils/kafka/shutdown';
import { checkConsumerGroup, runChecks } from '@packages/utils/kafka/health';
import { clients } from './clients';
import { GROUP_ID, consumeKafkaMessages, consumerState, stopLogConsumer } from './logger-consumer';

const app = express();

//liveness: only fails if the Kafka consumer has crashed
app.get('/health', (_req, res) => {
  const state = consumerState();
  res.status(state.crashed ? 503 : 200).json({ status: state.crashed ? 'unhealthy' : 'ok', service: 'logger-service', uptime: process.uptime(), consumer: state });
});

//readiness: the broker is reachable and our consumer group is alive (this service has no database)
app.get('/ready', async (_req, res) => {
  const report = await runChecks({ kafka: () => checkConsumerGroup(GROUP_ID) });
  res.status(report.ok ? 200 : 503).json({ status: report.ok ? 'ready' : 'not-ready', service: 'logger-service', ...report });
});

const wsServer = new WebSocket.Server({ noServer: true });

wsServer.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

const server =  http.createServer(app);
server.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (ws) => {
    wsServer.emit("connection", ws, request);
  });
});

server.listen(process.env.PORT || 6008, () => {
  console.log(`WebSocket server is running on port ${process.env.PORT || 6008}/api`);
});

//start kafka consumer
consumeKafkaMessages().catch((error) => console.error('Log consumer failed to start:', error));

//SIGTERM / SIGINT: deliver the queued logs, leave the consumer group, close the dashboards' sockets, exit 0
onShutdown('log consumer (deliver queued logs)', stopLogConsumer);
onShutdown('websocket clients', async () => {
  for (const client of clients) client.close(1001, 'server shutting down');
  await new Promise<void>((resolve) => wsServer.close(() => resolve()));
});
onShutdown('http server', () => new Promise<void>((resolve) => server.close(() => resolve())));
