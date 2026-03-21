import { useEffect, useState } from "react";
import { SERVER } from "../../config/global";
import "./Orders.css";

function formatLabel(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSchedule(order) {
  if (!order?.scheduledFor) return "As soon as possible";

  const date = new Date(order.scheduledFor);
  const dateText = Number.isNaN(date.getTime())
    ? "Scheduled"
    : date.toLocaleDateString();

  return order?.scheduledSlot
    ? `${dateText} (${order.scheduledSlot})`
    : dateText;
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${SERVER}/api/orders`, {
          credentials: "include",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (isMounted) {
            setError(data?.error || "Could not load orders.");
          }
          return;
        }

        if (isMounted) {
          setOrders(Array.isArray(data?.orders) ? data.orders : []);
        }
      } catch {
        if (isMounted) {
          setError("Could not load orders.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this order? Stock will be restored.",
      )
    ) {
      return;
    }

    try {
      setCancelling(orderId);

      const res = await fetch(`${SERVER}/api/orders/${orderId}/cancel`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || "Could not cancel order.");
        return;
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? data.order : order)),
      );
    } catch {
      alert("Could not cancel order.");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <section className="orders-wrap">
      <div className="orders-head">
        <h1>My Orders</h1>
        <p>Track your confirmed bouquets and delivery details.</p>
      </div>

      {loading && <div className="orders-state">Loading orders...</div>}
      {error && !loading && <div className="orders-state error">{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="orders-state">You have no orders yet.</div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="orders-card" key={order.id}>
              <div className="orders-card-head">
                <div>
                  <h2>Order #{order.id.slice(0, 8)}</h2>
                  <p>{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <span className="orders-badge">{order.status}</span>
              </div>

              <div className="orders-grid">
                <div className="orders-stat">
                  <span>Payment</span>
                  <strong>{formatLabel(order.paymentMethod)}</strong>
                </div>
                <div className="orders-stat">
                  <span>Delivery</span>
                  <strong>{formatLabel(order.deliveryOption)}</strong>
                </div>
                <div className="orders-stat">
                  <span>Items</span>
                  <strong>
                    {order.lines.reduce(
                      (sum, line) => sum + Number(line.quantity || 0),
                      0,
                    )}
                  </strong>
                </div>
                <div className="orders-stat">
                  <span>Total</span>
                  <strong>
                    RON {Number(order.finalPrice || 0).toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="orders-details">
                <p>
                  <strong>Schedule:</strong> {formatSchedule(order)}
                </p>
                <p>
                  <strong>Address:</strong> {order.deliveryStreet},{" "}
                  {order.deliveryCity}, {order.deliveryState}
                  {order.deliveryZipCode ? `, ${order.deliveryZipCode}` : ""}
                  {order.deliveryDetails ? ` (${order.deliveryDetails})` : ""}
                </p>
                <p>
                  <strong>Pricing:</strong> Subtotal RON{" "}
                  {Number(order.totalPrice || 0).toFixed(2)}
                  {Number(order.totalDiscount || 0) > 0
                    ? `, Discount -RON ${Number(order.totalDiscount || 0).toFixed(2)}`
                    : ""}
                  , Delivery RON {Number(order.deliveryTax || 0).toFixed(2)}
                  {order.promoCode ? `, Promo ${order.promoCode}` : ""}
                </p>
              </div>
              {order.status === "CONFIRMED" && (
                <button
                  className="orders-cancel-btn"
                  type="button"
                  onClick={() => handleCancelOrder(order.id)}
                  disabled={cancelling === order.id}
                >
                  {cancelling === order.id ? "Cancelling..." : "Cancel Order"}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
