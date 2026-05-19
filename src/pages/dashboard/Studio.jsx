// src/pages/dashboard/Studio.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sparkles, Clock, Maximize2, Minimize2, ArrowRight, Save,
  CheckCircle2, Zap, Timer, X, Loader2, RefreshCw, Copy, Check,
  Globe, FileText, ChevronDown, History, Clapperboard, AlertCircle,
  StickyNote, Link, Search, Youtube, Play,
} from "lucide-react";
import { useFirebaseAuth } from "@/lib/FirebaseAuthContext";
import {
  useSaveSession, useLearnFromEdit, useScriptHistory,
  useRewriteHook, useNotes, useRegenerateSection,
} from "@/hooks/useApi";
import useCreatorFlow from "@/store/creatorFlow";
import { auth } from "@/lib/firebase";

// ── SSE: Short-form ───────────────────────────────────────────────────────────
async function streamScript(body, onEvent) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${BASE}/api/v1/studio/script/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line || line.startsWith(": ping")) continue;
      if (line.startsWith("data: ")) {
        try { onEvent(JSON.parse(line.slice(6))); } catch {}
      }
    }
  }
}

// ── SSE: YouTube long-form ────────────────────────────────────────────────────
async function streamYouTubeScript(body, onEvent) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${BASE}/api/v1/studio/youtube/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.replace(/^data:\s*/, "").trim();
      if (!line || line === "[DONE]") continue;
      try { onEvent(JSON.parse(line)); } catch {}
    }
  }
}

// ── Animations ────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 22 } },
};

// ── Section color map ─────────────────────────────────────────────────────────
const SECTION_COLORS = {
  hook:       { dot: "bg-orange-500", text: "text-orange-500", bg: "bg-orange-500/8",  border: "border-orange-500/20" },
  body:       { dot: "bg-blue-500",   text: "text-blue-500",   bg: "bg-blue-500/8",    border: "border-blue-500/20" },
  cta:        { dot: "bg-emerald-500",text: "text-emerald-500",bg: "bg-emerald-500/8", border: "border-emerald-500/20" },
  detail:     { dot: "bg-violet-500", text: "text-violet-500", bg: "bg-violet-500/8",  border: "border-violet-500/20" },
  transition: { dot: "bg-amber-500",  text: "text-amber-500",  bg: "bg-amber-500/8",   border: "border-amber-500/20" },
  default:    { dot: "bg-primary",    text: "text-primary",    bg: "bg-primary/8",      border: "border-primary/20" },
};
const getSC = (type = "") => SECTION_COLORS[type] || SECTION_COLORS.default;

// ── Helpers ───────────────────────────────────────────────────────────────────
const calcDuration = (text = "") => {
  const w = text.trim().split(/\s+/).filter(Boolean).length;
  const s = Math.round((w / 130) * 60);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};

// ── Format options ────────────────────────────────────────────────────────────
const FORMATS = [
  { value: "reel",     label: "Reel",     emoji: "🎬" },
  { value: "post",     label: "Post",     emoji: "📝" },
  { value: "carousel", label: "Carousel", emoji: "🖼️" },
  { value: "video",    label: "Video",    emoji: "📹" },
  { value: "story",    label: "Story",    emoji: "⭕" },
  { value: "thread",   label: "Thread",   emoji: "🧵" },
];

const FORMAT_DURATION_CONFIG = {
  reel:     { min: 15,  max: 60,  step: 5,  unit: "seconds", label: "Duration",  default: 30 },
  story:    { min: 5,   max: 60,  step: 5,  unit: "seconds", label: "Duration",  default: 15 },
  post:     { min: 30,  max: 90,  step: 10, unit: "seconds", label: "Read time", default: 60 },
  carousel: { min: 1,   max: 10,  step: 1,  unit: "slides",  label: "Slides",    default: 5  },
  video:    { min: 1,   max: 180, step: 1,  unit: "minutes", label: "Duration",  default: 5  },
  thread:   { min: 1,   max: 10,  step: 1,  unit: "tweets",  label: "Tweets",    default: 5  },
};

const YOUTUBE_DURATIONS = ["5 min","10 min","15 min","20 min","30 min","45 min","60 min"];

function formatDurationDisplay(value, unit) {
  if (unit === "seconds") return value >= 60 ? `${Math.floor(value/60)}m ${value%60>0?(value%60)+"s":""}`.trim() : `${value}s`;
  if (unit === "minutes") return value >= 60 ? `${Math.floor(value/60)}h${value%60>0?` ${value%60}m`:""}` : `${value} min`;
  return `${value} ${unit}`;
}
function formatDurationForBackend(value, unit) {
  if (unit === "seconds") return `${value} seconds`;
  if (unit === "minutes") return `${value} minutes`;
  if (unit === "slides")  return `${value} slides`;
  if (unit === "tweets")  return `${value} tweets`;
  return `${value}`;
}

// ── Hook archetype colors ─────────────────────────────────────────────────────
const ARCHETYPE_COLORS = {
  CURIOSITY_GAP:      "bg-orange-500/10 border-orange-500/30 text-orange-600",
  PATTERN_INTERRUPT:  "bg-violet-500/10 border-violet-500/30 text-violet-600",
  PAIN_AMPLIFIER:     "bg-red-500/10 border-red-500/30 text-red-600",
  IDENTITY_HOOK:      "bg-blue-500/10 border-blue-500/30 text-blue-600",
  CONTRARIAN_CLAIM:   "bg-amber-500/10 border-amber-500/30 text-amber-600",
  BEFORE_AFTER:       "bg-teal-500/10 border-teal-500/30 text-teal-600",
  SOCIAL_PROOF_SHOCK: "bg-green-500/10 border-green-500/30 text-green-600",
};

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Phase bar ─────────────────────────────────────────────────────────────────
function PhaseBar({ phase, statusMsg, sectionsTotal, sectionsDone, isYouTube }) {
  const phases = isYouTube
    ? [
        { key: "researching", label: "Research",   icon: Globe },
        { key: "planning",    label: "Architecture",icon: FileText },
        { key: "scripting",   label: "Script",      icon: Play },
      ]
    : [
        { key: "researching", label: "Deep Research", icon: Globe },
        { key: "scripting",   label: "Script",         icon: FileText },
      ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {phases.map((p, i) => {
          const phaseOrder = phases.map((x) => x.key);
          const currentIdx = phaseOrder.indexOf(phase);
          const thisIdx    = phaseOrder.indexOf(p.key);
          const isDone  = currentIdx > thisIdx || phase === "done";
          const isActive = phase === p.key;
          const Icon = p.icon;
          return (
            <React.Fragment key={p.key}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all
                ${isDone ? "bg-emerald-500/10 text-emerald-600" : isActive ? "bg-primary/10 text-primary" : "bg-muted/40 text-muted-foreground"}`}>
                {isActive ? <Loader2 size={11} className="animate-spin" /> : isDone ? <Check size={11} /> : <Icon size={11} />}
                {p.label}
              </div>
              {i < phases.length - 1 && (
                <div className={`w-6 h-px ${isDone ? "bg-emerald-400/50" : "bg-border"}`} />
              )}
            </React.Fragment>
          );
        })}
        {(phase === "scripting" || phase === "planning") && sectionsTotal > 0 && (
          <span className="ml-auto font-body text-xs text-muted-foreground">
            {sectionsDone}/{sectionsTotal} {isYouTube ? "chapters" : "sections"}
          </span>
        )}
      </div>
      {statusMsg && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border">
          <Loader2 size={11} className="animate-spin text-primary shrink-0" />
          <p className="font-body text-xs text-muted-foreground">{statusMsg}</p>
        </div>
      )}
    </div>
  );
}

// ── Research brief card ───────────────────────────────────────────────────────
function ResearchBriefCard({ brief, visible }) {
  const [expanded, setExpanded] = useState(false);
  if (!brief || !visible) return null;
  const trendColor = {
    rising:    "text-emerald-500 bg-emerald-500/10",
    peaking:   "text-orange-500 bg-orange-500/10",
    declining: "text-red-500 bg-red-500/10",
    evergreen: "text-blue-500 bg-blue-500/10",
  }[brief.trendStrength] || "text-primary bg-primary/10";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-muted/20 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <Globe size={13} className="text-primary" />
          <span className="font-body text-xs font-semibold text-foreground">Research Brief</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${trendColor}`}>
            {brief.trendStrength}
          </span>
        </div>
        <ChevronDown size={12} className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-border">
            <div className="px-4 py-3 space-y-3">
              <p className="font-body text-xs text-foreground leading-relaxed">{brief.trendSummary}</p>
              {brief.topViralAngles?.length > 0 && (
                <div>
                  <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Viral Angles</p>
                  <div className="space-y-1">
                    {brief.topViralAngles.slice(0, 3).map((a, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="font-body text-[10px] font-bold text-primary shrink-0 mt-0.5">{i + 1}</span>
                        <p className="font-body text-xs text-foreground">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {brief.competitorGaps && (
                <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="font-body text-[10px] font-semibold text-primary mb-0.5">Opportunity Gap</p>
                  <p className="font-body text-xs text-foreground">{brief.competitorGaps}</p>
                </div>
              )}
              {brief.bestTiming && (
                <p className="font-body text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Best time:</span> {brief.bestTiming}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Hook Variant Picker (Phase 2) ─────────────────────────────────────────────
function HookVariantPicker({ variants, recommendation, onSelect, onSkip }) {
  if (!variants?.length) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/20 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-body text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            Pick your opening hook
          </h3>
          <p className="font-body text-xs text-muted-foreground mt-0.5">
            3 psychology-backed variants — ARIA recommends{" "}
            <span className="text-primary font-medium">
              {variants.find((v) => v.archetype === recommendation?.archetype)?.archetypeLabel}
            </span>
          </p>
        </div>
        <button onClick={onSkip} className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
          Auto-select
        </button>
      </div>
      <div className="space-y-3">
        {variants.map((variant) => (
          <button key={variant.archetype} onClick={() => onSelect(variant)}
            className={`w-full text-left p-4 rounded-xl border transition-all hover:border-primary/40 hover:bg-primary/5
              ${variant.archetype === recommendation?.archetype ? "border-primary/30 bg-primary/5" : "border-border"}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border font-body
                ${ARCHETYPE_COLORS[variant.archetype] || "bg-muted text-muted-foreground border-border"}`}>
                {variant.archetypeLabel}
              </span>
              {variant.archetype === recommendation?.archetype && (
                <span className="text-[10px] font-semibold text-primary font-body">★ ARIA Pick</span>
              )}
            </div>
            <p className="font-body text-sm font-medium text-foreground leading-snug mb-1.5">
              "{variant.hookLine}"
            </p>
            <p className="font-body text-xs text-muted-foreground leading-relaxed">{variant.visualCue}</p>
          </button>
        ))}
      </div>
      {recommendation?.reason && (
        <p className="font-body text-xs text-muted-foreground/70 italic border-t border-border pt-3">
          💡 {recommendation.reason}
        </p>
      )}
    </motion.div>
  );
}

// ── Chapter Plan Card (Phase 4 — YouTube) ─────────────────────────────────────
function ChapterPlanCard({ plan, visible }) {
  const [expanded, setExpanded] = useState(true);
  if (!plan || !visible) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-violet-500/20 bg-violet-500/5 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-violet-500/8 transition-colors">
        <div className="flex items-center gap-2">
          <Youtube size={13} className="text-violet-500" />
          <span className="font-body text-xs font-semibold text-foreground">Chapter Architecture</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600">
            {plan.chapters?.length} chapters
          </span>
        </div>
        <ChevronDown size={12} className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-violet-500/15">
            <div className="px-4 py-3 space-y-3">
              {plan.titleOptions?.length > 0 && (
                <div>
                  <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Title Options</p>
                  <div className="space-y-1">
                    {plan.titleOptions.map((t, i) => (
                      <div key={i} className={`px-3 py-2 rounded-lg font-body text-xs ${i === 0 ? "bg-violet-500/10 text-violet-700 font-medium" : "text-foreground bg-muted/30"}`}>
                        {i === 0 && <span className="text-[9px] font-bold text-violet-500 uppercase mr-2">ARIA Pick</span>}
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {plan.thumbnailConcept && (
                <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="font-body text-[10px] font-semibold text-primary mb-0.5">Thumbnail Concept</p>
                  <p className="font-body text-xs text-foreground">{plan.thumbnailConcept}</p>
                </div>
              )}
              <div>
                <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Chapters</p>
                <div className="space-y-1">
                  {plan.chapters?.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                      <span className="font-body text-[10px] text-muted-foreground w-5 shrink-0">{i + 1}</span>
                      <span className="font-body text-xs text-foreground flex-1 truncate">{c.label}</span>
                      <span className="font-body text-[10px] text-muted-foreground shrink-0">{c.durationMinutes}m</span>
                      {c.dropOffRisk === "high" && (
                        <span className="text-[9px] text-red-500 font-semibold shrink-0">⚠️ Re-hook</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Opening Unit Card (Phase 4 — YouTube) ─────────────────────────────────────
function OpeningUnitCard({ unit, visible }) {
  const [copied, setCopied] = useState(false);
  if (!unit || !visible) return null;
  const copy = () => {
    navigator.clipboard.writeText(unit.opening90s);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-orange-500" />
          <span className="font-body text-xs font-semibold text-foreground">Opening 90 Seconds</span>
          <span className="text-[10px] text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full font-semibold">Most Critical</span>
        </div>
        <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
        </button>
      </div>
      <div className="px-3 py-2.5 rounded-lg bg-card border border-border">
        <p className="font-body text-xs font-semibold text-foreground mb-1">"{unit.title}"</p>
        <p className="font-body text-xs text-muted-foreground leading-relaxed line-clamp-4">{unit.opening90s}</p>
      </div>
      {unit.openingTip && (
        <div className="flex items-start gap-2">
          <Zap size={11} className="text-primary mt-0.5 shrink-0" />
          <p className="font-body text-[11px] text-muted-foreground leading-snug">{unit.openingTip}</p>
        </div>
      )}
    </motion.div>
  );
}

// ── Section block ─────────────────────────────────────────────────────────────
function SectionBlock({ section, index, onChange, isActive, onFocus, sectionRef, onRegenerate, isRegenerating }) {
  const c = getSC(section.type);
  const dur = calcDuration(section.content);
  const isRehook = section.id?.startsWith("rehook_");

  return (
    <motion.div ref={sectionRef} variants={fadeUp} initial="hidden" animate="show"
      className={`rounded-xl border transition-all
        ${isRehook ? "border-amber-500/20 bg-amber-500/5" : isActive ? `${c.border} ${c.bg} shadow-sm` : "border-border hover:border-border/80"}`}>
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isRehook ? "bg-amber-500" : c.dot}`} />
          <span className={`font-body text-xs font-semibold uppercase tracking-wider ${isRehook ? "text-amber-500" : c.text}`}>
            {section.label}
          </span>
          {isRehook && (
            <span className="text-[9px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">Re-hook slot</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          {onRegenerate && !isRehook && (
            <button onClick={() => onRegenerate(section)} disabled={isRegenerating}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-body text-[10px] font-medium transition-all
                ${isRegenerating ? "opacity-50 cursor-not-allowed" : "hover:bg-muted hover:text-foreground"}`}>
              {isRegenerating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
              {isRegenerating ? "Working..." : "Regenerate"}
            </button>
          )}
          <span className="font-body text-[10px] flex items-center gap-1"><Timer size={10} />{dur}</span>
          <span className="font-body text-[10px]">{(section.content || "").trim().split(/\s+/).filter(Boolean).length}w</span>
        </div>
      </div>
      <div className="px-4 pb-3">
        <textarea value={section.content || ""} onChange={(e) => onChange(section.id, e.target.value)}
          onFocus={() => onFocus(section.id)} placeholder={section.placeholder}
          rows={4} className="w-full bg-transparent font-body text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none leading-relaxed"
          style={{ minHeight: 80 }} />
      </div>
      {section.tip && (
        <div className="px-4 pb-3 flex items-start gap-2 border-t border-border/50 pt-2">
          <Zap size={11} className="text-primary mt-0.5 shrink-0" />
          <p className="font-body text-[11px] text-muted-foreground leading-snug">{section.tip}</p>
        </div>
      )}
    </motion.div>
  );
}

// ── Chapter block (YouTube — richer than section block) ───────────────────────
function ChapterBlock({ chapter, index, onChange, isActive, onFocus, chapterRef }) {
  const [showNotes, setShowNotes] = useState(false);
  const hasProductionNotes = chapter.productionNotes?.length > 0;

  return (
    <motion.div ref={chapterRef} variants={fadeUp} initial="hidden" animate="show"
      className={`rounded-xl border transition-all ${isActive ? "border-violet-500/30 bg-violet-500/5 shadow-sm" : "border-border hover:border-border/80"}`}>
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-body text-[10px] font-bold text-violet-500 w-5">{index + 1}</span>
          <span className="font-body text-xs font-semibold text-foreground">{chapter.label}</span>
          {chapter.requiresReHook && (
            <span className="text-[9px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">Re-hook</span>
          )}
          {chapter.dropOffRisk === "high" && (
            <span className="text-[9px] font-semibold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">⚠️ Drop risk</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {hasProductionNotes && (
            <button onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg font-body text-[10px] hover:bg-muted hover:text-foreground transition-all">
              <FileText size={10} />
              Production notes
            </button>
          )}
          <span className="font-body text-[10px] flex items-center gap-1">
            <Timer size={10} />{calcDuration(chapter.script || "")}
          </span>
          <span className="font-body text-[10px]">
            {(chapter.script || "").trim().split(/\s+/).filter(Boolean).length}w
          </span>
        </div>
      </div>
      <div className="px-4 pb-3">
        <textarea value={chapter.script || ""} onChange={(e) => onChange(chapter.id, e.target.value)}
          onFocus={() => onFocus(chapter.id)} placeholder={`Write chapter: ${chapter.label}`}
          rows={5} className="w-full bg-transparent font-body text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none leading-relaxed"
          style={{ minHeight: 100 }} />
      </div>
      {chapter.tip && (
        <div className="px-4 pb-3 flex items-start gap-2 border-t border-border/50 pt-2">
          <Zap size={11} className="text-primary mt-0.5 shrink-0" />
          <p className="font-body text-[11px] text-muted-foreground leading-snug">{chapter.tip}</p>
        </div>
      )}
      <AnimatePresence>
        {showNotes && chapter.productionNotes?.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border/50">
            <div className="px-4 py-3 space-y-2">
              <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Production Notes</p>
              {chapter.productionNotes.map((note, i) => {
                const typeColors = {
                  talking_head: "text-blue-500 bg-blue-500/10",
                  broll:        "text-emerald-500 bg-emerald-500/10",
                  onscreen_text:"text-orange-500 bg-orange-500/10",
                  transition:   "text-amber-500 bg-amber-500/10",
                  music_note:   "text-violet-500 bg-violet-500/10",
                };
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="font-body text-[9px] text-muted-foreground w-16 shrink-0 pt-0.5">{note.timestamp}</span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 capitalize
                      ${typeColors[note.type] || "text-muted-foreground bg-muted"}`}>
                      {note.type?.replace("_", " ")}
                    </span>
                    <p className="font-body text-[11px] text-foreground leading-snug">{note.instruction}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Context panel ─────────────────────────────────────────────────────────────
function ContextPanel({ hookLine, hookTip, trendInsight, caption, hashtags, words, duration, platform, onClose, isYouTube, openingUnit, chapterPlan }) {
  const [copied, setCopied] = useState(null);
  const copy = (text, id) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000); };

  return (
    <div className="w-60 xl:w-64 shrink-0 border-l border-border bg-muted/20 flex flex-col">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Context</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[{ label: "Words", value: words }, { label: "Duration", value: duration }, { label: "Platform", value: platform }].map(({ label, value }) => (
            <div key={label} className="bg-muted/40 rounded-lg px-2.5 py-2">
              <p className="font-body text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="font-body text-xs font-semibold text-foreground mt-0.5">{value}</p>
            </div>
          ))}
        </div>
        {trendInsight && (
          <div className="bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5">
            <p className="font-body text-[10px] font-semibold text-primary mb-1">Trend Insight</p>
            <p className="font-body text-xs text-foreground leading-snug">{trendInsight}</p>
          </div>
        )}
        {isYouTube && openingUnit && (
          <div>
            <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Chosen Title</p>
            <p className="font-body text-xs font-medium text-foreground leading-snug bg-violet-500/8 border border-violet-500/20 px-3 py-2 rounded-lg">
              {openingUnit.title}
            </p>
          </div>
        )}
        {isYouTube && chapterPlan?.openingLoops?.length > 0 && (
          <div>
            <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Open Loops</p>
            <div className="space-y-1.5">
              {chapterPlan.openingLoops.map((loop) => (
                <div key={loop.id} className={`px-3 py-2 rounded-lg text-[11px] font-body leading-snug
                  ${loop.closedAt ? "bg-emerald-500/8 text-emerald-700 line-through opacity-60" : "bg-orange-500/8 text-orange-700"}`}>
                  {loop.question}
                </div>
              ))}
            </div>
          </div>
        )}
        {hookLine && !isYouTube && (
          <div>
            <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Hook Line</p>
            <div className="bg-orange-500/5 border border-orange-500/15 rounded-lg px-3 py-2.5">
              <p className="font-body text-xs font-medium text-foreground leading-snug">"{hookLine}"</p>
              {hookTip && <p className="font-body text-[10px] text-muted-foreground mt-1.5 leading-snug">{hookTip}</p>}
            </div>
          </div>
        )}
        {caption && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Caption</p>
              <button onClick={() => copy(caption, "cap")} className="text-muted-foreground hover:text-foreground transition-colors">
                {copied === "cap" ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              </button>
            </div>
            <p className="font-body text-xs text-foreground leading-relaxed whitespace-pre-line line-clamp-6">{caption}</p>
          </div>
        )}
        {hashtags?.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Hashtags</p>
              <button onClick={() => copy(hashtags.join(" "), "tags")} className="text-muted-foreground hover:text-foreground transition-colors">
                {copied === "tags" ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {hashtags.slice(0, 8).map((t, i) => (
                <span key={i} className="font-body text-[10px] text-primary bg-primary/8 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── History drawer ────────────────────────────────────────────────────────────
function HistoryDrawer({ history, onSelect, onClose }) {
  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28 }}
      className="absolute right-0 top-0 h-full w-72 bg-card border-l border-border z-20 flex flex-col shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="font-body text-sm font-semibold text-foreground">Script History</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!history.length ? (
          <p className="font-body text-xs text-muted-foreground text-center py-8">No saved scripts yet</p>
        ) : history.map((s) => (
          <button key={s.id} onClick={() => onSelect(s)}
            className="w-full text-left bg-muted/50 hover:bg-muted/80 rounded-xl px-3 py-2.5 transition-colors">
            <p className="font-body text-xs font-semibold text-foreground truncate">{s.idea || "Untitled"}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {s.format && (
                <span className="font-body text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full capitalize">{s.format}</span>
              )}
              <p className="font-body text-[10px] text-muted-foreground">
                {new Date(s.created_at || s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Notes Picker ──────────────────────────────────────────────────────────────
function NotesPicker({ isOpen, onClose, onSelect, notes, isLoading, searchQuery, setSearchQuery, attachedNotes }) {
  const pickerRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  const filtered = notes?.filter((n) => {
    const q = searchQuery.toLowerCase();
    return n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q) || n.tags?.some((t) => t.toLowerCase().includes(q));
  }) || [];
  const isAttached = (id) => attachedNotes.some((n) => n.id === id);
  if (!isOpen) return null;

  return (
    <motion.div ref={pickerRef} initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.98 }} transition={{ type: "spring", damping: 24, stiffness: 300 }}
      className="absolute left-0 right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
      style={{ maxHeight: 320 }}>
      <div className="px-3 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <StickyNote size={14} className="text-primary" />
          <span className="font-body text-xs font-semibold text-foreground">Connect Notes</span>
          <span className="ml-auto font-body text-[10px] text-muted-foreground">ESC to close</span>
        </div>
        <div className="mt-2 relative">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..." autoFocus
            className="w-full px-3 py-2 pl-8 rounded-lg bg-background border border-border font-body text-xs text-foreground
                       placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all" />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
        </div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={18} className="animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <StickyNote size={24} className="text-muted-foreground/40 mx-auto mb-2" />
            <p className="font-body text-xs text-muted-foreground">{searchQuery ? "No notes match your search" : "No notes found"}</p>
          </div>
        ) : (
          <div className="p-1.5 space-y-0.5">
            {filtered.map((note) => {
              const attached = isAttached(note.id);
              return (
                <button key={note.id} onClick={() => onSelect(note)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all group
                    ${attached ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/60 border border-transparent"}`}>
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 shrink-0 ${attached ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                      {attached ? <Check size={14} /> : <StickyNote size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-body text-xs font-medium truncate ${attached ? "text-primary" : "text-foreground"}`}>
                        {note.title || "Untitled Note"}
                      </p>
                      <p className="font-body text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{note.content?.slice(0, 80) || "No content"}</p>
                      {note.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {note.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="font-body text-[9px] text-primary/70 bg-primary/8 px-1.5 py-0.5 rounded">#{tag}</span>
                          ))}
                          {note.tags.length > 3 && <span className="font-body text-[9px] text-muted-foreground">+{note.tags.length - 3}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="px-3 py-2 border-t border-border bg-muted/20">
        <p className="font-body text-[10px] text-muted-foreground text-center">
          Click to {attachedNotes.length > 0 ? "add more" : "attach"} notes · Full content sent to AI
        </p>
      </div>
    </motion.div>
  );
}

// ── Regenerate Section Dialog ─────────────────────────────────────────────────
function RegenerateSectionDialog({ isOpen, onClose, section, onRegenerate, isRegenerating }) {
  const [instructions, setInstructions] = useState("");
  const textareaRef = useRef(null);
  useEffect(() => { if (isOpen) { setInstructions(""); setTimeout(() => textareaRef.current?.focus(), 100); } }, [isOpen]);
  const handleSubmit = (e) => { e.preventDefault(); if (!instructions.trim() || isRegenerating) return; onRegenerate(instructions.trim()); };
  if (!isOpen) return null;

  const typeIconColor = {
    hook: "bg-orange-500/15 text-orange-500", body: "bg-blue-500/15 text-blue-500",
    cta: "bg-emerald-500/15 text-emerald-500", detail: "bg-violet-500/15 text-violet-500",
    transition: "bg-amber-500/15 text-amber-500",
  }[section?.type] || "bg-primary/15 text-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeIconColor.split(" ")[0]}`}>
              <Sparkles size={16} className={typeIconColor.split(" ")[1]} />
            </div>
            <div>
              <h3 className="font-body text-sm font-semibold text-foreground">Regenerate: {section?.label}</h3>
              <p className="font-body text-xs text-muted-foreground">Tell the AI how to improve this section</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isRegenerating} className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {["Make it punchier","Add more emotion","Make it funnier","Add a stronger hook","Make it more relatable","Add Indian context"].map((s) => (
              <button key={s} type="button" onClick={() => setInstructions(s)} disabled={isRegenerating}
                className="px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted font-body text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                {s}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Instructions</label>
            <textarea ref={textareaRef} value={instructions} onChange={(e) => setInstructions(e.target.value)}
              placeholder={`e.g., "Make this more energetic and add a personal story..."`}
              rows={4} disabled={isRegenerating}
              className="w-full px-4 py-3 rounded-xl bg-muted/40 border border-border font-body text-sm text-foreground
                         placeholder:text-muted-foreground/50 resize-none outline-none focus:ring-2 focus:ring-primary/30
                         focus:border-primary/50 disabled:opacity-60 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Content</label>
            <div className="px-4 py-3 rounded-xl bg-muted/30 border border-border/50 max-h-32 overflow-y-auto">
              <p className="font-body text-xs text-muted-foreground leading-relaxed">{section?.content || "No content"}</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isRegenerating}
              className="flex-1 px-4 py-2.5 rounded-xl font-body text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={!instructions.trim() || isRegenerating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              {isRegenerating ? <><Loader2 size={14} className="animate-spin" /> Regenerating...</> : <><Sparkles size={14} /> Regenerate</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN STUDIO
// ══════════════════════════════════════════════════════════════════════════════
export default function Studio() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { dbUser } = useFirebaseAuth();

  // Creator flow
  const ideaFromFlow     = useCreatorFlow((s) => s.selectedIdea?.title || "");
  const setStudioSession = useCreatorFlow((s) => s.setStudioSession);
  const setIdeaText      = useCreatorFlow((s) => s.setIdeaText);
  const setLaunchCtx     = useCreatorFlow((s) => s.setLaunchContext);

  // ── Form state ────────────────────────────────────────────────────────────
  const [idea,         setIdea]         = useState(ideaFromFlow || "");
  const [format,       setFormat]       = useState("reel");
  const [mood,         setMood]         = useState("");
  const [angle,        setAngle]        = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [studioMode,   setStudioMode]   = useState("shortform"); // "shortform" | "youtube"

  // Duration
  const [durationValue,    setDurationValue]    = useState(FORMAT_DURATION_CONFIG["reel"].default);
  const [minDurationValue, setMinDurationValue] = useState(FORMAT_DURATION_CONFIG["reel"].min);
  const [durationError,    setDurationError]    = useState("");
  const [youtubeDuration,  setYoutubeDuration]  = useState("10 min");

  // Notes
  const [showNotesPicker,   setShowNotesPicker]   = useState(false);
  const [notesSearchQuery,  setNotesSearchQuery]  = useState("");
  const [attachedNotes,     setAttachedNotes]     = useState([]);
  const [slashTriggerPos,   setSlashTriggerPos]   = useState(null);
  const ideaTextareaRef = useRef(null);

  const { data: notesData, isLoading: notesLoading } = useNotes();
  const userNotes = notesData?.notes || [];

  // ── Pipeline state ────────────────────────────────────────────────────────
  const [isRunning,  setIsRunning]  = useState(false);
  const [phase,      setPhase]      = useState(null);
  const [statusMsg,  setStatusMsg]  = useState("");
  const [error,      setError]      = useState(null);

  // Research
  const [researchBrief, setResearchBrief] = useState(null);

  // Short-form script state
  const [sections,      setSections]      = useState([]);
  const [totalSections, setTotalSections] = useState(0);
  const [hookLine,      setHookLine]      = useState("");
  const [hookTip,       setHookTip]       = useState("");
  const [caption,       setCaption]       = useState("");
  const [hashtags,      setHashtags]      = useState([]);
  const [trendInsight,  setTrendInsight]  = useState("");
  const [totalDuration, setTotalDuration] = useState("");
  const [sessionId,     setSessionId]     = useState(null);

  // Phase 2 — Hook variants
  const [hookVariants,          setHookVariants]          = useState([]);
  const [selectedHookArchetype, setSelectedHookArchetype] = useState(null);
  const [hookRecommendation,    setHookRecommendation]    = useState(null);
  const [showHookPicker,        setShowHookPicker]        = useState(false);

  // Phase 4 — YouTube state
  const [youtubeChapters, setYoutubeChapters] = useState([]);
  const [chapterPlan,     setChapterPlan]     = useState(null);
  const [openingUnit,     setOpeningUnit]     = useState(null);

  // UI state
  const [activeSectionId,     setActiveSection]     = useState(null);
  const [showContext,          setShowContext]        = useState(true);
  const [focusMode,            setFocusMode]         = useState(false);
  const [saved,                setSaved]             = useState(false);
  const [saving,               setSaving]            = useState(false);
  const [showHistory,          setShowHistory]       = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [selectedSection,      setSelectedSection]   = useState(null);
  const [regeneratingSectionId,setRegeneratingSectionId] = useState(null);

  const sectionRefs = useRef({});
  const abortRef    = useRef(false);

  // API hooks
  const { mutateAsync: saveSession }       = useSaveSession();
  const { mutateAsync: learnFromEdit }     = useLearnFromEdit();
  const { data: historyData }              = useScriptHistory();
  const history                            = historyData?.data || [];
  const { mutateAsync: regenerateSection } = useRegenerateSection();

  // Computed
  const isYouTube = studioMode === "youtube";
  const hasResult = isYouTube ? youtubeChapters.length > 0 : sections.length > 0;
  const words = isYouTube
    ? youtubeChapters.reduce((a, c) => a + (c.script || "").trim().split(/\s+/).filter(Boolean).length, 0)
    : sections.reduce((a, s) => a + (s.content || "").trim().split(/\s+/).filter(Boolean).length, 0);
  const duration = isYouTube
    ? openingUnit ? youtubeDuration : ""
    : calcDuration(sections.map((s) => s.content || "").join(" "));

  // Sync idea
  useEffect(() => { setIdeaText(idea); }, [idea]);

  // Reset duration on format change
  useEffect(() => {
    const cfg = FORMAT_DURATION_CONFIG[format];
    if (cfg) { setDurationValue(cfg.default); setMinDurationValue(cfg.min); setDurationError(""); }
  }, [format]);

  // Calendar pre-fill
  useEffect(() => {
    const calendarEntry = location.state?.calendarEntry;
    if (calendarEntry && history.length > 0 && !sections.length) {
      const match = history.find((s) =>
        s.idea?.toLowerCase() === calendarEntry.title?.toLowerCase() ||
        s.idea?.toLowerCase().includes(calendarEntry.title?.toLowerCase())
      );
      if (match) {
        const script = match.edited_script || match.generated_script || {};
        if (script.sections?.length) {
          setSections(script.sections);
          setHookLine(script.hookLine || "");
          setHookTip(script.hookTip || "");
          setCaption(script.caption || "");
          setHashtags(script.hashtags || []);
          setTrendInsight(script.trendInsight || "");
          setResearchBrief(script.researchBrief || null);
          setFormat(match.format || "reel");
        }
        setIdea(match.idea || "");
        setSessionId(match.id);
        setSaved(true);
        setPhase("done");
        if (match.attachedNotes?.length) setAttachedNotes(match.attachedNotes);
      } else if (calendarEntry.title) {
        setIdea(calendarEntry.title);
      }
    }
  }, [location.state?.calendarEntry, history.length]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetState = () => {
    setResearchBrief(null);
    setSections([]); setTotalSections(0);
    setHookLine(""); setHookTip(""); setCaption(""); setHashtags([]);
    setTrendInsight(""); setTotalDuration(""); setSessionId(null);
    setSaved(false); setError(null); setPhase(null); setStatusMsg("");
    setAttachedNotes([]); setShowNotesPicker(false);
    setShowRegenerateDialog(false); setSelectedSection(null); setRegeneratingSectionId(null);
    setHookVariants([]); setSelectedHookArchetype(null); setHookRecommendation(null); setShowHookPicker(false);
    setYoutubeChapters([]); setChapterPlan(null); setOpeningUnit(null);
  };

  const handleSectionChange = useCallback((id, value) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content: value } : s)));
    setSaved(false);
  }, []);

  const handleChapterChange = useCallback((id, value) => {
    setYoutubeChapters((prev) => prev.map((c) => (c.id === id ? { ...c, script: value } : c)));
    setSaved(false);
  }, []);

  // ── Notes handlers ─────────────────────────────────────────────────────────
  const handleAttachNote = (note) => {
    const exists = attachedNotes.find((n) => n.id === note.id);
    if (exists) setAttachedNotes((p) => p.filter((n) => n.id !== note.id));
    else setAttachedNotes((p) => [...p, note]);
  };
  const handleRemoveNote = (id) => setAttachedNotes((p) => p.filter((n) => n.id !== id));

  const handleIdeaKeyDown = (e) => {
    if (e.key === "Escape" && showNotesPicker) { e.preventDefault(); setShowNotesPicker(false); setNotesSearchQuery(""); return; }
    if (e.key === "/" && !showNotesPicker) {
      const pos = e.target.selectionStart;
      const prev = idea.slice(0, pos).slice(-1);
      if (pos === 0 || prev === " " || prev === "\n") {
        e.preventDefault(); setShowNotesPicker(true); setNotesSearchQuery(""); setSlashTriggerPos(pos);
      }
    }
  };

  const handleDurationChange = (val) => {
    const cfg = FORMAT_DURATION_CONFIG[format];
    if (!cfg) return;
    setDurationValue(Math.min(Math.max(val, cfg.min), cfg.max));
    setDurationError(val > cfg.max ? `Max duration for a ${format} is ${formatDurationDisplay(cfg.max, cfg.unit)}` : "");
  };
  const handleMinDurationChange = (val) => {
    const cfg = FORMAT_DURATION_CONFIG[format];
    if (!cfg) return;
    const clamped = Math.min(Math.max(val, cfg.min), durationValue);
    setMinDurationValue(clamped);
    setDurationError(clamped > durationValue ? "Min duration cannot be greater than max duration" : "");
  };

  // ── Log hook choice ────────────────────────────────────────────────────────
  const logHookChoice = async (archetype) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/v1/studio/hook/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ archetype, niche: dbUser?.niches?.[0] || "general", platform: dbUser?.primary_platform || "instagram", wasAuto: false }),
      });
    } catch {}
  };

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!idea.trim() || isRunning) return;
    resetState();
    setIsRunning(true);
    abortRef.current = false;

    const notesCtx = attachedNotes.length > 0
      ? attachedNotes.map((n) => ({ id: n.id, title: n.title, content: n.content, tags: n.tags }))
      : undefined;

    try {
      if (isYouTube) {
        // ── YouTube long-form pipeline ─────────────────────────────────────
        await streamYouTubeScript(
          { idea: idea.trim(), niche: dbUser?.niches?.[0] || "general", duration: youtubeDuration, mood: mood || undefined, angle: angle || undefined, userQuery: idea },
          (event) => {
            if (abortRef.current) return;
            switch (event.type) {
              case "phase":         setPhase(event.phase); setStatusMsg(event.label); break;
              case "research_update": setStatusMsg(event.message); break;
              case "research_done": setResearchBrief(event.brief); setStatusMsg("Research complete. Building chapter architecture…"); break;
              case "chapter_plan":  setChapterPlan(event.plan); setPhase("planning"); setStatusMsg("Architecture ready. Writing chapters…"); break;
              case "opening_unit":  setOpeningUnit(event.unit); setHookLine(event.unit.opening90s?.slice(0, 80) + "…"); break;
              case "chapter":
                setYoutubeChapters((prev) => {
                  const exists = prev.find((c) => c.id === event.chapter.id);
                  return exists ? prev : [...prev, event.chapter];
                });
                setTotalSections(event.total);
                setPhase("scripting");
                break;
              case "done":          setPhase("done"); setStatusMsg("YouTube script ready!"); setIsRunning(false); break;
              case "error":         setError(event.message); setIsRunning(false); break;
            }
          },
        );
      } else {
        // ── Short-form pipeline ────────────────────────────────────────────
        const cfg = FORMAT_DURATION_CONFIG[format];
        await streamScript(
          {
            idea: idea.trim(),
            platform: dbUser?.primary_platform || "instagram",
            niche: dbUser?.niches?.[0] || "general",
            format, mood: mood || undefined, angle: angle || undefined, userQuery: idea,
            duration: cfg ? formatDurationForBackend(durationValue, cfg.unit) : undefined,
            minDuration: cfg ? formatDurationForBackend(minDurationValue, cfg.unit) : undefined,
            attachedNotes: notesCtx,
          },
          (event) => {
            if (abortRef.current) return;
            switch (event.type) {
              case "phase":         setPhase(event.phase); setStatusMsg(event.label); break;
              case "research_update": setStatusMsg(event.message); break;
              case "research_done": setResearchBrief(event.brief); setStatusMsg("Research complete. Writing your script…"); break;
              case "hook_variants": // Phase 2
                setHookVariants(event.variants);
                setHookRecommendation({ archetype: event.recommendedArchetype, reason: event.recommendationReason });
                setShowHookPicker(true);
                break;
              case "section":
                setTotalSections(event.total);
                setSections((prev) => {
                  const exists = prev.find((s) => s.id === event.section.id);
                  return exists ? prev : [...prev, event.section];
                });
                break;
              case "meta":
                setHookLine(event.hookLine); setHookTip(event.hookTip);
                setCaption(event.caption); setHashtags(event.hashtags);
                setTrendInsight(event.trendInsight); setTotalDuration(event.totalDuration);
                break;
              case "done":
                setPhase("done"); setStatusMsg("Script ready!"); setIsRunning(false);
                setStudioSession(null, event.result, event.result?.sections);
                autoSaveScript(event.result?.sections, event.result?.hookLine, event.result?.hookTip, event.result?.caption, event.result?.hashtags, event.result?.trendInsight);
                break;
              case "error": setError(event.message); setIsRunning(false); break;
            }
          },
        );
      }
    } catch (err) {
      if (!abortRef.current) setError(err.message || "Generation failed");
      setIsRunning(false);
    }
  };

  const handleStop = () => { abortRef.current = true; setIsRunning(false); setPhase(null); setStatusMsg("Stopped."); };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (saving || saved || !hasResult) return;
    setSaving(true);
    try {
      const scriptData = isYouTube
        ? { chapters: youtubeChapters, chapterPlan, openingUnit, caption, hashtags, trendInsight, researchBrief }
        : { sections, hookLine, hookTip, caption, hashtags, trendInsight, researchBrief };
      const data = await saveSession({
        idea, platform: dbUser?.primary_platform || "instagram",
        niche: dbUser?.niches?.[0] || "general",
        format: isYouTube ? "video" : format,
        generatedScript: scriptData, editedScript: scriptData,
        attachedNotes: attachedNotes.map((n) => ({ id: n.id, title: n.title, content: n.content, tags: n.tags })),
      });
      const sId = data?.data?.sessionId;
      setSessionId(sId);
      setStudioSession(sId, scriptData, isYouTube ? [] : sections);
      setSaved(true);
      learnFromEdit({ generatedSections: isYouTube ? [] : sections, editedSections: isYouTube ? [] : sections, intentLabel: "script_edit", sessionId: sId }).catch(() => {});
    } catch {}
    setSaving(false);
  };

  const autoSaveScript = useCallback(async (genSections, genHookLine, genHookTip, genCaption, genHashtags, genTrendInsight) => {
    try {
      const data = await saveSession({
        idea, platform: dbUser?.primary_platform || "instagram", niche: dbUser?.niches?.[0] || "general", format,
        generatedScript: { sections: genSections, hookLine: genHookLine, hookTip: genHookTip, caption: genCaption, hashtags: genHashtags, trendInsight: genTrendInsight, researchBrief },
        editedScript: { sections: genSections },
        attachedNotes: attachedNotes.map((n) => ({ id: n.id, title: n.title, content: n.content, tags: n.tags })),
      });
      const sId = data?.data?.sessionId;
      setSessionId(sId);
      setStudioSession(sId, { sections: genSections }, genSections);
      setSaved(true);
      learnFromEdit({ generatedSections: genSections, editedSections: genSections, intentLabel: "script_generated", sessionId: sId }).catch(() => {});
    } catch (err) { console.error("Auto-save failed:", err); }
  }, [saveSession, learnFromEdit, idea, dbUser, format, researchBrief, attachedNotes, setStudioSession]);

  // ── Go to Launch ───────────────────────────────────────────────────────────
  const handleGoToLaunch = () => {
    const fullScript = isYouTube
      ? youtubeChapters.map((c) => `[${c.label}]\n${c.script}`).join("\n\n")
      : sections.map((s) => `[${s.label}]\n${s.content}`).join("\n\n");
    setStudioSession(sessionId, { sections: isYouTube ? [] : sections, hookLine, hookTip, totalDuration }, isYouTube ? [] : sections);
    setIdeaText(idea);
    setLaunchCtx({ caption, hashtags, script: fullScript, hookLine, trendInsight, format: isYouTube ? "video" : format, platform: dbUser?.primary_platform || "instagram" }, null);
    navigate("/dashboard/launch");
  };

  // ── History select ─────────────────────────────────────────────────────────
  const handleSelectHistory = (session) => {
    const script = session.edited_script || session.generated_script || {};
    if (script.sections?.length) {
      setSections(script.sections); setHookLine(script.hookLine || ""); setHookTip(script.hookTip || "");
      setCaption(script.caption || ""); setHashtags(script.hashtags || []);
      setTrendInsight(script.trendInsight || ""); setResearchBrief(script.researchBrief || null);
      setFormat(session.format || "reel");
    }
    setIdea(session.idea || ""); setSessionId(session.id); setSaved(true);
    setShowHistory(false); setPhase("done");
    setAttachedNotes(session.attachedNotes?.length ? session.attachedNotes : []);
  };

  // ── Regenerate section ─────────────────────────────────────────────────────
  const handleOpenRegenerateDialog = (section) => { setSelectedSection(section); setShowRegenerateDialog(true); };
  const handleCloseRegenerateDialog = () => { setShowRegenerateDialog(false); setSelectedSection(null); };

  const handleRegenerateSection = async (instructions) => {
    if (!selectedSection || !instructions.trim()) return;
    setRegeneratingSectionId(selectedSection.id);
    setError(null);
    try {
      const result = await regenerateSection({
        sectionId: selectedSection.id, sectionLabel: selectedSection.label,
        sectionType: selectedSection.type, currentContent: selectedSection.content || "",
        userInstructions: instructions, idea, format, mood, angle, researchBrief,
        platform: dbUser?.primary_platform || "instagram", niche: dbUser?.niches?.[0] || "general",
        allSections: sections.map((s) => ({ id: s.id, label: s.label, type: s.type, content: s.content || "" })),
      });
      const data = result?.data ?? result;
      setSections((prev) => prev.map((s) => s.id === selectedSection.id ? { ...s, content: data.content || s.content, tip: data.tip || s.tip } : s));
      setSaved(false);
      handleCloseRegenerateDialog();
    } catch (err) {
      setError(err.message || "Failed to regenerate section. Please try again.");
    } finally {
      setRegeneratingSectionId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-background">

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 lg:px-5 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Clapperboard size={16} className="text-primary" />
          <h1 className="font-display text-base font-semibold text-foreground">Studio</h1>
          <span className="font-body text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
            {isYouTube ? "YouTube" : format}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasResult && (
            <>
              <button onClick={handleSave} disabled={saving || saved}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-xs font-semibold transition-all
                  ${saved ? "bg-emerald-500/15 text-emerald-600" : saving ? "opacity-60" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {saved ? <><CheckCircle2 size={12} /> Saved</> : saving ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : <><Save size={12} /> Save</>}
              </button>
              <button onClick={handleGoToLaunch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white font-body text-xs font-semibold hover:opacity-90 transition-opacity">
                Go to Launch <ArrowRight size={12} />
              </button>
            </>
          )}
          <button onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-xs font-medium transition-all
              ${showHistory ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}>
            <History size={12} /> History
          </button>
          {hasResult && (
            <button onClick={() => setFocusMode(!focusMode)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5">
              {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* ── Main body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 lg:px-6 py-5 space-y-5">

            {/* ── Input panel ──────────────────────────────────────────────── */}
            <AnimatePresence>
              {!focusMode && (
                <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl border border-border bg-card p-5 space-y-4">

                  {/* Idea */}
                  <div className="space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content Idea</label>
                      {attachedNotes.length > 0 && (
                        <span className="font-body text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {attachedNotes.length} note{attachedNotes.length > 1 ? "s" : ""} attached
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <textarea ref={ideaTextareaRef} value={idea} onChange={(e) => setIdea(e.target.value)}
                        onKeyDown={handleIdeaKeyDown}
                        placeholder="What's your content idea? Be specific — 'morning skincare for oily skin' not just 'skincare'"
                        rows={3} disabled={isRunning}
                        className="w-full px-4 py-3 rounded-xl bg-muted/40 border border-border font-body text-sm text-foreground
                                   placeholder:text-muted-foreground/50 resize-none outline-none focus:ring-2 focus:ring-primary/30
                                   focus:border-primary/50 disabled:opacity-60 transition-all" />
                      <AnimatePresence>
                        {showNotesPicker && (
                          <NotesPicker isOpen={showNotesPicker}
                            onClose={() => { setShowNotesPicker(false); setNotesSearchQuery(""); ideaTextareaRef.current?.focus(); }}
                            onSelect={handleAttachNote} notes={userNotes} isLoading={notesLoading}
                            searchQuery={notesSearchQuery} setSearchQuery={setNotesSearchQuery} attachedNotes={attachedNotes} />
                        )}
                      </AnimatePresence>
                    </div>
                    <AnimatePresence>
                      {attachedNotes.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="flex flex-wrap gap-1.5 pt-1">
                          {attachedNotes.map((note) => (
                            <motion.div key={note.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 group">
                              <StickyNote size={10} className="text-primary" />
                              <span className="font-body text-[11px] text-primary font-medium max-w-[120px] truncate">{note.title || "Untitled"}</span>
                              <button onClick={() => handleRemoveNote(note.id)} disabled={isRunning} className="text-primary/60 hover:text-primary transition-colors">
                                <X size={10} />
                              </button>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="flex items-center gap-1.5 text-muted-foreground/70">
                      <Link size={11} />
                      <p className="font-body text-[10px]">
                        Press <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">/</kbd> to connect notes
                      </p>
                    </div>
                  </div>

                  {/* Mode toggle */}
                  <div className="flex gap-2 p-1 bg-muted/40 rounded-xl">
                    {[
                      { value: "shortform", label: "📱 Short-Form", desc: "Reels · Shorts · TikTok" },
                      { value: "youtube",   label: "🎬 YouTube",    desc: "Long-form videos" },
                    ].map((m) => (
                      <button key={m.value} onClick={() => setStudioMode(m.value)} disabled={isRunning}
                        className={`flex-1 flex flex-col items-center py-2 px-3 rounded-lg transition-all font-body text-xs
                          ${studioMode === m.value ? "bg-card border border-border text-foreground font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                        <span className="text-sm">{m.label}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Short-form: format picker */}
                  {!isYouTube && (
                    <div className="space-y-1.5">
                      <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Format</label>
                      <div className="flex gap-2 flex-wrap">
                        {FORMATS.map((f) => (
                          <button key={f.value} onClick={() => setFormat(f.value)} disabled={isRunning}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-xs font-medium transition-all
                              ${format === f.value ? "bg-primary text-white" : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"} disabled:opacity-50`}>
                            <span>{f.emoji}</span> {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* YouTube: duration picker */}
                  {isYouTube && (
                    <div className="space-y-1.5">
                      <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Video Duration</label>
                      <div className="flex gap-2 flex-wrap">
                        {YOUTUBE_DURATIONS.map((d) => (
                          <button key={d} onClick={() => setYoutubeDuration(d)} disabled={isRunning}
                            className={`px-3 py-2 rounded-xl font-body text-xs font-medium transition-all
                              ${youtubeDuration === d ? "bg-primary text-white" : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"} disabled:opacity-50`}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Short-form: duration slider */}
                  {!isYouTube && (() => {
                    const cfg = FORMAT_DURATION_CONFIG[format];
                    if (!cfg) return null;
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cfg.label}</label>
                          <span className="font-body text-xs font-semibold text-foreground tabular-nums">{formatDurationDisplay(durationValue, cfg.unit)}</span>
                        </div>
                        <input type="range" min={cfg.min} max={cfg.max} step={cfg.step} value={durationValue}
                          disabled={isRunning} onChange={(e) => handleDurationChange(Number(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted accent-primary disabled:opacity-50" />
                        <div className="flex justify-between">
                          <span className="font-body text-[10px] text-muted-foreground">{formatDurationDisplay(cfg.min, cfg.unit)}</span>
                          <span className="font-body text-[10px] text-muted-foreground">{formatDurationDisplay(cfg.max, cfg.unit)}</span>
                        </div>
                        <div className="space-y-2 mt-4 pt-4 border-t border-border">
                          <div className="flex items-center justify-between">
                            <label className="font-body text-xs font-semibold text-foreground">Minimum {cfg.label.toLowerCase()}</label>
                            <span className="font-body text-xs font-semibold text-foreground tabular-nums">{formatDurationDisplay(minDurationValue, cfg.unit)}</span>
                          </div>
                          <input type="range" min={cfg.min} max={durationValue} step={cfg.step} value={minDurationValue}
                            disabled={isRunning} onChange={(e) => handleMinDurationChange(Number(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted accent-orange-500 disabled:opacity-50" />
                          <div className="flex justify-between">
                            <span className="font-body text-[10px] text-muted-foreground">{formatDurationDisplay(cfg.min, cfg.unit)}</span>
                            <span className="font-body text-[10px] text-muted-foreground">{formatDurationDisplay(durationValue, cfg.unit)}</span>
                          </div>
                        </div>
                        {durationError && (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                            <AlertCircle size={12} className="text-destructive shrink-0" />
                            <p className="font-body text-xs text-destructive">{durationError}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Advanced */}
                  <button onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1 font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown size={12} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                    Advanced options
                  </button>
                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="grid grid-cols-2 gap-3 overflow-hidden">
                        <div className="space-y-1">
                          <label className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Mood</label>
                          <input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="e.g. funny, emotional" disabled={isRunning}
                            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border font-body text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-60 transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Angle</label>
                          <input value={angle} onChange={(e) => setAngle(e.target.value)} placeholder="e.g. for beginners" disabled={isRunning}
                            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border font-body text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-60 transition-all" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Generate / Stop */}
                  <div className="flex gap-3">
                    <button onClick={isRunning ? handleStop : handleGenerate} disabled={!idea.trim() && !isRunning}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-body font-semibold text-sm transition-all disabled:opacity-40
                        ${isRunning ? "bg-red-500/10 text-red-500 hover:bg-red-500/15 border border-red-500/20" : "bg-primary text-white hover:bg-primary/90"}`}>
                      {isRunning ? <><X size={14} /> Stop</> : <><Sparkles size={14} /> {isYouTube ? "Generate YouTube Script" : "Generate Script"}</>}
                    </button>
                    {hasResult && !isRunning && (
                      <button onClick={resetState}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-body text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
                        <RefreshCw size={13} /> Clear
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Phase bar ───────────────────────────────────────────────── */}
            <AnimatePresence>
              {(isRunning || (phase && phase !== "done")) && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <PhaseBar phase={phase} statusMsg={statusMsg} sectionsTotal={totalSections}
                    sectionsDone={isYouTube ? youtubeChapters.length : sections.length} isYouTube={isYouTube} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Error ───────────────────────────────────────────────────── */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20">
                  <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="font-body text-sm text-red-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Research brief ───────────────────────────────────────────── */}
            <ResearchBriefCard brief={researchBrief} visible={!!researchBrief} />

            {/* ── Trend insight ────────────────────────────────────────────── */}
            <AnimatePresence>
              {trendInsight && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/8 border border-primary/15">
                  <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
                  <p className="font-body text-xs font-medium text-foreground">{trendInsight}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Phase 2: Hook Variant Picker ─────────────────────────────── */}
            {!isYouTube && showHookPicker && hookVariants.length > 0 && sections.length === 0 && (
              <HookVariantPicker
                variants={hookVariants}
                recommendation={hookRecommendation}
                onSelect={(variant) => {
                  setHookLine(variant.hookLine);
                  setHookTip(variant.hookTip);
                  setSelectedHookArchetype(variant.archetype);
                  setShowHookPicker(false);
                  logHookChoice(variant.archetype);
                }}
                onSkip={() => {
                  const recommended = hookVariants.find((v) => v.archetype === hookRecommendation?.archetype);
                  if (recommended) { setHookLine(recommended.hookLine); setSelectedHookArchetype(recommended.archetype); logHookChoice(recommended.archetype); }
                  setShowHookPicker(false);
                }}
              />
            )}

            {/* ── Phase 4: Chapter Plan + Opening Unit (YouTube) ───────────── */}
            {isYouTube && (
              <>
                <ChapterPlanCard plan={chapterPlan} visible={!!chapterPlan} />
                <OpeningUnitCard unit={openingUnit} visible={!!openingUnit} />
              </>
            )}

            {/* ── Short-form: Sections ─────────────────────────────────────── */}
            {!isYouTube && (
              <div className="space-y-3">
                {sections.map((section, idx) => (
                  <SectionBlock key={section.id} section={section} index={idx}
                    onChange={handleSectionChange} isActive={activeSectionId === section.id}
                    onFocus={setActiveSection} sectionRef={(el) => { sectionRefs.current[section.id] = el; }}
                    onRegenerate={hasResult && !isRunning ? handleOpenRegenerateDialog : null}
                    isRegenerating={regeneratingSectionId === section.id} />
                ))}
              </div>
            )}

            {/* ── YouTube: Chapters ────────────────────────────────────────── */}
            {isYouTube && (
              <div className="space-y-3">
                {youtubeChapters.map((chapter, idx) => (
                  <ChapterBlock key={chapter.id} chapter={chapter} index={idx}
                    onChange={handleChapterChange} isActive={activeSectionId === chapter.id}
                    onFocus={setActiveSection} chapterRef={(el) => { sectionRefs.current[chapter.id] = el; }} />
                ))}
              </div>
            )}

            {/* ── Bottom actions ───────────────────────────────────────────── */}
            <AnimatePresence>
              {hasResult && !isRunning && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 pt-2 pb-10">
                  <button onClick={handleSave} disabled={saving || saved}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-body font-semibold text-sm transition-all
                      ${saved ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                    {saved ? <><CheckCircle2 size={14} /> Saved</> : <><Save size={14} /> Save script</>}
                  </button>
                  <button onClick={handleGoToLaunch}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-body font-semibold text-sm hover:opacity-90 transition-opacity">
                    Go to Launch <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Regenerate button ────────────────────────────────────────── */}
            {hasResult && !isRunning && !isYouTube && (
              <div className="pb-4">
                <button onClick={handleGenerate}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border font-body text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                  <Sparkles size={13} /> Regenerate script
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Context panel ────────────────────────────────────────────────── */}
        {!focusMode && hasResult && showContext && (
          <div className="hidden lg:flex">
            <ContextPanel hookLine={hookLine} hookTip={hookTip} trendInsight={trendInsight}
              caption={caption} hashtags={hashtags} words={words} duration={duration}
              platform={dbUser?.primary_platform || "Instagram"} onClose={() => setShowContext(false)}
              isYouTube={isYouTube} openingUnit={openingUnit} chapterPlan={chapterPlan} />
          </div>
        )}

        {/* ── History drawer ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showHistory && <HistoryDrawer history={history} onSelect={handleSelectHistory} onClose={() => setShowHistory(false)} />}
        </AnimatePresence>

        {/* ── Regenerate section dialog ─────────────────────────────────────── */}
        <AnimatePresence>
          {showRegenerateDialog && (
            <RegenerateSectionDialog isOpen={showRegenerateDialog} onClose={handleCloseRegenerateDialog}
              section={selectedSection} onRegenerate={handleRegenerateSection} isRegenerating={!!regeneratingSectionId} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}