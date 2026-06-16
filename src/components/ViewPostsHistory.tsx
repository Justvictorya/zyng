import React, { useState } from "react";
import { 
  History, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Clock, 
  CheckCircle, 
  Layers, 
  ArrowRight,
  MessageSquare,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Loader2
} from "lucide-react";
import { Post, DialectType } from "../types";
import { translations } from "../lib/translations";

interface ViewPostsHistoryProps {
  dialect: DialectType;
  posts: Post[];
  isLoading: boolean;
  onPostDeleted: (id: string) => void;
  onPostUpdated: (id: string, updatedFields: Partial<Post>) => void;
  triggerRefresh: () => void;
}

export default function ViewPostsHistory({ 
  dialect, 
  posts, 
  isLoading,
  onPostDeleted,
  onPostUpdated,
  triggerRefresh
}: ViewPostsHistoryProps) {
  const t = translations[dialect];

  // Inline editing states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  // Parse string separated list to array
  const getPlatformsArray = (platformsStr: string) => {
    return platformsStr ? platformsStr.split(",").map(p => p.trim()) : [];
  };

  const handleStartEdit = (post: Post) => {
    setEditingPostId(post.id);
    setEditCaption(post.caption);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditCaption("");
  };

  const handleSaveInlineEdit = async (id: string) => {
    if (!editCaption.trim()) return;
    setIsUpdatingId(id);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editCaption })
      });
      const data = await res.json();
      if (data.success) {
        onPostUpdated(id, { caption: editCaption });
        setEditingPostId(null);
        setEditCaption("");
        triggerRefresh();
      }
    } catch (e) {
      console.error("Failed to update post inline:", e);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleDeleteTrigger = async (id: string) => {
    if (!confirm("Are you sure you want to cancel and delete this scheduled post?")) return;
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        onPostDeleted(id);
        triggerRefresh();
      }
    } catch (e) {
      console.error("Failed to delete post:", e);
    }
  };

  const getPlatformIcon = (chId: string) => {
    switch (chId.toLowerCase()) {
      case "facebook": return Facebook;
      case "instagram": return Instagram;
      case "twitter":
      case "x": return Twitter;
      case "linkedin": return Linkedin;
      default: return MessageSquare;
    }
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in" id="zyng-view-posts-history">
      
      {/* Table header indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
            Social Campaign Calendar Ledger
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Total of {posts.length} actions logged in database. Connects real-time to active broadcast channels.
          </p>
        </div>
        <div className="flex gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-400/10 px-3 py-1.5 rounded-lg font-semibold">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{posts.filter(p => p.status === "scheduled").length} Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-400/10 px-3 py-1.5 rounded-lg font-semibold">
            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{posts.filter(p => p.status === "published").length} Broadcasted</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="text-xs text-slate-400 font-sans">Connecting to Supabase Local Proxy Ledger...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24 bg-slate-900 border border-slate-850 border-dashed rounded-2xl">
          <History className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No posts in active ledger yet!</h4>
          <p className="text-xs text-slate-500 mt-1">
            Create a campaign post first and set a cross-posting channel to populate this ledger database.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isEditing = editingPostId === post.id;
            const channels = getPlatformsArray(post.platforms);
            
            return (
              <div 
                key={post.id}
                className={`bg-slate-900 border transition-all rounded-2xl p-5 hover:border-slate-800 shadow-md flex flex-col justify-between gap-4 ${
                  isEditing ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-800"
                }`}
                id={`post-card-${post.id}`}
              >
                
                {/* Platform Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-850 pb-3 h-auto">
                  <div className="flex flex-wrap items-center gap-2">
                    {channels.map((chan) => {
                      const Icon = getPlatformIcon(chan);
                      return (
                        <span 
                          key={chan} 
                          className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold font-mono tracking-wide rounded border uppercase shrink-0 ${
                            chan === "facebook" ? "bg-blue-500/10 text-blue-450 border-blue-500/20" :
                            chan === "instagram" ? "bg-pink-500/10 text-pink-400 border-pink-500/20" :
                            chan === "whatsapp" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            chan === "twitter" || chan === "x" ? "bg-slate-500/10 text-slate-300 border-slate-500/20" :
                            chan === "linkedin" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                            chan === "tiktok" ? "bg-red-500/10 text-red-450 border-red-500/20" :
                            "bg-slate-500/10 text-slate-300 border-slate-500/20"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span>{chan}</span>
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Status badges */}
                    <span className={`px-2 py-0.5 text-[9px] rounded font-mono font-bold uppercase border ${
                      post.status === "scheduled" 
                        ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" 
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                    }`}>
                      {post.status}
                    </span>

                    <span className="text-[10px] font-mono text-slate-500">
                      ID: #{post.id}
                    </span>
                  </div>
                </div>

                {/* Body Content Description */}
                <div className="py-1">
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed resize-none"
                      />
                      <div className="flex justify-end gap-2.5">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 border border-slate-800 text-slate-400 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={() => handleSaveInlineEdit(post.id)}
                          disabled={isUpdatingId === post.id}
                          className="px-4.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          {isUpdatingId === post.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 font-sans leading-relaxed break-words whitespace-pre-wrap select-text">
                      {post.caption}
                    </p>
                  )}
                </div>

                {/* Post Footer Metadata & Primary Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-850 pt-3 text-[11px]">
                  
                  {/* Local Timing Indicator */}
                  <div className="flex items-center gap-2 text-slate-400 font-sans">
                    <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>Broadcast Target:</span>
                    <span className="text-slate-300 font-mono font-medium">
                      {new Date(post.schedule_time).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })} WAT
                    </span>
                  </div>

                  {!isEditing && (
                    <div className="flex gap-2 justify-end shrink-0">
                      <button
                        onClick={() => handleStartEdit(post)}
                        className="p-2 border border-slate-850 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-950/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold"
                        title="Edit caption content"
                        id={`edit-btn-${post.id}`}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit Caption</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTrigger(post.id)}
                        className="p-2 border border-slate-850 text-slate-400 hover:text-rose-400 hover:border-rose-900/30 hover:bg-rose-950/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold"
                        title="Cancel broadcast scheduling"
                        id={`delete-btn-${post.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
