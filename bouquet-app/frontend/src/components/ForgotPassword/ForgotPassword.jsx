import { useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../../config/global";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    if (!normalizedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          data?.error || "Could not process your request. Please try again.",
        );
        return;
      }

      setMessage(
        data?.message ||
          "If an account with this email exists, a reset link has been sent.",
      );
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <h1 className="forgot-title">Forgot Password</h1>
        <p className="forgot-subtitle">
          Enter your account email and we will send you a reset link.
        </p>

        <form className="forgot-form" onSubmit={handleSubmit}>
          <label className="forgot-label" htmlFor="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            className="forgot-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          {error && <div className="forgot-error">{error}</div>}
          {message && <div className="forgot-success">{message}</div>}

          <button className="forgot-submit" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="forgot-back">
          Remembered your password? <Link to="/auth">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
