// src/constants/noteTags.js
// ── Single source of truth for all structural tag definitions ─────────────────
// Used by Notes.jsx, NoteCard, NoteEditor, Studio.jsx (/ picker), and AIRRA context

export const STRUCTURAL_TAGS = [
  "hook", "intro", "cta", "outro", "bridge",
  "story", "tip", "fact", "idea", "question", "ready",
];

// Visual metadata per structural tag
export const STRUCTURAL_TAG_META = {
  hook:     { emoji: "🪝", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400",     border: "border-orange-500/20" },
  intro:    { emoji: "🎬", color: "bg-violet-500/15 text-violet-600 dark:text-violet-400",     border: "border-violet-500/20" },
  cta:      { emoji: "📣", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",  border: "border-emerald-500/20" },
  outro:    { emoji: "🏁", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400",        border: "border-amber-500/20" },
  bridge:   { emoji: "🌉", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400",           border: "border-blue-500/20" },
  story:    { emoji: "📖", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400",           border: "border-rose-500/20" },
  tip:      { emoji: "💡", color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-500",     border: "border-yellow-500/20" },
  fact:     { emoji: "📌", color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",           border: "border-cyan-500/20" },
  idea:     { emoji: "✨", color: "bg-purple-500/15 text-purple-600 dark:text-purple-400",     border: "border-purple-500/20" },
  question: { emoji: "❓", color: "bg-pink-500/15 text-pink-600 dark:text-pink-400",           border: "border-pink-500/20" },
  ready:    { emoji: "🚀", color: "bg-green-500/15 text-green-600 dark:text-green-400",        border: "border-green-500/20" },
};

// Regex: match #word (letter-start, alphanumeric/hyphen body)
export const HASHTAG_REGEX = /#([a-zA-Z][a-zA-Z0-9_-]*)/g;

/**
 * Extract all unique lowercase hashtags from a string.
 * Returns array of tag strings WITHOUT the # prefix.
 */
export function extractHashtags(text = "") {
  const matches = [];
  let m;
  const re = new RegExp(HASHTAG_REGEX.source, "g");
  while ((m = re.exec(text)) !== null) {
    const tag = m[1].toLowerCase();
    if (!matches.includes(tag)) matches.push(tag);
  }
  return matches;
}

/**
 * Given a raw tag array, sort so structural tags come first (in STRUCTURAL_TAGS order),
 * then alphabetical for the rest.
 */
export function sortTags(tags = []) {
  const structural = STRUCTURAL_TAGS.filter((t) => tags.includes(t));
  const rest = tags
    .filter((t) => !STRUCTURAL_TAGS.includes(t))
    .sort((a, b) => a.localeCompare(b));
  return [...structural, ...rest];
}

/**
 * Score a note's content for "energy" — a rough signal for creators.
 * Returns { level: 'high'|'medium'|'low', label: string, emoji: string }
 */
export function scoreNoteEnergy(content = "", tags = []) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const hasStructural = tags.some((t) => STRUCTURAL_TAGS.includes(t));
  const hasQuestion = content.includes("?");
  const hasExclamation = content.includes("!");
  const startsStrong = /^(what|how|why|imagine|stop|this|i |the most|nobody|every)/i.test(content.trim());

  let score = 0;
  if (words >= 20) score += 1;
  if (words >= 50) score += 1;
  if (hasStructural) score += 2;
  if (hasQuestion) score += 1;
  if (hasExclamation) score += 1;
  if (startsStrong) score += 2;
  if (tags.includes("hook") || tags.includes("cta")) score += 2;
  if (tags.includes("ready")) score += 3;

  if (score >= 7) return { level: "high",   label: "Strong potential", emoji: "🔥" };
  if (score >= 4) return { level: "medium",  label: "Good start",       emoji: "💡" };
  return               { level: "low",    label: "Needs more",       emoji: "⚠️" };
}