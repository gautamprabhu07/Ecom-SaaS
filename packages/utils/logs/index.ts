//Path: packages/utils/logs/index.ts
import { getProducer } from "../kafka/producer";

export async function sendLog({
  type = 'info',
  message,
  source = 'unknown-service',
}: {
  type?: 'info' | 'error' | 'warning' | "success" | "debug";
  message: string;
  source?: string;
}) {
  const logPayload = {
    type,
    message,
    source,
    timestamp: new Date().toISOString(),
  };

  //the shared producer connects once and is reused: this used to connect and disconnect on every single log line
  const producer = await getProducer();
  await producer.send({
    topic: 'logs',
    messages: [{ value: JSON.stringify(logPayload) }],
  });
}
