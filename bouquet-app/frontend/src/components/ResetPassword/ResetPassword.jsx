import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiUrl } from "../../config/global";
import "./ResetPassword.css";

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(
    () => new URLSearchParams(location.search).get("token") || "",
    [location.search],
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset token is missing from the link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Could not reset password. Please try again.");
        return;
      }

      setMessage(
        data?.message || "Password reset successful. You can now log in.",
      );
      setTimeout(() => navigate("/auth"), 1200);
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reset-page">
      <div className="reset-card">
        <h1 className="reset-title">Reset Password</h1>
        <p className="reset-subtitle">Set your new password below.</p>

        <form className="reset-form" onSubmit={handleSubmit}>
          <label className="reset-label" htmlFor="reset-pass">
            New Password
          </label>
          <input
            id="reset-pass"
            className="reset-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <label className="reset-label" htmlFor="reset-pass-confirm">
            Confirm Password
          </label>
          <input
            id="reset-pass-confirm"
            className="reset-input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          {error && <div className="reset-error">{error}</div>}
          {message && <div className="reset-success">{message}</div>}

          <button className="reset-submit" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Reset password"}
          </button>
        </form>

        <p className="reset-back">
          Back to <Link to="/auth">authentication</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
