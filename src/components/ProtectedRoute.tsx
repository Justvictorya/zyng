import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useZyng, ensureValidToken } from "../context/ZyngContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, setCurrentUser } = useZyng();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (currentUser) return;
    // If we have a token but no user, try to restore session
    const token = localStorage.getItem("zyng_token");
    if (token) {
      setChecking(true);
      ensureValidToken().then((validToken) => {
        if (validToken) {
          // Token is valid — restore user from localStorage
          const saved = localStorage.getItem("zyng_user");
          if (saved) {
            try { setCurrentUser(JSON.parse(saved)); } catch {}
          }
        }
        setChecking(false);
      });
    }
  }, [currentUser, setCurrentUser]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050507]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
