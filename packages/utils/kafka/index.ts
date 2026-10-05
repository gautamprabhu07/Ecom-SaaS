//path: packages/utils/kafka/index.ts
import {Kafka} from "kafkajs";

export const kafka = new Kafka({
   clientId: "kafka-service",
   brokers: ["pkc-41p56.asia-south1.gcp.confluent.cloud:9092"],
   ssl: true,
   sasl: {
      mechanism: "plain",
      username: process.env.KAFKA_API_KEY!,
      password: process.env.KAFKA_API_SECRET!,
   },
   //kafkajs gives a new connection only 1 second to complete its TCP + TLS + SASL handshake. Over a normal internet
   //link to Confluent Cloud that is often not enough ("Connection timeout" / "socket disconnected before secure TLS
   //connection was established"), and every service shares this client, so allow a realistic amount of time.
   connectionTimeout: 10_000,
   authenticationTimeout: 10_000,
   requestTimeout: 30_000,
   //keep trying through brief network trouble instead of giving up quickly (backoff grows from 300ms)
   retry: { initialRetryTime: 300, retries: 8 },
});
