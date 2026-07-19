import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ensureValidToken } from "../context/ZyngContext";
import {
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { useZyng } from "../context/ZyngContext";

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

interface PublishResult {
  platform: string;
  success: boolean;
  error?: string;
  postId?: string;
}

export default function ViewPostAnalytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dialect, posts, isPostsLoading } = useZyng();
  const [livePost, setLivePost] = useState<any>(null);

  const contextPost = posts.find((p) => p.id === id);
  const post = livePost || contextPost;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchLive = async () => {
      const token = await ensureValidToken();
      if (!token || cancelled) return;
      const res = await fetch(`/api/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && !cancelled) setLivePost(data.post);
    };
    fetchLive();
    const interval = setInterval(fetchLive, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [id]);

  if (isPostsLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <BarChart2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-300 mb-2">Post not found</h2>
          <p className="text-xs text-slate-500 mb-6">This post may have been deleted or the link is invalid.</p>
          <button onClick={() => navigate("/dashboard/posts")} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm cursor-pointer">
            Back to Posts
          </button>
        </div>
      </div>
    );
  }

  const platforms = post.platforms.split(",").map((p) => p.trim().toLowerCase()).filter(Boolean);
  let publishResults: PublishResult[] = [];
  try {
    if (post.publish_results) {
      const parsed = JSON.parse(post.publish_results);
      if (Array.isArray(parsed)) publishResults = parsed;
    }
  } catch {}

  const status = post.status;

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Back button */}
      <button onClick={() => navigate("/dashboard/posts")} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer">
        <ArrowLeft className="h-4 w-4" />
        Back to Posts
      </button>

      {/* Post header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Post Analytics
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-1">ID: #{post.id}</p>
          </div>
          <span className={`px-2.5 py-1 text-[10px] rounded font-mono font-bold uppercase border shrink-0 ${
            status === "published" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
              : status === "scheduled" ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
              : "bg-slate-500/10 text-slate-400 border-slate-500/20"
          }`}>
            {status}
          </span>
        </div>

        {/* Caption */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap select-text">
            {post.caption}
          </p>
        </div>

        {/* Media */}
        {post.media_urls && (() => {
          let urls: string[] = [];
          try { urls = JSON.parse(post.media_urls); } catch {}
          if (urls.length === 0) return null;
          return (
            <div className="flex gap-2 flex-wrap">
              {urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  {url.match(/\.(mp4|mov|avi)$/i) ? (
                    <video src={url} className="h-20 w-20 rounded-lg object-cover border border-slate-800" />
                  ) : (
                    <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover border border-slate-800" />
                  )}
                </a>
              ))}
            </div>
          );
        })()}

        {/* Schedule info */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span>Target:</span>
          <span className="text-slate-300 font-mono font-medium">
            {new Date(post.schedule_time).toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
            })} WAT
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">Created:</span>
          <span className="text-slate-400 font-mono">
            {new Date(post.created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
            })}
          </span>
        </div>

        {post.platform_schedule && (() => {
          let ps: Record<string, string> = {};
          try { ps = JSON.parse(post.platform_schedule); } catch {}
          const entries = Object.entries(ps).filter(([_, v]) => v);
          if (entries.length === 0) return null;
          return (
            <div className="flex flex-wrap gap-3 text-[10px]">
              {entries.map(([platform, t]) => (
                <span key={platform} className="font-mono text-slate-500 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
                  {platform}: {new Date(t).toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })} WAT
                </span>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Per-platform results */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-indigo-400" />
          Platform Delivery Results
        </h3>

        <div className="grid gap-3">
          {platforms.map((platform) => {
            const result = publishResults.find((r) => r.platform === platform);
            const Icon = PLATFORM_ICONS[platform] || MessageSquare;
            const colorClass = PLATFORM_COLORS[platform] || "text-slate-400 bg-slate-500/10 border-slate-500/25";
            const delivered = result?.success === true;
            const failed = result?.success === false;
            const pending = !result;

            return (
              <div key={platform} className={`bg-slate-950 border rounded-xl p-4 flex items-start gap-4 ${
                delivered ? "border-emerald-500/20" : failed ? "border-rose-500/20" : "border-slate-800"
              }`}>
                <div className={`p-2 rounded-lg border ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-200 capitalize">{platform}</span>
                    {delivered && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                        <CheckCircle2 className="h-3 w-3" />
                        Delivered
                      </span>
                    )}
                    {failed && (
                      <span className="flex items-center gap-1 text-[10px] text-rose-400 font-mono font-bold">
                        <XCircle className="h-3 w-3" />
                        Failed
                      </span>
                    )}
                    {pending && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono font-bold">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                  </div>

                  {result?.error && (
                    <p className="text-[10px] text-rose-400/80 font-mono mt-1 break-words">
                      {result.error}
                    </p>
                  )}

                  {pending && status === "scheduled" && (
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      Awaiting schedule time
                    </p>
                  )}
                </div>

                {delivered && (
                  <div className="shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                )}
                {failed && (
                  <div className="shrink-0">
                    <XCircle className="h-6 w-6 text-rose-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary bar */}
        <div className="flex gap-4 text-[11px] font-mono pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{publishResults.filter((r) => r.success).length}/{platforms.length} delivered</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <XCircle className="h-3.5 w-3.5" />
            <span>{publishResults.filter((r) => !r.success).length} failed</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{platforms.length - publishResults.length} pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
