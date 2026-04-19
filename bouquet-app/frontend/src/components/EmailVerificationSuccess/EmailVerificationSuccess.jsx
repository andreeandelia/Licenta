import { useNavigate } from "react-router-dom";
import "./EmailVerificationSuccess.css";

function EmailVerificationSuccess() {
  const navigate = useNavigate();

  return (
    <div className="email-verify-success-container">
      <div className="email-verify-success-card">
        <div className="email-verify-success-icon">✓</div>
        <h1>Email Verified Successfully</h1>
        <p className="email-verify-success-message">
          Your account is now active. You can continue by signing in.
        </p>
        <button
          type="button"
          className="email-verify-success-button"
          onClick={() => navigate("/auth")}
        >
          Go to Authentication
        </button>
      </div>
    </div>
  );
}

export default EmailVerificationSuccess;
