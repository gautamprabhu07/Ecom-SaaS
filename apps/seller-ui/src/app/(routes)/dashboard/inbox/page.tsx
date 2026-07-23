//Path: apps/seller-ui/src/app/(routes)/dashboard/inbox/page.tsx
"use client";
import { useSearchParams, useRouter } from "next/navigation";
import useSeller from "../../../../hooks/useSeller";
import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import axiosInstance from "../../../../utils/axiosInstance";
import { isProtected } from "../../../../utils/protected";
import { useWebSocket } from "../../../../context/web-socket-context";
import ChatInput from "../../../../shared/components/chats/chatinput";

const Page = () => {
  const searchParams = useSearchParams();
  const { seller } = useSeller();
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
  const { ws } = useWebSocket();

  const { data: messages = [] } = useQuery({
    queryKey: ["seller-messages", conversationId],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/chatting/api/get-seller-messages/${conversationId}?page=1`,
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
      `/chatting/api/get-seller-messages/${conversationId}?page=${nextPage}`,
      isProtected,
    );

    queryClient.setQueryData(
      ["seller-messages", conversationId],
      (old: any) => [...res.data.messages.reverse(), ...(old || [])],
    );
    setPage(nextPage);
    setHasMore(res.data.hasMore);
  };

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["seller-conversations"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        "/chatting/api/get-seller-conversations",
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
          ["seller-messages", payload.conversationId],
          (old: any) => {
            const previousMessages = old || [];
            const pendingIndex = previousMessages.findIndex(
              (message: any) =>
                message.pending &&
                message.senderType === payload.senderType &&
                message.content === payload.content,
            );

            if (pendingIndex !== -1) {
              return previousMessages.map((message: any, index: number) =>
                index === pendingIndex ? { ...payload } : message,
              );
            }

            return [...previousMessages, payload];
          },
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
      fromUserId: seller?.id,
      toUserId: selectedChat.user?.id,
      conversationId: selectedChat.conversationId,
      messageBody: message,
      senderType: "seller",
    };

    ws?.send(JSON.stringify(payload));

    queryClient.setQueryData(
      ["seller-messages", selectedChat.conversationId],
      (old: any) => [
        ...(old || []),
        {
          pending: true,
          senderId: seller?.id,
          content: payload.messageBody,
          senderType: "seller",
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
    <div className="min-h-screen bg-[#FAF8F3] p-6">
      <div className="max-w-6xl mx-auto flex gap-4 h-[75vh] bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 shrink-0 border-r border-neutral-100 flex flex-col">
          <div className="px-4 py-3 border-b border-neutral-100 font-semibold text-neutral-900">
            Messages
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-sm text-neutral-400">Loading...</div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-sm text-neutral-400">
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
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition ${isActive ? "bg-emerald-50" : ""}`}
                  >
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-neutral-100 shrink-0">
                      {chat.user?.avatar && (
                        <Image
                          src={chat.user.avatar}
                          alt={chat.user?.name || "User"}
                          width={36}
                          height={36}
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-neutral-800 truncate">
                          {chat.user?.name}
                        </span>
                        {chat.user?.isOnline && (
                          <span className="text-[10px] text-emerald-500">
                            ●
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 truncate">
                        {getLastMessage(chat)}
                      </p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="text-[10px] bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0">
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
              <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-neutral-100">
                  {selectedChat.user?.avatar && (
                    <Image
                      src={selectedChat.user.avatar}
                      alt={selectedChat.user?.name || "User"}
                      width={36}
                      height={36}
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">
                    {selectedChat.user?.name}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    {selectedChat.user?.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              <div
                ref={messageContainerRef}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#FDFCF9]"
              >
                {hasMore && (
                  <div className="text-center">
                    <button
                      onClick={loadMoreMessages}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      Load previous messages
                    </button>
                  </div>
                )}
                {messages.map((msg: any, index: number) => (
                  <div
                    key={index}
                    className={`flex ${msg.senderType === "seller" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                        msg.senderType === "seller"
                          ? "bg-emerald-600 text-white"
                          : "bg-white border border-neutral-200 text-neutral-800"
                      }`}
                    >
                      <div>{msg.text || msg.content}</div>
                      <div
                        className={`text-[10px] mt-0.5 ${msg.senderType === "seller" ? "text-emerald-100" : "text-neutral-400"}`}
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
            <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
