//path: packages/utils/kafka/index.ts
import {Kafka} from "kafkajs";

export const kafka = new Kafka({
   clientId: "kafka-service",
<<<<<<< HEAD
   brokers: ["pkc-41p56.asia-south1.gcp.confluent.cloud:9092"],
=======
   brokers: ["pkc-xrnwx.asia-south2.gcp.confluent.cloud:9092"],
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
   ssl: true,
   sasl: {
      mechanism: "plain",
      username: process.env.KAFKA_API_KEY!,
      password: process.env.KAFKA_API_SECRET!,
   },
});