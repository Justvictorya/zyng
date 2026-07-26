import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { useZyng } from "../context/ZyngContext";

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
  const { posts } = useZyng();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
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

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedPosts = selectedDate
    ? postsByDate[selectedDate.toISOString().split("T")[0]] || []
    : [];

  const monthName = currentDate.toLocaleDateString("en", { month: "long", year: "numeric" });

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-fade-in text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Content Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer">
            <ChevronLeft className="h-4 w-4 text-slate-400" />
          </button>
          <span className="text-sm font-mono text-slate-300 min-w-[160px] text-center">{monthName}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer">
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-[10px] font-mono text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayPosts = postsByDate[dateStr] || [];
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
              const isSelected = selectedDate?.getFullYear() === year && selectedDate?.getMonth() === month && selectedDate?.getDate() === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(new Date(year, month, day))}
                  className={`aspect-square p-1 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/10"
                      : isToday
                        ? "border-indigo-500/30 bg-slate-800/50"
                        : "border-transparent hover:bg-slate-800/30"
                  }`}
                >
                  <span className={`text-[11px] font-mono block mb-0.5 ${
                    isToday ? "text-indigo-400 font-bold" : "text-slate-400"
                  }`}>
                    {day}
                  </span>
                  {dayPosts.length > 0 && (
                    <div className="flex flex-wrap gap-0.5">
                      {dayPosts.slice(0, 3).map((post) => {
                        const platforms = post.platforms?.split(",").map(p => p.trim().toLowerCase()) || [];
                        return platforms.slice(0, 2).map((pf) => (
                          <div
                            key={`${post.id}-${pf}`}
                            className={`w-1.5 h-1.5 rounded-full ${PLATFORM_COLORS[pf] || "bg-slate-600"}`}
                            title={`${pf}: ${post.caption?.substring(0, 50)}`}
                          />
                        ));
                      })}
                      {dayPosts.length > 3 && (
                        <span className="text-[7px] text-slate-500">+{dayPosts.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Detail */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              {selectedDate
                ? selectedDate.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })
                : "Select a date"}
            </h3>
            <Clock className="h-4 w-4 text-slate-500" />
          </div>

          {selectedDate ? (
            selectedPosts.length > 0 ? (
              <div className="space-y-3">
                {selectedPosts.map((post) => {
                  const platforms = post.platforms?.split(",").map(p => p.trim().toLowerCase()) || [];
                  return (
                    <div key={post.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                      <p className="text-xs text-slate-300 line-clamp-2">{post.caption || "No caption"}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {platforms.map((pf) => (
                            <span key={pf} className={`px-1.5 py-0.5 text-[8px] font-mono font-bold rounded ${PLATFORM_COLORS[pf] || "bg-slate-700"} text-white`}>
                              {PLATFORM_LABELS[pf] || pf.toUpperCase()}
                            </span>
                          ))}
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          post.status === "published"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : post.status === "scheduled"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-slate-700 text-slate-400"
                        }`}>
                          {post.status}
                        </span>
                      </div>
                      {post.schedule_time && (
                        <p className="text-[9px] text-slate-600 font-mono">
                          {new Date(post.schedule_time).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
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
