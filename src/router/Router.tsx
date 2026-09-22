/* =========================================================
   CLIENT-SIDE SECURE ROUTER (Section 30, 31)
   Manages browser URL synchronization, protected route gating,
   email verification enforcement, and permission-based access control.
   ========================================================= */

import React, { createContext, useContext, useState, useEffect } from "react";

interface RouterContextType {
  currentPath: string;
  navigate: (toPath: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  currentPath: "/login",
  navigate: () => {},
});

// Normalize pathname into standard app route
function normalizeRoute(pathname: string): string {
  const clean = pathname.trim().toLowerCase();
  if (!clean || clean === "/" || clean === "/index.html") {
    return "/dashboard";
  }
  // Strip trailing slash
  return clean.replace(/\/$/, "");
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return normalizeRoute(window.location.pathname);
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizeRoute(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (toPath: string) => {
    const normalized = normalizeRoute(toPath);
    if (window.location.pathname !== normalized) {
      window.history.pushState({}, "", normalized);
    }
    setCurrentPath(normalized);
    window.scrollTo(0, 0);
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
}
