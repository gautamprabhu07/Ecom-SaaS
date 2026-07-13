//Path: apps/user-ui/src/app/%28routes%29/checkout/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { loadStripe, Appearance } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { XCircle } from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import ChekoutForm from "apps/user-ui/src/shared/components/checkout/checkoutform";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

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
        const sellerStripeAccountId = sellers[0].stripeAccountId;

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

  const appearance: Appearance = {
    theme: "stripe",
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    <div>
      <div>
        <div>
          <XCircle />
        </div>
        <h2>Payment Failed</h2>
        <p>{error}. Please go back to the cart and try again.</p>
        <button onClick={() => router.push("/cart")}>Back to Cart</button>
      </div>
    </div>;
  }

  return;
  clientSecret && (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
      <ChekoutForm
        clientSecret={clientSecret}
        cartItems={cartItems}
        coupon={coupon}
        sessionId={sessionId}
      />
    </Elements>
  );
};

export default Page;
