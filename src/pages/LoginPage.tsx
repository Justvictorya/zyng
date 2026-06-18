import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Key, RefreshCw } from "lucide-react";
import { useZyng } from "../context/ZyngContext";

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
