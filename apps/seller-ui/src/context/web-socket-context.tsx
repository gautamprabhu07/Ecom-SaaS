//Path: apps/seller-ui/src/context/web-socket-context.tsx
"use client";
import { useEffect, useRef, useState, createContext, useContext } from "react";

interface WebSocketContextValue {
  ws: WebSocket | null;
  unreadCounts: Record<string, number>;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  ws: null,
  unreadCounts: {},
});

export const WebSocketProvider = ({
  children,
  seller,
}: {
  children: React.ReactNode;
  seller: any;
}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [, forceRender] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!seller?.id) return;

    let ws: WebSocket;
    try {
      ws = new WebSocket(`${process.env.NEXT_PUBLIC_CHATTING_WEBSOCKET_URL}`);
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(`seller_${seller.id}`);
      forceRender((n) => n + 1);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "UNSEEN_COUNT_UPDATE") {
          const { conversationId, count } = data.payload;
          setUnreadCounts((prev) => ({
            ...prev,
            [conversationId]: count,
          }));
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = (err) => {
      // Suppress noisy StrictMode double-mount close errors in dev;
      // genuine connection failures will surface via onclose/retry logic instead.
      if (
        ws.readyState !== WebSocket.CLOSING &&
        ws.readyState !== WebSocket.CLOSED
      ) {
        console.error("WebSocket error:", err);
      }
    };

    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [seller?.id]);

  // Always render children immediately — chat connectivity is
  // supplementary and must never block the rest of the app.
  return (
    <WebSocketContext.Provider value={{ ws: wsRef.current, unreadCounts }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
