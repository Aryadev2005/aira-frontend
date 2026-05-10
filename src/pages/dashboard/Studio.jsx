// src/pages/dashboard/Studio.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Clock,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Maximize2,
  Minimize2,
  ArrowRight,
  Save,
  CheckCircle2,
  Zap,
  Timer,
} from "lucide-react";
import { useFirebaseAuth } from "@/lib/FirebaseAuthContext";
import {
  useScriptStructure,
  useSaveSession,
  useLearnFromEdit,
  useScriptHistory,
} from "@/hooks/useApi";
import useCreatorFlow from "@/store/creatorFlow";

// ── Animations ────────────────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 26 } },
};

// ── Section colour map ────────────────────────────────────────────────────────
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
  default: {
    dot: "bg-primary",
    text: "text-primary",
    bg: "bg-primary/8",
    border: "border-primary/20",
  },
};

const getSectionColors = (label = "") => {
  const l = label.toLowerCase();
  if (l.includes("hook") || l.includes("open")) return SECTION_COLORS.hook;
  if (l.includes("cta") || l.includes("call") || l.includes("close"))
    return SECTION_COLORS.cta;
  if (l.includes("body") || l.includes("value") || l.includes("core"))
    return SECTION_COLORS.body;
  return SECTION_COLORS.default;
};

// ── Speaking pace calculator (130 words/min avg) ──────────────────────────────
const calcDuration = (text = "") => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const secs = Math.round((words / 130) * 60);
  if (secs < 60) return `~${secs}s`;
  return `~${Math.floor(secs / 60)}m ${secs % 60}s`;
};

const totalWordCount = (sections = []) =>
  sections.reduce(
    (acc, s) =>
      acc + (s.content || "").trim().split(/\s+/).filter(Boolean).length,
    0,
  );

// ── Outline panel ─────────────────────────────────────────────────────────────
function OutlinePanel({
  sections,
  activeSectionId,
  onJump,
  onToggle,
  visible,
}) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-52 shrink-0 border-r border-border bg-muted/30 flex flex-col"
    >
      <div className="px-4 py-3 border-b border-border">
        <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Outline
        </p>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {sections.map((s, i) => {
          const colors = getSectionColors(s.label || s.type);
          const isActive = s.id === activeSectionId;
          return (
            <button
              key={s.id}
              onClick={() => onJump(s.id)}
              className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 transition-colors
                ${isActive ? "bg-primary/10" : "hover:bg-muted/60"}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
              <div className="min-w-0">
                <p
                  className={`font-body text-xs font-semibold truncate ${isActive ? colors.text : "text-foreground"}`}
                >
                  {s.label || s.type || `Section ${i + 1}`}
                </p>
                <p className="font-body text-[10px] text-muted-foreground">
                  {calcDuration(s.content)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={onToggle}
        className="flex items-center justify-center gap-1 py-2.5 border-t border-border
                   text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
      >
        <ChevronLeft size={13} /> Hide
      </button>
    </motion.div>
  );
}

// ── Section editor block ──────────────────────────────────────────────────────
function SectionBlock({
  section,
  index,
  onChange,
  isActive,
  onFocus,
  sectionRef,
}) {
  const colors = getSectionColors(section.label || section.type);
  const duration = calcDuration(section.content);

  return (
    <div
      ref={sectionRef}
      className={`rounded-2xl border transition-all duration-200 ${
        isActive
          ? `${colors.border} ${colors.bg} shadow-sm`
          : "border-border hover:border-border/80"
      }`}
    >
      {/* Section header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
          <span
            className={`font-body text-xs font-semibold uppercase tracking-wider ${colors.text}`}
          >
            {section.label || section.type || `Section ${index + 1}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-body text-[10px] text-muted-foreground flex items-center gap-1">
            <Timer size={10} /> {duration}
          </span>
          <span className="font-body text-[10px] text-muted-foreground">
            {(section.content || "").trim().split(/\s+/).filter(Boolean).length}
            w
          </span>
        </div>
      </div>

      {/* Textarea */}
      <div className="px-4 pb-4">
        <textarea
          value={section.content || ""}
          onChange={(e) => onChange(section.id, e.target.value)}
          onFocus={() => onFocus(section.id)}
          placeholder={
            section.placeholder ||
            `Write your ${section.label || "section"} here...`
          }
          rows={4}
          className="w-full bg-transparent font-body text-sm text-foreground
                     placeholder:text-muted-foreground/50 resize-none outline-none
                     leading-relaxed"
          style={{ minHeight: "80px" }}
        />
      </div>

      {/* Tip / guidance */}
      {section.tip && (
        <div className="px-4 pb-3 flex items-start gap-2">
          <Zap size={11} className="text-primary mt-0.5 shrink-0" />
          <p className="font-body text-[11px] text-muted-foreground leading-relaxed">
            {section.tip}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Right context panel ───────────────────────────────────────────────────────
function ContextPanel({
  visible,
  idea,
  hookLine,
  ariaTip,
  totalWords,
  totalDuration,
  onToggle,
}) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-64 shrink-0 border-l border-border bg-muted/20 flex flex-col"
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Context
        </p>
        <button
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Idea source */}
        {idea && (
          <div>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
              Idea
            </p>
            <p className="font-body text-xs text-foreground leading-relaxed">
              {idea}
            </p>
          </div>
        )}

        {/* Hook line */}
        {hookLine && (
          <div>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
              Hook Line
            </p>
            <p className="font-body text-xs text-primary font-medium leading-relaxed">
              "{hookLine}"
            </p>
          </div>
        )}

        {/* Script stats */}
        <div className="bg-background rounded-xl p-3 space-y-2 border border-border">
          <div className="flex justify-between">
            <span className="font-body text-[10px] text-muted-foreground">
              Words
            </span>
            <span className="font-body text-[10px] font-semibold text-foreground">
              {totalWords}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-[10px] text-muted-foreground">
              Duration
            </span>
            <span className="font-body text-[10px] font-semibold text-primary">
              {totalDuration}
            </span>
          </div>
        </div>

        {/* ARIA tip */}
        {ariaTip && (
          <div>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
              ARIA Tip
            </p>
            <div className="flex gap-2">
              <Sparkles size={11} className="text-primary mt-0.5 shrink-0" />
              <p className="font-body text-xs text-muted-foreground leading-relaxed">
                {ariaTip}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Studio ───────────────────────────────────────────────────────────────
export default function Studio() {
  const { dbUser } = useFirebaseAuth();
  const navigate = useNavigate();

  // ── Zustand flow state ──────────────────────────────────────────────────
  const ideaFromFlow = useCreatorFlow((s) => s.ideaText);
  const selectedIdea = useCreatorFlow((s) => s.selectedIdea);
  const setStudioSession = useCreatorFlow((s) => s.setStudioSession);

  // ── Local state ─────────────────────────────────────────────────────────
  const [idea, setIdea] = useState(ideaFromFlow || "");
  const [result, setResult] = useState(null);
  const [editedSections, setEditedSections] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [activeSectionId, setActiveSection] = useState(null);
  const [showOutline, setShowOutline] = useState(true);
  const [showContext, setShowContext] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const sectionRefs = useRef({});

  // ── API hooks ───────────────────────────────────────────────────────────
  const { mutateAsync: generateScript, isPending } = useScriptStructure();
  const { mutateAsync: saveSession } = useSaveSession();
  const { mutateAsync: learnFromEdit } = useLearnFromEdit();
  const { data: historyData } = useScriptHistory();
  const history = historyData?.data || [];

  // Pre-fill idea from Discovery flow
  useEffect(() => {
    if (ideaFromFlow && !idea) setIdea(ideaFromFlow);
  }, [ideaFromFlow]);

  // Computed values
  const words = totalWordCount(editedSections);
  const duration = calcDuration(editedSections.map((s) => s.content).join(" "));

  // Jump to section
  const jumpToSection = useCallback((id) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  // Generate
  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setError(null);
    setResult(null);
    setSaved(false);
    setSessionId(null);

    try {
      const res = await generateScript({
        idea,
        platform: dbUser?.primary_platform || "instagram",
        niche: dbUser?.niches?.[0] || "general",
        archetype: dbUser?.archetype || "CREATOR",
        followerRange: dbUser?.follower_range || "1K-10K",
      });

      const data = res.data;
      setResult(data);
      const cloned = JSON.parse(JSON.stringify(data.sections || []));
      setEditedSections(cloned);
      if (cloned.length > 0) setActiveSection(cloned[0].id);

      // Auto-save
      const saved = await saveSession({
        idea,
        platform: dbUser?.primary_platform || "instagram",
        niche: dbUser?.niches?.[0] || "general",
        generatedScript: data,
        editedScript: {},
      });
      const sid = saved?.data?.sessionId || null;
      setSessionId(sid);
      // Push to Zustand
      setStudioSession(sid, data, cloned);
    } catch (e) {
      console.error(e);
      setError("Could not generate script. Please try again.");
    }
  };

  // Edit handler
  const handleSectionChange = (sectionId, newContent) => {
    const updated = editedSections.map((s) =>
      s.id === sectionId ? { ...s, content: newContent } : s,
    );
    setEditedSections(updated);
    setSaved(false);
    // Keep Zustand in sync
    setStudioSession(sessionId, result, updated);
  };

  // Save final
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSession({
        idea,
        platform: dbUser?.primary_platform || "instagram",
        niche: dbUser?.niches?.[0] || "general",
        generatedScript: result,
        editedScript: { sections: editedSections },
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Go to Launch
  const handleGoToLaunch = () => {
    setStudioSession(sessionId, result, editedSections);
    navigate("/dashboard/launch");
  };

  // History select
  const handleHistorySelect = (script) => {
    const active = script.edited_script?.sections?.length
      ? script.edited_script
      : script.generated_script || null;
    setIdea(script.idea);
    setResult(active);
    setEditedSections(JSON.parse(JSON.stringify(active?.sections || [])));
    setSessionId(script.id);
    setShowHistory(false);
    setSaved(false);
    if (active?.sections?.[0]) setActiveSection(active.sections[0].id);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-screen bg-background">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-border bg-card/50 backdrop-blur shrink-0">
        <div>
          <h1 className="font-heading text-xl text-foreground">Studio</h1>
          {result && (
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              {words} words · {duration}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* History */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted
                       font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clock size={13} /> History
          </button>

          {/* Focus mode */}
          {result && (
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={focusMode ? "Exit focus mode" : "Focus mode"}
            >
              {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}

          {/* Save */}
          {result && (
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-xs
                font-semibold transition-all ${
                  saved
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
            >
              {saved ? (
                <>
                  <CheckCircle2 size={13} /> Saved
                </>
              ) : (
                <>
                  <Save size={13} /> Save
                </>
              )}
            </button>
          )}

          {/* Go to Launch */}
          {result && (
            <button
              onClick={handleGoToLaunch}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary
                         text-white font-body text-xs font-semibold hover:bg-primary/90
                         active:scale-[0.98] transition-all shadow-warm"
            >
              Go to Launch <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Three-panel layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left outline panel — hidden in focus mode */}
        <AnimatePresence>
          {!focusMode && result && showOutline && (
            <OutlinePanel
              sections={editedSections}
              activeSectionId={activeSectionId}
              onJump={jumpToSection}
              onToggle={() => setShowOutline(false)}
              visible
            />
          )}
        </AnimatePresence>

        {/* Collapsed outline toggle */}
        {!focusMode && result && !showOutline && (
          <button
            onClick={() => setShowOutline(true)}
            className="w-8 border-r border-border bg-muted/30 flex items-center justify-center
                       text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={13} />
          </button>
        )}

        {/* ── Centre editor ── */}
        <div className="flex-1 overflow-y-auto">
          <div
            className={`mx-auto py-6 px-4 ${focusMode ? "max-w-2xl" : "max-w-3xl"}`}
          >
            {/* Idea input */}
            {(!result || focusMode === false) && (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4 mb-6"
              >
                {/* Source chip — if arrived from Discovery */}
                {selectedIdea && (
                  <motion.div
                    variants={item}
                    className="flex items-center gap-2 px-3 py-2 bg-primary/8 border border-primary/15
                               rounded-xl text-xs font-body text-primary"
                  >
                    <Sparkles size={12} />
                    <span className="font-semibold">From Discovery:</span>
                    <span className="truncate text-muted-foreground">
                      {selectedIdea.whyNow?.slice(0, 60)}…
                    </span>
                  </motion.div>
                )}

                <motion.div variants={item} className="relative">
                  <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="What's your content idea? Paste a rough concept, a title, or just a vibe — ARIA writes the rest."
                    rows={3}
                    className="w-full bg-card border border-border rounded-2xl px-4 py-3.5
                               font-body text-sm text-foreground placeholder:text-muted-foreground/50
                               resize-none outline-none focus:border-primary/40 focus:ring-1
                               focus:ring-primary/20 transition-all leading-relaxed"
                  />
                </motion.div>

                {error && (
                  <p className="text-destructive font-body text-sm">{error}</p>
                )}

                <motion.div variants={item}>
                  <button
                    onClick={handleGenerate}
                    disabled={isPending || !idea.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white
                               rounded-xl font-body font-semibold text-sm hover:bg-primary/90
                               disabled:opacity-50 active:scale-[0.98] transition-all shadow-warm"
                  >
                    {isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ARIA is writing…
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} /> Generate Script
                      </>
                    )}
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* Generated hook line */}
            <AnimatePresence>
              {result?.hookLine && !isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 bg-primary/8 border border-primary/15 rounded-xl px-4 py-3"
                >
                  <p className="font-body text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">
                    Opening Hook
                  </p>
                  <p className="font-heading text-lg text-foreground">
                    "{result.hookLine}"
                  </p>
                  {result.hookTip && (
                    <p className="font-body text-xs text-muted-foreground mt-1.5">
                      {result.hookTip}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Section blocks */}
            <AnimatePresence>
              {result && !isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {editedSections.map((section, idx) => (
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

                  {/* Bottom actions */}
                  <div className="flex gap-3 pt-4 pb-8">
                    <button
                      onClick={handleSave}
                      disabled={saving || saved}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                        font-body font-semibold text-sm transition-all ${
                          saved
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                      {saved ? (
                        <>
                          <CheckCircle2 size={14} /> Saved
                        </>
                      ) : (
                        <>
                          <Save size={14} /> Save Script
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleGoToLaunch}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                                 bg-primary text-white font-body font-semibold text-sm
                                 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-warm"
                    >
                      Go to Launch <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right context panel */}
        <AnimatePresence>
          {!focusMode && result && showContext && (
            <ContextPanel
              visible
              idea={idea}
              hookLine={result?.hookLine}
              ariaTip={selectedIdea?.ariaTip || result?.ariaPostingTip}
              totalWords={words}
              totalDuration={duration}
              onToggle={() => setShowContext(false)}
            />
          )}
        </AnimatePresence>

        {/* Collapsed context toggle */}
        {!focusMode && result && !showContext && (
          <button
            onClick={() => setShowContext(true)}
            className="w-8 border-l border-border bg-muted/30 flex items-center justify-center
                       text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={13} />
          </button>
        )}
      </div>

      {/* ── History slide-over ── */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-card border-l border-border
                         flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="font-heading text-base text-foreground">
                  Script History
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {history.length === 0 ? (
                  <p className="text-muted-foreground font-body text-sm text-center pt-8">
                    No scripts yet. Generate your first one!
                  </p>
                ) : (
                  history.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleHistorySelect(s)}
                      className="w-full text-left bg-muted/50 hover:bg-muted rounded-xl p-3 transition-colors"
                    >
                      <p className="font-body text-sm font-semibold text-foreground truncate">
                        {s.idea}
                      </p>
                      <p className="font-body text-xs text-muted-foreground mt-0.5 capitalize">
                        {s.platform} · {s.niche}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
