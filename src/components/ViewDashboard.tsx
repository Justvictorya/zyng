import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Users, 
  Activity, 
  Calendar, 
  ArrowRight, 
  PlusCircle, 
  CheckCircle,
  Eye, 
  MapPin, 
  Sparkles,
  Zap
} from "lucide-react";
import { Post } from "../types";
import { translations } from "../lib/translations";
import { useZyng } from "../context/ZyngContext";

export default function ViewDashboard() {
  const { currentUser: user, dialect, posts } = useZyng();
  const navigate = useNavigate();
  const t = translations[dialect];
  
  const countScheduled = posts.filter(p => p.status === "scheduled").length;
  const countPublished = posts.filter(p => p.status === "published").length;

  const getDialectGreeting = () => {
    const name = user ? user.name : "";
    switch (dialect) {
      case "pidgin":
        return `Kool, how far ${name}! No shaking. Zyng dey fully active.`;
      case "yoruba":
        return `O kuabo niyi, ${name}! Eto rẹ n ṣiṣẹ lọwọ.`;
      case "hausa":
        return `Barka da zuwa, ${name}! Komai yana tafiya da kyau.`;
      case "igbo":
        return `Nnọọ o nwanne, ${name}! Anyị nọ n'ọrụ ugbu a.`;
      default:
        return `Welcome back, ${name}! Let's handle your social media.`;
    }
  };

  const getPlatformsArray = (platformsStr: string) => {
    return platformsStr ? platformsStr.split(",").map(p => p.trim()) : [];
  };

  return (
    <div className="space-y-8 animate-fade-in p-4 sm:p-8" id="zyng-view-dashboard">
      
      {/* 1. Personalized Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950/40 via-[#050507] to-black border border-purple-500/20 p-5 md:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 h-40 w-40 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 h-24 w-60 bg-indigo-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <span className="inline-flex items-center gap-1 bg-purple-500/15 text-purple-350 border border-purple-500/20 px-2.5 py-1 rounded-full text-xs font-semibold font-mono tracking-wide uppercase">
              <Sparkles className="h-3 w-3 text-purple-400 shrink-0" />
              SOCIAL DASHBOARD
            </span>
            <h3 className="text-2xl font-bold font-sans text-slate-100 tracking-tight leading-tight">
              {getDialectGreeting()}
            </h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Your automated posts. Powered by Gemini AI captions and cross-platform scheduling.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button 
              onClick={() => navigate("/dashboard/create-post")}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-purple-550/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm cursor-pointer"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>{t.createPost}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Statistics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Scheduled Posts Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative group hover:border-slate-800/80 transition-colors shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-sans">{t.postsScheduled}</p>
              <h4 className="text-2xl font-mono font-bold text-slate-100 mt-2">{countScheduled}</h4>
            </div>
            <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 rounded-xl flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-slate-300 font-medium font-mono">{countPublished} posted</span>
            <span>already in database</span>
          </div>
        </div>

        {/* Total Posts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative hover:border-slate-800/80 transition-colors shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-sans">{t.totalReach}</p>
              <h4 className="text-2xl font-mono font-bold text-slate-100 mt-2">{posts.length}</h4>
            </div>
            <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1">
            <span className="text-xs text-slate-500 font-sans">Total posts created</span>
          </div>
        </div>

        {/* Published Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative hover:border-slate-800/80 transition-colors shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-sans">{t.engagementRate}</p>
              <h4 className="text-2xl font-mono font-bold text-slate-100 mt-2">{countPublished}</h4>
            </div>
            <div className="h-10 w-10 bg-violet-500/10 text-violet-400 border border-violet-500/10 rounded-xl flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1">
            <span className="text-xs text-slate-500 font-sans">Successfully published</span>
          </div>
        </div>

        {/* Waiting (scheduled vs published) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative hover:border-slate-800/80 transition-colors shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-sans">Pending</p>
              <h4 className="text-2xl font-mono font-bold text-slate-100 mt-2">{countScheduled}</h4>
            </div>
            <div className="h-10 w-10 bg-cyan-500/10 text-cyan-400 border border-cyan-500/10 rounded-xl flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-indigo-400 font-medium font-sans">Awaiting broadcast</span>
          </div>
        </div>

      </div>

      {/* 3. Performance Snapshot Line Chart / SVG Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Interactive Chart Graphic (Custom purely engineered SVG) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">{t.analyticsSummary}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Post activity over time</p>
            </div>
            <span className="text-xs text-indigo-400 border border-indigo-500/20 bg-indigo-500/10 rounded px-2.5 py-1 font-mono">
              Activity Map
            </span>
          </div>

          {/* SVG Custom Linear Grid Line Chart */}
          <div className="relative h-60 w-full bg-slate-950/20 border border-slate-800/50 rounded-xl p-4 flex flex-col justify-between">
            
            {/* Legend guide lines */}
            <div className="absolute inset-x-0 top-1/4 border-b border-slate-900/40 border-dashed pointer-events-none"></div>
            <div className="absolute inset-x-0 top-2/4 border-b border-slate-900/40 border-dashed pointer-events-none"></div>
            <div className="absolute inset-x-0 top-3/4 border-b border-slate-900/40 border-dashed pointer-events-none"></div>

            {/* SVG line and gradient fill */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="glow-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Interpolated Graph Shadow area */}
              <path 
                d="M 10,130 Q 90,80 180,110 T 350,50 T 490,30 L 490,200 L 10,200 Z" 
                fill="url(#glow-grad)"
              />

              {/* The Line stroke of graph */}
              <path 
                d="M 10,130 Q 90,80 180,110 T 350,50 T 490,30" 
                fill="none" 
                stroke="url(#glow-line)" 
                strokeWidth="3.5" 
                strokeLinecap="round"
              />

              <linearGradient id="glow-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              
              {/* Highlight interactive points */}
              <circle cx="10" cy="130" r="4" fill="#a78bfa" stroke="#0f172a" strokeWidth="2" />
              <circle cx="90" cy="80" r="4" fill="#818cf8" stroke="#0f172a" strokeWidth="2" />
              <circle cx="180" cy="110" r="4" fill="#6366f1" stroke="#0f172a" strokeWidth="2" />
              <circle cx="350" cy="50" r="4" fill="#4f46e5" stroke="#0f172a" strokeWidth="2" />
              <circle cx="490" cy="30" r="5" fill="#06b6d4" stroke="#0f172a" strokeWidth="2" className="animate-ping" />
            </svg>

            {/* Axis titles */}
            <div className="flex-1"></div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>
        </div>


      </div>

      {/* 4. Active queue checklist planner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Active Post Planner Queue</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Posts saved or waiting to broadcast to channels</p>
          </div>
          <button 
            onClick={() => navigate("/dashboard/posts")}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors border border-transparent hover:border-slate-800 px-3 py-1.5 rounded-xl"
            id="view-posts-shortcut"
          >
            <span>See entire list</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl">
            <Calendar className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No scheduled posts yet.</p>
            <button 
              onClick={() => navigate("/dashboard/create-post")}
              className="text-xs text-indigo-400 hover:underline font-medium mt-1 inline-block"
            >
              Draft your first post now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.slice(0, 3).map((post) => {
              const channels = getPlatformsArray(post.platforms);
              return (
                <div 
                  key={post.id}
                  className="bg-slate-950 border border-slate-850/80 rounded-xl p-4.5 hover:border-slate-800 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2.5 max-w-2xl min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {channels.map((ch) => (
                        <span 
                          key={ch}
                          className={`px-2 py-0.5 text-[10px] font-semibold font-mono tracking-wide rounded border uppercase shrink-0 ${
                            ch === "facebook" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                            ch === "instagram" ? "bg-pink-500/10 text-pink-400 border-pink-500/20" :
                            ch === "whatsapp" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            ch === "twitter" || ch === "x" ? "bg-slate-500/10 text-slate-300 border-slate-500/20" :
                            ch === "linkedin" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                            ch === "tiktok" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-slate-500/10 text-slate-300 border-slate-500/20"
                          }`}
                        >
                          {ch}
                        </span>
                      ))}

                      <span className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase ${
                        post.status === "scheduled" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-400/20" : "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20"
                      }`}>
                        {post.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-sans line-clamp-2 leading-relaxed break-words">
                      {post.caption}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-slate-500 block">BROADCAST DATES</span>
                    <span className="text-xs text-slate-300 font-medium font-sans mt-1 block">
                      {new Date(post.schedule_time).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })} WAT
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
