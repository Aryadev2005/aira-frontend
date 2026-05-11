// src/pages/dashboard/Studio.jsx
// ── v3: / note picker added — all original logic preserved exactly ─────────────
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Plus,
  X,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Telescope,
  Clapperboard,
  StickyNote,
} from "lucide-react";
import { useFirebaseAuth } from "@/lib/FirebaseAuthContext";
import {
  useScriptStructure,
  useSaveSession,
  useLearnFromEdit,
  useScriptHistory,
  useCreateNote,
  useRewriteHook,
  useNotes,
} from "@/hooks/useApi";
import useCreatorFlow from "@/store/creatorFlow";
import DeepAnalysis from "@/components/studio/DeepAnalysis";
import { sortTags, STRUCTURAL_TAG_META } from "@/constants/noteTags";

// ── Animations ────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 24 } },
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
  if (
    l.includes("body") ||
    l.includes("value") ||
    l.includes("step") ||
    l.includes("story")
  )
    return SECTION_COLORS.body;
  return SECTION_COLORS.default;
};

// ── Duration helper (130 wpm) ─────────────────────────────────────────────────
const calcDuration = (text = "") => {
  const w = text.trim().split(/\s+/).filter(Boolean).length;
  const s = Math.round((w / 130) * 60);
  return s < 60 ? `~${s}s` : `~${Math.floor(s / 60)}m ${s % 60}s`;
};

const totalWordCount = (sections = []) =>
  sections.reduce(
    (acc, s) =>
      acc + (s.content || "").trim().split(/\s+/).filter(Boolean).length,
    0,
  );

// ── Outline panel (left) ──────────────────────────────────────────────────────
function OutlinePanel({ sections, activeSectionId, onJump, onAdd }) {
  return (
    <div className="w-48 xl:w-52 shrink-0 border-r border-border bg-muted/20 flex flex-col">
      <div className="px-3 py-3 border-b border-border">
        <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Outline
        </p>
      </div>
      <div className="flex-1 overflow-y-auto py-1.5">
        {sections.map((s) => {
          const c = getSectionColors(s.label || s.type);
          const isAct = s.id === activeSectionId;
          return (
            <button
              key={s.id}
              onClick={() => onJump(s.id)}
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 transition-colors
                ${isAct ? "bg-primary/10" : "hover:bg-muted/60"}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
              <div className="min-w-0">
                <p
                  className={`font-body text-xs font-semibold truncate ${isAct ? c.text : "text-foreground"}`}
                >
                  {s.label || s.type || "Section"}
                </p>
                <p className="font-body text-[10px] text-muted-foreground">
                  {calcDuration(s.content)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="border-t border-border p-2">
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl
                     font-body text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <Plus size={12} /> Add section
        </button>
      </div>
    </div>
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
  const c   = getSectionColors(section.label || section.type);
  const dur = calcDuration(section.content);

  return (
    <div
      ref={sectionRef}
      className={`rounded-2xl border transition-all duration-200
        ${isActive
          ? `${c.border} ${c.bg} shadow-sm`
          : "border-border hover:border-border/80"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${c.dot}`} />
          <span
            className={`font-body text-xs font-semibold uppercase tracking-wider ${c.text}`}
          >
            {section.label || section.type || `Section ${index + 1}`}
          </span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="font-body text-[10px] flex items-center gap-1">
            <Timer size={10} />
            {dur}
          </span>
          <span className="font-body text-[10px]">
            {(section.content || "").trim().split(/\s+/).filter(Boolean).length}w
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
            `Write your ${section.label || "section"} here…`
          }
          rows={4}
          className="w-full bg-transparent font-body text-sm text-foreground
                     placeholder:text-muted-foreground/40 resize-none outline-none leading-relaxed"
          style={{ minHeight: 80 }}
        />
      </div>
      {/* Tip */}
      {section.tip && (
        <div className="px-4 pb-3 flex items-start gap-2 border-t border-border/50 pt-2">
          <Zap size={11} className="text-primary mt-0.5 shrink-0" />
          <p className="font-body text-[11px] text-muted-foreground leading-snug">
            {section.tip}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Context panel (right) ─────────────────────────────────────────────────────
function ContextPanel({
  idea,
  hookLine,
  hookTip,
  words,
  duration,
  platform,
  onClose,
  hookVariants,
  showHookVariants,
  isRewriting,
  onTryAnotherHook,
  hookVariantCopied,
  onCopyVariant,
}) {
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
          <X size={13} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Idea */}
        <div>
          <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Idea
          </p>
          <p className="font-body text-xs text-foreground leading-relaxed">
            {idea || "—"}
          </p>
        </div>

        {/* Hook */}
        {hookLine && (
          <div>
            <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Hook line
            </p>
            <p className="font-heading text-sm text-primary leading-snug">
              "{hookLine}"
            </p>
            {hookTip && (
              <p className="font-body text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {hookTip}
              </p>
            )}
            <button
              onClick={onTryAnotherHook}
              disabled={isRewriting}
              className="mt-2 flex items-center gap-1.5 font-body text-[11px] text-primary/80
                         hover:text-primary transition-colors disabled:opacity-50"
            >
              {isRewriting ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <RefreshCw size={10} />
              )}
              Try another hook
            </button>

            {/* Hook variants */}
            {showHookVariants && hookVariants.length > 0 && (
              <div className="mt-2 space-y-2">
                {hookVariants.map((v, i) => (
                  <div
                    key={i}
                    className="bg-primary/6 border border-primary/15 rounded-xl p-2.5 relative group"
                  >
                    <p className="font-body text-xs text-foreground leading-snug pr-5">
                      "{v.text}"
                    </p>
                    {v.improvement && (
                      <p className="font-body text-[10px] text-muted-foreground mt-1">
                        {v.improvement}
                      </p>
                    )}
                    <button
                      onClick={() => onCopyVariant(v.text, i)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {hookVariantCopied === i ? (
                        <Check size={11} className="text-emerald-500" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showHookVariants && !isRewriting && hookVariants.length === 0 && (
              <p className="mt-2 font-body text-[11px] text-muted-foreground">
                No variants returned. Try again.
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        <div>
          <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Script stats
          </p>
          <div className="space-y-1.5">
            {[
              { l: "Words",    v: words,    acc: false },
              { l: "Duration", v: duration, acc: true  },
              { l: "Platform", v: platform, acc: false },
            ].map((row) => (
              <div key={row.l} className="flex items-center justify-between">
                <span className="font-body text-xs text-muted-foreground">
                  {row.l}
                </span>
                <span
                  className={`font-body text-xs font-semibold ${row.acc ? "text-primary" : "text-foreground"}`}
                >
                  {row.v}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ARIA tip */}
        <div className="flex items-start gap-2 bg-primary/6 border border-primary/15 rounded-xl p-2.5">
          <Sparkles size={11} className="text-primary mt-0.5 shrink-0" />
          <p className="font-body text-[11px] text-muted-foreground leading-snug">
            Add a pattern-interrupt in your hook — try a number or
            counter-intuitive statement to spike 3-second retention.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── History drawer ────────────────────────────────────────────────────────────
function HistoryDrawer({ history, onSelect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-0 right-0 h-full w-72 bg-card border-l border-border z-20 flex flex-col shadow-xl"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="font-heading text-sm text-foreground">History</p>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {history.length === 0 && (
          <p className="font-body text-xs text-muted-foreground text-center pt-8">
            No saved scripts yet.
          </p>
        )}
        {history.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="w-full text-left bg-muted/50 hover:bg-muted/80 rounded-xl px-3 py-2.5 transition-colors"
          >
            <p className="font-body text-xs font-semibold text-foreground truncate">
              {s.idea || "Untitled"}
            </p>
            <p className="font-body text-[10px] text-muted-foreground mt-0.5">
              {new Date(s.created_at || s.createdAt).toLocaleDateString(
                "en-IN",
                { day: "numeric", month: "short" },
              )}
            </p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Note Picker Dropdown — triggered by "/" in idea textarea ──────────────────
function NotePickerDropdown({ notes, query, onSelect, onClose }) {
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return notes
      .filter((n) => {
        if (!q) return true;
        return (
          (n.title || "").toLowerCase().includes(q) ||
          (n.content || "").toLowerCase().includes(q) ||
          (n.tags || []).some((t) => t.includes(q))
        );
      })
      .slice(0, 8);
  }, [notes, query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={  { opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.13 }}
      className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <StickyNote size={12} className="text-primary" />
          <span className="font-body text-xs font-semibold text-muted-foreground">
            Insert from Notes
            {query && <span className="text-foreground"> · "{query}"</span>}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={12} />
        </button>
      </div>

      {/* List */}
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-4 font-body text-sm text-muted-foreground text-center">
            No notes match{query ? ` "${query}"` : ""}
          </p>
        ) : (
          filtered.map((note) => {
            const displayTags = sortTags(note.tags ?? []).slice(0, 3);
            return (
              <button
                key={note.id}
                onClick={() => onSelect(note)}
                className="w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm text-foreground font-semibold truncate group-hover:text-primary transition-colors">
                      {note.title || "(untitled)"}
                    </p>
                    {note.content && (
                      <p className="font-body text-xs text-muted-foreground truncate mt-0.5">
                        {note.content.slice(0, 70)}…
                      </p>
                    )}
                  </div>
                  {displayTags.length > 0 && (
                    <div className="flex gap-1 flex-shrink-0 mt-0.5">
                      {displayTags.map((tag) => {
                        const meta = STRUCTURAL_TAG_META[tag];
                        return (
                          <span
                            key={tag}
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold
                              ${meta?.color ?? "bg-muted text-muted-foreground"}`}
                          >
                            {meta?.emoji ?? `#${tag}`}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="px-3 py-2 border-t border-border bg-muted/20">
        <p className="font-body text-[10px] text-muted-foreground">
          Type to filter · Click to insert · Esc to close
        </p>
      </div>
    </motion.div>
  );
}

// ── Main Studio ───────────────────────────────────────────────────────────────
export default function Studio() {
  const navigate = useNavigate();
  const { dbUser } = useFirebaseAuth();

  // Creator flow pre-fill — use separate selectors to avoid object-literal
  // returning a new ref on every render (causes getSnapshot infinite loop)
  const ideaFromFlow    = useCreatorFlow((s) => s.selectedIdea?.title || "");
  const setStudioSession = useCreatorFlow((s) => s.setStudioSession);

  // Local state — identical to original
  const [idea,             setIdea]           = useState(ideaFromFlow || "");
  const [result,           setResult]         = useState(null);
  const [editedSections,   setEditedSections] = useState([]);
  const [sessionId,        setSessionId]      = useState(null);
  const [activeSectionId,  setActiveSection]  = useState(null);
  const [showContext,      setShowContext]     = useState(true);
  const [focusMode,        setFocusMode]      = useState(false);
  const [saved,            setSaved]          = useState(false);
  const [saving,           setSaving]         = useState(false);
  const [error,            setError]          = useState(null);
  const [showHistory,      setShowHistory]    = useState(false);
  const [hookVariants,     setHookVariants]   = useState([]);
  const [showHookVariants, setShowHookVariants] = useState(false);
  const [hookVariantCopied, setHookVariantCopied] = useState(null);
  const [studioTab, setStudioTab] = useState("script"); // "script" | "deep"

  // Note picker — only new state vs original
  const [showNotePicker,  setShowNotePicker]  = useState(false);
  const [notePickerQuery, setNotePickerQuery] = useState("");

  const sectionRefs = useRef({});
  const ideaRef     = useRef(null);

  // API hooks — identical to original; useNotes added for picker only
  const { mutateAsync: generateScript, isPending } = useScriptStructure();
  const { mutateAsync: saveSession  }              = useSaveSession();
  const { mutateAsync: learnFromEdit }             = useLearnFromEdit();
  const { data: historyData }                      = useScriptHistory();
  const history                                    = historyData?.data || [];
  const { mutateAsync: createNote }                = useCreateNote();
  const { mutateAsync: rewriteHook, isPending: isRewriting } = useRewriteHook();

  // Notes for the "/" picker (staleTime 2 min from existing hook — no extra cost)
  const { data: notesData } = useNotes({});
  const allNotes = notesData?.notes ?? [];

  // Pre-fill from flow — identical to original
  useEffect(() => {
    if (ideaFromFlow && !idea) setIdea(ideaFromFlow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaFromFlow]);

  // Computed — identical to original
  const words    = totalWordCount(editedSections);
  const duration = calcDuration(editedSections.map((s) => s.content).join(" "));

  // Jump to section — identical to original
  const jumpToSection = useCallback((id) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  // ── Note picker logic (new, self-contained) ───────────────────────────────
  const handleIdeaChange = useCallback(
    (e) => {
      const val = e.target.value;
      setIdea(val);
      setSaved(false);

      const lastChar = val[val.length - 1];

      if (lastChar === "/") {
        setShowNotePicker(true);
        setNotePickerQuery("");
        return;
      }

      if (showNotePicker) {
        const slashIdx = val.lastIndexOf("/");
        if (slashIdx !== -1) {
          setNotePickerQuery(val.slice(slashIdx + 1));
        } else {
          // "/" was deleted — close picker
          setShowNotePicker(false);
        }
      }
    },
    [showNotePicker],
  );

  const handleIdeaKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape" && showNotePicker) {
        e.preventDefault();
        setShowNotePicker(false);
      }
    },
    [showNotePicker],
  );

  const handleNotePickerSelect = useCallback(
    (note) => {
      const slashIdx = idea.lastIndexOf("/");
      const before   = slashIdx !== -1 ? idea.slice(0, slashIdx) : idea;
      const insert   = note.title || note.content?.slice(0, 100) || "";
      setIdea((before + insert).trimStart());
      setShowNotePicker(false);
      setNotePickerQuery("");
      setTimeout(() => ideaRef.current?.focus(), 50);
    },
    [idea],
  );

  // ── Generate script — IDENTICAL to original ──────────────────────────────
  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setError(null);
    setResult(null);
    setSaved(false);
    setSessionId(null);
    try {
      const res = await generateScript({
        idea,
        platform:      dbUser?.primary_platform || "instagram",
        niche:         dbUser?.niches?.[0]       || "general",
        archetype:     dbUser?.archetype         || "CREATOR",
        followerRange: dbUser?.follower_range    || "1K-10K",
      });
      const data   = res.data;
      setResult(data);
      const cloned = JSON.parse(JSON.stringify(data.sections || []));
      setEditedSections(cloned);
      if (cloned.length > 0) setActiveSection(cloned[0].id);

      const savedRes = await saveSession({
        idea,
        platform:        dbUser?.primary_platform || "instagram",
        niche:           dbUser?.niches?.[0]       || "general",
        generatedScript: data,
        editedScript:    {},
      });
      const sid = savedRes?.data?.sessionId || null;
      setSessionId(sid);
      setStudioSession?.(sid, data, cloned);
      setShowHookVariants(false);
      setHookVariants([]);

      // Auto-save hook section to notes silently
      const hookSection = cloned.find((s) => {
        const l = (s.label || s.type || "").toLowerCase();
        return l.includes("hook") || l.includes("open");
      });
      if (hookSection?.content) {
        createNote({
          title:       idea.slice(0, 80),
          content:     hookSection.content,
          source:      "studio_hook",
          source_meta: { sessionId: sid },
          tags:        ["hook"],
        }).catch(() => {});
      }
    } catch (e) {
      console.error(e);
      setError("Could not generate script. Please try again.");
    }
  };

  // ── Section edit — IDENTICAL to original ─────────────────────────────────
  const handleSectionChange = (sectionId, newContent) => {
    setEditedSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, content: newContent } : s)),
    );
    setSaved(false);
  };

  // ── Save — IDENTICAL to original ─────────────────────────────────────────
  const handleSave = async () => {
    if (!sessionId || !result) return;
    setSaving(true);
    try {
      await saveSession({
        idea,
        platform:        dbUser?.primary_platform || "instagram",
        niche:           dbUser?.niches?.[0]       || "general",
        generatedScript: result,
        editedScript:    { sections: editedSections },
      });
      // Learn from edits only when content actually changed
      const changed = editedSections.filter((s) => {
        const orig = result.sections?.find((o) => o.id === s.id);
        return orig && orig.content !== s.content;
      });
      if (changed.length > 0) {
        await learnFromEdit({
          generatedSections: result.sections,
          editedSections,
          intentLabel: "tightened_language",
          sessionId,
        }).catch(() => {});
      }
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // ── Try another hook — IDENTICAL to original ─────────────────────────────
  const handleTryAnotherHook = async () => {
    if (!result?.hookLine || !idea) return;
    setShowHookVariants(true);
    setHookVariants([]);
    try {
      const res = await rewriteHook({
        hook: result.hookLine,
        platform: dbUser?.primary_platform || "instagram",
        niche: dbUser?.niches?.[0],
      });
      setHookVariants(res?.data?.rewrites ?? res?.rewrites ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  // ── Copy variant — IDENTICAL to original ─────────────────────────────────
  const handleCopyVariant = (text, idx) => {
    navigator.clipboard.writeText(text);
    setHookVariantCopied(idx);
    setTimeout(() => setHookVariantCopied(null), 1500);
  };

  // ── Load from history — IDENTICAL to original ────────────────────────────
  const handleSelectHistory = (script) => {
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

  // ── Render — IDENTICAL to original except idea textarea block ────────────
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 lg:px-5 py-2.5 border-b border-border bg-card/50 backdrop-blur shrink-0">
        <div>
          <h1 className="font-heading text-lg text-foreground">Studio</h1>
          {result && (
            <p className="font-body text-[11px] text-muted-foreground">
              {words} words · {duration}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted
                       font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clock size={12} /> History
          </button>
          {result && (
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {focusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}
          {result && (
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-xs font-semibold transition-all
                ${saved
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {saved ? (
                <><CheckCircle2 size={12} /> Saved</>
              ) : saving ? (
                <><div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Saving…</>
              ) : (
                <><Save size={12} /> Save</>
              )}
            </button>
          )}
          <button
            onClick={() => navigate("/dashboard/launch")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white font-body text-xs font-semibold
                       hover:opacity-90 transition-opacity"
          >
            Go to Launch <ArrowRight size={12} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 p-1 mx-4 lg:mx-5 mt-3 bg-muted/40 rounded-xl border border-border w-fit">
        <button
          onClick={() => setStudioTab("script")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm font-medium transition-all
      ${
        studioTab === "script"
          ? "bg-card text-foreground shadow-sm border border-border"
          : "text-muted-foreground hover:text-foreground"
      }`}
        >
          <Clapperboard size={14} />
          Script Builder
        </button>
        <button
          onClick={() => setStudioTab("deep")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm font-medium transition-all
      ${
        studioTab === "deep"
          ? "bg-card text-foreground shadow-sm border border-border"
          : "text-muted-foreground hover:text-foreground"
      }`}
        >
          <Telescope size={14} />
          Deep Analysis
          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
            NEW
          </span>
        </button>
      </div>

      {studioTab === "deep" ? (
        <div className="flex flex-1 overflow-hidden">
          <DeepAnalysis
            userNiche={dbUser?.niches?.[0]}
            userPlatform={dbUser?.primary_platform}
          />
        </div>
      ) : (
        /* ── Three-panel shell ── */
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left: Outline (hidden in focus mode, desktop only) */}
          {!focusMode && result && (
            <div className="hidden lg:flex">
              <OutlinePanel
                sections={editedSections}
                activeSectionId={activeSectionId}
                onJump={jumpToSection}
                onAdd={() => {}}
              />
            </div>
          )}

          {/* Centre: Editor */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 space-y-5">
              {/* Idea textarea */}
              <div>
                <textarea
                  className="w-full bg-muted/40 border border-border rounded-2xl px-4 py-3.5
                           font-body text-sm text-foreground placeholder:text-muted-foreground/50
                           resize-none outline-none focus:border-primary/40 transition-colors"
                  rows={2}
                  value={idea}
                  onChange={(e) => {
                    setIdea(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="What's your content idea? Paste a rough concept, title, or vibe…"
                />
              </div>
        {/* Centre: Editor */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 space-y-5">

            {/* ── Idea textarea — only change: wrapped in relative div + picker ── */}
            <div className="relative">
              <textarea
                ref={ideaRef}
                className="w-full bg-muted/40 border border-border rounded-2xl px-4 py-3.5
                           font-body text-sm text-foreground placeholder:text-muted-foreground/50
                           resize-none outline-none focus:border-primary/40 transition-colors"
                rows={2}
                value={idea}
                onChange={handleIdeaChange}
                onKeyDown={handleIdeaKeyDown}
                placeholder="What's your content idea? Type / to insert from Notes…"
              />
              <AnimatePresence>
                {showNotePicker && (
                  <NotePickerDropdown
                    notes={allNotes}
                    query={notePickerQuery}
                    onSelect={handleNotePickerSelect}
                    onClose={() => setShowNotePicker(false)}
                  />
                )}
              </AnimatePresence>
            </div>

              {/* Generate button (no result yet) */}
              {!result && !isPending && (
                <motion.div variants={fadeUp} initial="hidden" animate="show">
                  <button
                    onClick={handleGenerate}
                    disabled={!idea.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
                             bg-primary text-white font-body font-semibold text-sm
                             hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                
                  <Sparkles size={15} /> Generate Script
                </button>
                {error && (
                  <p className="font-body text-xs text-red-500 text-center mt-2">
                    {error}
                  </p>
                )}
              </motion.div>
            )}

            {/* Generating state */}
            {isPending && (
              <div className="flex items-center justify-center gap-3 py-8 text-muted-foreground font-body text-sm">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                AIRRA is writing…
              </div>
            )}

            {/* Hook banner */}
            <AnimatePresence>
              {result?.hookLine && !isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3.5"
                >
                  <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-primary mb-1.5">
                    Opening hook
                  </p>
                  <p className="font-heading text-base text-foreground">
                    "{result.hookLine}"
                  </p>
                  {result.hookTip && (
                    <p className="font-body text-xs text-muted-foreground mt-1.5">
                      {result.hookTip}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Generating state */}
              {isPending && (
                <div className="flex items-center justify-center gap-3 py-8 text-muted-foreground font-body text-sm">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ARIA is writing…
                </div>
              )}

              {/* Hook banner */}
              <AnimatePresence>
                {result?.hookLine && !isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3.5"
                  >
                    <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-primary mb-1.5">
                      Opening hook
                    </p>
                    <p className="font-heading text-base text-foreground">
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
                    <div className="flex gap-3 pt-4 pb-10">
                      <button
                        onClick={handleSave}
                        disabled={saving || saved}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                        font-body font-semibold text-sm transition-all
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
                        onClick={() => navigate("/dashboard/launch")}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                                 bg-primary text-white font-body font-semibold text-sm hover:opacity-90 transition-opacity"
                      >
                        Go to Launch <ArrowRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Re-generate button (after result) */}
              {result && !isPending && (
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

          {/* Right: Context (desktop, hidden in focus mode) */}
          {!focusMode && result && showContext && (
            <div className="hidden lg:flex">
              <ContextPanel
                idea={idea}
                hookLine={result?.hookLine}
                hookTip={result?.hookTip}
                words={words}
                duration={duration}
                platform={dbUser?.primary_platform || "Instagram"}
                onClose={() => setShowContext(false)}
                hookVariants={hookVariants}
                showHookVariants={showHookVariants}
                isRewriting={isRewriting}
                onTryAnotherHook={handleTryAnotherHook}
                hookVariantCopied={hookVariantCopied}
                onCopyVariant={handleCopyVariant}
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
      )}
    </div>
  );
}