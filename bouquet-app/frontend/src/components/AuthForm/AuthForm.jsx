import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loadMe } from "../../stores/actions/auth-actions";
import { apiUrl } from "../../config/global";
import "./AuthForm.css";

const GOOGLE_GSI_SCRIPT = "https://accounts.google.com/gsi/client";

function ensureGoogleScriptLoaded() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector("script[data-google-gsi='1']");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Could not load Google Sign-In script.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_GSI_SCRIPT;
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = "1";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Could not load Google Sign-In script."));
    document.head.appendChild(script);
  });
}

export default function AuthForm({ initialMode = "login" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const googleButtonRef = useRef(null);
  const googleClientId = String(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
  ).trim();

  const isRegister = mode === "register";

  const handleGoogleCredential = useCallback(
    async (response) => {
      const credential = String(response?.credential || "").trim();
      if (!credential) {
        setServerError("Google authentication failed. Missing credential.");
        return;
      }

      resetMessages();
      setGoogleLoading(true);

      try {
        const res = await fetch(apiUrl("/api/auth/google"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ credential }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setServerError(data?.error || "Google sign-in failed.");
          return;
        }

        const user = await dispatch(loadMe());
        if (!user) {
          setServerError(
            "Google authentication succeeded, but user data could not be loaded.",
          );
          return;
        }

        setSuccessMessage("Google authentication succeeded!");
        navigate(user?.role === "ADMIN" ? "/admin/dashboard" : "/home", {
          replace: true,
        });
      } catch {
        setServerError("Nu s-a putut conecta la server. Încearcă din nou.");
      } finally {
        setGoogleLoading(false);
      }
    },
    [dispatch, navigate],
  );

  useEffect(() => {
    if (isRegister) return;

    if (!googleClientId) {
      setServerError(
        "Google sign-in is unavailable: missing VITE_GOOGLE_CLIENT_ID.",
      );
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await ensureGoogleScriptLoaded();
        if (
          cancelled ||
          !googleButtonRef.current ||
          !window.google?.accounts?.id
        )
          return;

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredential,
        });

        googleButtonRef.current.innerHTML = "";

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 360,
        });
      } catch (err) {
        if (!cancelled) {
          setServerError(
            err?.message || "Google sign-in is currently unavailable.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [googleClientId, handleGoogleCredential, isRegister]);

  function resetMessages() {
    setServerError("");
    setSuccessMessage("");
    setFieldErrors({});
  }

  function validate() {
    const errors = {};

    const e = String(email || "")
      .trim()
      .toLocaleLowerCase();
    if (!e || !e.includes("@")) errors.email = "Email invalid.";

    if (!password || password.length < 8)
      errors.password = "Parola trebuie să aibă cel puțin 8 caractere.";

    if (isRegister) {
      const n = String(name || "").trim();
      if (!n) errors.name = "Numele este obligatoriu.";
      if (n && n.length < 2)
        errors.name = "Numele trebuie să aibă cel puțin 2 caractere.";

      if (confirmPassword !== password)
        errors.confirmPassword = "Parolele nu coincid.";
    }

    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    resetMessages();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister
        ? { name: name.trim(), email: email.trim().toLowerCase(), password }
        : { email: email.trim().toLowerCase(), password };

      const res = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409) {
          setServerError("Email deja folosit.");
        } else if (res.status === 400) {
          setServerError(data?.error || "Date invalide. Verifică câmpurile.");
        } else if (res.status === 401) {
          setServerError("Email sau parolă greșite.");
        } else {
          setServerError(data?.error || "A apărut o eroare. Încearcă din nou.");
        }
        return;
      }

      const user = await dispatch(loadMe());
      if (!user) {
        setServerError(
          "Autentificarea a reușit, dar nu s-au putut încărca datele contului.",
        );
        return;
      }

      setSuccessMessage(
        isRegister ? "Cont creat cu succes!" : "Autentificare reușită!",
      );
      navigate(user?.role === "ADMIN" ? "/admin/dashboard" : "/home", {
        replace: true,
      });
    } catch (err) {
      setServerError("Nu s-a putut conecta la server. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  const buttonLabel = useMemo(() => {
    if (loading) return "Processing...";
    return isRegister ? "Create Account" : "Login";
  }, [loading, isRegister]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-flower" aria-hidden="true">
            🌸
          </span>
        </div>

        <h1 className="auth-title">Welcome to Bloomery!</h1>
        <p className="auth-subtitle">Login or create an account to continue.</p>

        <div className="auth-tabs" role="tablist" aria-label="Auth tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              resetMessages();
            }}
            role="tab"
            aria-selected={mode === "login"}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              resetMessages();
            }}
            role="tab"
            aria-selected={mode === "register"}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="field">
              <label className="label">Full Name</label>
              <input
                className={`input ${fieldErrors.name ? "input-error" : ""}`}
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              {fieldErrors.name && (
                <div className="error">{fieldErrors.name}</div>
              )}
            </div>
          )}

          <div className="field">
            <label className="label">Email</label>
            <input
              className={`input ${fieldErrors.email ? "input-error" : ""}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <div className="error">{fieldErrors.email}</div>
            )}
          </div>

          <div className="field">
            <label className="label">Password</label>
            <input
              className={`input ${fieldErrors.password ? "input-error" : ""}`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
            <div className="hint">At least 8 characters</div>
            {fieldErrors.password && (
              <div className="error">{fieldErrors.password}</div>
            )}
          </div>

          {isRegister && (
            <div className="field">
              <label className="label">Confirm Password</label>
              <input
                className={`input ${fieldErrors.confirmPassword ? "input-error" : ""}`}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {fieldErrors.confirmPassword && (
                <div className="error">{fieldErrors.confirmPassword}</div>
              )}
            </div>
          )}

          {serverError && <div className="server-error">{serverError}</div>}
          {successMessage && <div className="success">{successMessage}</div>}

          <button
            className="submit"
            type="submit"
            disabled={loading || googleLoading}
          >
            {buttonLabel}
          </button>

          {!isRegister && (
            <>
              <div className="auth-divider">
                <span>or continue with</span>
              </div>
              <div
                className={`google-login-slot ${googleLoading ? "is-loading" : ""}`}
                ref={googleButtonRef}
              />
            </>
          )}

          {!isRegister && (
            <div className="auth-footer">
              <p
                className="pass-fgt"
                role="button"
                tabIndex={0}
                onClick={() => navigate("/forgot-password")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate("/forgot-password");
                  }
                }}
              >
                Forgot password?
              </p>
              <hr />
              <p>Want to checkout without an account?</p>
              <button
                type="button"
                className="guest"
                onClick={() => navigate("/home", { replace: true })}
              >
                Continue as Guest
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
