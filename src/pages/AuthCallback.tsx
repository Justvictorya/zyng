import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase-client";
import { useZyng } from "../context/ZyngContext";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const { setCurrentUser } = useZyng();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const provider = searchParams.get("provider");

    if (provider === "tiktok") {
      handleTikTokLogin();
    } else {
      handleSupabaseCallback();
    }
  }, []);

  async function handleTikTokLogin() {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = localStorage.getItem("tiktok_login_state");

    if (!code) {
      setError("No authorization code received from TikTok.");
      return;
    }

    if (state && savedState && state !== savedState) {
      setError("State mismatch. Possible CSRF attack.");
      return;
    }

    localStorage.removeItem("tiktok_login_state");

    try {
      const res = await fetch("/api/auth/tiktok-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem("zyng_user", JSON.stringify(data.user));
        if (data.session?.access_token) {
          localStorage.setItem("zyng_token", data.session.access_token);
        }
        if (data.session?.refresh_token) {
          localStorage.setItem("zyng_refresh_token", data.session.refresh_token);
        }
        navigate("/dashboard", { replace: true });
      } else {
        setError(data.error || "TikTok login failed");
      }
    } catch {
      setError("Failed to connect to authentication server.");
    }
  }

  async function handleSupabaseCallback() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setError("No session found. Please try logging in again.");
      return;
    }

    const { user } = session;

    try {
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
        localStorage.setItem("zyng_token", session.access_token);
        if (session.refresh_token) {
          localStorage.setItem("zyng_refresh_token", session.refresh_token);
        }
        navigate("/dashboard", { replace: true });
      } else {
        setError(data.error || "Failed to create session");
      }
    } catch {
      setError("Failed to connect to authentication server.");
    }
  }

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
