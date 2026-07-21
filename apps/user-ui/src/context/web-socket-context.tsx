//Path: apps/user-ui/src/context/web-socket-context.tsx
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
  user,
}: {
  children: React.ReactNode;
  user: any;
}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [, forceRender] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?.id) return;

    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_CHATTING_WEBSOCKET_URL}`,
    );
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(`user_${user.id}`);
      forceRender((n) => n + 1);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "UNSEEN_COUNT_UPDATE") {
        const { conversationId, count } = data.payload;
        setUnreadCounts((prev) => ({
          ...prev,
          [conversationId]: count,
        }));
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [user?.id]);

  return (
    <WebSocketContext.Provider value={{ ws: wsRef.current, unreadCounts }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
