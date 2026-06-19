import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Key, RefreshCw } from "lucide-react";
import { useZyng } from "../context/ZyngContext";
import { supabase } from "../lib/supabase-client";

export default function LoginPage() {
  const { setCurrentUser, loadPosts } = useZyng();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem("zyng_user", JSON.stringify(data.user));
        navigate("/dashboard");
        loadPosts();
      } else {
        setError(data.error || "Credentials invalid.");
      }
    } catch {
      setError("Failed to connect to authentication server.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillVictoria = () => {
    setEmail("victoryajohn0309@gmail.com");
    setPassword("password123");
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 md:px-8 py-14 bg-[#050507] font-sans" id="login-screen">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl relative z-10">
        <div className="text-center space-y-2">
          <span className="text-[10px] text-indigo-400 font-bold font-mono tracking-widest uppercase">Secure Authentication Gateway</span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 font-sans">Welcome back to Zyng</h2>
          <p className="text-xs text-slate-400">Log in to proceed with your automated social management schedules.</p>
        </div>

        {error && (
          <div className="bg-rose-950 border border-rose-500/40 text-rose-300 text-xs px-4 py-3 rounded-xl font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" placeholder="victoryajohn0309@gmail.com" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Password</label>
              <span className="text-[10px] text-slate-500 hover:text-indigo-400 cursor-pointer">Forgot password?</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono" placeholder="password123" required />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-900/30 transition-all text-xs flex items-center justify-center gap-1 cursor-pointer" id="login-submit-btn">
            {isLoading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : null}
            <span>Authenticate Credentials</span>
          </button>
        </form>

        <div className="space-y-2 mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-3 text-slate-500 font-mono text-[10px]">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } })}
              className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 transition-colors cursor-pointer group"
              title="Login with Google"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-200 font-medium">Google</span>
            </button>
            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: "facebook", options: { redirectTo: `${window.location.origin}/auth/callback` } })}
              className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 transition-colors cursor-pointer group"
              title="Login with Facebook"
            >
              <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-200 font-medium">Meta</span>
            </button>
            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: "twitter", options: { redirectTo: `${window.location.origin}/auth/callback` } })}
              className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 transition-colors cursor-pointer group"
              title="Login with Twitter"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-200 font-medium">X</span>
            </button>
            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: `${window.location.origin}/auth/callback` } })}
              className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 transition-colors cursor-pointer group"
              title="Login with GitHub"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-200 font-medium">GitHub</span>
            </button>
          </div>
        </div>

        <div className="relative border-t border-slate-850/80 pt-4 mt-2">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 px-3 text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wide -translate-y-1/2">Hackathon Override</span>
          <button onClick={fillVictoria} className="w-full bg-slate-950 text-indigo-400 hover:text-indigo-300 border border-indigo-500/15 py-3 px-4.5 rounded-xl transition-all text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-950/80 cursor-pointer" id="instant-demo-override" title="Loads Victoria John email and password presets into form fields">
            <Key className="h-4 w-4 shrink-0" />
            <span>Fill Victoria John Credentials</span>
          </button>
        </div>

        <div className="text-center text-xs text-slate-500 pt-2 selection:bg-none">
          Don't have a social campaign yet?{" "}
          <Link to="/signup" className="text-indigo-400 hover:underline font-semibold">Join free beta</Link>
        </div>
      </div>
    </div>
  );
}
