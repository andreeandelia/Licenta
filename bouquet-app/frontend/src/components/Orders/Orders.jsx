import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package2 } from "lucide-react";
import { apiUrl } from "../../config/global";
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
  const [cancelTargetId, setCancelTargetId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(apiUrl("/api/orders"), {
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
    try {
      setCancelling(orderId);
      setError("");

      const res = await fetch(apiUrl(`/api/orders/${orderId}/cancel`), {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not cancel order.");
        return;
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? data.order : order)),
      );
      setCancelTargetId(null);
    } catch {
      setError("Could not cancel order.");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <section className="orders-wrap">
      <div className="orders-head">
        <h1>My Orders</h1>
      </div>

      {loading && <div className="orders-state">Loading orders...</div>}
      {error && !loading && <div className="orders-state error">{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="orders-empty">
          <div className="orders-empty-icon" aria-hidden="true">
            <Package2 size={28} />
          </div>
          <h2>No orders yet.</h2>
          <p>
            Start building a bouquet and place your first order to see it here.
          </p>
          <Link to="/builder" className="orders-empty-cta">
            Start Building
          </Link>
        </div>
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
              {(order.status === "CONFIRMED" || order.status === "CREATED") && (
                <button
                  className="orders-cancel-btn"
                  type="button"
                  onClick={() => setCancelTargetId(order.id)}
                  disabled={cancelling === order.id}
                >
                  {cancelling === order.id ? "Cancelling..." : "Cancel Order"}
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {cancelTargetId && (
        <div className="orders-modal-backdrop" role="dialog" aria-modal="true">
          <div className="orders-modal-card">
            <h3>Cancel this order?</h3>
            <p>
              This action will cancel your order and restore stock quantities.
            </p>
            <div className="orders-modal-actions">
              <button
                type="button"
                className="orders-modal-btn orders-modal-btn-secondary"
                onClick={() => setCancelTargetId(null)}
                disabled={cancelling === cancelTargetId}
              >
                Keep order
              </button>
              <button
                type="button"
                className="orders-modal-btn orders-modal-btn-danger"
                onClick={() => handleCancelOrder(cancelTargetId)}
                disabled={cancelling === cancelTargetId}
              >
                {cancelling === cancelTargetId
                  ? "Cancelling..."
                  : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
