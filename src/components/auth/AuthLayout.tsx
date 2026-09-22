import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F3F4F6", // Light gray background to match the images
        padding: "2rem",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        className="auth-card"
        style={{
          width: "100%",
          maxWidth: "600px",
          background: "#FFFFFF",
          backgroundColor: "#FFFFFF",
          color: "#111827",
          colorScheme: "light",
          borderRadius: "24px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.05)",
          padding: "3rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
};
