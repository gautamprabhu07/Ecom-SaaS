//Path: packages/utils/kafka/producer.ts
//one shared producer per process: connect once, reuse for every send. Opening a connection costs a TCP + TLS + SASL
//handshake (hundreds of milliseconds to Confluent Cloud), so doing it per message would dominate the cost of the send.
import type { Producer } from "kafkajs";
import { kafka } from "./index";

let producer: Producer | null = null;
let connection: Promise<void> | null = null;

export const getProducer = async (): Promise<Producer> => {
  if (!producer) producer = kafka.producer();
  if (!connection) {
    //sharing the promise stops concurrent callers each opening their own connection; a failed attempt is retried next call
    connection = producer.connect().catch((error) => {
      connection = null;
      throw error;
    });
  }
  await connection;
  return producer;
};

export const disconnectProducer = async (): Promise<void> => {
  const current = producer;
  const pending = connection;
  producer = null;
  connection = null;
  if (!current) return;
  await pending?.catch(() => undefined);
  await current.disconnect().catch(() => undefined);
};
