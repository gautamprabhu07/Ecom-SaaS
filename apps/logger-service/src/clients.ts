//Path: apps/logger-service/src/clients.ts
//the WebSocket clients (admin dashboards) currently watching the live log stream.
//Lives in its own module so main.ts and logger-consumer.ts don't have to import each other.
import WebSocket from 'ws';

export const clients = new Set<WebSocket>();
