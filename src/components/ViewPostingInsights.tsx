import React, { useState, useEffect } from "react";
import { Clock, BarChart3, Calendar, TrendingUp, Loader2, Zap } from "lucide-react";
import { useZyng, ensureValidToken } from "../context/ZyngContext";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-sky-500",
  facebook: "bg-blue-600",
  instagram: "bg-pink-500",
  tiktok: "bg-black",
  linkedin: "bg-blue-700",
  youtube: "bg-red-600",
  whatsapp: "bg-green-600",
};

const PLATFORM_LABELS: Record<string, string> = {
  twitter: "X/Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
};

interface PlatformInsight {
  lastPostAt: string | null;
  totalPosts: number;
  publishedCount: number;
  postsByHour: Record<string, number>;
  postsByDay: Record<string, number>;
  totalEngagement: number;
  bestHour: number | null;
  bestDay: number | null;
  avgEngagement: number;
  topPost: { id: string; caption: string; engagement: number; date: string } | null;
}

interface Insights {
  platforms: Record<string, PlatformInsight>;
  bestDayHour: { day: number | null; hour: number | null };
  totalPosts: number;
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
}

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function HourBar({ hour, count, max }: React.PropsWithoutRef<{ hour: number; count: number; max: number }>) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-slate-500 w-8 text-right">{formatHour(hour)}</span>
      <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[9px] font-mono text-slate-500 w-4">{count}</span>
    </div>
  );
}

export default function ViewPostingInsights() {
  const { dialect } = useZyng();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      const token = await ensureValidToken();
      if (!token) return;
      try {
        const res = await fetch("/api/analytics/posting-insights", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setInsights(data.insights);
      } catch (e) {
        console.error("Failed to fetch posting insights", e);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!insights || insights.totalPosts === 0) {
    return (
      <div className="p-4 sm:p-8 space-y-6 animate-fade-in text-slate-200">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Posting Insights</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Clock className="h-8 w-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No posts yet. Create your first post to see insights.</p>
        </div>
      </div>
    );
  }

      const platformEntries = (Object.entries(insights.platforms) as [string, PlatformInsight][]).sort((a, b) => b[1].totalPosts - a[1].totalPosts);

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-fade-in text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Posting Insights</h2>
        </div>
        <span className="text-[10px] font-mono text-slate-500">{insights.totalPosts} total posts</span>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[9px] font-mono text-slate-500 uppercase">Platforms Used</span>
          <p className="text-2xl font-bold text-white mt-1">{platformEntries.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[9px] font-mono text-slate-500 uppercase">Busiest Day</span>
          <p className="text-2xl font-bold text-white mt-1">
            {insights.bestDayHour.day !== null ? DAY_NAMES[insights.bestDayHour.day] : "—"}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[9px] font-mono text-slate-500 uppercase">Peak Hour</span>
          <p className="text-2xl font-bold text-white mt-1">
            {insights.bestDayHour.hour !== null ? formatHour(insights.bestDayHour.hour) : "—"}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[9px] font-mono text-slate-500 uppercase">Total Engagement</span>
          <p className="text-2xl font-bold text-white mt-1">
            {platformEntries.reduce((sum, [, s]) => sum + s.totalEngagement, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Per-Platform Cards */}
      <div className="space-y-4">
        {platformEntries.map(([platform, stat]) => {
          const color = PLATFORM_COLORS[platform] || "bg-slate-600";
          const label = PLATFORM_LABELS[platform] || platform;
          const maxHourCount = Math.max(...Object.values(stat.postsByHour).map(Number), 1);

          return (
            <div key={platform} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
              {/* Platform header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <h3 className="text-sm font-bold text-white">{label}</h3>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                  <span>{stat.totalPosts} posts</span>
                  <span>{stat.publishedCount} published</span>
                  {stat.totalEngagement > 0 && (
                    <span className="text-amber-400">{stat.totalEngagement.toLocaleString()} eng.</span>
                  )}
                </div>
              </div>

              {/* Last post + Best time */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 rounded-xl p-3">
                  <span className="text-[8px] font-mono text-slate-600 uppercase block">Last Posted</span>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {stat.lastPostAt ? timeSince(stat.lastPostAt) : "Never"}
                  </p>
                  {stat.lastPostAt && (
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {new Date(stat.lastPostAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
                <div className="bg-slate-950 rounded-xl p-3">
                  <span className="text-[8px] font-mono text-slate-600 uppercase block">Best Day</span>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {stat.bestDay !== null ? DAY_NAMES[stat.bestDay] : "—"}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    {stat.bestDay !== null && stat.postsByDay[String(stat.bestDay)]
                      ? `${stat.postsByDay[String(stat.bestDay)]} posts`
                      : ""}
                  </p>
                </div>
                <div className="bg-slate-950 rounded-xl p-3">
                  <span className="text-[8px] font-mono text-slate-600 uppercase block">Best Hour</span>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {stat.bestHour !== null ? formatHour(stat.bestHour) : "—"}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    {stat.bestHour !== null && stat.postsByHour[String(stat.bestHour)]
                      ? `${stat.postsByHour[String(stat.bestHour)]} posts`
                      : ""}
                  </p>
                </div>
                <div className="bg-slate-950 rounded-xl p-3">
                  <span className="text-[8px] font-mono text-slate-600 uppercase block">Avg Engagement</span>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {stat.avgEngagement > 0 ? stat.avgEngagement.toLocaleString() : "—"}
                  </p>
                </div>
              </div>

              {/* Hourly activity chart */}
              {Object.keys(stat.postsByHour).length > 0 && (
                <div className="space-y-1">
                  <span className="text-[8px] font-mono text-slate-600 uppercase block mb-2">Posting Activity by Hour (WAT)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                    {Array.from({ length: 24 }, (_, h) => (
                      <HourBar key={h} hour={h} count={stat.postsByHour[String(h)] || 0} max={maxHourCount} />
                    ))}
                  </div>
                </div>
              )}

              {/* Top post */}
              {stat.topPost && stat.topPost.engagement > 0 && (
                <div className="bg-slate-950 rounded-xl p-3 flex items-start gap-3">
                  <TrendingUp className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[8px] font-mono text-amber-400 uppercase block">Top Post</span>
                    <p className="text-[11px] text-slate-300 mt-0.5">{stat.topPost.caption}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {stat.topPost.engagement} engagement · {new Date(stat.topPost.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
