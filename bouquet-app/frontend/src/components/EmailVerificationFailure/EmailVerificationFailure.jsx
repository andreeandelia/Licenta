import "./EmailVerificationFailure.css";

function EmailVerificationFailure() {
  return (
    <div className="email-verify-failure-container">
      <div className="email-verify-failure-card">
        <div className="email-verify-failure-icon">✕</div>
        <h1>Verification Failed</h1>
        <p className="email-verify-failure-message">
          The verification link is invalid or expired.
        </p>
        <p className="email-verify-failure-details">
          Please request a new verification email from the authentication page.
        </p>
      </div>
    </div>
  );
}

export default EmailVerificationFailure;
