import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  Layers, 
  PenSquare, 
  History, 
  BarChart2, 
  Settings, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  HelpCircle,
  Inbox,
  Lock,
  Mail,
  Sparkles,
  RefreshCw,
  Eye,
  Key
} from "lucide-react";

import { UserProfile, Post, DialectType } from "./types";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ViewDashboard from "./components/ViewDashboard";
import ViewCreatePost from "./components/ViewCreatePost";
import ViewPostsHistory from "./components/ViewPostsHistory";
import ViewAnalytics from "./components/ViewAnalytics";
import ViewSettings from "./components/ViewSettings";

export default function App() {
  // Navigation Routing States
  // 'landing' | 'login' | 'signup' | 'workspace'
  const [route, setRoute] = useState<"landing" | "login" | "signup" | "workspace">("landing");
  const [workspaceView, setWorkspaceView] = useState<string>("dashboard");
  const [dialect, setDialect] = useState<DialectType>("english");

  // Authentication structures
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Login input states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Signup input states
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Dynamic posts list
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);

  // NEPA-Proof draft backup flags
  const [nepaDraftActive, setNepaDraftActive] = useState(false);
  const [triggerDraftRecoverSignal, setTriggerDraftRecoverSignal] = useState(false);

  // Check if cache contains NEPA drafts on mount
  useEffect(() => {
    const cached = localStorage.getItem("zyng_nepa_draft");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.caption && parsed.caption.trim().length > 3) {
          setNepaDraftActive(true);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Fetch posts from back-end Express JSON DB
  const loadPosts = async () => {
    setIsPostsLoading(true);
    try {
      const savedUser = localStorage.getItem("zyng_user");
      const uid = savedUser ? JSON.parse(savedUser).id : null;
      const res = await fetch(`/api/posts${uid ? "?user_id=" + uid : ""}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error("Failed to fetch posts list:", e);
    } finally {
      setIsPostsLoading(false);
    }
  };

  // Load user session if active or default to pre-loaded Victoria John
  useEffect(() => {
    const savedUser = localStorage.getItem("zyng_user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        setRoute("workspace");
        loadPosts();
      } catch {
        // failed parse
      }
    }
  }, []);

  // After OAuth callback, navigate to Settings view
  useEffect(() => {
    if (route === "workspace") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("connected") || params.get("error")) {
        setWorkspaceView("settings");
      }
    }
  }, [route]);

  // Sync posts when in workspace
  useEffect(() => {
    if (route === "workspace") {
      loadPosts();
    }
  }, [route, workspaceView]);

  // Auth Functions
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem("zyng_user", JSON.stringify(data.user));
        setRoute("workspace");
        loadPosts();
      } else {
        setLoginError(data.error || "Credentials invalid.");
      }
    } catch {
      setLoginError("Failed to connect to authentication server.");
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Safe testing shortcut login for Victoria John
  const handleInstantVictoriaLogin = () => {
    setLoginEmail("victoryajohn0309@gmail.com");
    setLoginPassword("password123");
    setLoginError("");
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    
    if (!agreeTerms) {
      setSignupError("Abeg you must agree to terms of usage first!");
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setSignupName("");
        setSignupEmail("");
        setSignupPassword("");
        setAgreeTerms(false);
        setSignupSuccess(true);
        
        // Log in instantly
        setCurrentUser(data.user);
        localStorage.setItem("zyng_user", JSON.stringify(data.user));
        
        setTimeout(() => {
          setSignupSuccess(false);
          setRoute("workspace");
        }, 1200);
      } else {
        setSignupError(data.error || "Signup registered error.");
      }
    } catch {
      setSignupError("Error connecting to signup endpoint");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("zyng_user");
    setRoute("landing");
  };

  // Password strength computation for Signup view
  const getPasswordStrength = () => {
    if (!signupPassword) return { score: 0, label: "Empty", color: "bg-slate-800" };
    if (signupPassword.length < 5) return { score: 1, label: "Too Weak", color: "bg-rose-500" };
    if (signupPassword.length < 8) return { score: 2, label: "Medium Vibe", color: "bg-amber-500" };
    return { score: 3, label: "Solid Security Key", color: "bg-emerald-500" };
  };

  const passStrength = getPasswordStrength();

  // Route handlers within workspace
  const handlePostSavedNotification = () => {
    loadPosts();
    setWorkspaceView("posts-history");
  };

  // Draft recover trigger
  const handleRecoverNepaDraft = () => {
    setWorkspaceView("create-post");
    setTriggerDraftRecoverSignal(true);
  };

  return (
    <div className="bg-[#050507] min-h-screen text-slate-100 font-sans selection:bg-purple-500/30 selection:text-white overflow-x-hidden" id="zyng-root-viewport">
      
      {/* 1. PUBLIC LANDING VIEW OR AUTH FLOATING FRAME */}
      {route === "landing" && (
        <div className="min-h-screen relative flex flex-col justify-between items-center px-4 md:px-8 py-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/40 via-[#050507] to-[#050507]" id="landing-screen">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-500/5 blur-3xl"></div>

          {/* Landing Header */}
          <header className="w-full max-w-6xl flex justify-between items-center relative z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-950/40">
                <Zap className="h-4.5 w-4.5 text-white animate-pulse" />
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Zyng</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setRoute("login")}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Log In
              </button>
              <button 
                onClick={() => setRoute("signup")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4.5 py-2 rounded-xl shadow-lg shadow-indigo-900/20 transition-all transform hover:-translate-y-0.5"
              >
                Get Started
              </button>
            </div>
          </header>

          {/* Landing Core Copy Centered Card (Proportional Craft Summary style!) */}
          <main className="w-full max-w-4xl text-center flex flex-col items-center justify-center my-14 relative z-10 space-y-6">

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-sans font-bold tracking-tight bg-gradient-to-b from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent leading-[1.1]">
              Social Management,<br />
              <span className="bg-gradient-to-tr from-violet-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent italic">Localized for Nigeria.</span>
            </h1>

            <p className="max-w-2xl text-slate-400 text-sm sm:text-base leading-relaxed">
              Why source software in USD while charging clients in Naira? Zyng is Nigeria's #1 Social Media Automation engine. Draft, fix slang grammar with Gemini, cross-post to Instagram & WhatsApp status, and scale 27x cheaper at <strong>₦12,000/month</strong>.
            </p>

            <div className="pt-6 flex flex-col sm:flex-row gap-4 items-center shrink-0">
              <button 
                onClick={() => setRoute("signup")}
                className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs px-8 py-4 rounded-xl shadow-xl shadow-indigo-900/30 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>Start Managing for Free</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button 
                onClick={() => setRoute("login")}
                className="w-full sm:w-auto border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900/20 text-xs font-semibold px-8 py-4 rounded-xl transition-all cursor-pointer"
              >
                Log In to Dashboard
              </button>
            </div>

            {/* Platform Badges list preview */}
            <div className="pt-12 grid grid-cols-7 gap-6 justify-center items-center opacity-70">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Facebook</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Instagram</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">YouTube</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">WhatsApp Status</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">TikTok</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">LinkedIn</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">X / Twitter</span>
            </div>
          </main>

          {/* Pricing warning card */}
          <footer className="text-center text-[11px] text-slate-600 font-mono relative z-10 shrink-0">
            ₦12,000/month standard subscription billing. Integrated securely via Paystack. WAT central lock.
          </footer>
        </div>
      )}

      {/* 2. REGULAR LOGIN FRAMEWORK */}
      {route === "login" && (
        <div className="min-h-screen flex items-center justify-center px-4 md:px-8 py-14 bg-[#050507] font-sans" id="login-screen">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>
          
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl relative z-10">
            <div className="text-center space-y-2">
              <span className="text-[10px] text-indigo-400 font-bold font-mono tracking-widest uppercase">Secure Authentication Gateway</span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-100 font-sans">
                Welcome back to Zyng
              </h2>
              <p className="text-xs text-slate-400">
                Log in to proceed with your automated social management schedules.
              </p>
            </div>

            {loginError && (
              <div className="bg-rose-950 border border-rose-500/40 text-rose-300 text-xs px-4 py-3 rounded-xl font-medium">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input 
                    type="email" 
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="victoryajohn0309@gmail.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Password</label>
                  <span className="text-[10px] text-slate-500 hover:text-indigo-400 cursor-pointer">Forgot password?</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input 
                    type="password" 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    placeholder="password123"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoginLoading}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-900/30 transition-all text-xs flex items-center justify-center gap-1 cursor-pointer"
                id="login-submit-btn"
              >
                {isLoginLoading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : null}
                <span>Authenticate Credentials</span>
              </button>
            </form>

            {/* INSTANT VECTOR OVERRIDE TRIGGER FOR VICTORIA JOHN TESTER */}
            <div className="relative border-t border-slate-850/80 pt-4 mt-2">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 px-3 text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wide -translate-y-1/2">
                Hackathon Override
              </span>
              
              <button
                onClick={handleInstantVictoriaLogin}
                className="w-full bg-slate-950 text-indigo-400 hover:text-indigo-300 border border-indigo-500/15 py-3 px-4.5 rounded-xl transition-all text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-950/80 cursor-pointer"
                id="instant-demo-override"
                title="Loads Victoria John email and password presets into form fields"
              >
                <Key className="h-4 w-4 shrink-0" />
                <span>Fill Victoria John Credentials</span>
              </button>
            </div>

            <div className="text-center text-xs text-slate-500 pt-2 selection:bg-none">
              Don't have a social campaign yet?{" "}
              <button onClick={() => setRoute("signup")} className="text-indigo-400 hover:underline font-semibold">Join free beta</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SIGNUP MODULE FRAMEWORK */}
      {route === "signup" && (
        <div className="min-h-screen flex items-center justify-center px-4 md:px-8 py-10 bg-[#050507] font-sans" id="signup-screen">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl relative z-10">
            <div className="text-center space-y-1.5">
              <span className="text-[10px] text-indigo-400 font-bold font-mono tracking-widest uppercase">Start Free Social Campaigns</span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-100">
                Join Zyng Socials
              </h2>
              <p className="text-xs text-slate-400">
                Create a social manager profile to deploy 6 cross-posting.
              </p>
            </div>

            {signupSuccess && (
              <div className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-3 rounded-xl font-medium">
                Registration complete! Redirecting to workspace...
              </div>
            )}
            
            {signupError && (
              <div className="bg-rose-950 border border-rose-500/40 text-rose-300 text-xs px-4 py-3 rounded-xl font-medium">
                {signupError}
              </div>
            )}

            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase block">Full name / Brand title</label>
                <input 
                  type="text" 
                  value={signupName} 
                  onChange={(e) => setSignupName(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Victoria John"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase block">Email address</label>
                <input 
                  type="email" 
                  value={signupEmail} 
                  onChange={(e) => setSignupEmail(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="victoryajohn0309@gmail.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase block">Password strength</label>
                <input 
                  type="password" 
                  value={signupPassword} 
                  onChange={(e) => setSignupPassword(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  placeholder="Create password"
                  required
                />
                
                {/* Visual Password Strength bar */}
                {signupPassword && (
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-850 mt-1 space-y-1">
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${passStrength.color}`} style={{ width: `${(passStrength.score / 3) * 100}%` }}></div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 block text-right font-semibold">
                      Strength: {passStrength.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2.5 py-1">
                <input 
                  type="checkbox" 
                  checked={agreeTerms} 
                  onChange={(e) => setAgreeTerms(e.target.checked)} 
                  className="mt-0.5 rounded border-slate-850 text-indigo-600 bg-slate-950 focus:ring-0 focus:outline-none"
                  id="agree-terms-check"
                />
                <label htmlFor="agree-terms-check" className="text-[11px] text-slate-400 leading-tight">
                  Agree to standard term of usage, Pro subscription pricing models, and WAT timezone scheduling defaults.
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-1 cursor-pointer"
                id="signup-submit-btn"
              >
                Create Free Account
              </button>
            </form>

            <div className="text-center text-xs text-slate-500 pt-1">
              Already have an automated ledger account?{" "}
              <button onClick={() => setRoute("login")} className="text-indigo-400 hover:underline font-semibold">Log in</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN HIGH-FIDELITY APP WORKSPACE CONTAINER */}
      {route === "workspace" && currentUser && (
        <div className="flex bg-[#050507] min-h-screen relative font-sans" id="workspace-layout">
          
          {/* Unified left Sidebar rail navigation */}
          <Sidebar 
            currentView={workspaceView} 
            setCurrentView={setWorkspaceView} 
            dialect={dialect} 
            setDialect={setDialect} 
            user={currentUser} 
            onLogout={handleLogout} 
          />

          {/* Core Content Body workspace layout */}
          <div className="flex-1 flex flex-col justify-between overflow-x-hidden min-h-screen">
            
            {/* Topbar page headers containing clock triggers */}
            <Header 
              currentView={workspaceView} 
              dialect={dialect} 
              nepaDraftActive={nepaDraftActive}
              onRecoverDraft={handleRecoverNepaDraft}
            />

            {/* Multi-view router frame panels */}
            <main className="flex-1 overflow-y-auto">
              {workspaceView === "dashboard" && (
                <ViewDashboard 
                  user={currentUser} 
                  dialect={dialect} 
                  posts={posts} 
                  onCreatePostClick={() => setWorkspaceView("create-post")}
                  onViewPostsClick={() => setWorkspaceView("posts-history")}
                />
              )}

              {workspaceView === "create-post" && (
                <ViewCreatePost 
                  dialect={dialect} 
                  onPostSaved={handlePostSavedNotification} 
                  setNepaDraftActive={setNepaDraftActive}
                  triggerDraftRecoverSignal={triggerDraftRecoverSignal}
                  onResetRecoverSignal={() => setTriggerDraftRecoverSignal(false)}
                />
              )}

              {workspaceView === "posts-history" && (
                <ViewPostsHistory 
                  dialect={dialect} 
                  posts={posts} 
                  isLoading={isPostsLoading} 
                  onPostDeleted={(id) => {
                    setPosts(prev => prev.filter(p => p.id !== id));
                  }}
                  onPostUpdated={(id, updatedFields) => {
                    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
                  }}
                  triggerRefresh={loadPosts}
                />
              )}

              {workspaceView === "analytics" && (
                <ViewAnalytics dialect={dialect} />
              )}

              {workspaceView === "settings" && (
                <ViewSettings 
                  dialect={dialect} 
                  user={currentUser} 
                  onUserUpdate={(updatedFields) => {
                    const next = { ...currentUser, ...updatedFields } as UserProfile;
                    setCurrentUser(next);
                    localStorage.setItem("zyng_user", JSON.stringify(next));
                  }} 
                />
              )}
            </main>

            {/* Global Workspace credit labels */}
            <footer className="bg-slate-950 border-t border-slate-900 px-8 py-4.5 flex justify-between items-center text-[11px] text-slate-500 font-mono shrink-0">
              <span>PRO ACTIVE QUEUE BROADCASTS CONNECTED</span>
              <span>© Zyng 2026 · Built for Nigeria</span>
            </footer>

          </div>

        </div>
      )}

    </div>
  );
}
