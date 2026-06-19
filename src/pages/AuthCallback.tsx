import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase-client";
import { useZyng } from "../context/ZyngContext";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const { setCurrentUser } = useZyng();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setError("No session found. Please try logging in again.");
        return;
      }

      const { user } = session;

      try {
        // Check if user exists in our system, if not create one
        const res = await fetch("/api/auth/oauth-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
          }),
        });

        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          localStorage.setItem("zyng_user", JSON.stringify(data.user));
          navigate("/dashboard", { replace: true });
        } else {
          setError(data.error || "Failed to create session");
        }
      } catch {
        setError("Failed to connect to authentication server.");
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050507]">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="text-indigo-400 hover:underline text-xs"
            >
              Back to login
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
            <p className="text-slate-400 text-sm">Completing authentication...</p>
          </>
        )}
      </div>
    </div>
  );
}
