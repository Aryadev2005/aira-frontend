// src/pages/dashboard/DashboardHome.jsx
// ── v2 redesign: clean stats strip + workflow cards + trending row ────────────
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowRight, Sparkles } from "lucide-react";
import { useProfile, useAnalyticsDashboard, useViralIdeas } from "@/hooks/useApi";
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

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCell({ label, value, suffix, delta, accent = false }) {
  return (
    <div className="flex-1 min-w-0 bg-card border border-border rounded-2xl px-4 py-3.5">
      <p className="font-body text-xs text-muted-foreground mb-1">{label}</p>
      <p
        className={`font-heading text-2xl leading-none ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
        {suffix && (
          <span className="font-body text-sm ml-0.5 text-muted-foreground">
            {suffix}
          </span>
        )}
      </p>
      {delta && (
        <p className="font-body text-[11px] text-muted-foreground mt-1">
          {delta}
        </p>
      )}
    </div>
  );
}

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
      {/* Step label */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? "bg-primary" : "bg-muted-foreground/40"}`}
        />
        <span className="font-body text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {step}
        </span>
      </div>

      {/* Title */}
      <p className="font-heading text-lg text-foreground mb-1.5">{title}</p>

      {/* Description */}
      <p className="font-body text-sm text-muted-foreground leading-relaxed mb-3">
        {desc}
      </p>

      {/* Chips */}
      <div className="flex gap-2 mb-4">{chips}</div>

      {/* CTA */}
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

  const analytics = analyticsData?.data;
  const growth = analytics?.growthRate ?? "+18.2";
  const health = analytics?.currentHealthScore ?? 84;
  const ideas = liveIdeas.length > 0 ? liveIdeas.length : (analytics?.contentIdeas ?? 27);
  const bestTime = analytics?.bestWindow ?? "8:42";
  const growthDelta = analytics?.growthDelta ? `▲ ${analytics.growthDelta} vs last week` : null;
  const healthDelta = analytics?.healthDelta ? `▲ ${analytics.healthDelta} vs last week` : null;

  const STATS = [
    {
      label: "7-day growth",
      value: growth,
      suffix: "%",
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
      suffix: " PM",
      delta: null,
    },
  ];

  const WORKFLOW = [
    {
      id: "discover",
      stepNum: "01",
      step: "01 · Discover",
      active: true,
      title: "What to make",
      desc: "Niche trends, viral angles, competitor moves — surfaced 48h before the algorithm.",
      chips: liveIdeas.length > 0
        ? [<span key="hot" className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">Hot · {liveIdeas.length}</span>]
        : [],
      cta: "Browse brief",
      path: "/dashboard/discover",
    },
    {
      id: "studio",
      stepNum: "02",
      step: "02 · Studio",
      active: false,
      title: "How to make it",
      desc: "Script builder, BGM matcher, hook variations — without losing your voice.",
      chips: [
        <span
          key="c"
          className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600"
        >
          Drafting · 2
        </span>,
      ],
      cta: "Open studio",
      path: "/dashboard/studio",
    },
    {
      id: "launch",
      stepNum: "03",
      step: "03 · Launch",
      active: false,
      title: "Drop it right",
      desc: "Optimal timing, posting package, and brand-deal alerts so hits don't slip.",
      chips: [
        <span
          key="c"
          className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600"
        >
          Queued · 1
        </span>,
      ],
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

      {/* ── Stats strip ── */}
      <motion.div
        variants={item}
        className="flex gap-3 overflow-x-auto pb-1 no-scrollbar"
      >
        {STATS.map((s) => (
          <StatCell key={s.label} {...s} />
        ))}
      </motion.div>

      {/* ── Workflow ── */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-base text-foreground">
            Your workflow today
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {WORKFLOW.map((w) => (
            <WorkflowCard key={w.id} {...w} onClick={() => navigate(w.path)} />
          ))}
        </div>
      </motion.div>

      {/* ── Trending for you ── */}
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
          {ideasLoading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="w-44 h-28 bg-muted rounded-2xl animate-pulse flex-shrink-0" />
              ))
            : liveIdeas.length === 0
            ? (
                <div
                  onClick={() => navigate("/dashboard/settings")}
                  className="flex-shrink-0 w-64 bg-card border border-border rounded-2xl p-4 flex items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <p className="font-body text-sm text-muted-foreground text-center">
                    Connect Instagram to see personalized trends →
                  </p>
                </div>
              )
            : liveIdeas.map((idea, i) => (
                <TrendCard key={idea.title + i} {...idea} />
              ))}
        </div>
      </motion.div>

      {/* ── ARIA tip ── */}
      <motion.div
        variants={item}
        className="flex items-start gap-3 bg-primary/6 border border-primary/15 rounded-2xl px-4 py-3.5"
      >
        <span className="text-primary mt-0.5 flex-shrink-0">
          <Sparkles size={14} />
        </span>
        <p className="font-body text-sm text-foreground/80 leading-relaxed">
          <span className="font-semibold text-primary">ARIA tip:</span> Add a
          pattern-interrupt in your next hook — try starting with a number or a
          counter-intuitive statement to spike 3-second retention.
        </p>
      </motion.div>
    </motion.div>
  );
}
