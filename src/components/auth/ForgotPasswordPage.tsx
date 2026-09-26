/* =========================================================
   PASSWORD RESET PAGE (Section 33, 34, 35)
   Features:
   - Input email address
   - Calls sendPasswordResetEmail via authService
   - Shows generic message without revealing email registration existence
   - Loading states [ Sending Reset Link... ]
   ========================================================= */

import React, { useState } from "react";
import { AuthLayout } from "./AuthLayout";
import { useRouter } from "../../router/Router";
import { resetPassword, getFirebaseErrorMessage } from "../../services/authService";
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export const ForgotPasswordPage: React.FC = () => {
  const { navigate } = useRouter();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(email.trim());
      // Section 33: Always show generic message, do not reveal whether email exists
      setIsSuccess(true);
    } catch (err: any) {
      console.warn("Password reset error:", err);
      // For security, still show generic success unless network failed
      if (err?.code === "auth/network-request-failed") {
        setErrorMessage(getFirebaseErrorMessage(err));
      } else {
        setIsSuccess(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            marginBottom: "1.5rem",
          }}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </button>

        <div style={{ marginBottom: "1.75rem" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "14px",
              background: "rgba(22, 163, 74, 0.12)",
              color: "#16A34A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <KeyRound size={24} />
          </div>
          <h2 style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
            Reset Password
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
            Enter your email address and we will send you a secure link to reset your password.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              background: "rgba(235, 87, 87, 0.1)",
              color: "#EB5757",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              fontSize: "0.82rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
              border: "1px solid rgba(235, 87, 87, 0.25)",
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "16px",
              background: "rgba(22, 163, 74, 0.08)",
              border: "1px solid rgba(22, 163, 74, 0.25)",
              textAlign: "center",
            }}
          >
            <CheckCircle2 size={36} color="#16A34A" style={{ margin: "0 auto 0.75rem" }} />
            <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--text-main)" }}>
              Check Your Inbox
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 1.25rem" }}>
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
            </p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", fontWeight: 700 }}
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="label" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  className="input"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: "2.5rem" }}
                  required
                />
                <Mail
                  size={17}
                  style={{
                    position: "absolute",
                    left: "0.85rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", fontWeight: 700, padding: "0.75rem", fontSize: "0.92rem" }}
            >
              {isSubmitting ? "Sending Reset Link..." : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};
