// src/pages/dashboard/Studio.jsx
// ── Fully rewired: single section, two-pass research→script pipeline ──────────
// Phase 1: Deep research agent streams progress updates
// Phase 2: Script sections stream in one by one
// History stored. Go to Launch passes full context (script, caption, hashtags).
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Clock,
  Maximize2,
  Minimize2,
  ArrowRight,
  Save,
  CheckCircle2,
  Zap,
  Timer,
  X,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Globe,
  FileText,
  ChevronDown,
  History,
  Clapperboard,
  AlertCircle,
} from "lucide-react";
import { useFirebaseAuth } from "@/lib/FirebaseAuthContext";
import {
  useSaveSession,
  useLearnFromEdit,
  useScriptHistory,
  useRewriteHook,
} from "@/hooks/useApi";
import useCreatorFlow from "@/store/creatorFlow";
import { auth } from "@/lib/firebase";

// ── SSE streaming helper ──────────────────────────────────────────────────────
async function streamScript(body, onEvent) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  const res = await fetch(`${BASE}/api/v1/studio/script/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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
        try {
          onEvent(JSON.parse(line.slice(6)));
        } catch {}
      }
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
  hook: {
    dot: "bg-orange-500",
    text: "text-orange-500",
    bg: "bg-orange-500/8",
    border: "border-orange-500/20",
  },
  body: {
    dot: "bg-blue-500",
    text: "text-blue-500",
    bg: "bg-blue-500/8",
    border: "border-blue-500/20",
  },
  cta: {
    dot: "bg-emerald-500",
    text: "text-emerald-500",
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/20",
  },
  detail: {
    dot: "bg-violet-500",
    text: "text-violet-500",
    bg: "bg-violet-500/8",
    border: "border-violet-500/20",
  },
  transition: {
    dot: "bg-amber-500",
    text: "text-amber-500",
    bg: "bg-amber-500/8",
    border: "border-amber-500/20",
  },
  default: {
    dot: "bg-primary",
    text: "text-primary",
    bg: "bg-primary/8",
    border: "border-primary/20",
  },
};
const getSC = (type = "") => SECTION_COLORS[type] || SECTION_COLORS.default;

// ── Duration helper ───────────────────────────────────────────────────────────
const calcDuration = (text = "") => {
  const w = text.trim().split(/\s+/).filter(Boolean).length;
  const s = Math.round((w / 130) * 60);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};

// ── Format options ────────────────────────────────────────────────────────────
const FORMATS = [
  { value: "reel", label: "Reel", emoji: "🎬" },
  { value: "post", label: "Post", emoji: "📝" },
  { value: "carousel", label: "Carousel", emoji: "🖼️" },
  { value: "video", label: "Video", emoji: "📹" },
  { value: "story", label: "Story", emoji: "⭕" },
  { value: "thread", label: "Thread", emoji: "🧵" },
];

// ── Phase indicator ───────────────────────────────────────────────────────────
function PhaseBar({ phase, statusMsg, sectionsTotal, sectionsDone }) {
  const phases = [
    { key: "researching", label: "Deep Research", icon: Globe },
    { key: "scripting", label: "Script", icon: FileText },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {phases.map((p, i) => {
          const isDone =
            (phase === "scripting" && p.key === "researching") ||
            phase === "done";
          const isActive = phase === p.key;
          const Icon = p.icon;
          return (
            <React.Fragment key={p.key}>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all
                ${isDone ? "bg-emerald-500/10 text-emerald-600" : isActive ? "bg-primary/10 text-primary" : "bg-muted/40 text-muted-foreground"}`}
              >
                {isActive ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : isDone ? (
                  <Check size={11} />
                ) : (
                  <Icon size={11} />
                )}
                {p.label}
              </div>
              {i < phases.length - 1 && (
                <div
                  className={`w-6 h-px ${isDone || (phase === "scripting" && p.key === "researching") ? "bg-emerald-400/50" : "bg-border"}`}
                />
              )}
            </React.Fragment>
          );
        })}
        {phase === "scripting" && sectionsTotal > 0 && (
          <span className="ml-auto font-body text-xs text-muted-foreground">
            {sectionsDone}/{sectionsTotal} sections
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

  const trendColor =
    {
      rising: "text-emerald-500 bg-emerald-500/10",
      peaking: "text-orange-500 bg-orange-500/10",
      declining: "text-red-500 bg-red-500/10",
      evergreen: "text-blue-500 bg-blue-500/10",
    }[brief.trendStrength] || "text-primary bg-primary/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-muted/20 overflow-hidden"
    >
      {/* Summary row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Globe size={13} className="text-primary" />
          <span className="font-body text-xs font-semibold text-foreground">
            Research Brief
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${trendColor}`}
          >
            {brief.trendStrength}
          </span>
        </div>
        <ChevronDown
          size={12}
          className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-4 py-3 space-y-3">
              <p className="font-body text-xs text-foreground leading-relaxed">
                {brief.trendSummary}
              </p>

              {brief.topViralAngles?.length > 0 && (
                <div>
                  <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Viral Angles
                  </p>
                  <div className="space-y-1">
                    {brief.topViralAngles.slice(0, 3).map((a, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="font-body text-[10px] font-bold text-primary shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="font-body text-xs text-foreground">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {brief.competitorGaps && (
                <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="font-body text-[10px] font-semibold text-primary mb-0.5">
                    Opportunity Gap
                  </p>
                  <p className="font-body text-xs text-foreground">
                    {brief.competitorGaps}
                  </p>
                </div>
              )}

              {brief.bestTiming && (
                <p className="font-body text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Best time:
                  </span>{" "}
                  {brief.bestTiming}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Section block ─────────────────────────────────────────────────────────────
function SectionBlock({
  section,
  index,
  onChange,
  isActive,
  onFocus,
  sectionRef,
}) {
  const c = getSC(section.type);
  const dur = calcDuration(section.content);
  return (
    <motion.div
      ref={sectionRef}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className={`rounded-xl border transition-all ${isActive ? `${c.border} ${c.bg} shadow-sm` : "border-border hover:border-border/80"}`}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${c.dot}`} />
          <span
            className={`font-body text-xs font-semibold uppercase tracking-wider ${c.text}`}
          >
            {section.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="font-body text-[10px] flex items-center gap-1">
            <Timer size={10} />
            {dur}
          </span>
          <span className="font-body text-[10px]">
            {(section.content || "").trim().split(/\s+/).filter(Boolean).length}
            w
          </span>
        </div>
      </div>
      <div className="px-4 pb-3">
        <textarea
          value={section.content || ""}
          onChange={(e) => onChange(section.id, e.target.value)}
          onFocus={() => onFocus(section.id)}
          placeholder={section.placeholder}
          rows={4}
          className="w-full bg-transparent font-body text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none leading-relaxed"
          style={{ minHeight: 80 }}
        />
      </div>
      {section.tip && (
        <div className="px-4 pb-3 flex items-start gap-2 border-t border-border/50 pt-2">
          <Zap size={11} className="text-primary mt-0.5 shrink-0" />
          <p className="font-body text-[11px] text-muted-foreground leading-snug">
            {section.tip}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ── Context panel ─────────────────────────────────────────────────────────────
function ContextPanel({
  hookLine,
  hookTip,
  trendInsight,
  caption,
  hashtags,
  words,
  duration,
  platform,
  onClose,
}) {
  const [copied, setCopied] = useState(null);
  const copy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-60 xl:w-64 shrink-0 border-l border-border bg-muted/20 flex flex-col">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Context
        </p>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Words", value: words },
            { label: "Duration", value: duration },
            { label: "Platform", value: platform },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted/40 rounded-lg px-2.5 py-2">
              <p className="font-body text-[9px] text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <p className="font-body text-xs font-semibold text-foreground mt-0.5">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Trend insight */}
        {trendInsight && (
          <div className="bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5">
            <p className="font-body text-[10px] font-semibold text-primary mb-1">
              Trend Insight
            </p>
            <p className="font-body text-xs text-foreground leading-snug">
              {trendInsight}
            </p>
          </div>
        )}

        {/* Hook */}
        {hookLine && (
          <div>
            <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Hook Line
            </p>
            <div className="bg-orange-500/5 border border-orange-500/15 rounded-lg px-3 py-2.5">
              <p className="font-body text-xs font-medium text-foreground leading-snug">
                "{hookLine}"
              </p>
              {hookTip && (
                <p className="font-body text-[10px] text-muted-foreground mt-1.5 leading-snug">
                  {hookTip}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Caption */}
        {caption && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Caption
              </p>
              <button
                onClick={() => copy(caption, "cap")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied === "cap" ? (
                  <Check size={11} className="text-emerald-500" />
                ) : (
                  <Copy size={11} />
                )}
              </button>
            </div>
            <p className="font-body text-xs text-foreground leading-relaxed whitespace-pre-line line-clamp-6">
              {caption}
            </p>
          </div>
        )}

        {/* Hashtags */}
        {hashtags?.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Hashtags
              </p>
              <button
                onClick={() => copy(hashtags.join(" "), "tags")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied === "tags" ? (
                  <Check size={11} className="text-emerald-500" />
                ) : (
                  <Copy size={11} />
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {hashtags.slice(0, 8).map((t, i) => (
                <span
                  key={i}
                  className="font-body text-[10px] text-primary bg-primary/8 px-2 py-0.5 rounded-full"
                >
                  {t}
                </span>
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
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28 }}
      className="absolute right-0 top-0 h-full w-72 bg-card border-l border-border z-20 flex flex-col shadow-xl"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="font-body text-sm font-semibold text-foreground">
          Script History
        </p>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!history.length ? (
          <p className="font-body text-xs text-muted-foreground text-center py-8">
            No saved scripts yet
          </p>
        ) : (
          history.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="w-full text-left bg-muted/50 hover:bg-muted/80 rounded-xl px-3 py-2.5 transition-colors"
            >
              <p className="font-body text-xs font-semibold text-foreground truncate">
                {s.idea || "Untitled"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {s.format && (
                  <span className="font-body text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full capitalize">
                    {s.format}
                  </span>
                )}
                <p className="font-body text-[10px] text-muted-foreground">
                  {new Date(s.created_at || s.createdAt).toLocaleDateString(
                    "en-IN",
                    { day: "numeric", month: "short" },
                  )}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Studio
// ══════════════════════════════════════════════════════════════════════════════
export default function Studio() {
  const navigate = useNavigate();
  const { dbUser } = useFirebaseAuth();

  // Creator flow pre-fill
  const ideaFromFlow = useCreatorFlow((s) => s.selectedIdea?.title || "");
  const setStudioSession = useCreatorFlow((s) => s.setStudioSession);
  const setIdeaText = useCreatorFlow((s) => s.setIdeaText);
  const setLaunchCtx = useCreatorFlow((s) => s.setLaunchContext);

  // Form state
  const [idea, setIdea] = useState(ideaFromFlow || "");
  const [format, setFormat] = useState("reel");
  const [mood, setMood] = useState("");
  const [angle, setAngle] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Pipeline state
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState(null); // "researching" | "scripting" | "done"
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState(null);

  // Research state
  const [researchBrief, setResearchBrief] = useState(null);

  // Script state (streamed in)
  const [sections, setSections] = useState([]);
  const [totalSections, setTotalSections] = useState(0);
  const [hookLine, setHookLine] = useState("");
  const [hookTip, setHookTip] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [trendInsight, setTrendInsight] = useState("");
  const [totalDuration, setTotalDuration] = useState("");
  const [sessionId, setSessionId] = useState(null);

  // UI state
  const [activeSectionId, setActiveSection] = useState(null);
  const [showContext, setShowContext] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const sectionRefs = useRef({});
  const abortRef = useRef(false);

  // API hooks
  const { mutateAsync: saveSession } = useSaveSession();
  const { mutateAsync: learnFromEdit } = useLearnFromEdit();
  const { data: historyData } = useScriptHistory();
  const history = historyData?.data || [];

  const hasResult = sections.length > 0;
  const words = sections.reduce(
    (acc, s) =>
      acc + (s.content || "").trim().split(/\s+/).filter(Boolean).length,
    0,
  );
  const duration = calcDuration(sections.map((s) => s.content || "").join(" "));

  // Sync idea to zustand
  useEffect(() => {
    setIdeaText(idea);
  }, [idea]);

  const handleSectionChange = useCallback((id, value) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, content: value } : s)),
    );
    setSaved(false);
  }, []);

  const resetState = () => {
    setResearchBrief(null);
    setSections([]);
    setTotalSections(0);
    setHookLine("");
    setHookTip("");
    setCaption("");
    setHashtags([]);
    setTrendInsight("");
    setTotalDuration("");
    setSessionId(null);
    setSaved(false);
    setError(null);
    setPhase(null);
    setStatusMsg("");
  };

  const handleGenerate = async () => {
    if (!idea.trim() || isRunning) return;
    resetState();
    setIsRunning(true);
    abortRef.current = false;

    try {
      await streamScript(
        {
          idea: idea.trim(),
          platform: dbUser?.primary_platform || "instagram",
          niche: dbUser?.niches?.[0] || "general",
          format,
          mood: mood || undefined,
          angle: angle || undefined,
        },
        (event) => {
          if (abortRef.current) return;

          switch (event.type) {
            case "phase":
              setPhase(event.phase);
              setStatusMsg(event.label);
              break;

            case "research_update":
              setStatusMsg(event.message);
              break;

            case "research_done":
              setResearchBrief(event.brief);
              setStatusMsg("Research complete. Writing your script…");
              break;

            case "section":
              setTotalSections(event.total);
              setSections((prev) => {
                const exists = prev.find((s) => s.id === event.section.id);
                if (exists) return prev;
                return [...prev, event.section];
              });
              break;

            case "meta":
              setHookLine(event.hookLine);
              setHookTip(event.hookTip);
              setCaption(event.caption);
              setHashtags(event.hashtags);
              setTrendInsight(event.trendInsight);
              setTotalDuration(event.totalDuration);
              break;

            case "done":
              setPhase("done");
              setStatusMsg("Script ready!");
              setIsRunning(false);
              // Store in zustand for launch
              setStudioSession(null, event.result, event.result.sections);
              break;

            case "error":
              setError(event.message);
              setIsRunning(false);
              break;
          }
        },
      );
    } catch (err) {
      if (!abortRef.current) setError(err.message || "Generation failed");
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    abortRef.current = true;
    setIsRunning(false);
    setPhase(null);
    setStatusMsg("Stopped.");
  };

  const handleSave = async () => {
    if (saving || saved || !sections.length) return;
    setSaving(true);
    try {
      const data = await saveSession({
        idea,
        platform: dbUser?.primary_platform || "instagram",
        niche: dbUser?.niches?.[0] || "general",
        format,
        generatedScript: {
          sections,
          hookLine,
          hookTip,
          caption,
          hashtags,
          trendInsight,
          researchBrief,
        },
        editedScript: { sections },
      });
      const sId = data?.data?.sessionId;
      setSessionId(sId);
      setStudioSession(sId, { sections, hookLine, hookTip }, sections);
      setSaved(true);

      // Learn from any edits
      if (sections.length > 0) {
        learnFromEdit({
          generatedSections: sections,
          editedSections: sections,
          intentLabel: "script_edit",
          sessionId: sId,
        }).catch(() => {});
      }
    } catch {}
    setSaving(false);
  };

  // ── Go to Launch — passes full context ──────────────────────────────────────
  const handleGoToLaunch = () => {
    // Build a full script text from sections
    const fullScript = sections
      .map((s) => `[${s.label}]\n${s.content}`)
      .join("\n\n");

    // Store everything in zustand so Launch page can pre-fill
    setStudioSession(
      sessionId,
      { sections, hookLine, hookTip, totalDuration },
      sections,
    );
    setIdeaText(idea);

    // Navigate with state — Launch page reads from creatorFlow (zustand)
    // Also store the rich context that Launch needs for the posting package
    setLaunchCtx(
      {
        // Pre-built caption from research (Launch can use or override)
        caption,
        hashtags,
        script: fullScript,
        hookLine,
        trendInsight,
        format,
        platform: dbUser?.primary_platform || "instagram",
      },
      null, // slot is determined by Launch's own timing API
    );

    navigate("/dashboard/launch");
  };

  const handleSelectHistory = (session) => {
    const script = session.edited_script || session.generated_script || {};
    if (script.sections?.length) {
      setSections(script.sections);
      setHookLine(script.hookLine || "");
      setHookTip(script.hookTip || "");
      setCaption(script.caption || "");
      setHashtags(script.hashtags || []);
      setTrendInsight(script.trendInsight || "");
      setResearchBrief(script.researchBrief || null);
      setFormat(session.format || "reel");
    }
    setIdea(session.idea || "");
    setSessionId(session.id);
    setSaved(true);
    setShowHistory(false);
    setPhase("done");
  };

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 lg:px-5 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Clapperboard size={16} className="text-primary" />
          <h1 className="font-display text-base font-semibold text-foreground">
            Studio
          </h1>
          {format && (
            <span className="font-body text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
              {format}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasResult && (
            <>
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-xs font-semibold transition-all
                  ${saved ? "bg-emerald-500/15 text-emerald-600" : saving ? "opacity-60" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {saved ? (
                  <>
                    <CheckCircle2 size={12} /> Saved
                  </>
                ) : saving ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save size={12} /> Save
                  </>
                )}
              </button>
              <button
                onClick={handleGoToLaunch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white font-body text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Go to Launch <ArrowRight size={12} />
              </button>
            </>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-xs font-medium transition-all
              ${showHistory ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
          >
            <History size={12} />
            History
          </button>
          {hasResult && (
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
              title={focusMode ? "Exit focus" : "Focus mode"}
            >
              {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left: input + script */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 lg:px-6 py-5 space-y-5">
            {/* ── Input panel ─────────────────────────────────────────────── */}
            <AnimatePresence>
              {!focusMode && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl border border-border bg-card p-5 space-y-4"
                >
                  {/* Idea */}
                  <div className="space-y-1.5">
                    <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Content Idea
                    </label>
                    <textarea
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      placeholder="What's your content idea? Be specific — 'morning skincare for oily skin' not just 'skincare'"
                      rows={2}
                      disabled={isRunning}
                      className="w-full px-4 py-3 rounded-xl bg-muted/40 border border-border font-body text-sm
                                 text-foreground placeholder:text-muted-foreground/50 resize-none outline-none
                                 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-60 transition-all"
                    />
                  </div>

                  {/* Format picker */}
                  <div className="space-y-1.5">
                    <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Format
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {FORMATS.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => setFormat(f.value)}
                          disabled={isRunning}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-xs font-medium transition-all
                            ${
                              format === f.value
                                ? "bg-primary text-white"
                                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                            } disabled:opacity-50`}
                        >
                          <span>{f.emoji}</span> {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced toggles */}
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1 font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronDown
                      size={12}
                      className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                    />
                    Advanced options
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="grid grid-cols-2 gap-3 overflow-hidden"
                      >
                        <div className="space-y-1">
                          <label className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Mood
                          </label>
                          <input
                            value={mood}
                            onChange={(e) => setMood(e.target.value)}
                            placeholder="e.g. funny, emotional"
                            disabled={isRunning}
                            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border font-body text-xs
                                       text-foreground placeholder:text-muted-foreground/50 outline-none
                                       focus:ring-1 focus:ring-primary/30 disabled:opacity-60 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Angle
                          </label>
                          <input
                            value={angle}
                            onChange={(e) => setAngle(e.target.value)}
                            placeholder="e.g. for beginners"
                            disabled={isRunning}
                            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border font-body text-xs
                                       text-foreground placeholder:text-muted-foreground/50 outline-none
                                       focus:ring-1 focus:ring-primary/30 disabled:opacity-60 transition-all"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Generate / Stop */}
                  <div className="flex gap-3">
                    <button
                      onClick={isRunning ? handleStop : handleGenerate}
                      disabled={!idea.trim() && !isRunning}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-body font-semibold text-sm
                                  transition-all disabled:opacity-40
                                  ${
                                    isRunning
                                      ? "bg-red-500/10 text-red-500 hover:bg-red-500/15 border border-red-500/20"
                                      : "bg-primary text-white hover:bg-primary/90"
                                  }`}
                    >
                      {isRunning ? (
                        <>
                          <X size={14} /> Stop
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} /> Generate Script
                        </>
                      )}
                    </button>
                    {hasResult && !isRunning && (
                      <button
                        onClick={() => {
                          resetState();
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-body text-sm
                                   text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
                      >
                        <RefreshCw size={13} /> Clear
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Phase indicator (while running) ─────────────────────────── */}
            <AnimatePresence>
              {(isRunning || (phase && phase !== "done")) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <PhaseBar
                    phase={phase}
                    statusMsg={statusMsg}
                    sectionsTotal={totalSections}
                    sectionsDone={sections.length}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Error ───────────────────────────────────────────────────── */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20"
                >
                  <AlertCircle
                    size={14}
                    className="text-red-500 mt-0.5 shrink-0"
                  />
                  <p className="font-body text-sm text-red-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Research brief (collapsible) ─────────────────────────────── */}
            <ResearchBriefCard
              brief={researchBrief}
              visible={!!researchBrief}
            />

            {/* ── Trend insight banner ─────────────────────────────────────── */}
            <AnimatePresence>
              {trendInsight && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/8 border border-primary/15"
                >
                  <Sparkles
                    size={14}
                    className="text-primary shrink-0 mt-0.5"
                  />
                  <p className="font-body text-xs font-medium text-foreground">
                    {trendInsight}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Script sections ──────────────────────────────────────────── */}
            <div className="space-y-3">
              {sections.map((section, idx) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  index={idx}
                  onChange={handleSectionChange}
                  isActive={activeSectionId === section.id}
                  onFocus={setActiveSection}
                  sectionRef={(el) => {
                    sectionRefs.current[section.id] = el;
                  }}
                />
              ))}
            </div>

            {/* ── Bottom actions (after complete) ──────────────────────────── */}
            <AnimatePresence>
              {hasResult && !isRunning && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 pt-2 pb-10"
                >
                  <button
                    onClick={handleSave}
                    disabled={saving || saved}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-body font-semibold text-sm transition-all
                      ${saved ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    {saved ? (
                      <>
                        <CheckCircle2 size={14} /> Saved
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Save script
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleGoToLaunch}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white
                               font-body font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Go to Launch <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Regenerate */}
            {hasResult && !isRunning && (
              <div className="pb-4">
                <button
                  onClick={handleGenerate}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border
                             font-body text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Sparkles size={13} /> Regenerate script
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: context panel */}
        {!focusMode && hasResult && showContext && (
          <div className="hidden lg:flex">
            <ContextPanel
              hookLine={hookLine}
              hookTip={hookTip}
              trendInsight={trendInsight}
              caption={caption}
              hashtags={hashtags}
              words={words}
              duration={duration}
              platform={dbUser?.primary_platform || "Instagram"}
              onClose={() => setShowContext(false)}
            />
          </div>
        )}

        {/* History drawer */}
        <AnimatePresence>
          {showHistory && (
            <HistoryDrawer
              history={history}
              onSelect={handleSelectHistory}
              onClose={() => setShowHistory(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
