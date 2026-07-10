import React, { useState, useEffect } from "react";
import {
  BarChart2,
  TrendingUp,
  Activity,
  Cpu,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MessageSquare,
  Loader2,
  AlertTriangle,
  Download,
} from "lucide-react";
import { translations } from "../lib/translations";
import { useZyng } from "../context/ZyngContext";

interface BotPostEntry {
  id: string;
  caption: string;
  created_at: string;
  status: "published" | "failed" | "pending";
  error?: string | null;
}

interface BotStatsEntry {
  totalTargeted: number;
  published: number;
  failed: number;
  pending: number;
  lastPublished: string | null;
  successRate: number;
  posts: BotPostEntry[];
}

interface AnalyticsStats {
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  connectedPlatforms: number;
  platformDistribution: { name: string; count: number; percentage: number }[];
  recentPosts: { caption: string; platforms: string[]; created_at: string; schedule_time: string; status: string }[];
  postsOverTime: { date: string; count: number }[];
  botStats: Record<string, BotStatsEntry>;
  connectedAccounts: { platform: string; name: string | null; connectedAt: string }[];
}

const PLATFORM_ICONS: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: TrendingUp,
  whatsapp: MessageSquare,
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "text-blue-400 bg-blue-500/10 border-blue-500/25",
  instagram: "text-pink-400 bg-pink-500/10 border-pink-500/25",
  twitter: "text-slate-300 bg-slate-500/10 border-slate-500/25",
  linkedin: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
  youtube: "text-red-400 bg-red-500/10 border-red-500/25",
  tiktok: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
  whatsapp: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
};

function BotDetailRow(props: { entry: BotPostEntry; key?: string }) {
  const { entry } = props;
  const statusIcon = {
    published: <CheckCircle2 className="h-3 w-3 text-emerald-400" />,
    failed: <XCircle className="h-3 w-3 text-rose-400" />,
    pending: <Clock className="h-3 w-3 text-amber-400" />,
  }[entry.status];

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-slate-800/30 last:border-0">
      {statusIcon}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-300 truncate">{entry.caption || "(no caption)"}</p>
        {entry.error && (
          <p className="text-[9px] text-rose-400/80 mt-0.5 truncate">{entry.error}</p>
        )}
      </div>
      <span className="text-[9px] font-mono text-slate-500 shrink-0">
        {new Date(entry.created_at).toLocaleDateString()}
      </span>
    </div>
  );
}

export default function ViewAnalytics() {
  const { dialect } = useZyng();
  const t = translations[dialect];
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBots, setExpandedBots] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchStats = async () => {
      const savedUser = localStorage.getItem("zyng_user");
      if (!savedUser) return;
      const uid = JSON.parse(savedUser).id;
      try {
        const res = await fetch(`/api/v1/analytics/dashboard?user_id=${uid}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("zyng_token")}` },
        });
        const data = await res.json();
        if (data.success) setStats(data.stats);
      } catch (e) {
        console.error("Failed to fetch analytics", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const toggleBot = (platform: string) => {
    setExpandedBots(prev => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  };

  const totalPlatformPosts = stats?.platformDistribution?.reduce((s, p) => s + p.count, 0) || 1;

  const handleExportCSV = async () => {
    const token = localStorage.getItem("zyng_token");
    if (!token) return;
    try {
      const res = await fetch("/api/analytics/export", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zyng-analytics-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-fade-in text-slate-200" id="zyng-view-analytics">
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 text-[10px] font-mono bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="h-3 w-3" />
          Export CSV
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md shadow-black/10">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Total Posts</span>
            <span className="px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/10 text-indigo-400 text-[10px] rounded font-bold font-mono">All time</span>
          </div>
          <h4 className="text-2xl font-bold font-mono text-slate-100 mt-2">{stats?.totalPosts || 0}</h4>
          <p className="text-[10px] text-slate-500 mt-1">Posts created across all platforms</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md shadow-black/10">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Scheduled</span>
            <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/10 text-amber-400 text-[10px] rounded font-bold font-mono">Upcoming</span>
          </div>
          <h4 className="text-2xl font-bold font-mono text-slate-100 mt-2">{stats?.scheduledPosts || 0}</h4>
          <p className="text-[10px] text-slate-500 mt-1">Posts scheduled for future</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md shadow-black/10">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Published</span>
            <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/10 text-emerald-400 text-[10px] rounded font-bold font-mono">Live</span>
          </div>
          <h4 className="text-2xl font-bold font-mono text-slate-100 mt-2">{stats?.publishedPosts || 0}</h4>
          <p className="text-[10px] text-slate-500 mt-1">Successfully posted to platforms</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md shadow-black/10">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Connected</span>
            <span className="px-2 py-0.5 bg-cyan-500/15 border border-cyan-500/10 text-cyan-400 text-[10px] rounded font-bold font-mono">Platforms</span>
          </div>
          <h4 className="text-2xl font-bold font-mono text-slate-100 mt-2">{stats?.connectedPlatforms || 0}</h4>
          <p className="text-[10px] text-slate-500 mt-1">Social accounts linked</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md shadow-black/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Platform Distribution</h3>
            <BarChart2 className="h-4 w-4 text-slate-500" />
          </div>
          <div className="space-y-3">
            {stats?.platformDistribution?.length > 0 ? stats.platformDistribution.map((p) => {
              const Icon = PLATFORM_ICONS[p.name] || Activity;
              const colorClass = PLATFORM_COLORS[p.name] || "text-slate-400 bg-slate-500/10 border-slate-500/25";
              return (
                <div key={p.name} className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium capitalize">{p.name}</span>
                      <span className="text-slate-400 font-mono">{p.count} posts</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${p.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-500 w-8 text-right">{p.percentage}%</span>
                </div>
              );
            }) : (
              <p className="text-xs text-slate-500 text-center py-4">No platform data yet. Create a post to see distribution.</p>
            )}
          </div>
        </div>

        {/* Detailed Per-Platform Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md shadow-black/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Publisher Performance</h3>
            <Cpu className="h-4 w-4 text-slate-500" />
          </div>
          <div className="space-y-3">
            {stats?.botStats && Object.keys(stats.botStats).length > 0 ? (
              Object.entries(stats.botStats).map(([platform, data]: [string, BotStatsEntry]) => {
                const Icon = PLATFORM_ICONS[platform] || Activity;
                const colorClass = PLATFORM_COLORS[platform] || "text-slate-400 bg-slate-500/10 border-slate-500/25";
                const total = data.totalTargeted;
                const isExpanded = expandedBots.has(platform);

                return (
                  <div key={platform} className="border border-slate-800 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleBot(platform)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/40 transition-colors text-left"
                    >
                      <div className={`p-2 rounded-lg border ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-xs text-slate-200 font-medium capitalize">{platform}</span>
                          <span className="text-[10px] font-mono text-slate-500">{data.published}/{total} posted</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${data.successRate}%` }} />
                        </div>
                        <div className="flex items-center gap-3 text-[9px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                            {data.published}
                          </span>
                          <span className="flex items-center gap-1">
                            <XCircle className="h-2.5 w-2.5 text-rose-500" />
                            {data.failed}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 text-amber-500" />
                            {data.pending}
                          </span>
                          <span>{data.successRate}% success</span>
                          {data.lastPublished && (
                            <span className="ml-auto text-[8px] text-slate-600">
                              Last: {new Date(data.lastPublished).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-800 px-3 py-2 bg-slate-950/50 max-h-64 overflow-y-auto">
                        {data.posts.length > 0 ? (
                          data.posts.map((entry) => <BotDetailRow key={entry.id + platform} entry={entry} />)
                        ) : (
                          <p className="text-[10px] text-slate-500 text-center py-2">No posts targeted to this platform yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">No platform activity yet. Schedule your first post to see publisher stats.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md shadow-black/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Connected Accounts</h3>
          <Activity className="h-4 w-4 text-slate-500" />
        </div>
        {stats?.connectedAccounts && stats.connectedAccounts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.connectedAccounts.map((acc) => {
              const Icon = PLATFORM_ICONS[acc.platform] || Activity;
              const colorClass = PLATFORM_COLORS[acc.platform] || "text-slate-400";
              return (
                <div key={acc.platform} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${colorClass.split(" ")[0]}`} />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-200 capitalize truncate">{acc.platform}</p>
                    {acc.name && <p className="text-[9px] text-slate-500 truncate">{acc.name}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">No accounts connected. Go to Settings to link platforms.</p>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md shadow-black/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Recent Posts</h3>
          <Activity className="h-4 w-4 text-slate-500" />
        </div>
        {stats?.recentPosts && stats.recentPosts.length > 0 ? (
          <div className="space-y-2">
            {stats.recentPosts.map((post, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 truncate">{post.caption}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <div className="flex gap-1">
                    {post.platforms.slice(0, 3).map((pf) => {
                      const Icon = PLATFORM_ICONS[pf];
                      return Icon ? <Icon key={pf} className="h-3 w-3 text-slate-500" /> : null;
                    })}
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${post.status === "published" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {post.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">No posts yet. Create your first post to see it here.</p>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md shadow-black/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Posts Over Time</h3>
          <TrendingUp className="h-4 w-4 text-slate-500" />
        </div>
        {stats?.postsOverTime && stats.postsOverTime.length > 0 ? (
          <div className="flex items-end gap-1 h-32">
            {stats.postsOverTime.slice(-14).map((day) => {
              const maxCount = Math.max(...stats.postsOverTime.map((d) => d.count), 1);
              const height = (day.count / maxCount) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono text-slate-500">{day.count}</span>
                  <div
                    className="w-full bg-indigo-500 rounded-t hover:bg-indigo-400 transition-colors"
                    style={{ height: `${height}%`, minHeight: day.count > 0 ? "4px" : "0" }}
                  />
                  <span className="text-[8px] font-mono text-slate-600 -rotate-45 origin-left whitespace-nowrap">
                    {day.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-slate-500">0</span>
                <div className="w-full bg-slate-800 rounded-t" style={{ height: "2px" }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
