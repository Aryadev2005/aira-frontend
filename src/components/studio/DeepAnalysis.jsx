// src/components/studio/DeepAnalysis.jsx
// ── Deep Analysis section — streams from /studio/deep-analysis/stream ─────────
// Sits inside the existing Studio page as a collapsible section.
// Uses native EventSource-like fetch streaming (SSE) with live UI updates.
import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Telescope,
  Sparkles,
  Search,
  Globe,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Loader2,
  Zap,
  TrendingUp,
  Hash,
  FileText,
  Calendar,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { auth } from "@/lib/firebase";

// ── SSE streaming helper ──────────────────────────────────────────────────────
async function streamDeepAnalysis(
  { topic, platform, niche, contentType, angle },
  onEvent,
) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();

  const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${BASE}/api/v1/studio/deep-analysis/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ topic, platform, niche, contentType, angle }),
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

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
          const event = JSON.parse(line.slice(6));
          onEvent(event);
        } catch {
          // malformed chunk, skip
        }
      }
    }
  }
}

// ── Tiny copy hook ────────────────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(null);
  const copy = useCallback((text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);
  return { copied, copy };
}

// ── Status step indicator ─────────────────────────────────────────────────────
const STEPS = [
  { key: "research", label: "Web Research", icon: Globe },
  { key: "strategy", label: "Strategy", icon: TrendingUp },
  { key: "hooks", label: "Hooks & Captions", icon: Zap },
  { key: "contentPlan", label: "Content Plan", icon: Calendar },
];

function StepIndicator({ completedSteps }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {STEPS.map((step, i) => {
        const done = completedSteps.includes(step.key);
        const Icon = step.icon;
        return (
          <React.Fragment key={step.key}>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-body font-medium transition-all duration-500
                ${
                  done
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/40 text-muted-foreground"
                }`}
            >
              <Icon size={11} />
              <span>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-4 h-px transition-colors duration-500 ${done ? "bg-primary/40" : "bg-border"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Animated typing dots ──────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <span className="inline-flex gap-0.5 items-center ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
        />
      ))}
    </span>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function ResultSection({
  icon: Icon,
  title,
  color = "primary",
  children,
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", damping: 22 }}
      className="rounded-2xl border border-border bg-card p-5 space-y-3"
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center bg-${color}/10`}
        >
          <Icon size={14} className={`text-${color}`} />
        </div>
        <p className="font-body text-sm font-semibold text-foreground">
          {title}
        </p>
      </div>
      {children}
    </motion.div>
  );
}

// ── Hook card ─────────────────────────────────────────────────────────────────
function HookCard({ hook, index, copied, onCopy }) {
  const id = `hook-${index}`;
  return (
    <div className="group relative bg-muted/40 hover:bg-muted/60 rounded-xl px-4 py-3 transition-colors">
      <p className="font-body text-sm text-foreground leading-relaxed pr-8">
        {hook}
      </p>
      <button
        onClick={() => onCopy(hook, id)}
        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity
                   w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted"
      >
        {copied === id ? (
          <Check size={12} className="text-emerald-500" />
        ) : (
          <Copy size={12} className="text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

// ── Caption card ──────────────────────────────────────────────────────────────
function CaptionCard({ caption, index, copied, onCopy }) {
  const id = `cap-${index}`;
  return (
    <div className="group relative bg-muted/40 hover:bg-muted/60 rounded-xl px-4 py-3 transition-colors">
      <p className="font-body text-sm text-foreground leading-relaxed pr-8 whitespace-pre-line">
        {caption}
      </p>
      <button
        onClick={() => onCopy(caption, id)}
        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity
                   w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted"
      >
        {copied === id ? (
          <Check size={12} className="text-emerald-500" />
        ) : (
          <Copy size={12} className="text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

// ── Hashtag cloud ─────────────────────────────────────────────────────────────
function HashtagCloud({ hashtags, copied, onCopy }) {
  return (
    <div className="flex flex-wrap gap-2">
      {hashtags.map((tag, i) => (
        <button
          key={i}
          onClick={() => onCopy(tag, `ht-${i}`)}
          className="group flex items-center gap-1 px-3 py-1.5 rounded-full
                     bg-primary/8 hover:bg-primary/15 border border-primary/20
                     text-primary font-body text-xs font-medium transition-all"
        >
          {tag}
          {copied === `ht-${i}` ? (
            <Check size={10} />
          ) : (
            <Copy
              size={10}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ── Content plan table ────────────────────────────────────────────────────────
function ContentPlanTable({ plan }) {
  return (
    <div className="space-y-2">
      {plan.map((item, i) => (
        <div
          key={i}
          className="flex gap-3 items-start bg-muted/30 rounded-xl px-4 py-3"
        >
          <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="font-body text-xs font-bold text-primary">
              D{item.day}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-semibold text-foreground truncate">
              {item.title}
            </p>
            <p className="font-body text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {item.hook}
            </p>
            <span className="inline-block mt-1 text-[10px] font-body font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {item.format} · {item.angle}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Research text block ───────────────────────────────────────────────────────
function ResearchBlock({ content }) {
  const [expanded, setExpanded] = useState(false);
  const text =
    typeof content === "string" ? content : JSON.stringify(content, null, 2);
  const preview = text.slice(0, 400);
  const hasMore = text.length > 400;

  return (
    <div className="space-y-2">
      <p className="font-body text-sm text-foreground leading-relaxed whitespace-pre-line">
        {expanded ? text : preview}
        {!expanded && hasMore && "…"}
      </p>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-body text-primary hover:text-primary/80 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp size={12} /> Show less
            </>
          ) : (
            <>
              <ChevronDown size={12} /> Read full research
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main DeepAnalysis Component
// ══════════════════════════════════════════════════════════════════════════════
export default function DeepAnalysis({ userNiche, userPlatform }) {
  // Form state
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("reel");
  const [angle, setAngle] = useState("");

  // Stream state
  const [isRunning, setIsRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [completedSteps, setCompletedSteps] = useState([]);
  const [error, setError] = useState(null);

  // Result state
  const [research, setResearch] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [hooks, setHooks] = useState([]);
  const [captions, setCaptions] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [contentPlan, setContentPlan] = useState([]);
  const [summary, setSummary] = useState(null);

  const { copied, copy } = useCopy();
  const abortRef = useRef(false);

  const hasResults = research || strategy || hooks.length > 0;

  const reset = () => {
    setResearch(null);
    setStrategy(null);
    setHooks([]);
    setCaptions([]);
    setHashtags([]);
    setContentPlan([]);
    setSummary(null);
    setCompletedSteps([]);
    setError(null);
    setStatusMsg("");
  };

  const handleRun = async () => {
    if (!topic.trim() || isRunning) return;
    reset();
    setIsRunning(true);
    abortRef.current = false;

    try {
      await streamDeepAnalysis(
        {
          topic: topic.trim(),
          platform: userPlatform || "instagram",
          niche: userNiche || "general",
          contentType,
          angle: angle.trim() || undefined,
        },
        (event) => {
          if (abortRef.current) return;

          switch (event.type) {
            case "status":
              setStatusMsg(event.message);
              break;
            case "research":
              console.log("[DeepAnalysis] research event received:", {
                contentType: typeof event.content,
                isArray: Array.isArray(event.content),
                sample: Array.isArray(event.content)
                  ? event.content.slice(0, 2)
                  : String(event.content).slice(0, 300),
              });
              setResearch(event.content);
              setCompletedSteps((p) => [...new Set([...p, "research"])]);
              break;
            case "strategy":
              setStrategy(event.content);
              setCompletedSteps((p) => [...new Set([...p, "strategy"])]);
              break;
            case "hooks":
              setHooks(event.content);
              setCompletedSteps((p) => [...new Set([...p, "hooks"])]);
              break;
            case "captions":
              setCaptions(event.content);
              break;
            case "hashtags":
              setHashtags(event.content);
              break;
            case "contentPlan":
              setContentPlan(event.content);
              setCompletedSteps((p) => [...new Set([...p, "contentPlan"])]);
              break;
            case "done":
              setSummary(event.summary);
              setStatusMsg("Analysis complete!");
              setIsRunning(false);
              break;
            case "error":
              setError(event.message);
              setIsRunning(false);
              break;
          }
        },
      );
    } catch (err) {
      if (!abortRef.current) {
        setError(err.message || "Something went wrong");
      }
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    abortRef.current = true;
    setIsRunning(false);
    setStatusMsg("Stopped.");
  };

  const CONTENT_TYPES = [
    "reel",
    "post",
    "carousel",
    "video",
    "thread",
    "story",
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Telescope size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Deep Analysis
            </h2>
            <p className="font-body text-sm text-muted-foreground mt-0.5">
              AI agent researches your topic in real-time — web search +
              platform data — then builds your full content package.
            </p>
          </div>
        </div>

        {/* ── Input form ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          {/* Topic input */}
          <div className="space-y-1.5">
            <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Topic or Trend
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !isRunning && handleRun()
                }
                placeholder='e.g. "morning skincare routine for oily skin" or "gym motivation reels"'
                disabled={isRunning}
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-muted/40 border border-border
                         font-body text-sm text-foreground placeholder:text-muted-foreground/50
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                         disabled:opacity-60 transition-all"
              />
            </div>
          </div>

          {/* Content type + optional angle */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="space-y-1.5 flex-1 min-w-[140px]">
              <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Content Type
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                disabled={isRunning}
                className="w-full px-3 py-2.5 rounded-xl bg-muted/40 border border-border
                         font-body text-sm text-foreground focus:outline-none focus:ring-2
                         focus:ring-primary/30 disabled:opacity-60 transition-all appearance-none"
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 flex-[2] min-w-[200px]">
              <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Angle{" "}
                <span className="font-normal normal-case">(optional)</span>
              </label>
              <input
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                placeholder='e.g. "budget-friendly" or "for beginners"'
                disabled={isRunning}
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border
                         font-body text-sm text-foreground placeholder:text-muted-foreground/50
                         focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 transition-all"
              />
            </div>
          </div>

          {/* Run / Stop button */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={isRunning ? handleStop : handleRun}
              disabled={!topic.trim() && !isRunning}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-body font-semibold text-sm
                        transition-all disabled:opacity-40 disabled:cursor-not-allowed
                        ${
                          isRunning
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500/15 border border-red-500/20"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
            >
              {isRunning ? (
                <>
                  <X size={14} />
                  Stop
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Run Deep Analysis
                </>
              )}
            </button>

            {hasResults && !isRunning && (
              <button
                onClick={() => {
                  reset();
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm
                         text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
              >
                <RefreshCw size={13} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Live status bar ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {(isRunning || completedSteps.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {/* Step progress */}
              <StepIndicator completedSteps={completedSteps} />

              {/* Current status message */}
              {statusMsg && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/40 border border-border">
                  {isRunning && (
                    <Loader2
                      size={13}
                      className="animate-spin text-primary shrink-0"
                    />
                  )}
                  <p className="font-body text-xs text-muted-foreground">
                    {statusMsg}
                    {isRunning && <ThinkingDots />}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error ──────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20"
            >
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="font-body text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Summary banner ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-5 py-4 rounded-2xl bg-primary/8 border border-primary/20 flex items-start gap-3"
            >
              <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="font-body text-sm font-medium text-foreground leading-relaxed">
                {summary}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results grid ───────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Research findings */}
          <AnimatePresence>
            {research && (
              <ResultSection icon={Globe} title="Research Findings" delay={0}>
                <ResearchBlock content={research} />
              </ResultSection>
            )}
          </AnimatePresence>

          {/* Strategy */}
          <AnimatePresence>
            {strategy && (
              <ResultSection
                icon={TrendingUp}
                title="Content Strategy"
                delay={0.05}
              >
                <p className="font-body text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {strategy}
                </p>
              </ResultSection>
            )}
          </AnimatePresence>

          {/* Hooks */}
          <AnimatePresence>
            {hooks.length > 0 && (
              <ResultSection
                icon={Zap}
                title={`${hooks.length} Scroll-Stopping Hooks`}
                delay={0.1}
              >
                <div className="space-y-2">
                  {hooks.map((h, i) => (
                    <HookCard
                      key={i}
                      hook={h}
                      index={i}
                      copied={copied}
                      onCopy={copy}
                    />
                  ))}
                </div>
              </ResultSection>
            )}
          </AnimatePresence>

          {/* Captions */}
          <AnimatePresence>
            {captions.length > 0 && (
              <ResultSection
                icon={FileText}
                title={`${captions.length} Ready-to-Post Captions`}
                delay={0.15}
              >
                <div className="space-y-3">
                  {captions.map((c, i) => (
                    <div key={i}>
                      <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Variant {i + 1}
                      </p>
                      <CaptionCard
                        caption={c}
                        index={i}
                        copied={copied}
                        onCopy={copy}
                      />
                    </div>
                  ))}
                </div>
              </ResultSection>
            )}
          </AnimatePresence>

          {/* Hashtags */}
          <AnimatePresence>
            {hashtags.length > 0 && (
              <ResultSection icon={Hash} title="Hashtag Pack" delay={0.2}>
                <HashtagCloud
                  hashtags={hashtags}
                  copied={copied}
                  onCopy={copy}
                />
                <button
                  onClick={() => copy(hashtags.join(" "), "all-hashtags")}
                  className="flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === "all-hashtags" ? (
                    <>
                      <Check size={11} className="text-emerald-500" /> Copied
                      all!
                    </>
                  ) : (
                    <>
                      <Copy size={11} /> Copy all {hashtags.length} hashtags
                    </>
                  )}
                </button>
              </ResultSection>
            )}
          </AnimatePresence>

          {/* Content Plan */}
          <AnimatePresence>
            {contentPlan.length > 0 && (
              <ResultSection
                icon={Calendar}
                title="14-Day Content Plan"
                delay={0.25}
              >
                <ContentPlanTable plan={contentPlan} />
              </ResultSection>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
