//Path: apps/admin-ui/src/app/dashboard/loggers/page.tsx
"use client";
import React, { useState } from "react";
import { useEffect, useRef } from "react";
import { Download, Radio } from "lucide-react";
import Breadcrumbs from "../../../shared/components/breadcrumbs";

type LogType = "info" | "error" | "warning" | "success" | "debug";

type LogItem = {
  type: LogType;
  message: string;
  source?: string;
  timestamp: string;
};

const typeColorMap: Record<LogType, string> = {
  success: "text-[#047857]",
  error: "text-red-600",
  warning: "text-[#9a5b1f]",
  info: "text-[#292524]",
  debug: "text-[#78716C]",
};

const typeBadgeMap: Record<LogType, string> = {
  success: "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]",
  error: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-[#FDBA74]/20 text-[#9a5b1f] border-[#FDBA74]/40",
  info: "bg-[#F5F5F4] text-[#57534e] border-[#E7E5E4]",
  debug: "bg-[#F5F5F4] text-[#78716C] border-[#E7E5E4]",
};

const Page = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "error" | "success">(
    "all",
  );
  const [isConnected, setIsConnected] = useState(false);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const socket = new WebSocket(process.env.NEXT_PUBLIC_SOCKET_URL!);

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);
    socket.onerror = () => setIsConnected(false);

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setLogs((prevLogs) => [...prevLogs, parsed]);
      } catch (error) {
        console.error("Error parsing log message:", error);
      }
    };
    return () => {
      socket.close();
    };
  }, []);

  //auto scroll to bottom when new logs are added
  useEffect(() => {
    applyFilter(activeFilter);
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const applyFilter = (filter: "all" | "error" | "success") => {
    setActiveFilter(filter);
    if (filter === "all") {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter((log) => log.type === filter));
    }
  };

  //handle key press for filtering logs
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "1") {
        applyFilter("error");
      } else if (e.key === "2") {
        applyFilter("success");
      } else if (e.key === "0") {
        applyFilter("all");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [logs]);

  const downloadLogs = () => {
    const content = filteredLogs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message} ${log.source ? `(${log.source})` : ""}`,
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "application-logs.log";
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] p-6 font-['Inter']">
      {/* Header + Breadcrumb */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-['Nunito'] text-2xl font-extrabold text-[#292524]">
            Application Logs
          </h1>
          {/*  Breadcrumbs */}
          <Breadcrumbs title="Logs" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#78716C] bg-white border border-[#E7E5E4] rounded-full px-3 py-1.5">
            <Radio
              size={13}
              className={
                isConnected
                  ? "text-[#059669] animate-pulse-soft"
                  : "text-[#A8A29E]"
              }
            />
            {isConnected ? "Live" : "Disconnected"}
          </div>
          <button
            onClick={downloadLogs}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-[#059669] text-white hover:bg-[#047857] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4">
        {[
          { key: "all", label: "All", hint: "0" },
          { key: "error", label: "Errors", hint: "1" },
          { key: "success", label: "Success", hint: "2" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => applyFilter(f.key as "all" | "error" | "success")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
              activeFilter === f.key
                ? "bg-[#059669] text-white border-[#059669]"
                : "bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#059669] hover:text-[#047857]"
            }`}
          >
            {f.label}
            <span
              className={`text-[10px] px-1 rounded-full ${
                activeFilter === f.key
                  ? "bg-white/20 text-white"
                  : "bg-[#F5F5F4] text-[#A8A29E]"
              }`}
            >
              {f.hint}
            </span>
          </button>
        ))}
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <span className="text-xl">📜</span>
            </div>
            <p className="text-sm text-[#78716C]">
              {logs.length === 0
                ? "Waiting for logs..."
                : "No logs match this filter."}
            </p>
          </div>
        ) : (
          <div
            ref={logContainerRef}
            className="max-h-[70vh] overflow-y-auto divide-y divide-[#F5F5F4]"
          >
            {/* Table header */}
            <div className="grid grid-cols-[110px_140px_90px_1fr] gap-3 px-4 py-2.5 bg-[#FAF8F3] text-xs font-medium text-[#78716C] sticky top-0">
              <span>Time</span>
              <span>Service</span>
              <span>Status</span>
              <span>Message</span>
            </div>

            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className="grid grid-cols-[110px_140px_90px_1fr] gap-3 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-[#FAF8F3]"
              >
                <span className="text-xs text-[#A8A29E] font-mono">
                  {formatTime(log.timestamp)}
                </span>
                <span className="text-xs text-[#78716C] truncate">
                  {log.source || "unknown-service"}
                </span>
                <span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border transition-transform duration-150 hover:scale-105 ${typeBadgeMap[log.type]}`}
                  >
                    {log.type.toUpperCase()}
                  </span>
                </span>
                <span className={`truncate ${typeColorMap[log.type]}`}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
