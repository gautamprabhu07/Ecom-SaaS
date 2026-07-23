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
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
  debug: "text-gray-600",
};

const typeBadgeMap: Record<LogType, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  error: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  debug: "bg-gray-50 text-gray-700 border-gray-200",
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header + Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Application Logs
          </h1>
          {/*  Breadcrumbs */}
          <Breadcrumbs title="Logs" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Radio
              size={13}
              className={isConnected ? "text-green-500" : "text-gray-300"}
            />
            {isConnected ? "Live" : "Disconnected"}
          </div>
          <button
            onClick={downloadLogs}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              activeFilter === f.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {f.label}
            <span
              className={`text-[10px] px-1 rounded ${
                activeFilter === f.key
                  ? "bg-blue-500 text-blue-100"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {f.hint}
            </span>
          </button>
        ))}
      </div>

      {/* Log list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-sm text-gray-400">
              {logs.length === 0
                ? "Waiting for logs..."
                : "No logs match this filter."}
            </p>
          </div>
        ) : (
          <div
            ref={logContainerRef}
            className="max-h-[70vh] overflow-y-auto divide-y divide-gray-50"
          >
            {/* Table header */}
            <div className="grid grid-cols-[110px_140px_90px_1fr] gap-3 px-4 py-2.5 bg-gray-50 text-xs font-medium text-gray-500 sticky top-0">
              <span>Time</span>
              <span>Service</span>
              <span>Status</span>
              <span>Message</span>
            </div>

            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className="grid grid-cols-[110px_140px_90px_1fr] gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition"
              >
                <span className="text-xs text-gray-400 font-mono">
                  {formatTime(log.timestamp)}
                </span>
                <span className="text-xs text-gray-600 truncate">
                  {log.source || "unknown-service"}
                </span>
                <span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${typeBadgeMap[log.type]}`}
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
