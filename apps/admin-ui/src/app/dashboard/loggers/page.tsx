"use client";
import React, { useState } from "react";
import { useEffect, useRef } from "react";
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

const Page = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogItem[]>([]);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const socket = new WebSocket(process.env.NEXT_PUBLIC_SOCKET_URL!);
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
    setFilteredLogs(logs);
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  //handle key press for filtering logs
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "1") {
        setFilteredLogs(logs.filter((log) => log.type === "error"));
      } else if (e.key === "2") {
        setFilteredLogs(logs.filter((log) => log.type === "success"));
      } else if (e.key === "0") {
        setFilteredLogs(logs);
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

  return (
    <div>
      Add title: Application logs breadcrumbs waiting for logs when logs arent
      present then display logs: time, service, status, message
    </div>
  );
};

export default Page;
