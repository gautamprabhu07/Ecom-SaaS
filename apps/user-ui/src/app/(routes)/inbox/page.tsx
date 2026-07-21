//Path: apps/user-ui/src/app/(routes)/inbox/page.tsx
"use client";
import { useSearchParams, useRouter } from "next/navigation";
import useRequireAuth from "../../../hooks/useRequiredAuth";
import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import axiosInstance from "../../../utils/axiosInstance";
import { isProtected } from "../../../utils/protected";
import { useWebSocket } from "../../../context/web-socket-context";
import ChatInput from "../../../shared/components/chats/chatinput";

const Page = () => {
  const searchParams = useSearchParams();
  const { user, isLoading: userLoading } = useRequireAuth();
  const router = useRouter();
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const conversationId = searchParams.get("conversationId");
  const { ws, unreadCounts } = useWebSocket();

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/chatting/api/get-messages/${conversationId}?page=1`,
        isProtected,
      );
      setPage(1);
      setHasMore(res.data.hasMore);
      return res.data.messages.reverse();
    },
    enabled: !!conversationId,
    staleTime: 2 * 60 * 1000,
  });

  const loadMoreMessages = async () => {
    if (!conversationId) return;
    const nextPage = page + 1;
    const res = await axiosInstance.get(
      `/chatting/api/get-messages/${conversationId}?page=${nextPage}`,
      isProtected,
    );

    queryClient.setQueryData(["messages", conversationId], (old: any) => [
      ...res.data.messages.reverse(),
      ...(old || []),
    ]);
    setPage(nextPage);
    setHasMore(res.data.hasMore);
  };

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        "/chatting/api/get-user-conversations",
        isProtected,
      );
      return response.data.conversations;
    },
  });

  useEffect(() => {
    if (conversations) setChats(conversations);
  }, [conversations]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (conversationId && chats.length > 0) {
      const chat = chats.find((c) => c.conversationId === conversationId);
      setSelectedChat(chat || null);
    }
  }, [conversationId, chats]);

  useEffect(() => {
    if (!ws) return;
    const handleIncoming = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_MESSAGE") {
        const payload = data.payload;
        queryClient.setQueryData(
          ["messages", payload.conversationId],
          (old: any) => [...(old || []), payload],
        );
        setChats((prev) =>
          prev.map((c) =>
            c.conversationId === payload.conversationId
              ? { ...c, lastMessage: payload.content }
              : c,
          ),
        );
        scrollToBottom();
      }
    };
    ws.addEventListener("message", handleIncoming);
    return () => ws.removeEventListener("message", handleIncoming);
  }, [ws, queryClient]);

  const handleChatSelect = (chat: any) => {
    setChats((prev) =>
      prev.map((c) =>
        c.conversationId === chat.conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    );
    router.push(`?conversationId=${chat.conversationId}`);

    ws?.send(
      JSON.stringify({
        type: "MARK_AS_SEEN",
        conversationId: chat.conversationId,
      }),
    );
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
  };

  const handleSend = async (e: any) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    const payload = {
      fromUserId: user?.id,
      toUserId: selectedChat.seller?.id,
      conversationId: selectedChat.conversationId,
      messageBody: message,
      senderType: "user",
    };

    ws?.send(JSON.stringify(payload));

    queryClient.setQueryData(
      ["messages", selectedChat.conversationId],
      (old: any) => [
        ...(old || []),
        {
          content: payload.messageBody,
          senderType: "user",
          createdAt: new Date().toISOString(),
        },
      ],
    );

    setChats((prev) =>
      prev.map((c) =>
        c.conversationId === selectedChat.conversationId
          ? { ...c, lastMessage: payload.messageBody }
          : c,
      ),
    );

    setMessage("");
    scrollToBottom();
  };

  const getLastMessage = (chat: any) => chat.lastMessage || "";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto flex gap-4 h-[75vh] bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800">
            Messages
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-sm text-gray-400">Loading...</div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">
                No conversations found.
              </div>
            ) : (
              chats.map((chat) => {
                const isActive =
                  selectedChat?.conversationId === chat.conversationId;
                return (
                  <button
                    key={chat.conversationId}
                    onClick={() => handleChatSelect(chat)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition ${isActive ? "bg-blue-50" : ""}`}
                  >
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-100 shrink-0">
                      {chat.seller?.avatar && (
                        <Image
                          src={chat.seller.avatar}
                          alt={chat.seller?.name || "Seller"}
                          width={36}
                          height={36}
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {chat.seller?.name}
                        </span>
                        {chat.seller?.isOnline && (
                          <span className="text-[10px] text-green-600">●</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {getLastMessage(chat)}
                      </p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="text-[10px] bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main chat panel */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-100">
                  {selectedChat.seller?.avatar && (
                    <Image
                      src={selectedChat.seller.avatar}
                      alt={selectedChat.seller?.name || "Seller"}
                      width={36}
                      height={36}
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">
                    {selectedChat.seller?.name}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedChat.seller?.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              <div
                ref={messageContainerRef}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
              >
                {hasMore && (
                  <div className="text-center">
                    <button
                      onClick={loadMoreMessages}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Load previous messages
                    </button>
                  </div>
                )}
                {messages.map((msg: any, index: number) => (
                  <div
                    key={index}
                    className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                        msg.senderType === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div>{msg.text || msg.content}</div>
                      <div
                        className={`text-[10px] mt-0.5 ${msg.senderType === "user" ? "text-blue-100" : "text-gray-400"}`}
                      >
                        {msg.time ||
                          new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={scrollAnchorRef} />
              </div>

              <ChatInput
                message={message}
                setMessage={setMessage}
                onSendMessage={handleSend}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
