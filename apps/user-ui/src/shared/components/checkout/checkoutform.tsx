//Path: apps/user-ui/src/shared/components/checkout/checkoutform.tsx
import React, { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Loader2, XCircle } from "lucide-react";

const CheckoutForm = ({
  clientSecret,
  cartItems,
  coupon,
  sessionId,
}: {
  clientSecret: string;
  cartItems: any[];
  coupon: any;
  sessionId: string | null;
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"success" | "failed" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const total = cartItems.reduce(
    (acc, item) => acc + item.quantity * item.sale_price,
    0,
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMsg(submitError.message || "Please check your payment details.");
      setLoading(false);
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?session_id=${sessionId}`,
      },
    });
    if (result.error) {
      setErrorMsg(result.error.message || "An unexpected error occurred.");
      setStatus("failed");
    } else {
      setStatus("success");
    }
    setLoading(false);
  };
  return (
    <div className="max-w-md mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-neutral-900">
          Secure Payment Checkout
        </h2>

        {/*Dynamic order summary*/}
        <div className="space-y-2 border-y border-neutral-100 py-4">
          {cartItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm text-neutral-600"
            >
              <span>
                {item.quantity} × {item.title}
              </span>
              <span className="font-medium text-neutral-800">
                ${(item.quantity * item.sale_price).toFixed(2)}
              </span>
            </div>
          ))}

          {coupon &&
            typeof coupon.discountAmount === "number" &&
            coupon.discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm text-emerald-600">
                <span>Discount</span>
                <span>-${coupon.discountAmount.toFixed(2)}</span>
              </div>
            )}
          <div className="flex items-center justify-between text-sm font-semibold text-neutral-900 pt-2">
            <span>Total</span>
            <span>${(total - (coupon?.discountAmount || 0)).toFixed(2)}</span>
          </div>
        </div>

        <PaymentElement />

        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Processing..." : "Pay Now"}
        </button>

        {errorMsg && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">
            <XCircle size={16} />
            {errorMsg}
          </div>
        )}
        {status === "success" && (
          <div className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
            Payment Successful! Thank you for your purchase.
          </div>
        )}
        {status === "failed" && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">
            <XCircle size={16} />
            Payment Failed. Please try again.
          </div>
        )}
      </form>
    </div>
  );
};

export default CheckoutForm;
