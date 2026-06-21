import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Twitter, 
  Layers, 
  PenSquare, 
  History, 
  BarChart2, 
  Settings, 
  LogOut, 
  Zap, 
  Globe2,
  Sun,
  Moon,
} from "lucide-react";
import { motion } from "motion/react";
import { DialectType } from "../types";
import { translations } from "../lib/translations";
import { useZyng } from "../context/ZyngContext";

export default function Sidebar() {
  const { dialect, setDialect, currentUser: user, handleLogout } = useZyng();
  const navigate = useNavigate();
  const t = translations[dialect];
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("zyng-theme");
    return stored !== "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.remove("theme-light");
    } else {
      root.classList.add("theme-light");
    }
    localStorage.setItem("zyng-theme", dark ? "dark" : "light");
  }, [dark]);

  const menuItems = [
    { id: "dashboard", label: t.dashboard, icon: Layers },
    { id: "create-post", label: t.createPost, icon: PenSquare, badge: "AI" },
    { id: "posts", label: t.postsHistory, icon: History },
    { id: "analytics", label: t.analytics, icon: BarChart2 },
    { id: "settings", label: t.settings, icon: Settings },
  ];

  return (
    <aside className="w-64 bg-black/40 backdrop-blur-md border-r border-white/10 flex flex-col justify-between text-slate-200 shrink-0 h-screen sticky top-0" id="zyng-sidebar">
      {/* Brand Header */}
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
              Zyng
            </h1>

          </div>
        </div>
        
        <p className="mt-4 text-xs text-slate-400 font-sans leading-relaxed">
          {t.tagline}
        </p>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 px-4 py-3 space-y-1.5 overflow-y-auto">
        <span className="px-3 text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-2">
          Navigation
        </span>
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          const to = item.id === "dashboard" ? "/dashboard" : `/dashboard/${item.id}`;
          
          return (
            <NavLink
              key={item.id}
              to={to}
              end={item.id === "dashboard"}
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative duration-200 ${
                  isActive 
                    ? "bg-purple-600/25 text-purple-200 border border-purple-500/30 shadow-md shadow-purple-900/10" 
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                }`
              }
              id={`nav-item-${item.id}`}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5">
                    {isActive ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 animate-pulse" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-transparent shrink-0" />
                    )}
                    <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-purple-300" : "text-slate-400 group-hover:text-purple-300"}`} />
                    <span>{item.label}</span>
                  </div>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute left-0 w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-purple-500/15 text-purple-300 border border-purple-550/20 rounded font-bold font-mono tracking-tight shadow-md">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Dialect Selector & User Card at Bottom */}
      <div className="p-4 border-t border-white/10 space-y-4">
        {/* Dialect Fast Selector */}
        <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Globe2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-sans truncate">Dialect</span>
          </div>
          <select 
            value={dialect}
            onChange={(e) => setDialect(e.target.value as DialectType)}
            className="bg-black/80 border border-white/10 rounded-lg text-[11px] text-white px-2 py-1 focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
            id="dialect-dropdown"
          >
            <option value="english">Eng</option>
            <option value="pidgin">Pidgin</option>
            <option value="yoruba">Yoruba</option>
            <option value="hausa">Hausa</option>
            <option value="igbo">Igbo</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {dark ? (
              <Moon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            )}
            <span className="text-[11px] text-slate-400 font-sans truncate">Theme</span>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              dark ? "bg-indigo-600" : "bg-slate-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 translate-y-0 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                dark ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* User Card */}
        {user ? (
          <div className="flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl p-3 shadow-md shadow-black/20">
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src={user.avatar} 
                alt={user.name} 
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-lg object-cover ring-2 ring-purple-500/20 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="px-1 py-0.2 text-[8px] leading-tight bg-purple-500/25 text-purple-300 font-mono rounded border border-purple-400/20 font-bold uppercase shrink-0">
                    {user.tier}
                  </span>
                  <span className="text-[9px] text-slate-450 truncate font-sans">₦12k/mo</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => { handleLogout(); navigate("/login"); }}
              className="text-slate-400 hover:text-red-400 hover:bg-white/10 p-1.5 rounded-lg transition-colors border border-transparent hover:border-white/10"
              title="Logout"
              id="logout-btn"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-center p-3">
            <span className="text-xs text-slate-500">Not logged in</span>
          </div>
        )}
      </div>
    </aside>
  );
}
