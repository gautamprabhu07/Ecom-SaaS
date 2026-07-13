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
    <div>
      <form onSubmit={handleSubmit}>
        <h2>Secure Payment Checkout</h2>

        {/*Dynamic order summary*/}
        <div>
          {cartItems.map((item, index) => (
            <div key={index}>
              <span>{item.quantity}</span>
              <span>{item.title}</span>
              <span>${(item.quantity * item.sale_price).toFixed(2)}</span>
            </div>
          ))}

          <div>
            {coupon && coupon?.discountAmount !== 0 && (
              <>
                <span>Discount</span>
                <span>${(coupon?.discountAmount).toFixed(2)}</span>
              </>
            )}
          </div>
          <div>
            <span>Total</span>
            <span>
              ${(total - coupon ? coupon?.discountAmount : 0).toFixed(2)}
            </span>
          </div>
        </div>

        <PaymentElement />
        <button type="submit" disabled={!stripe || loading}>
          {loading && <Loader2 />}
          {loading ? "Processing..." : "Pay Now"}
        </button>

        {errorMsg && (
          <div>
            <XCircle />
            {errorMsg}
          </div>
        )}
        {status === "success" && (
          <div>Payment Successful! Thank you for your purchase.</div>
        )}
        {status === "failed" && (
          <div>
            <XCircle />
            Payment Failed. Please try again.
          </div>
        )}
      </form>
    </div>
  );
};

export default CheckoutForm;
