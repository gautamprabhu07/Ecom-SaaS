//path: apps/kafka-service/src/main.ts
import express from "express";
import prisma from "@packages/libs/prisma";
import redis from "@packages/libs/redis";
import { saveDeadLetter } from "@packages/libs/prisma/dead-letters";
import { setDeadLetterFallback } from "@packages/utils/kafka/dlq";
import { disconnectProducer } from "@packages/utils/kafka/producer";
import { onShutdown } from "@packages/utils/kafka/shutdown";
import { checkConsumerGroup, runChecks } from "@packages/utils/kafka/health";
import { GROUP_ID, consumerState, startUserEventsConsumer, stopUserEventsConsumer } from "./user-events-consumer";

//events that can't be published to the Kafka DLQ topic are kept in MongoDB instead of being lost
setDeadLetterFallback(saveDeadLetter);

const app = express();

//liveness: is the process healthy? Only fails if the consumer has crashed (so an orchestrator should restart us)
app.get("/health", (_req, res) => {
   const state = consumerState();
   res.status(state.crashed ? 503 : 200).json({ status: state.crashed ? "unhealthy" : "ok", service: "kafka-service", uptime: process.uptime(), consumer: state });
});

//readiness: can we actually do our job right now? Needs the broker, our consumer group, MongoDB and Redis
app.get("/ready", async (_req, res) => {
   const report = await runChecks({
      kafka: () => checkConsumerGroup(GROUP_ID),
      database: async () => {
         await prisma.$runCommandRaw({ ping: 1 });
      },
      redis: async () => {
         await redis.ping();
      },
   });
   res.status(report.ok ? 200 : 503).json({ status: report.ok ? "ready" : "not-ready", service: "kafka-service", ...report });
});

const port = process.env.PORT || 6003;
const server = app.listen(port, () => console.log(`kafka-service health endpoints on http://localhost:${port}/health and /ready`));
server.on("error", console.error);

startUserEventsConsumer().catch((err) => {
   console.error("Kafka consumer failed to start:", err);
});

//SIGTERM / SIGINT: stop taking events, finish and commit what is buffered, then disconnect and exit 0
onShutdown("users-events consumer (drain buffer, commit offsets)", stopUserEventsConsumer);
onShutdown("shared Kafka producer", disconnectProducer);
onShutdown("health server", () => new Promise<void>((resolve) => server.close(() => resolve())));
