import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, LayoutGrid, Rows3, Lock, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useZyng, ensureValidToken } from "../context/ZyngContext";

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
  twitter: "X",
  facebook: "FB",
  instagram: "IG",
  tiktok: "TT",
  linkedin: "In",
  youtube: "YT",
  whatsapp: "WA",
};

export default function ViewCalendar() {
  const { posts, currentUser: user, loadPosts } = useZyng();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [rescheduleMsg, setRescheduleMsg] = useState<string | null>(null);

  if (user?.tier === "Free") {
    return (
      <div className="p-4 sm:p-8 space-y-6 animate-fade-in text-slate-200">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Content Calendar</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <Lock className="h-8 w-8 text-amber-400 mx-auto" />
          <p className="text-sm text-slate-400">Content Calendar is a Pro feature.</p>
          <button onClick={() => navigate("/dashboard/settings")} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer">Upgrade to Pro</button>
        </div>
      </div>
    );
  }

  const today = new Date();

  const postsByDate = useMemo(() => {
    const map: Record<string, typeof posts> = {};
    for (const post of posts) {
      const dateStr = post.schedule_time ? post.schedule_time.split("T")[0] : post.created_at?.split("T")[0];
      if (dateStr) {
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(post);
      }
    }
    return map;
  }, [posts]);

  const selectedPosts = selectedDate
    ? postsByDate[selectedDate.toISOString().split("T")[0]] || []
    : [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const monthName = currentDate.toLocaleDateString("en", { month: "long", year: "numeric" });

  const getWeekStart = (d: Date) => { const c = new Date(d); c.setDate(c.getDate() - c.getDay()); c.setHours(0, 0, 0, 0); return c; };
  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const weekLabel = `${weekDays[0].toLocaleDateString("en", { month: "short", day: "numeric" })} — ${weekDays[6].toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}`;
  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };
  const navigateDir = (dir: "prev" | "next") => { if (viewMode === "month") dir === "prev" ? prevMonth() : nextMonth(); else dir === "prev" ? prevWeek() : nextWeek(); };
  const label = viewMode === "month" ? monthName : weekLabel;
  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  // Drag-to-reschedule
  const handleDragStart = (e: React.DragEvent, postId: string) => {
    e.dataTransfer.setData("text/plain", postId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const postId = e.dataTransfer.getData("text/plain");
    if (!postId) return;

    const targetDate = new Date(targetDateStr + "T12:00:00");
    const newTime = new Date(targetDate);
    newTime.setHours(12, 0, 0, 0);

    try {
      const token = await ensureValidToken();
      if (!token) return;
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ schedule_time: newTime.toISOString() }),
      });
      const data = await res.json();
      if (data.success) {
        setRescheduleMsg("Post rescheduled!");
        setTimeout(() => setRescheduleMsg(null), 2000);
        loadPosts();
      }
    } catch (err) {
      console.error("Reschedule failed", err);
    }
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(dateStr);
  };

  const handleDragLeave = () => setDragOverDate(null);

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-fade-in text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Content Calendar</h2>
          {rescheduleMsg && <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{rescheduleMsg}</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button onClick={() => setViewMode("month")} className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === "month" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setViewMode("week")} className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === "week" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}>
              <Rows3 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigateDir("prev")} className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer">
              <ChevronLeft className="h-4 w-4 text-slate-400" />
            </button>
            <span className="text-sm font-mono text-slate-300 min-w-[200px] text-center">{label}</span>
            <button onClick={() => navigateDir("next")} className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer">
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-[10px] font-mono text-slate-500 py-2">{day}</div>
            ))}
          </div>

          {viewMode === "month" ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayPosts = postsByDate[dateStr] || [];
                const isToday = isSameDay(today, new Date(year, month, day));
                const isSelected = selectedDate?.getFullYear() === year && selectedDate?.getMonth() === month && selectedDate?.getDate() === day;
                const isDragOver = dragOverDate === dateStr;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    onDragOver={(e) => handleDragOver(e, dateStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    className={`aspect-square p-1 rounded-lg border text-left transition-all cursor-pointer ${
                      isDragOver ? "border-amber-400 bg-amber-500/10 scale-105"
                        : isSelected ? "border-indigo-500 bg-indigo-500/10"
                          : isToday ? "border-indigo-500/30 bg-slate-800/50"
                            : "border-transparent hover:bg-slate-800/30"
                    }`}
                  >
                    <span className={`text-[11px] font-mono block mb-0.5 ${isToday ? "text-indigo-400 font-bold" : "text-slate-400"}`}>{day}</span>
                    {dayPosts.length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {dayPosts.slice(0, 3).map((post) => {
                          const platforms = post.platforms?.split(",").map(p => p.trim().toLowerCase()) || [];
                          return platforms.slice(0, 2).map((pf) => (
                            <div key={`${post.id}-${pf}`} className={`w-1.5 h-1.5 rounded-full ${PLATFORM_COLORS[pf] || "bg-slate-600"}`} title={`${pf}: ${post.caption?.substring(0, 50)}`} />
                          ));
                        })}
                        {dayPosts.length > 3 && <span className="text-[7px] text-slate-500">+{dayPosts.length - 3}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {weekDays.map((day) => {
                const dateStr = day.toISOString().split("T")[0];
                const dayPosts = postsByDate[dateStr] || [];
                const isToday = isSameDay(today, day);
                const isSelected = selectedDate && isSameDay(selectedDate, day);
                const isDragOver = dragOverDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(day)}
                    onDragOver={(e) => handleDragOver(e, dateStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isDragOver ? "border-amber-400 bg-amber-500/10"
                        : isSelected ? "border-indigo-500 bg-indigo-500/10"
                          : isToday ? "border-indigo-500/30 bg-slate-800/30"
                            : "border-transparent hover:bg-slate-800/20"
                    }`}
                  >
                    <div className={`text-center min-w-[36px] ${isToday ? "text-indigo-400" : "text-slate-500"}`}>
                      <span className="text-[10px] font-mono block uppercase">{day.toLocaleDateString("en", { weekday: "short" })}</span>
                      <span className={`text-lg font-bold font-mono ${isToday ? "text-indigo-300" : "text-slate-300"}`}>{day.getDate()}</span>
                    </div>
                    <div className="flex-1 min-h-[36px]">
                      {dayPosts.length > 0 ? (
                        <div className="space-y-1">
                          {dayPosts.slice(0, 4).map((post) => {
                            const platforms = post.platforms?.split(",").map(p => p.trim().toLowerCase()) || [];
                            return (
                              <div key={post.id} className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                  {platforms.slice(0, 3).map((pf) => <div key={pf} className={`w-1.5 h-1.5 rounded-full ${PLATFORM_COLORS[pf] || "bg-slate-600"}`} />)}
                                </div>
                                <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                  {post.schedule_time && new Date(post.schedule_time).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" })} {post.caption?.substring(0, 50)}
                                </span>
                              </div>
                            );
                          })}
                          {dayPosts.length > 4 && <span className="text-[9px] text-slate-500">+{dayPosts.length - 4} more</span>}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">No posts</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Date Detail */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              {selectedDate ? selectedDate.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" }) : "Select a date"}
            </h3>
            <Clock className="h-4 w-4 text-slate-500" />
          </div>

          {selectedDate ? (
            selectedPosts.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[9px] text-slate-600 italic">Drag a post to a different date to reschedule</p>
                {selectedPosts.map((post) => {
                  const platforms = post.platforms?.split(",").map(p => p.trim().toLowerCase()) || [];
                  return (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, post.id)}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 cursor-grab active:cursor-grabbing hover:border-amber-500/30 transition-all"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-3 w-3 text-slate-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-300 line-clamp-2 flex-1">{post.caption || "No caption"}</p>
                      </div>
                      <div className="flex items-center justify-between pl-5">
                        <div className="flex gap-1">
                          {platforms.map((pf) => (
                            <span key={pf} className={`px-1.5 py-0.5 text-[8px] font-mono font-bold rounded ${PLATFORM_COLORS[pf] || "bg-slate-700"} text-white`}>
                              {PLATFORM_LABELS[pf] || pf.toUpperCase()}
                            </span>
                          ))}
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          post.status === "published" ? "bg-emerald-500/10 text-emerald-400"
                            : post.status === "scheduled" ? "bg-amber-500/10 text-amber-400"
                              : "bg-slate-700 text-slate-400"
                        }`}>{post.status}</span>
                      </div>
                      {post.schedule_time && (
                        <p className="text-[9px] text-slate-600 font-mono pl-5">
                          {new Date(post.schedule_time).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" })} WAT
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">No posts scheduled for this date.</p>
            )
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">Click a date on the calendar to see scheduled posts.</p>
          )}
        </div>
      </div>
    </div>
  );
}
