import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase-client";
import { useZyng } from "../context/ZyngContext";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const CUSTOM_OAUTH_PROVIDERS = ["linkedin", "twitter", "instagram"];

export default function AuthCallback() {
  const { setCurrentUser } = useZyng();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [connected, setConnected] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle "account connected" flow (coming from OAuth connect callback)
    const connectedPlatform = searchParams.get("connected");
    const errorParam = searchParams.get("error");

    if (connectedPlatform) {
      setConnected(connectedPlatform);
      localStorage.setItem("oauth_connected", connectedPlatform);
      setTimeout(() => navigate("/dashboard/settings", { replace: true }), 1500);
      return;
    }

    if (errorParam) {
      setError(errorParam);
      setTimeout(() => navigate("/dashboard/settings", { replace: true }), 3000);
      return;
    }

    const provider = searchParams.get("provider");

    if (provider) {
      localStorage.removeItem("current_oauth_provider");
      if (CUSTOM_OAUTH_PROVIDERS.includes(provider)) {
        handleSocialLogin(provider);
        return;
      }
    }

    handleSupabaseCallback();
  }, []);

  async function handleSocialLogin(platform: string) {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = localStorage.getItem(`${platform}_login_state`);

    if (!code) {
      setError("No authorization code received.");
      return;
    }

    if (state && savedState && state !== savedState) {
      setError("State mismatch. Possible CSRF attack.");
      return;
    }

    localStorage.removeItem(`${platform}_login_state`);
    localStorage.removeItem("current_oauth_provider");
    const codeVerifier = localStorage.getItem(`${platform}_code_verifier`) || undefined;
    localStorage.removeItem(`${platform}_code_verifier`);

    try {
      const res = await fetch(`/api/auth/social-login/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, code_verifier: codeVerifier }),
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
        setError(data.error || `${platform} login failed`);
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
        {connected ? (
          <>
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="text-emerald-400 text-sm font-semibold capitalize">
              Connected to {connected}!
            </p>
            <p className="text-slate-500 text-xs">Redirecting to settings...</p>
          </>
        ) : error ? (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => navigate("/dashboard/settings")}
              className="text-indigo-400 hover:underline text-xs"
            >
              Back to settings
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
