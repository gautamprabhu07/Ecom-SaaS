//Path: apps/chatting-service/src/websocket.ts
import { kafka } from '@packages/utils/kafka';
import { WebSocketServer, WebSocket } from 'ws';
import redis from '@packages/libs/redis';
import { Server as HttpServer } from 'http';

const producer = kafka.producer();
const connectedUsers: Map<string, WebSocket> = new Map();
const unseenCounts: Map<string, number> = new Map();

type IncomingMessage = {
   type?: string;
   fromUserId?: string;
   toUserId?: string;
   messageBody: string;
   conversationId: string;
   senderType: string;
};

export async function createWebSocketServer(server: HttpServer) {
   const wss = new WebSocketServer({ server });

   await producer.connect();
   console.log('Kafka producer connected');

   wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection established');

      let registeredUserId: string | null = null;

      ws.on('message', async (rawMessage) => {
         try {
            const messageStr = rawMessage.toString();

            if (!registeredUserId && !messageStr.startsWith('{')) {
               registeredUserId = messageStr;
               connectedUsers.set(registeredUserId, ws);
               console.log(`User ${registeredUserId} registered with WebSocket server`);

               const isSeller = registeredUserId.startsWith('seller_');
               const redisKey = isSeller
                  ? `online:seller:${registeredUserId.replace('seller_', '')}`
                  : `online:user:${registeredUserId.replace('user_', '')}`;
               await redis.set(redisKey, '1');
               await redis.expire(redisKey, 300);
               return;
            }

            const data: IncomingMessage = JSON.parse(messageStr);

            if (data.type === 'MARK_AS_SEEN' && registeredUserId) {
               const seenKey = `${registeredUserId}_${data.conversationId}`;
               unseenCounts.set(seenKey, 0);
               return;
            }

            const { fromUserId, toUserId, messageBody, conversationId, senderType } = data;

            if (!data || !toUserId || !messageBody || !conversationId) {
               console.warn('Invalid message received:', data);
               return;
            }

            const now = new Date().toISOString();

            const messagePayload = {
               conversationId,
               senderId: fromUserId,
               senderType,
               content: messageBody,
               createdAt: now,
            };

            const messageEvent = JSON.stringify({
               type: 'NEW_MESSAGE',
               payload: messagePayload,
            });

            const recieverKey = senderType === 'user' ? `seller_${toUserId}` : `user_${toUserId}`;
            const senderKey = senderType === 'user' ? `user_${fromUserId}` : `seller_${fromUserId}`;

            const unseenKey = `${recieverKey}_${conversationId}`;
            const prevCount = unseenCounts.get(unseenKey) || 0;
            unseenCounts.set(unseenKey, prevCount + 1);

            const recieverSocket = connectedUsers.get(recieverKey);
            if (recieverSocket && recieverSocket.readyState === WebSocket.OPEN) {
               recieverSocket.send(messageEvent);
               recieverSocket.send(
                  JSON.stringify({
                     type: 'UNSEEN_COUNT_UPDATE',
                     payload: { conversationId, count: prevCount + 1 },
                  }),
               );
               console.log(
                  `Sent unseen count update to ${recieverKey} for conversation ${conversationId}: ${prevCount + 1}`,
               );
            } else {
               console.log(`User ${recieverKey} is not connected. Message will be sent when they connect.`);
            }

            const senderSocket = connectedUsers.get(senderKey);
            if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
               senderSocket.send(messageEvent);
               console.log(`Echoed message back to sender ${senderKey}`);
            }

            await producer.send({
               topic: 'chat_new_message',
               messages: [
                  {
                     key: conversationId,
                     value: JSON.stringify(messagePayload),
                  },
               ],
            });
            console.log(`Message sent to Kafka topic 'chat_new_message' for conversation ${conversationId}`);
         } catch (error) {
            console.error('Error processing WebSocket message:', error);
         }
      });

      ws.on('close', async () => {
         if (registeredUserId) {
            connectedUsers.delete(registeredUserId);
            console.log(`User ${registeredUserId} disconnected from WebSocket server`);
            const isSeller = registeredUserId.startsWith('seller_');
            const redisKey = isSeller
               ? `online:seller:${registeredUserId.replace('seller_', '')}`
               : `online:user:${registeredUserId.replace('user_', '')}`;
            await redis.del(redisKey);
         }
      });

      ws.on('error', (error) => {
         console.error('WebSocket error:', error);
      });
   });

   console.log('WebSocket server is running and ready to accept connections');
}