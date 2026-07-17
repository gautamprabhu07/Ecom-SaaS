//Path: apps/user-ui/src/app/%28routes%29/checkout/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { loadStripe, Appearance } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { Loader2, XCircle } from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import ChekoutForm from "apps/user-ui/src/shared/components/checkout/checkoutform";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);
const appearance: Appearance = {
  theme: "stripe",
};
const Page = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [coupon, setCoupon] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const fetchSessionAndClientSecret = async () => {
      if (!sessionId) {
        setError("Session ID is missing in the URL.");
        setLoading(false);
        return;
      }
      try {
        const verifyrRes = await axiosInstance.get(
          `/order/api/verify-payment-session?session_id=${sessionId}`,
        );

        const { totalAmount, sellers, coupon, cart } = verifyrRes.data.session;

        if (
          !sellers ||
          sellers.length === 0 ||
          totalAmount === undefined ||
          totalAmount === null
        ) {
          throw new Error("Invalid session data received from the server.");
        }

        setCartItems(cart);
        setCoupon(coupon);
        const sellerStripeAccountId = sellers[0].sellerStripeAccountId;

        const intentRes = await axiosInstance.post(
          "/order/api/create-payment-intent",
          {
            amount: coupon?.discountAmount
              ? totalAmount - coupon?.discountAmount
              : totalAmount,
            sellerStripeAccountId,
            sessionId,
          },
        );

        setClientSecret(intentRes.data.clientSecret);
      } catch (error: any) {
        console.error(
          "Error fetching session or creating payment intent:",
          error,
        );
        setError(
          error?.response?.data?.message ||
            error.message ||
            "An unexpected error occurred.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndClientSecret();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center gap-2 text-neutral-500 text-sm">
        <Loader2 size={16} className="animate-spin" />
        Loading checkout...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center max-w-sm w-full">
          <XCircle className="mx-auto text-rose-500 mb-3" size={32} />
          <h2 className="text-lg font-semibold text-neutral-900 mb-1">
            Payment Failed
          </h2>
          <p className="text-sm text-neutral-500 mb-5">
            {error}. Please go back to the cart and try again.
          </p>
          <button
            onClick={() => router.push("/cart")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-full transition"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    clientSecret && (
      <div className="min-h-screen bg-[#FAF8F3] py-12 px-4">
        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
          <ChekoutForm
            clientSecret={clientSecret}
            cartItems={cartItems}
            coupon={coupon}
            sessionId={sessionId}
          />
        </Elements>
      </div>
    )
  );
};

export default Page;
