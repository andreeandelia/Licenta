import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "./CODSuccess.css";

function CODSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const order = location.state?.order || null;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        navigate("/orders");
      } else {
        navigate("/home");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, user]);

  return (
    <div className="cod-success-container">
      <div className="cod-success-card">
        <div className="success-icon">✓</div>
        <h1>Order Placed Successfully!</h1>
        <p className="success-message">
          Your cash on delivery order has been received.
        </p>
        {order?.id && (
          <p className="order-message">
            Order #{order.id}
            {order?.finalPrice != null
              ? ` · Total RON ${Number(order.finalPrice).toFixed(2)}`
              : ""}
          </p>
        )}
        <p className="redirect-message">
          Redirecting you to {user ? "your orders" : "home"} in a few seconds...
        </p>
      </div>
    </div>
  );
}

export default CODSuccess;
