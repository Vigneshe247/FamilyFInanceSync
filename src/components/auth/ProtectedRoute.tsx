/* =========================================================
   PROTECTED ROUTE WRAPPER (Section 2, 3, 30)
   Guards components and views against unauthenticated and
   unverified access, redirecting to /login or /verify-email.
   ========================================================= */

import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "../../router/Router";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireVerification = true,
}) => {
  const { user, loading, isEmailVerified } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (requireVerification && !isEmailVerified) {
        navigate("/verify-email");
      }
    }
  }, [user, loading, isEmailVerified, requireVerification, navigate]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          background: "var(--bg-canvas)",
          color: "var(--text-muted)",
        }}
      >
        <Loader2 className="animate-spin" size={38} color="#16A34A" />
        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
          Verifying secure family session...
        </span>
      </div>
    );
  }

  if (!user || (requireVerification && !isEmailVerified)) {
    return null;
  }

  return <>{children}</>;
};
