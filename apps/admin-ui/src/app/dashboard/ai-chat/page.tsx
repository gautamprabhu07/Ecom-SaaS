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
    <div className="p-6 font-['Inter']">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-['Nunito'] text-xl font-extrabold text-[#292524] flex items-center gap-2">
          <Sparkles size={20} className="text-[#059669]" />
          AI Chat
        </h2>
      </div>

      <div className="mb-4">
        <Breadcrumbs title="AI Chat" />
      </div>

      <div className="rounded-2xl border border-[#E7E5E4] bg-white shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] flex flex-col h-[65vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center text-center mt-10 gap-3">
              <div className="w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center">
                <Sparkles size={22} className="text-[#059669]" />
              </div>
              <p className="text-sm text-[#78716C] max-w-xs">
                Ask about store performance — e.g. "What's the most sold
                product?" or "Which shop has the most visitors?"
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "admin" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap transition-shadow duration-200 ${
                  msg.role === "admin"
                    ? "bg-[#059669] text-white shadow-[0_4px_12px_-2px_rgba(5,150,105,0.3)]"
                    : "bg-[#F5F5F4] text-[#292524]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isPending && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[75%] rounded-2xl px-3.5 py-2 text-sm bg-[#F5F5F4] text-[#78716C]">
                Thinking...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-[#F5F5F4] p-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about products, shops, or user activity..."
            disabled={isPending}
            className="flex-1 text-sm outline-none border border-[#E7E5E4] rounded-full px-4 py-2 text-[#292524] placeholder:text-[#A8A29E] transition-all duration-200 focus:ring-2 focus:ring-[#059669] focus:border-[#059669] disabled:bg-[#FAF8F3]"
          />
          <button
            onClick={handleSend}
            disabled={isPending || !input.trim()}
            className="flex items-center gap-1.5 text-sm font-medium bg-[#059669] text-white px-4 py-2 rounded-full hover:bg-[#047857] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
