// src/pages/dashboard/DashboardHome.jsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowRight, Sparkles } from "lucide-react";
import {
  useProfile,
  useAnalyticsDashboard,
  useViralIdeas,
  useScriptHistory,      // NEW IMPORT — for Studio chip
  useCalendarEntries,    // NEW IMPORT — for Launch chip
} from "@/hooks/useApi";
import { useFirebaseAuth } from "@/lib/FirebaseAuthContext";

// ── Helpers ───────────────────────────────────────────────────────────────────
const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const today = () =>
  new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

// Returns current month key "YYYY-MM" for calendar query
const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const BADGE_STYLES = {
  HOT: "bg-primary/15 text-primary",
  RISING: "bg-amber-500/15 text-amber-600",
  NEW: "bg-blue-500/15 text-blue-600",
};

// ── Animation ─────────────────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 24 } },
};

// ── StatCell ──────────────────────────────────────────────────────────────────
// CHANGE: value can now be null → renders "—" instead of fake fallback
function StatCell({ label, value, suffix, delta, accent = false }) {
  const isEmpty = value === null || value === undefined;
  return (
    <div className="flex-1 min-w-0 bg-card border border-border rounded-2xl px-4 py-3.5">
      <p className="font-body text-xs text-muted-foreground mb-1">{label}</p>
      <p
        className={`font-heading text-2xl leading-none ${
          isEmpty
            ? "text-muted-foreground/30"
            : accent
            ? "text-primary"
            : "text-foreground"
        }`}
      >
        {isEmpty ? "—" : value}
        {!isEmpty && suffix && (
          <span className="font-body text-sm ml-0.5 text-muted-foreground">
            {suffix}
          </span>
        )}
      </p>
      {delta && !isEmpty && (
        <p className="font-body text-[11px] text-muted-foreground mt-1">
          {delta}
        </p>
      )}
    </div>
  );
}

// ── WorkflowCard — unchanged ──────────────────────────────────────────────────
function WorkflowCard({ step, title, desc, chips, cta, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[220px] text-left rounded-2xl border p-5 transition-all cursor-pointer
        ${
          active
            ? "bg-primary/8 border-primary/30 shadow-sm"
            : "bg-card border-border hover:border-primary/20 hover:bg-muted/40"
        }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            active ? "bg-primary" : "bg-muted-foreground/40"
          }`}
        />
        <span className="font-body text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {step}
        </span>
      </div>
      <p className="font-heading text-lg text-foreground mb-1.5">{title}</p>
      <p className="font-body text-sm text-muted-foreground leading-relaxed mb-3">
        {desc}
      </p>
      <div className="flex gap-2 mb-4">{chips}</div>
      <div
        className={`flex items-center gap-1.5 font-body text-sm font-semibold
        ${active ? "text-primary" : "text-muted-foreground"}`}
      >
        {cta}
        <ArrowRight size={13} />
      </div>
    </button>
  );
}

function TrendCard({ title, badge, growthSignal, velocityScore }) {
  return (
    <div className="flex-shrink-0 w-44 bg-card border border-border rounded-2xl p-4 space-y-2">
      <div className="flex gap-1.5">
        <span
          className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${BADGE_STYLES[badge] || "bg-muted text-muted-foreground"}`}
        >
          {badge}
        </span>
      </div>
      <p className="font-heading text-sm text-foreground leading-snug">
        {title}
      </p>
      <div className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
        <span className="text-primary font-semibold">{growthSignal}</span>
        <span>·</span>
        <span>{velocityScore ?? 0}% vel</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const navigate = useNavigate();
  const { data: profileData } = useProfile();
  const { dbUser } = useFirebaseAuth();
  const { data: analyticsData } = useAnalyticsDashboard();

  const displayName =
    dbUser?.name || profileData?.data?.user?.name || "Creator";

  const { data: ideasData, isLoading: ideasLoading } = useViralIdeas({});
  const liveIdeas = ideasData?.data?.ideas?.slice(0, 6) ?? [];

  // NEW: fetch script history for Studio chip
  const { data: historyData } = useScriptHistory();
  const scriptCount = historyData?.data?.length ?? 0;

  // NEW: fetch this month's calendar entries for Launch chip
  const { data: calendarData } = useCalendarEntries(currentMonthKey());
  const calendarCount = calendarData?.data?.length ?? 0;

  // ── Stats — null fallbacks instead of fake numbers ────────────────────────
  // CHANGE: ?? null instead of ?? "+18.2" / ?? 84 / ?? 27 / ?? "8:42"
  const analytics  = analyticsData?.data;
  const growth     = analytics?.growthRate         ?? null;
  const health     = analytics?.currentHealthScore ?? null;
  const ideas      = liveIdeas.length > 0
    ? liveIdeas.length
    : (analytics?.contentIdeas ?? null);
  const bestTime   = analytics?.bestWindow         ?? null;
  const growthDelta = analytics?.growthDelta
    ? `▲ ${analytics.growthDelta} vs last week`
    : null;
  const healthDelta = analytics?.healthDelta
    ? `▲ ${analytics.healthDelta} vs last week`
    : null;

  const STATS = [
    {
      label: "7-day growth",
      value: growth,
      suffix: growth !== null ? "%" : "",
      delta: growthDelta,
      accent: true,
    },
    {
      label: "Health score",
      value: health,
      suffix: "",
      delta: healthDelta,
    },
    {
      label: "Content ideas",
      value: ideas,
      suffix: "",
      delta: null,
    },
    {
      label: "Best window",
      value: bestTime,
      // CHANGE: only show "PM" suffix if we have a real value
      suffix: bestTime !== null ? " PM" : "",
      delta: null,
    },
  ];

  // ── Workflow active state logic ────────────────────────────────────────────
  // CHANGE: active is computed, not hardcoded to always be Discover
  // Logic: if user has saved scripts → Studio is active
  //        if user has calendar entries → Launch is active
  //        otherwise Discover is active (default starting step)
  const activeStep = useMemo(() => {
    if (calendarCount > 0) return "launch";
    if (scriptCount > 0)   return "studio";
    return "discover";
  }, [scriptCount, calendarCount]);

  const WORKFLOW = [
    {
      id: "discover",
      stepNum: "01",
      step: "01 · Discover",
      // CHANGE: active based on computed activeStep
      active: activeStep === "discover",
      title: "What to make",
      desc: "Niche trends, viral angles, competitor moves — surfaced 48h before the algorithm.",
      // ORIGINAL chip logic preserved — dynamic live ideas count
      chips:
        liveIdeas.length > 0
          ? [
              <span
                key="hot"
                className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary"
              >
                Hot · {liveIdeas.length}
              </span>,
            ]
          : [],
      cta: "Browse brief",
      path: "/dashboard/discover",
    },
    {
      id: "studio",
      stepNum: "02",
      step: "02 · Studio",
      active: activeStep === "studio",
      title: "How to make it",
      desc: "Script builder, BGM matcher, hook variations — without losing your voice.",
      // CHANGE: chip is dynamic — shows real script count, hidden when 0
      chips:
        scriptCount > 0
          ? [
              <span
                key="c"
                className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600"
              >
                Drafting · {scriptCount}
              </span>,
            ]
          : [],
      cta: "Open studio",
      path: "/dashboard/studio",
    },
    {
      id: "launch",
      stepNum: "03",
      step: "03 · Launch",
      active: activeStep === "launch",
      title: "Drop it right",
      desc: "Optimal timing, posting package, and brand-deal alerts so hits don't slip.",
      // CHANGE: chip is dynamic — shows real calendar count, hidden when 0
      chips:
        calendarCount > 0
          ? [
              <span
                key="c"
                className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600"
              >
                Queued · {calendarCount}
              </span>,
            ]
          : [],
      cta: "Schedule",
      path: "/dashboard/launch",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* ── Greeting ── */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl text-foreground">
            {greet()}, <span className="text-primary">{displayName}.</span>
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-0.5">
            {today()}
          </p>
        </div>
        <button className="relative p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>
      </motion.div>

      {/* ── Stats strip — unchanged structure, StatCell handles null ── */}
      <motion.div
        variants={item}
        className="flex gap-3 overflow-x-auto pb-1 no-scrollbar"
      >
        {STATS.map((s) => (
          <StatCell key={s.label} {...s} />
        ))}
      </motion.div>

      {/* ── Workflow — unchanged structure, WORKFLOW array is now dynamic ── */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-base text-foreground">
            Your workflow today
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {WORKFLOW.map((w) => (
            <WorkflowCard
              key={w.id}
              {...w}
              onClick={() => navigate(w.path)}
            />
          ))}
        </div>
      </motion.div>

      {/* ── Trending for you — unchanged ── */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-base text-foreground">
            Trending for you
          </h2>
          <button
            onClick={() => navigate("/dashboard/discover")}
            className="font-body text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            View all <ArrowRight size={11} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {ideasLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-44 h-24 bg-muted rounded-2xl animate-pulse"
              />
            ))
          ) : liveIdeas.length > 0 ? (
            liveIdeas.map((idea, i) => (
              <TrendCard
                key={idea.id || i}
                title={idea.title}
                badge={idea.badge}
                growthSignal={idea.growthSignal}
                velocityScore={idea.velocityScore}
              />
            ))
          ) : (
            <p className="font-body text-sm text-muted-foreground py-4">
              No trending ideas right now — check back soon.
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
