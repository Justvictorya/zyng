import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Clock, ShieldAlert, Zap, Layers, PenSquare, History, BarChart2, Settings, HelpCircle } from "lucide-react";
import { translations } from "../lib/translations";
import { useZyng } from "../context/ZyngContext";

interface HeaderProps {
  nepaDraftActive: boolean;
  onRecoverDraft?: () => void;
}

export default function Header({ nepaDraftActive, onRecoverDraft }: HeaderProps) {
  const { dialect } = useZyng();
  const location = useLocation();
  const t = translations[dialect];
  const currentView = location.pathname.replace("/dashboard/", "").replace("/dashboard", "dashboard") || "dashboard";
  const [watTime, setWatTime] = useState("");

  // WAT (West Africa Time) is UTC+1. Let's compute a neat active clock helper.
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Add UTC offset for UTC+1
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const watDate = new Date(utc + (3600000 * 1));
      
      const timeStr = watDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
      setWatTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getViewIconAndTitle = () => {
    switch (currentView) {
      case "dashboard":
        return { icon: Layers, title: t.dashboard, subtitle: "Manage your social schedule from Lagos to Abuja" };
      case "create-post":
        return { icon: PenSquare, title: t.createPost, subtitle: "Generate AI-caption, schedule cross-posting, or analyze red flags" };
      case "posts":
        return { icon: History, title: t.postsHistory, subtitle: "Manage scheduled social content calendar queues" };
      case "analytics":
        return { icon: BarChart2, title: t.analytics, subtitle: "Check the pulse of your audience & growth charts" };
      case "settings":
        return { icon: Settings, title: t.settings, subtitle: "Integrate platforms, handle subscription billing & details" };
      default:
        return { icon: Zap, title: "Zyng", subtitle: "Social intelligence engine" };
    }
  };

  const info = getViewIconAndTitle();
  const Icon = info.icon;

  return (
    <header className="bg-black/30 backdrop-blur-md border-b border-white/5 px-8 py-5 flex items-center justify-between shrink-0" id="zyng-header">
      {/* View Title & Breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-0 text-purple-405">
          <Icon className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-sans tracking-tight">
            {info.title}
            <span className="text-[10px] bg-white/5 text-slate-450 font-normal font-mono border border-white/10 px-20 py-0.5 rounded-full">
              WAT Timezone
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* Utilities Right Hand */}
      <div className="flex items-center gap-4">
        
        {/* NEPA-Proof Backup Floating Banner */}
        {nepaDraftActive && (
          <div className="flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 text-purple-300 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer transition-colors shadow-lg animate-pulse"
               onClick={onRecoverDraft}
               id="nepa-draft-notification"
               title="Click to recover your NEPA-proof draft">
            <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping"></span>
            <span className="font-mono text-purple-450 font-bold uppercase text-[10px]">NEPA-Proof Active</span>
            <span className="hidden sm:inline text-slate-300">Draft saved</span>
          </div>
        )}

        {/* WAT Realtime Digital Clock */}
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-md">
          <Clock className="h-3.5 w-3.5 text-purple-400 shrink-0" />
          <div className="text-right">
            <span className="text-xs text-purple-300 font-mono font-medium block">
              {watTime || "00:00:00 AM"}
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold font-mono">
              Lagos, Nigeria
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
