//Path: apps/seller-ui/src/app/provider.tsx

"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import { Toaster } from "sonner";
import useSeller from "../hooks/useSeller";
import { WebSocketProvider } from "../context/web-socket-context";

const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ProvidersWithWebSocket>{children}</ProvidersWithWebSocket>
      <Toaster />
    </QueryClientProvider>
  );
};

const ProvidersWithWebSocket = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { seller, isLoading } = useSeller();

  return (
    <>
      {seller ? (
        <WebSocketProvider seller={seller}>{children}</WebSocketProvider>
      ) : (
        children
      )}
    </>
  );
};

export default Providers;
