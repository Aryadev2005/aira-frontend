// src/pages/dashboard/Calendar.jsx
// ── v2 redesign: clean fixed grid + sliding day detail panel ─────────────────
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  X,
  Check,
  Trash2,
} from "lucide-react";
import {
  useCalendarEntries,
  useCreateCalendarEntry,
  useUpdateCalendarEntry,
  useDeleteCalendarEntry,
  useSavedCalendar,
  useGenerateCalendar,
  useProfile,
} from "@/hooks/useApi";

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_STYLES = {
  idea: { bg: "bg-blue-500/15", text: "text-blue-600", label: "Idea" },
  script: { bg: "bg-amber-500/15", text: "text-amber-600", label: "Script" },
  ready: { bg: "bg-emerald-500/15", text: "text-emerald-600", label: "Ready" },
  posted: { bg: "bg-primary/15", text: "text-primary", label: "Posted" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const toKey = (d) => d.toISOString().split("T")[0];

function buildCells(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({
      date: new Date(year, month - 1, prevDays - i),
      isCurrentMonth: false,
    });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  const rem = 42 - cells.length;
  for (let d = 1; d <= rem; d++)
    cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  return cells;
}

// ── Day cell ──────────────────────────────────────────────────────────────────
function DayCell({
  date,
  entries,
  aiEntries,
  isToday,
  isCurrentMonth,
  isSelected,
  onClick,
}) {
  return (
    <div
      onClick={() => isCurrentMonth && onClick(date)}
      className={`min-h-[80px] p-1.5 border-b border-r border-border cursor-pointer transition-colors
        ${!isCurrentMonth ? "opacity-30 cursor-default" : "hover:bg-muted/40"}
        ${isSelected ? "bg-primary/6" : ""}
        ${isToday ? "bg-amber-500/5" : ""}`}
    >
      {/* Day number */}
      <div
        className={`w-6 h-6 flex items-center justify-center rounded-full font-body text-xs mb-1
        ${isToday ? "bg-primary text-white font-semibold" : "text-foreground"}`}
      >
        {date.getDate()}
      </div>

      {/* Confirmed entries */}
      <div className="space-y-0.5">
        {entries.slice(0, 2).map((e) => {
          const s = STATUS_STYLES[e.status] || STATUS_STYLES.idea;
          return (
            <div
              key={e.id}
              className={`px-1.5 py-0.5 rounded-md font-body text-[10px] font-medium truncate ${s.bg} ${s.text}`}
            >
              {e.title}
            </div>
          );
        })}
        {/* AI suggestions */}
        {aiEntries.slice(0, 1).map((e, i) => (
          <div
            key={i}
            className="px-1.5 py-0.5 rounded-md font-body text-[10px] font-medium truncate
                       border border-dashed border-primary/40 text-primary/70"
          >
            ✦ {e.title}
          </div>
        ))}
        {entries.length + aiEntries.length > 3 && (
          <p className="font-body text-[9px] text-muted-foreground px-1">
            +{entries.length + aiEntries.length - 3} more
          </p>
        )}
      </div>
    </div>
  );
}

// ── Day detail panel ──────────────────────────────────────────────────────────
function DayDetailPanel({
  date,
  entries,
  aiEntries,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onAcceptAI,
  onNavigateToStudio,
}) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const formattedDate = date
    ? date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await onCreate({
      title: newTitle.trim(),
      status: "idea",
      scheduled_date: toKey(date),
    });
    setNewTitle("");
    setAdding(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full lg:w-72 xl:w-80 bg-card border-l border-border flex flex-col shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <p className="font-heading text-sm text-foreground">{formattedDate}</p>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Confirmed entries */}
        {entries.map((e) => {
          const s = STATUS_STYLES[e.status] || STATUS_STYLES.idea;
          return (
            <div
              key={e.id}
              onClick={() => onNavigateToStudio(e)}
              className="bg-muted/50 rounded-xl p-3 cursor-pointer hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-semibold text-foreground truncate">
                    {e.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`font-body text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${s.bg} ${s.text}`}
                    >
                      {s.label}
                    </span>
                    {e.platform && (
                      <span className="font-body text-[10px] text-muted-foreground">
                        {e.platform}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {e.status !== "posted" && (
                    <button
                      onClick={() => onUpdate({ id: e.id, status: "posted" })}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                    >
                      <Check size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(e.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* AI suggestions */}
        {aiEntries.map((e, i) => (
          <div
            key={i}
            className="border border-dashed border-primary/30 rounded-xl p-3 bg-primary/4"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={10} className="text-primary" />
              <span className="font-body text-[10px] font-semibold text-primary uppercase tracking-wider">
                AI Suggestion
              </span>
            </div>
            <p className="font-body text-sm font-semibold text-foreground mb-2">
              {e.title}
            </p>
            {e.hook && (
              <p className="font-body text-xs text-muted-foreground mb-2 leading-relaxed">
                {e.hook}
              </p>
            )}
            <button
              onClick={() => onAcceptAI(e, date)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl
                         bg-primary text-white font-body text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Accept → Add to Calendar
            </button>
          </div>
        ))}

        {entries.length === 0 && aiEntries.length === 0 && (
          <p className="font-body text-xs text-muted-foreground text-center pt-8">
            Nothing scheduled. Add content below.
          </p>
        )}

        {/* Quick add */}
        {adding ? (
          <div className="space-y-2">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Content idea or title…"
              className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5
                         font-body text-sm text-foreground placeholder:text-muted-foreground/50
                         outline-none focus:border-primary/40 transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 py-2 rounded-xl bg-primary text-white font-body text-xs font-semibold
                           hover:opacity-90 transition-opacity"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setNewTitle("");
                }}
                className="px-3 py-2 rounded-xl bg-muted text-muted-foreground font-body text-xs hover:bg-muted/80"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed
                       border-border font-body text-xs text-muted-foreground hover:text-foreground
                       hover:border-primary/30 transition-colors"
          >
            <Plus size={12} /> Quick add
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <button
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                           bg-primary text-white font-body text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Sparkles size={12} /> Generate ideas for this day
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Calendar ─────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const navigate = useNavigate();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthLabel = MONTHS[viewMonth];

  const { data: profileData } = useProfile();
  const user = profileData?.data?.user;

  const { data: entriesData, isLoading: entriesLoading } =
    useCalendarEntries(monthKey);
  const entries = entriesData?.data || [];

  const { data: savedCalData } = useSavedCalendar();
  const savedCals = savedCalData?.data || [];

  const { mutateAsync: generateCalendar } = useGenerateCalendar();
  const { mutateAsync: createEntry } = useCreateCalendarEntry();
  const { mutateAsync: updateEntry } = useUpdateCalendarEntry();
  const { mutateAsync: deleteEntry } = useDeleteCalendarEntry();

  // AI suggestions from saved monthly calendar
  const aiSuggestions = useMemo(() => {
    const cal = savedCals.find(
      (c) => c.month === monthLabel && c.year === viewYear,
    );
    if (!cal?.calendar_data?.days) return [];
    return cal.calendar_data.days
      .filter((d) => d.isPostingDay && d.title)
      .map((d) => ({
        date: d.date,
        title: d.title,
        hook: d.hook,
        format: d.contentType,
        badge: d.badge,
      }));
  }, [savedCals, monthLabel, viewYear]);

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      const key = e.scheduled_date?.split("T")[0] || e.scheduled_date;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [entries]);

  // Group AI suggestions by date
  const aiByDate = useMemo(() => {
    const map = {};
    aiSuggestions.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [aiSuggestions]);

  const calendarCells = useMemo(
    () => buildCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const selectedEntries = selectedDate
    ? entriesByDate[toKey(selectedDate)] || []
    : [];
  const selectedAI = selectedDate ? aiByDate[toKey(selectedDate)] || [] : [];

  const handleAcceptAI = async (suggestion, date) => {
    await createEntry({
      title: suggestion.title,
      status: "idea",
      scheduled_date: toKey(date),
      caption: suggestion.hook || "",
      ai_accepted: true,
    });
  };

  const handleGenerateAIPlan = async () => {
    setIsGenerating(true);
    try {
      await generateCalendar({
        niche: user?.niches?.[0] || "general",
        platform: user?.primary_platform || "instagram",
        followerRange: user?.follower_range || "1K-10K",
        month: monthLabel,
        year: viewYear,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNavigateToStudio = (entry) => {
    navigate("/dashboard/studio", {
      state: {
        calendarEntry: entry,
        title: entry.title,
        caption: entry.caption,
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-2.5 border-b border-border bg-card/50 backdrop-blur shrink-0">
        <div>
          <h1 className="font-heading text-lg text-foreground">Calendar</h1>
          <p className="font-body text-[11px] text-muted-foreground">
            Content schedule · {monthLabel} {viewYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-3 mr-2">
            <div className="flex items-center gap-1.5 font-body text-[11px] text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary/20" />
              Confirmed
            </div>
            <div className="flex items-center gap-1.5 font-body text-[11px] text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-sm border border-dashed border-primary/50" />
              AI suggestion
            </div>
          </div>
          <button
            onClick={handleGenerateAIPlan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted
                       font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isGenerating ? (
              <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
            AI Plan
          </button>
          <button
            onClick={() => setSelectedDate(now)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white
                       font-body text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={12} /> Add entry
          </button>
        </div>
      </div>

      {/* ── Grid + panel ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="font-heading text-base text-foreground w-40 text-center">
                {monthLabel} {viewYear}
              </h2>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              onClick={() => {
                setViewYear(now.getFullYear());
                setViewMonth(now.getMonth());
                setSelectedDate(now);
              }}
              className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
            >
              Today
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border shrink-0">
            {DAYS_SHORT.map((d) => (
              <div
                key={d}
                className="py-2 text-center font-body text-[11px] font-semibold text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="flex-1 overflow-auto">
            {entriesLoading ? (
              <div className="grid grid-cols-7">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-h-[80px] bg-muted/30 animate-pulse border-b border-r border-border"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 border-l border-t border-border">
                {calendarCells.map(({ date, isCurrentMonth }, idx) => {
                  const dateStr = toKey(date);
                  const dayEntries = entriesByDate[dateStr] || [];
                  const dayAI = aiByDate[dateStr] || [];
                  const isToday = dateStr === toKey(now);
                  const isSelected =
                    selectedDate && toKey(selectedDate) === dateStr;
                  return (
                    <DayCell
                      key={idx}
                      date={date}
                      entries={dayEntries}
                      aiEntries={dayAI}
                      isToday={isToday}
                      isCurrentMonth={isCurrentMonth}
                      isSelected={isSelected}
                      onClick={setSelectedDate}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Day detail panel */}
        <AnimatePresence>
          {selectedDate && (
            <DayDetailPanel
              date={selectedDate}
              entries={selectedEntries}
              aiEntries={selectedAI}
              onClose={() => setSelectedDate(null)}
              onCreate={(data) => createEntry(data)}
              onUpdate={(data) => updateEntry(data)}
              onDelete={(id) => deleteEntry(id)}
              onAcceptAI={handleAcceptAI}
              onNavigateToStudio={handleNavigateToStudio}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
