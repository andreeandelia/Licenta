import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PaymentFailure.css";

function PaymentFailure() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/home");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="payment-failure-container">
      <div className="payment-failure-card">
        <div className="failure-icon">✕</div>
        <h1>Payment Failed</h1>
        <p className="failure-message">
          Unfortunately, your payment could not be processed.
        </p>
        <p className="failure-details">
          Please try again or contact support if the problem persists.
        </p>
        <p className="redirect-message">
          Redirecting you to home in a few seconds...
        </p>
      </div>
    </div>
  );
}

export default PaymentFailure;
