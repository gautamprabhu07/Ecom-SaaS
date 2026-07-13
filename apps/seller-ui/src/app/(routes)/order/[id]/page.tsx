"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../utils/axiosInstance";

const status = [
  "Ordered",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const Page = () => {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const fetchOrder = async () => {
    try {
      const response = await axiosInstance.get(
        `/order/api/get-order-details/${orderId}`,
      );
      setOrder(response.data.order);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      await axiosInstance.put(`/order/api/update-status/${orderId}`, {
        status: newStatus,
      });
      setOrder((prevOrder: any) => ({
        ...prevOrder,
        deliveryStatus: newStatus,
      }));
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div>
        <Loader2 />
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <p>Order not found</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <span onClick={() => router.push("/dashboard/orders")}>
          <ArrowLeft />
          Back to Dashboard
        </span>
      </div>

      <h3>Order #{order.id.slice(-6).toUpperCase()}</h3>

      {/* Status selector */}
      <div>
        <label>Update delivery status:</label>
        <select
          value={order.deliveryStatus}
          onChange={handleStatusChange}
          disabled={updating}
        >
          {status.map((s) => {
            const currentIndex = status.indexOf(order.deliveryStatus);
            const statusIndex = status.indexOf(s);

            return (
              <option key={s} value={s} disabled={statusIndex < currentIndex}>
                {s}
              </option>
            );
          })}
        </select>
      </div>

      {/* Delivery Progress */}
      <div>
        <div>
          {status.map((step, index) => {
            const current = step === order.deliveryStatus;
            const passed = status.indexOf(order.deliveryStatus) >= index;
            return (
              <div key={step}>
                <div>{passed ? "✓" : index + 1}</div>
                <span>{step}</span>
              </div>
            );
          })}
        </div>
        <div>
          {status.map((step, idx) => {
            const reached = idx <= status.indexOf(order.deliveryStatus);
            return (
              <div>
                <div
                  style={{
                    width: "100%",
                    height: "4px",
                    backgroundColor: reached ? "green" : "lightgray",
                  }}
                />
                {idx !== status.length - 1 && (
                  <div
                    style={{
                      width: "100%",
                      height: "4px",
                      backgroundColor: "lightgray",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Info */}
      <div>
        <p>
          <span>Payment Status:</span>
          <span>{order.status}</span>
        </p>
        <p>
          <span>Total Paid:</span>
          <span>${order.total.toFixed(2)}</span>
        </p>
        {order.discountAmount > 0 && (
          <p>
            <span>Discount Applied:</span>
            <span>
              ${order.discountAmount.toFixed(2)}(
              {order.couponCode?.discountType === "percentage"
                ? `${order.couponCode?.discountValue}%`
                : `$${order.couponCode?.discountValue}`}
              )
            </span>
          </p>
        )}

        {order.couponCode && (
          <p>
            <span>Coupon Used:</span>
            <span>{order.couponCode.public_name}</span>
          </p>
        )}

        <p>
          <span>Date: </span>
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Shipping address */}
      {order.shippingAddress && (
        <div>
          <h4>Shipping Address</h4>
          <p>{order.shippingAddress.name}</p>
          <p>
            {order.shippingAddress.street}, {order.shippingAddress.city}{" "}
            {order.shippingAddress.zip}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>
      )}

      {/* Order Items */}
      <div>
        <h2>Order Items</h2>

        <div>
          {order.items.map((item: any) => (
            <div key={item.productId}>
              <img src={item.product?.images[0]?.url} alt={item.title} />
              <div>
                <p>{item.product?.title}</p>
                <p>Quantity: {item.quantity}</p>
                {item.selectedOptions &&
                  Object.keys(item.selectedOptions).length > 0 && (
                    <div>
                      {Object.entries(item.selectedOptions).map(
                        ([key, value]: [string, any]) =>
                          value && (
                            <span key={key}>
                              {key}: {value}
                            </span>
                          ),
                      )}
                    </div>
                  )}
                <p>Price: ${item.sale_price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
