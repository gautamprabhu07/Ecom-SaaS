// Path: apps/user-ui/src/app/(routes)/payment-success/page.tsx
"use client";

import { useStore } from "apps/user-ui/src/store";
import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const router = useRouter();

  useEffect(() => {
    // clear the cart now that payment succeeded
    useStore.setState({ cart: [] });

    // confetti burst
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: ["#2563eb", "#f59e0b", "#22c55e"],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: ["#2563eb", "#f59e0b", "#22c55e"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 size={36} className="text-green-500" />
          </div>
        </div>

        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          Payment Successful!
        </h1>
        <p className="text-sm text-gray-500 mb-1">
          Thank you for your order. We've received your payment and your order
          is being processed.
        </p>

        {sessionId && (
          <p className="text-xs text-gray-400 mt-3 mb-6">
            Session ID: <span className="font-mono">{sessionId}</span>
          </p>
        )}

        <button
          onClick={() => router.push("/profile?active=My+Orders")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition"
        >
          Track Order
        </button>

        <button
          onClick={() => router.push("/")}
          className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
