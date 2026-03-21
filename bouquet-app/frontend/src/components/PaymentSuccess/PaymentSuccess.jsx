import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "./PaymentSuccess.css";

function PaymentSuccess() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

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
    <div className="payment-success-container">
      <div className="payment-success-card">
        <div className="success-icon">✓</div>
        <h1>Payment Successful!</h1>
        <p className="success-message">
          Your payment has been processed successfully.
        </p>
        <p className="redirect-message">
          Redirecting you to {user ? "your orders" : "home"} in a few seconds...
        </p>
      </div>
    </div>
  );
}

export default PaymentSuccess;
