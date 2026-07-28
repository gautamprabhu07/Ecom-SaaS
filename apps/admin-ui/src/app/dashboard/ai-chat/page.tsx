//Path: apps/admin-ui/src/app/dashboard/ai-chat/page.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Send } from "lucide-react";
import axiosInstance from "../../../utils/axiosInstance";
import Breadcrumbs from "../../../shared/components/breadcrumbs";

interface ChatMessage {
  role: "admin" | "assistant";
  content: string;
}

const askAnalyticsAssistant = async (message: string) => {
  const response = await axiosInstance.post("/admin/api/ai-chat", { message });
  return response.data.reply as string;
};

const AiChatPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: askAnalyticsAssistant,
    onSuccess: (reply) => {
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: errorMessage }]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isPending) return;

    setMessages((prev) => [...prev, { role: "admin", content: trimmed }]);
    sendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles size={20} className="text-emerald-600" />
          AI Chat
        </h2>
      </div>

      <div className="mb-4">
        <Breadcrumbs title="AI Chat" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white flex flex-col h-[65vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-gray-400 text-center mt-10">
              Ask about store performance — e.g. "What's the most sold product?" or
              "Which shop has the most visitors?"
            </p>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "admin" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "admin"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isPending && (
            <div className="flex justify-start">
              <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-400">
                Thinking...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-100 p-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about products, shops, or user activity..."
            disabled={isPending}
            className="flex-1 text-sm outline-none border border-gray-200 rounded-lg px-3 py-2 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
          />
          <button
            onClick={handleSend}
            disabled={isPending || !input.trim()}
            className="flex items-center gap-1.5 text-sm font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChatPage;
