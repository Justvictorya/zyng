import React, { useState } from "react";
import { 
  BarChart2, 
  TrendingUp, 
  MapPin, 
  UserPlus, 
  Activity, 
  Cpu, 
  Smartphone, 
  Globe2, 
  Target,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MessageSquare,
  ArrowUpRight
} from "lucide-react";
import { translations } from "../lib/translations";
import { useZyng } from "../context/ZyngContext";

export default function ViewAnalytics() {
  const { dialect } = useZyng();
  const t = translations[dialect];
  const [activeGeoFilter, setActiveGeoFilter] = useState("all");

  const nigerianHubs = [
    { city: "Lagos Hub", state: "Lagos State", rate: "54%", count: "69,200", growth: "+16.3%", color: "indigo" },
    { city: "Abuja City", state: "FCT", rate: "22%", count: "28,100", growth: "+11.5%", color: "violet" },
    { city: "Port Harcourt", state: "Rivers State", rate: "12%", count: "15,400", growth: "+8.2%", color: "cyan" },
    { city: "Kano Center", state: "Kano State", rate: "8%", count: "10,250", growth: "+4.1%", color: "emerald" },
    { city: "Enugu/Onitsha", state: "Enugu State", rate: "4%", count: "5,500", growth: "+9.0%", color: "amber" }
  ];

  const shareStats = [
    { name: "WhatsApp Status Automation", value: "38%", count: "48,700 views", icon: MessageSquare, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" },
    { name: "Instagram Business Feed", value: "20%", count: "25,600 reach", icon: Instagram, color: "text-pink-400 bg-pink-500/10 border-pink-500/25" },
    { name: "Facebook Client Groups", value: "13%", count: "16,660 clicks", icon: Facebook, color: "text-blue-400 bg-blue-500/10 border-blue-500/25" },
    { name: "YouTube Channel Content", value: "12%", count: "15,360 views", icon: Youtube, color: "text-red-400 bg-red-500/10 border-red-500/25" },
    { name: "Twitter/X Viral Hooks", value: "10%", count: "12,840 views", icon: Twitter, color: "text-slate-300 bg-slate-500/10 border-slate-500/25" },
    { name: "LinkedIn Career Pipeline", value: "7%", count: "8,970 reads", icon: Linkedin, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25" },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in text-slate-200" id="zyng-view-analytics">
      
      {/* 1. Core Summary metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md shadow-black/10">
          <div className="flex justify-between items-center bg-transparent p-0 border-0">
            <span className="text-xs text-slate-400">Total Campaign Conversions</span>
            <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/10 text-emerald-400 text-[10px] rounded font-bold font-mono">+18.5%</span>
          </div>
          <h4 className="text-2xl font-bold font-mono text-slate-100 mt-2">14,280 Clicks</h4>
          <p className="text-[10px] text-slate-500 mt-1">Acquired from custom automated links</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md shadow-black/10">
          <div className="flex justify-between items-center bg-transparent p-0 border-0">
            <span className="text-xs text-slate-400">Avg Cost per Acquisition (CAC)</span>
            <span className="px-2 py-0.5 bg-violet-500/15 border border-violet-500/10 text-violet-400 text-[10px] rounded font-bold font-mono">-14% cheaper</span>
          </div>
          <h4 className="text-2xl font-bold font-mono text-slate-100 mt-2">₦42.50 per Click</h4>
          <p className="text-[10px] text-slate-500 mt-1">Hootsuite proxy CPC averages ₦600+</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md shadow-black/10">
          <div className="flex justify-between items-center bg-transparent p-0 border-0">
            <span className="text-xs text-slate-400">Net Business Valuation Generated</span>
            <span className="px-2 py-0.5 bg-indigo-500/25 border border-indigo-400/10 text-indigo-300 text-[10px] rounded font-bold font-mono">27x ROI</span>
          </div>
          <h4 className="text-2xl font-bold font-mono text-slate-100 mt-2">₦4.8M net sales</h4>
          <p className="text-[10px] text-slate-500 mt-1">Cross-posted store catalog transactions</p>
        </div>

      </div>

      {/* 2. Graphs Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Weekly reach bar chart mapping */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h5 className="text-sm font-semibold text-slate-200">Weekly Broadcast reach breakdown</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">Displays consolidated campaign impressions compiled cross-platform</p>
            </div>
            
            <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1 font-mono">
              Month over Month
            </span>
          </div>

          {/* Pure SVG Bar Chart */}
          <div className="relative h-64 bg-slate-950 p-4 border border-slate-850 rounded-xl flex flex-col justify-end">
            
            {/* The canvas Bars */}
            <div className="flex justify-around items-end h-44 px-4 w-full">
              
              {/* Bar 1 */}
              <div className="flex flex-col items-center gap-2 group w-12">
                <div className="bg-slate-800 hover:bg-slate-700 h-16 w-3.5 rounded-full relative transition-all duration-300">
                  <div className="absolute bottom-0 inset-x-0 bg-indigo-500 h-1/2 rounded-full cursor-pointer"></div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Wk 1</span>
              </div>

              {/* Bar 2 */}
              <div className="flex flex-col items-center gap-2 group w-12">
                <div className="bg-slate-800 hover:bg-slate-700 h-28 w-3.5 rounded-full relative transition-all duration-300">
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-violet-600 to-indigo-500 h-4/5 rounded-full cursor-pointer"></div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Wk 2</span>
              </div>

              {/* Bar 3 */}
              <div className="flex flex-col items-center gap-2 group w-12">
                <div className="bg-slate-800 hover:bg-slate-700 h-36 w-3.5 rounded-full relative transition-all duration-300">
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-600 to-cyan-500 h-full rounded-full cursor-pointer"></div>
                </div>
                <span className="text-[10px] font-mono text-indigo-400 font-semibold">Wk 3</span>
              </div>

              {/* Bar 4 */}
              <div className="flex flex-col items-center gap-2 group w-12">
                <div className="bg-slate-800 hover:bg-slate-700 h-40 w-3.5 rounded-full relative transition-all duration-300">
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-cyan-600 to-indigo-500 h-4/5 rounded-full cursor-pointer animate-pulse"></div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Wk 4</span>
              </div>
            </div>
            
            {/* Axis description */}
            <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between text-[11px] text-slate-500 font-sans">
              <span>Lower limit: 0 views</span>
              <span>Central mean: 120,000 views</span>
            </div>

          </div>
        </div>

        {/* Cross platform analytics breakdowns */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-semibold text-slate-200">Cross-Platform Distribution Breakdown</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">Which channels drive your customer inquiries?</p>
            </div>

            <div className="space-y-3">
              {shareStats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${stat.color} shrink-0`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-300 font-sans block">{stat.name}</span>
                        <span className="text-[9px] text-slate-500 font-mono block uppercase">{stat.count}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-indigo-400">{stat.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Regional Demographics map chart card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h5 className="text-sm font-semibold text-slate-200">Regional Click Density in Nigeria</h5>
            <p className="text-[11px] text-slate-400 mt-0.5">Geographical spread and click densities mapped across industrial hubs</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveGeoFilter("all")}
              className={`px-3 py-1 text-[10px] font-mono border rounded ${
                activeGeoFilter === "all" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 font-bold" : "border-slate-800 text-slate-400 hover:text-slate-350"
              }`}
            >
              All Hubs
            </button>
            <button 
              onClick={() => setActiveGeoFilter("high")}
              className={`px-3 py-1 text-[10px] font-mono border rounded ${
                activeGeoFilter === "high" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 font-bold" : "border-slate-800 text-slate-400 hover:text-slate-350"
              }`}
            >
              Density &gt; 15%
            </button>
          </div>
        </div>

        {/* Map Layout splitting Hub lists and custom stylized dot plot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Dot plot representation */}
          <div className="relative h-64 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-center p-4">
            
            {/* Mock abstract geographic layout map outline of Nigeria */}
            <div className="absolute inset-0 opacity-25 p-4 flex items-center justify-center pointer-events-none">
              <svg className="h-full w-4/5 text-slate-800 stroke-current stroke-1 fill-none" viewBox="0 0 100 100">
                <path d="M 10,20 Q 30,5 60,10 T 90,20 T 95,50 T 80,85 T 40,95 T 15,80 T 5,45 Z" />
                <path d="M 20,40 Q 50,55 80,42" /> {/* Niger/Benue abstract splitting line */}
                <path d="M 50,55 L 50,95" />
              </svg>
            </div>

            {/* Glowing density circles */}
            {/* Lagos */}
            <div className="absolute bottom-16 left-16 z-10 flex flex-col items-center">
              <span className="h-4.5 w-4.5 rounded-full bg-indigo-500 border-2 border-white animate-pulse shadow-lg shadow-indigo-500/50"></span>
              <span className="text-[9px] font-mono font-bold text-indigo-400 mt-1 bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded shadow">
                Lagos (54%)
              </span>
            </div>

            {/* Abuja */}
            <div className="absolute top-24 left-1/2 z-10 flex flex-col items-center -translate-x-1/2">
              <span className="h-4 w-4 rounded-full bg-violet-500 border-2 border-white animate-pulse shadow-lg shadow-violet-500/50"></span>
              <span className="text-[9px] font-mono font-bold text-violet-400 mt-1 bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded shadow">
                Abuja (22%)
              </span>
            </div>

            {/* Port Harcourt */}
            <div className="absolute bottom-12 right-1/3 z-10 flex flex-col items-center">
              <span className="h-3.5 w-3.5 rounded-full bg-cyan-500 border-2 border-white animate-pulse shadow-lg shadow-cyan-500/50"></span>
              <span className="text-[9px] font-mono font-bold text-cyan-400 mt-1 bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded shadow">
                PH (12%)
              </span>
            </div>

            {/* Kano */}
            <div className="absolute top-10 right-1/4 z-10 flex flex-col items-center">
              <span className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse shadow-lg shadow-emerald-500/50"></span>
              <span className="text-[9px] font-mono font-bold text-emerald-400 mt-1 bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded shadow">
                Kano (8%)
              </span>
            </div>

          </div>

          {/* Regional Table lists */}
          <div className="space-y-3">
            {nigerianHubs
              .filter(hub => activeGeoFilter === "all" || parseInt(hub.rate) > 15)
              .map((hub) => (
                <div key={hub.city} className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">{hub.city}</span>
                      <span className="text-[9px] text-slate-500 font-mono block uppercase">{hub.state}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-100 font-mono block">{hub.count} contacts</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">{hub.growth} this month</span>
                  </div>
                </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
}
