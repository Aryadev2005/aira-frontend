// src/pages/dashboard/Calendar.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, Sparkles, Calendar as CalIcon,
  CheckCircle2, Clock, Zap, MoreHorizontal, Trash2, Check, X
} from 'lucide-react';
import {
  useCalendarEntries, useGenerateCalendar, useSavedCalendar,
  useCreateCalendarEntry, useUpdateCalendarEntry, useDeleteCalendarEntry,
  useProfile
} from '@/hooks/useApi';

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const STATUS_STYLES = {
  idea:   { bg: 'bg-muted',           text: 'text-muted-foreground', label: 'Idea'   },
  script: { bg: 'bg-blue-500/15',     text: 'text-blue-600',         label: 'Script' },
  ready:  { bg: 'bg-orange-500/15',   text: 'text-orange-600',       label: 'Ready'  },
  posted: { bg: 'bg-emerald-500/15',  text: 'text-emerald-600',      label: 'Posted' },
};

const PLATFORM_ICONS = {
  instagram: '📸',
  youtube:   '▶️',
  tiktok:    '♪',
  twitter:   '🐦',
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// ── Day cell ──────────────────────────────────────────────────────────────────
function DayCell({ date, entries, aiEntries, isToday, isCurrentMonth, onClick }) {
  const allEntries   = [...entries, ...aiEntries];
  const hasConfirmed = entries.length > 0;
  const hasAI        = aiEntries.length > 0;

  return (
    <div
      onClick={() => isCurrentMonth && onClick(date)}
      className={`min-h-[80px] lg:min-h-[100px] p-1.5 border-r border-b border-border/50
                  cursor-pointer transition-colors group
                  ${isCurrentMonth ? 'hover:bg-muted/30' : 'bg-muted/10 opacity-40'}
                  ${isToday ? 'bg-primary/5' : ''}`}
    >
      {/* Date number */}
      <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1
                       font-body text-xs font-semibold transition-colors
                       ${isToday
                         ? 'bg-primary text-white'
                         : 'text-foreground group-hover:bg-muted'}`}>
        {date.getDate()}
      </div>

      {/* Entry pills */}
      <div className="space-y-0.5">
        {entries.slice(0, 2).map((e) => {
          const s = STATUS_STYLES[e.status] || STATUS_STYLES.idea;
          return (
            <div key={e.id}
              className={`text-[10px] font-body font-medium px-1.5 py-0.5 rounded-md
                          truncate ${s.bg} ${s.text}`}
            >
              {PLATFORM_ICONS[e.platform] || '📱'} {e.title}
            </div>
          );
        })}
        {/* AI suggestion pills — muted/dashed */}
        {aiEntries.slice(0, hasConfirmed ? 1 : 2).map((e, i) => (
          <div key={`ai-${i}`}
            className="text-[10px] font-body px-1.5 py-0.5 rounded-md truncate
                       border border-dashed border-primary/30 text-primary/60 bg-primary/5"
          >
            ✨ {e.title}
          </div>
        ))}
        {allEntries.length > 3 && (
          <p className="text-[10px] text-muted-foreground font-body pl-1">
            +{allEntries.length - 3} more
          </p>
        )}
      </div>
    </div>
  );
}

// ── Day detail panel ──────────────────────────────────────────────────────────
function DayDetailPanel({ date, entries, aiEntries, onClose, onCreate, onUpdate, onDelete, onAcceptAI }) {
  const dateStr = date?.toISOString().split('T')[0] || '';
  const [addingManual, setAddingManual] = useState(false);
  const [newTitle, setNewTitle]         = useState('');

  const formattedDate = date
    ? date.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full lg:w-80 bg-card border-l border-border flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <p className="font-heading text-sm text-foreground">{formattedDate}</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Confirmed entries */}
        {entries.map((e) => {
          const s = STATUS_STYLES[e.status] || STATUS_STYLES.idea;
          return (
            <div key={e.id} className="bg-muted/50 rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-semibold text-foreground truncate">{e.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`font-body text-[10px] font-semibold px-1.5 py-0.5
                                      rounded-full ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                    {e.scheduled_time && (
                      <span className="font-body text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock size={9} /> {e.scheduled_time}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {/* Mark posted */}
                  {e.status !== 'posted' && (
                    <button
                      onClick={() => onUpdate({ id: e.id, status: 'posted', posted_at: new Date().toISOString() })}
                      className="p-1 rounded-lg text-muted-foreground hover:text-emerald-500 transition-colors"
                      title="Mark as posted"
                    >
                      <Check size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(e.id)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {e.hook && (
                <p className="font-body text-xs text-muted-foreground italic line-clamp-2">"{e.hook}"</p>
              )}
            </div>
          );
        })}

        {/* AI suggestions for this day */}
        {aiEntries.map((e, i) => (
          <div key={`ai-${i}`}
            className="border border-dashed border-primary/30 bg-primary/5 rounded-xl p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={10} className="text-primary" />
                  <span className="font-body text-[10px] text-primary font-semibold">AI Suggestion</span>
                </div>
                <p className="font-body text-sm text-foreground">{e.title}</p>
                {e.hook && <p className="font-body text-xs text-muted-foreground mt-0.5">{e.hook}</p>}
              </div>
            </div>
            <button
              onClick={() => onAcceptAI(e, dateStr)}
              className="mt-2 w-full py-1.5 bg-primary/10 hover:bg-primary/20 text-primary
                         font-body text-xs font-semibold rounded-lg transition-colors"
            >
              Accept → Add to Calendar
            </button>
          </div>
        ))}

        {entries.length === 0 && aiEntries.length === 0 && (
          <p className="font-body text-sm text-muted-foreground text-center pt-4">
            Nothing scheduled. Add content below.
          </p>
        )}

        {/* Quick add */}
        {addingManual ? (
          <div className="space-y-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Content idea or title…"
              autoFocus
              className="w-full bg-muted border border-border rounded-xl px-3 py-2
                         font-body text-sm text-foreground placeholder:text-muted-foreground/50
                         outline-none focus:border-primary/40 transition-all"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (newTitle.trim()) {
                    onCreate({ title: newTitle.trim(), scheduled_date: dateStr, status: 'idea', source: 'manual' });
                    setNewTitle('');
                    setAddingManual(false);
                  }
                }}
                className="flex-1 py-2 bg-primary text-white rounded-xl font-body text-xs
                           font-semibold hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => { setAddingManual(false); setNewTitle(''); }}
                className="px-3 py-2 bg-muted text-muted-foreground rounded-xl font-body text-xs
                           hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingManual(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed
                       border-border rounded-xl font-body text-xs text-muted-foreground
                       hover:text-foreground hover:border-border/80 transition-colors"
          >
            <Plus size={13} /> Quick add
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Calendar ─────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const now    = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const monthKey   = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthLabel = MONTHS[viewMonth];

  const { data: profileData } = useProfile();
  const user = profileData?.data?.user;

  // Fetch individual entries for this month
  const { data: entriesData, isLoading: entriesLoading } = useCalendarEntries(monthKey);
  const entries = entriesData?.data || [];

  // Fetch AI monthly calendar (existing system)
  const { data: savedCalData } = useSavedCalendar();
  const savedCals = savedCalData?.data || [];

  const { mutateAsync: generateCalendar }  = useGenerateCalendar();
  const { mutateAsync: createEntry }        = useCreateCalendarEntry();
  const { mutateAsync: updateEntry }        = useUpdateCalendarEntry();
  const { mutateAsync: deleteEntry }        = useDeleteCalendarEntry();

  // Build AI suggestions from existing monthly calendar data
  const aiSuggestions = useMemo(() => {
    const cal = savedCals.find((c) => c.month === monthLabel && c.year === viewYear);
    if (!cal?.calendar_data?.days) return [];
    return cal.calendar_data.days
      .filter((d) => d.isPostingDay && d.title)
      .map((d) => ({
        date:   d.date,
        title:  d.title,
        hook:   d.hook,
        format: d.contentType,
        badge:  d.badge,
      }));
  }, [savedCals, monthLabel, viewYear]);

  // Group confirmed entries by date
  const entriesByDate = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      if (!map[e.scheduled_date]) map[e.scheduled_date] = [];
      map[e.scheduled_date].push(e);
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

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDayOfMonth(viewYear, viewMonth);

  const calendarCells = useMemo(() => {
    const cells = [];
    // Prev month padding
    const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ date: new Date(viewYear, viewMonth - 1, prevMonthDays - i), isCurrentMonth: false });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(viewYear, viewMonth, d), isCurrentMonth: true });
    }
    // Next month padding (fill to 6 rows = 42 cells)
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ date: new Date(viewYear, viewMonth + 1, d), isCurrentMonth: false });
    }
    return cells;
  }, [viewYear, viewMonth, firstDay, daysInMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  };

  // Generate AI calendar for this month
  const handleGenerateAI = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      await generateCalendar({
        niche:         user.niches?.[0]   || 'general',
        platform:      user.primary_platform || 'Instagram',
        followerRange: user.follower_range || '10K–50K',
        month:         monthLabel,
        year:          viewYear,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Accept AI suggestion → convert to real entry
  const handleAcceptAI = async (aiEntry, date) => {
    await createEntry({
      title:          aiEntry.title,
      scheduled_date: date,
      format:         aiEntry.format,
      hook:           aiEntry.hook,
      status:         'idea',
      source:         'ai_generated',
      is_ai_suggested: true,
      ai_accepted:    true,
    });
  };

  const selectedDateStr = selectedDate?.toISOString().split('T')[0] || '';
  const selectedEntries = entriesByDate[selectedDateStr] || [];
  const selectedAI      = aiByDate[selectedDateStr] || [];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-screen bg-background">

      {/* ── Calendar header ── */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3.5
                      border-b border-border bg-card/50 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={16} />
          </button>
          <h2 className="font-heading text-lg text-foreground min-w-[160px] text-center">
            {monthLabel} {viewYear}
          </h2>
          <button onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-3 mr-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
              <span className="font-body text-xs text-muted-foreground">Confirmed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border border-dashed border-primary/40" />
              <span className="font-body text-xs text-muted-foreground">AI suggestion</span>
            </div>
          </div>

          {/* Generate AI plan */}
          <button
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary
                       font-body text-xs font-semibold hover:bg-primary/20 transition-colors
                       disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            {isGenerating ? 'Generating…' : 'AI Plan'}
          </button>
        </div>
      </div>

      {/* ── Main grid + detail panel ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Calendar grid */}
        <div className="flex-1 overflow-auto">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/20 sticky top-0 z-10">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="px-2 py-2 text-center font-body text-xs
                                      font-semibold text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Loading skeleton */}
          {entriesLoading && (
            <div className="p-4 grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          )}

          {/* Calendar cells */}
          {!entriesLoading && (
            <div className="grid grid-cols-7">
              {calendarCells.map(({ date, isCurrentMonth }, idx) => {
                const dateStr   = date.toISOString().split('T')[0];
                const dayEntries = entriesByDate[dateStr] || [];
                const dayAI     = aiByDate[dateStr] || [];
                const isToday   = dateStr === now.toISOString().split('T')[0];

                return (
                  <DayCell
                    key={idx}
                    date={date}
                    entries={dayEntries}
                    aiEntries={dayAI}
                    isToday={isToday}
                    isCurrentMonth={isCurrentMonth}
                    onClick={setSelectedDate}
                  />
                );
              })}
            </div>
          )}
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
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
