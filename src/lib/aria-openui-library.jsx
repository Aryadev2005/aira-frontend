/**
 * aria-openui-library.jsx
 *
 * OpenUI component library for ARIA Brain — TrendAI's generative UI layer.
 * Matches the warm beige-orange palette (DM Serif Display + DM Sans).
 *
 * Install deps first:
 *   npm install @openuidev/react-lang @openuidev/react-ui zod
 *
 * Usage in AriaBrain.jsx:
 *   import { ariaLibrary } from '@/lib/aria-openui-library';
 *   import { Renderer } from '@openuidev/react-lang';
 *   // in the assistant bubble:
 *   <Renderer library={ariaLibrary} response={contentStr} isStreaming={!!msg._streaming} />
 *
 * Usage in backend (ariaBrain.service.ts or aria_agent.controller.ts):
 *   import { ariaLibraryNode } from './aria-openui-library.node';  // see next file
 *   const OPENUI_PROMPT = ariaLibraryNode.prompt();
 *   // inject into system prompt
 */

import React from "react";
import { z } from "zod";
import { defineComponent, createLibrary } from "@openuidev/react-lang";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Music,
  Zap,
  BarChart2,
  Star,
  Clock,
  ExternalLink,
  Check,
  ChevronRight,
  Flame,
  Globe,
  Hash,
  Film,
} from "lucide-react";

// ─── Design tokens (matches index.css CSS vars) ───────────────────────────────
const T = {
  primary: "hsl(22 67% 63%)", // warm terracotta-orange
  primaryFg: "#fff",
  card: "hsl(34 33% 96%)",
  cardDark: "hsl(18 60% 14%)",
  border: "hsl(30 22% 83%)",
  muted: "hsl(22 25% 44%)",
  fg: "hsl(18 40% 12%)",
  rising: "#22c55e",
  falling: "#ef4444",
  neutral: "hsl(22 25% 44%)",
  accent: "hsl(18 80% 10%)",
  gold: "#d4a843",
  sage: "#7a9072",
};

// ─── Shared micro-components ──────────────────────────────────────────────────
const Card = ({ children, style, className = "" }) => (
  <div
    className={`rounded-2xl border bg-card text-foreground overflow-hidden ${className}`}
    style={{ borderColor: T.border, ...style }}
  >
    {children}
  </div>
);

const Badge = ({ label, color = T.primary, bg }) => (
  <span
    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-body"
    style={{ background: bg ?? `${color}20`, color }}
  >
    {label}
  </span>
);

const TrendIcon = ({ dir }) => {
  if (dir === "rising") return <TrendingUp size={14} color={T.rising} />;
  if (dir === "falling") return <TrendingDown size={14} color={T.falling} />;
  return <Minus size={14} color={T.neutral} />;
};

// ─── 1. TrendCard ─────────────────────────────────────────────────────────────
const TrendCardComp = ({ props: p }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="font-heading text-base text-foreground leading-snug">
              {p.title}
            </p>
            {p.subtitle && (
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                {p.subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <TrendIcon dir={p.direction} />
            <span
              className="text-sm font-semibold font-body"
              style={{
                color:
                  p.direction === "rising"
                    ? T.rising
                    : p.direction === "falling"
                      ? T.falling
                      : T.neutral,
              }}
            >
              {p.changeLabel}
            </span>
          </div>
        </div>

        {/* Platform + source badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {p.platform && <Badge label={p.platform} />}
          {p.niche && (
            <Badge label={p.niche} bg={`${T.accent}15`} color={T.accent} />
          )}
        </div>

        {/* Score bar */}
        {typeof p.score === "number" && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1 font-body">
              <span>Heat Score</span>
              <span className="font-semibold" style={{ color: T.primary }}>
                {p.score}/100
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: T.primary }}
                initial={{ width: 0 }}
                animate={{ width: `${p.score}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Insight line */}
        {p.insight && (
          <p
            className="text-xs font-body text-muted-foreground border-t pt-2 mt-2"
            style={{ borderColor: T.border }}
          >
            💡 {p.insight}
          </p>
        )}
      </div>
    </Card>
  </motion.div>
);

const TrendCard = defineComponent({
  name: "TrendCard",
  description:
    "Displays a single trending topic/keyword with heat score, direction, and insight.",
  props: z.object({
    title: z.string().describe("Trend name or keyword"),
    subtitle: z
      .string()
      .optional()
      .describe('Brief context (e.g. "Spotted on Instagram Reels")'),
    direction: z
      .enum(["rising", "falling", "stable"])
      .describe("Trend momentum"),
    changeLabel: z
      .string()
      .describe('Human-readable change e.g. "+34% this week"'),
    score: z.number().min(0).max(100).optional().describe("Heat score 0-100"),
    platform: z
      .string()
      .optional()
      .describe("Platform: Instagram, YouTube, etc."),
    niche: z.string().optional().describe("Content niche"),
    insight: z.string().optional().describe("ARIA's actionable tip"),
  }),
  component: TrendCardComp,
});

// ─── 2. TrendGrid (list of TrendCards) ───────────────────────────────────────
const TrendGridComp = ({ props: p }) => (
  <div className="space-y-3">
    {p.header && (
      <div className="flex items-center gap-2 mb-1">
        <Flame size={15} style={{ color: T.primary }} />
        <span className="font-heading text-sm text-foreground">{p.header}</span>
      </div>
    )}
    {p.trends.map((t, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.07, duration: 0.3 }}
      >
        <Card>
          <div className="p-3 flex items-center gap-3">
            <span
              className="font-heading text-xl tabular-nums w-7 text-center"
              style={{ color: T.primary }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-sm text-foreground truncate">
                {t.title}
              </p>
              {t.subtitle && (
                <p className="font-body text-xs text-muted-foreground truncate">
                  {t.subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <TrendIcon dir={t.direction} />
              {t.badge && <Badge label={t.badge} />}
            </div>
          </div>
        </Card>
      </motion.div>
    ))}
  </div>
);

const TrendGrid = defineComponent({
  name: "TrendGrid",
  description:
    'Ranked list of trends — use for "top trends this week" or multi-topic overviews.',
  props: z.object({
    header: z
      .string()
      .optional()
      .describe('Section heading e.g. "🔥 Trending This Week"'),
    trends: z
      .array(
        z.object({
          title: z.string(),
          subtitle: z.string().optional(),
          direction: z.enum(["rising", "falling", "stable"]),
          badge: z
            .string()
            .optional()
            .describe('Short label e.g. "HOT" or "Saturated"'),
        }),
      )
      .min(1)
      .max(10),
  }),
  component: TrendGridComp,
});

// ─── 3. SongCard ─────────────────────────────────────────────────────────────
const SongCardComp = ({ props: p }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Card>
      <div className="p-4 flex items-start gap-4">
        {/* Album art placeholder */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${T.primary}40, ${T.gold}30)`,
          }}
        >
          <Music size={22} style={{ color: T.primary }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-base text-foreground truncate">
            {p.title}
          </p>
          <p className="font-body text-xs text-muted-foreground mb-2">
            {p.artist}
          </p>
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {p.genre && <Badge label={p.genre} />}
            {p.mood && (
              <Badge label={p.mood} bg={`${T.sage}20`} color={T.sage} />
            )}
            {p.lifecycle && (
              <Badge
                label={p.lifecycle}
                bg={
                  p.lifecycle === "Rising" ? `${T.rising}20` : `${T.primary}20`
                }
                color={p.lifecycle === "Rising" ? T.rising : T.primary}
              />
            )}
          </div>
          {p.insight && (
            <p
              className="font-body text-xs text-muted-foreground mt-2 border-t pt-2"
              style={{ borderColor: T.border }}
            >
              {p.insight}
            </p>
          )}
        </div>
        {p.usageScore !== undefined && (
          <div className="text-right shrink-0">
            <p className="font-heading text-xl" style={{ color: T.primary }}>
              {p.usageScore}
            </p>
            <p className="font-body text-[10px] text-muted-foreground">Usage</p>
          </div>
        )}
      </div>
    </Card>
  </motion.div>
);

const SongCard = defineComponent({
  name: "SongCard",
  description:
    "Shows a trending song with artist, genre, mood, lifecycle, and content use advice.",
  props: z.object({
    title: z.string(),
    artist: z.string(),
    genre: z.string().optional(),
    mood: z.string().optional(),
    lifecycle: z.enum(["Rising", "Peak", "Declining", "Evergreen"]).optional(),
    usageScore: z
      .number()
      .optional()
      .describe("Reels/TikTok usage score 0-100"),
    insight: z.string().optional().describe("When/how to use this in content"),
  }),
  component: SongCardComp,
});

// ─── 4. ContentIdea ──────────────────────────────────────────────────────────
// NOTE: No `script` prop here. If user asks for a script → use ScriptCard instead.
const ContentIdeaComp = ({ props: p }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card style={{ borderLeft: `3px solid ${T.primary}` }}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-2 mb-3">
          <Film
            size={15}
            style={{ color: T.primary, marginTop: 2, flexShrink: 0 }}
          />
          <div>
            <p className="font-heading text-sm text-foreground leading-snug">
              {p.hook}
            </p>
            {p.format && (
              <p className="font-body text-[11px] text-muted-foreground mt-0.5">
                {p.format}
              </p>
            )}
          </div>
        </div>

        {/* Why it works */}
        {p.whyItWorks && (
          <div
            className="rounded-lg px-3 py-2 mb-3 text-xs font-body leading-relaxed"
            style={{ background: `${T.primary}10`, color: T.muted }}
          >
            💡 {p.whyItWorks}
          </div>
        )}

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5">
          {p.niche && <Badge label={p.niche} />}
          {p.viralPotential && (
            <Badge
              label={`${p.viralPotential} potential`}
              bg={p.viralPotential === "High" ? `${T.rising}20` : `${T.gold}20`}
              color={p.viralPotential === "High" ? T.rising : T.gold}
            />
          )}
          {p.estimatedReach && (
            <Badge
              label={`~${p.estimatedReach} reach`}
              bg={`${T.primary}15`}
              color={T.primary}
            />
          )}
        </div>

        {p.cta && (
          <p className="font-body text-xs text-muted-foreground mt-2.5 flex items-center gap-1">
            <ChevronRight size={12} style={{ color: T.primary }} /> {p.cta}
          </p>
        )}
      </div>
    </Card>
  </motion.div>
);

const ContentIdea = defineComponent({
  name: "ContentIdea",
  description:
    "A SINGLE content idea — concept title/hook, format, niche, and viral potential. NEVER use this for scripts. If the user asks for a script, use ScriptCard instead.",
  props: z.object({
    hook: z
      .string()
      .describe("Punchy concept title or opening line — NOT a script"),
    format: z
      .string()
      .optional()
      .describe('e.g. "30s Reel", "Carousel", "YouTube Short"'),
    whyItWorks: z
      .string()
      .optional()
      .describe("1-sentence explanation of why this idea fits the creator"),
    niche: z.string().optional(),
    viralPotential: z.enum(["High", "Medium", "Low"]).optional(),
    estimatedReach: z.string().optional().describe('e.g. "10K–30K"'),
    cta: z
      .string()
      .optional()
      .describe('Next step e.g. "Want a full script for this?"'),
  }),
  component: ContentIdeaComp,
});

// ─── 5. IdeaBatch (multiple ContentIdeas) ────────────────────────────────────
const IdeaBatchComp = ({ props: p }) => (
  <div className="space-y-3">
    {p.header && (
      <div className="flex items-center gap-2 mb-1">
        <Zap size={14} style={{ color: T.primary }} />
        <span className="font-heading text-sm text-foreground">{p.header}</span>
      </div>
    )}
    {p.ideas.map((idea, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.08, duration: 0.25 }}
      >
        <Card
          style={{
            borderLeft: `3px solid ${i % 2 === 0 ? T.primary : T.gold}`,
          }}
        >
          <div className="p-3">
            <p className="font-heading text-sm text-foreground leading-snug mb-1">
              {idea.hook}
            </p>
            {idea.format && (
              <p className="font-body text-[11px] text-muted-foreground">
                {idea.format}
              </p>
            )}
            {idea.tip && (
              <p
                className="font-body text-xs text-muted-foreground mt-1.5 border-t pt-1.5"
                style={{ borderColor: T.border }}
              >
                💡 {idea.tip}
              </p>
            )}
          </div>
        </Card>
      </motion.div>
    ))}
  </div>
);

const IdeaBatch = defineComponent({
  name: "IdeaBatch",
  description:
    "Multiple content ideas shown together — use when user asks for 3+ ideas at once.",
  props: z.object({
    header: z.string().optional(),
    ideas: z
      .array(
        z.object({
          hook: z.string(),
          format: z.string().optional(),
          tip: z.string().optional(),
        }),
      )
      .min(2)
      .max(10),
  }),
  component: IdeaBatchComp,
});

// ─── 6. AnalyticsSnapshot ────────────────────────────────────────────────────
const AnalyticsSnapshotComp = ({ props: p }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <Card>
      {p.title && (
        <div
          className="px-4 pt-3 pb-2 border-b"
          style={{ borderColor: T.border }}
        >
          <div className="flex items-center gap-2">
            <BarChart2 size={14} style={{ color: T.primary }} />
            <span className="font-heading text-sm text-foreground">
              {p.title}
            </span>
          </div>
        </div>
      )}
      <div className="p-4 grid grid-cols-2 gap-3">
        {p.metrics.map((m, i) => (
          <div key={i} className="bg-secondary rounded-xl px-3 py-2.5">
            <p className="font-body text-[11px] text-muted-foreground mb-0.5">
              {m.label}
            </p>
            <p className="font-heading text-xl text-foreground">{m.value}</p>
            {m.change && (
              <p
                className="font-body text-xs mt-0.5"
                style={{
                  color: m.change.startsWith("+")
                    ? T.rising
                    : m.change.startsWith("-")
                      ? T.falling
                      : T.muted,
                }}
              >
                {m.change}
              </p>
            )}
          </div>
        ))}
      </div>
      {p.summary && (
        <p className="px-4 pb-3 font-body text-xs text-muted-foreground">
          {p.summary}
        </p>
      )}
    </Card>
  </motion.div>
);

const AnalyticsSnapshot = defineComponent({
  name: "AnalyticsSnapshot",
  description:
    "Grid of key metrics — use for profile analytics, engagement stats, performance summaries.",
  props: z.object({
    title: z.string().optional(),
    metrics: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
          change: z.string().optional().describe('e.g. "+12%" or "-3%"'),
        }),
      )
      .min(2)
      .max(8),
    summary: z
      .string()
      .optional()
      .describe("1-line ARIA insight below the metrics"),
  }),
  component: AnalyticsSnapshotComp,
});

// ─── 7. RateCard ─────────────────────────────────────────────────────────────
const RateCardComp = ({ props: p }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    <Card>
      <div
        className="px-4 pt-4 pb-2 border-b"
        style={{ borderColor: T.border }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-heading text-base text-foreground">
              {p.creatorName || "Your Rate Card"}
            </p>
            {p.niche && (
              <p className="font-body text-xs text-muted-foreground">
                {p.niche}
              </p>
            )}
          </div>
          <Badge
            label={p.tier || "Nano"}
            bg={`${T.primary}20`}
            color={T.primary}
          />
        </div>
        {p.followers && (
          <p className="font-body text-xs text-muted-foreground mt-1">
            {p.followers} followers · {p.engagementRate} ER
          </p>
        )}
      </div>
      <div className="p-4 space-y-2">
        {p.deliverables.map((d, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-1.5 border-b last:border-0"
            style={{ borderColor: T.border }}
          >
            <div>
              <p className="font-body text-sm text-foreground">{d.type}</p>
              {d.notes && (
                <p className="font-body text-[11px] text-muted-foreground">
                  {d.notes}
                </p>
              )}
            </div>
            <p className="font-heading text-base" style={{ color: T.primary }}>
              {d.rate}
            </p>
          </div>
        ))}
      </div>
      {p.note && (
        <p className="px-4 pb-3 font-body text-xs text-muted-foreground">
          {p.note}
        </p>
      )}
    </Card>
  </motion.div>
);

const RateCard = defineComponent({
  name: "RateCard",
  description:
    "Brand deal rate card showing deliverable types and pricing — use when user asks about rates.",
  props: z.object({
    creatorName: z.string().optional(),
    niche: z.string().optional(),
    tier: z.string().optional().describe("e.g. Nano, Micro, Mid, Macro"),
    followers: z.string().optional(),
    engagementRate: z.string().optional(),
    deliverables: z
      .array(
        z.object({
          type: z.string().describe('e.g. "Instagram Reel", "Story Set (3)"'),
          rate: z.string().describe('e.g. "₹8,000 – ₹12,000"'),
          notes: z.string().optional(),
        }),
      )
      .min(1)
      .max(8),
    note: z.string().optional().describe("Disclaimer or negotiation tip"),
  }),
  component: RateCardComp,
});

// ─── 8. GrowthRoadmap ────────────────────────────────────────────────────────
const GrowthRoadmapComp = ({ props: p }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
    <Card>
      {p.title && (
        <div
          className="px-4 pt-3 pb-2 border-b flex items-center gap-2"
          style={{ borderColor: T.border }}
        >
          <Star size={14} style={{ color: T.primary }} />
          <span className="font-heading text-sm text-foreground">
            {p.title}
          </span>
        </div>
      )}
      <div className="p-4 space-y-3">
        {p.phases.map((phase, i) => (
          <div key={i} className="flex gap-3">
            {/* Timeline dot */}
            <div className="flex flex-col items-center">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ background: phase.done ? T.rising : T.primary }}
              >
                {phase.done ? <Check size={12} /> : i + 1}
              </div>
              {i < p.phases.length - 1 && (
                <div
                  className="w-px flex-1 mt-1"
                  style={{ background: T.border }}
                />
              )}
            </div>
            <div className="pb-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-body font-semibold text-sm text-foreground">
                  {phase.label}
                </p>
                {phase.timeframe && (
                  <span className="font-body text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock size={10} />
                    {phase.timeframe}
                  </span>
                )}
              </div>
              <p className="font-body text-xs text-muted-foreground leading-relaxed">
                {phase.description}
              </p>
              {phase.milestone && (
                <p
                  className="font-body text-xs mt-1"
                  style={{ color: T.primary }}
                >
                  🎯 {phase.milestone}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  </motion.div>
);

const GrowthRoadmap = defineComponent({
  name: "GrowthRoadmap",
  description:
    "Step-by-step growth plan with phases, timeframes, and milestones.",
  props: z.object({
    title: z.string().optional(),
    phases: z
      .array(
        z.object({
          label: z.string(),
          timeframe: z.string().optional().describe('e.g. "Week 1-2"'),
          description: z.string(),
          milestone: z.string().optional().describe('e.g. "Hit 5K followers"'),
          done: z.boolean().optional().describe("Mark phase as completed"),
        }),
      )
      .min(2)
      .max(6),
  }),
  component: GrowthRoadmapComp,
});

// ─── 9. QuickActions (suggestion chips) ──────────────────────────────────────
const QuickActionsComp = ({ props: p }) => (
  <div className="pt-1">
    {p.label && (
      <p className="font-body text-xs text-muted-foreground mb-2">{p.label}</p>
    )}
    <div className="flex flex-wrap gap-2">
      {p.actions.map((a, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-body border transition-colors hover:border-primary/60"
          style={{
            background: `${T.primary}10`,
            borderColor: `${T.primary}30`,
            color: T.primary,
          }}
          onClick={() => {
            // Dispatch a custom event so AriaBrain can intercept and auto-send
            window.dispatchEvent(
              new CustomEvent("aria:quickAction", {
                detail: a.message || a.label,
              }),
            );
          }}
        >
          {a.emoji && <span>{a.emoji}</span>}
          {a.label}
          <ChevronRight size={11} />
        </motion.button>
      ))}
    </div>
  </div>
);

const QuickActions = defineComponent({
  name: "QuickActions",
  description:
    "Tappable follow-up chips — always add at end of complex responses to guide next steps.",
  props: z.object({
    label: z
      .string()
      .optional()
      .describe('e.g. "What would you like to do next?"'),
    actions: z
      .array(
        z.object({
          label: z.string().describe("Button text"),
          emoji: z.string().optional(),
          message: z
            .string()
            .optional()
            .describe("Message to send when tapped; defaults to label"),
        }),
      )
      .min(1)
      .max(5),
  }),
  component: QuickActionsComp,
});

// ─── 10. InfoAlert ───────────────────────────────────────────────────────────
const InfoAlertComp = ({ props: p }) => {
  const colors = {
    tip: {
      bg: `${T.primary}15`,
      border: `${T.primary}40`,
      icon: "💡",
      textColor: T.primary,
    },
    warning: {
      bg: `${T.gold}15`,
      border: `${T.gold}40`,
      icon: "⚠️",
      textColor: T.gold,
    },
    success: {
      bg: `${T.rising}15`,
      border: `${T.rising}40`,
      icon: "✅",
      textColor: T.rising,
    },
    info: {
      bg: `hsl(210 80% 56% / 0.12)`,
      border: "hsl(210 80% 56% / 0.3)",
      icon: "ℹ️",
      textColor: "hsl(210 80% 56%)",
    },
  };
  const c = colors[p.variant] || colors.tip;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl px-4 py-3 border font-body"
      style={{ background: c.bg, borderColor: c.border }}
    >
      <p
        className="text-sm font-semibold mb-0.5"
        style={{ color: c.textColor }}
      >
        {c.icon} {p.title}
      </p>
      <p className="text-xs text-foreground/80 leading-relaxed">{p.body}</p>
    </motion.div>
  );
};

const InfoAlert = defineComponent({
  name: "InfoAlert",
  description:
    "Highlighted callout for tips, warnings, success confirmations, or key info.",
  props: z.object({
    variant: z.enum(["tip", "warning", "success", "info"]),
    title: z.string(),
    body: z.string(),
  }),
  component: InfoAlertComp,
});

// ─── 11. ScriptCard ──────────────────────────────────────────────────────────
// Section type → visual accent colour
const SECTION_COLORS = {
  hook: {
    bg: `hsl(22 67% 63% / 0.12)`,
    border: `hsl(22 67% 63% / 0.35)`,
    label: "HOOK",
    dot: "hsl(22 67% 63%)",
  },
  build: {
    bg: `hsl(210 60% 56% / 0.10)`,
    border: `hsl(210 60% 56% / 0.30)`,
    label: "BUILD",
    dot: "hsl(210 60% 56%)",
  },
  value: {
    bg: `hsl(140 35% 48% / 0.10)`,
    border: `hsl(140 35% 48% / 0.30)`,
    label: "VALUE",
    dot: "hsl(140 35% 48%)",
  },
  cta: {
    bg: `hsl(18 80% 10% / 0.07)`,
    border: `hsl(18 80% 10% / 0.25)`,
    label: "CTA",
    dot: "hsl(18 80% 10%)",
  },
  transition: {
    bg: `hsl(260 20% 55% / 0.09)`,
    border: `hsl(260 20% 55% / 0.28)`,
    label: "TRANSITION",
    dot: "hsl(260 20% 55%)",
  },
  reveal: {
    bg: `hsl(35 80% 56% / 0.10)`,
    border: `hsl(35 80% 56% / 0.30)`,
    label: "REVEAL",
    dot: "hsl(35 80% 56%)",
  },
  default: {
    bg: `hsl(30 22% 83% / 0.35)`,
    border: `hsl(30 22% 83%)`,
    label: "",
    dot: T.muted,
  },
};

const sectionStyle = (type = "default") =>
  SECTION_COLORS[type.toLowerCase()] || SECTION_COLORS.default;

const ScriptCardComp = ({ props: p }) => {
  const totalDuration =
    p.totalDuration || (p.scenes?.length ? `~${p.scenes.length * 4}s` : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card>
        {/* ── Header ── */}
        <div
          className="px-4 pt-4 pb-3 border-b"
          style={{ borderColor: T.border }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${T.primary}18` }}
              >
                <Film size={15} style={{ color: T.primary }} />
              </div>
              <div>
                <p className="font-heading text-base text-foreground leading-snug">
                  {p.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {p.format && (
                    <span className="font-body text-[11px] text-muted-foreground">
                      {p.format}
                    </span>
                  )}
                  {p.format && totalDuration && (
                    <span className="text-muted-foreground/40 text-[10px]">
                      ·
                    </span>
                  )}
                  {totalDuration && (
                    <span className="font-body text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock size={10} />
                      {totalDuration}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Viral badge */}
            {p.viralPotential && (
              <Badge
                label={`${p.viralPotential} potential`}
                bg={
                  p.viralPotential === "High" ? `${T.rising}20` : `${T.gold}20`
                }
                color={p.viralPotential === "High" ? T.rising : T.gold}
              />
            )}
          </div>

          {/* Meta tags */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {p.platform && <Badge label={p.platform} />}
            {p.niche && (
              <Badge label={p.niche} bg={`${T.accent}12`} color={T.accent} />
            )}
            {p.audio && (
              <Badge
                label={`🎵 ${p.audio}`}
                bg={`${T.sage}18`}
                color={T.sage}
              />
            )}
          </div>
        </div>

        {/* ── Scene breakdown ── */}
        <div className="p-4 space-y-2.5">
          {p.scenes.map((scene, i) => {
            const style = sectionStyle(scene.type);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.25 }}
                className="rounded-xl border overflow-hidden"
                style={{ background: style.bg, borderColor: style.border }}
              >
                {/* Scene header row */}
                <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
                  {/* Coloured dot */}
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: style.dot }}
                  />
                  {/* Scene label / type */}
                  {style.label && (
                    <span
                      className="font-body text-[10px] font-bold tracking-widest uppercase"
                      style={{ color: style.dot }}
                    >
                      {style.label}
                    </span>
                  )}
                  {/* Timing */}
                  {scene.timing && (
                    <span className="font-body text-[10px] text-muted-foreground ml-auto tabular-nums">
                      {scene.timing}
                    </span>
                  )}
                </div>

                <div className="px-3 pb-3 space-y-1.5">
                  {/* Scene title / label */}
                  {scene.scene && (
                    <p className="font-body font-semibold text-xs text-foreground">
                      {scene.scene}
                    </p>
                  )}

                  {/* Dialogue */}
                  {scene.dialogue && (
                    <p className="font-body text-sm text-foreground/85 leading-relaxed">
                      "{scene.dialogue}"
                    </p>
                  )}

                  {/* Visual direction */}
                  {scene.visual && (
                    <p className="font-body text-xs text-muted-foreground italic">
                      🎬 {scene.visual}
                    </p>
                  )}

                  {/* SFX / audio cue */}
                  {scene.sfx && (
                    <p className="font-body text-xs" style={{ color: T.sage }}>
                      🎵 {scene.sfx}
                    </p>
                  )}

                  {/* On-screen text */}
                  {scene.onScreenText && (
                    <div
                      className="inline-block mt-0.5 px-2 py-0.5 rounded font-body text-xs font-semibold"
                      style={{ background: `${T.accent}12`, color: T.accent }}
                    >
                      TEXT: "{scene.onScreenText}"
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Footer: ARIA tip + caption seed ── */}
        {(p.ariaTip || p.captionHook || p.hashtags?.length) && (
          <div
            className="px-4 pb-4 pt-1 border-t space-y-2"
            style={{ borderColor: T.border }}
          >
            {p.ariaTip && (
              <p className="font-body text-xs text-muted-foreground">
                💡 {p.ariaTip}
              </p>
            )}
            {p.captionHook && (
              <div
                className="rounded-lg px-3 py-2 font-body text-xs"
                style={{ background: `${T.primary}10`, color: T.primary }}
              >
                <span className="font-semibold">Caption opener:</span>{" "}
                {p.captionHook}
              </div>
            )}
            {p.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {p.hashtags.map((h, i) => (
                  <span
                    key={i}
                    className="font-body text-[11px] px-2 py-0.5 rounded-full"
                    style={{ background: `${T.border}`, color: T.muted }}
                  >
                    #{h.replace(/^#/, "")}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

const ScriptCard = defineComponent({
  name: "ScriptCard",
  description: [
    "Full reel / short / video script with scene-by-scene breakdown.",
    'Use WHENEVER the user asks to "write a script", "give me a script", "script for X", or any variation.',
    "NEVER use ContentIdea for scripts — always use ScriptCard.",
    "Each scene has: type (hook/build/value/cta/transition/reveal), timing, dialogue, visual direction, sfx, on-screen text.",
  ].join(" "),
  props: z.object({
    title: z.string().describe("Script title / content concept"),
    format: z
      .string()
      .optional()
      .describe('e.g. "30s Reel", "60s Reel", "YouTube Short"'),
    totalDuration: z.string().optional().describe('e.g. "28–32 seconds"'),
    platform: z.string().optional(),
    niche: z.string().optional(),
    audio: z.string().optional().describe("Suggested song or audio style"),
    viralPotential: z.enum(["High", "Medium", "Low"]).optional(),
    scenes: z
      .array(
        z.object({
          type: z
            .enum([
              "hook",
              "build",
              "value",
              "cta",
              "transition",
              "reveal",
              "default",
            ])
            .describe("Section purpose — drives the colour coding"),
          scene: z
            .string()
            .optional()
            .describe('Short label e.g. "Opening Hook", "Punchline"'),
          timing: z.string().optional().describe('Timestamp range e.g. "0–3s"'),
          dialogue: z
            .string()
            .optional()
            .describe("Spoken or on-camera dialogue"),
          visual: z
            .string()
            .optional()
            .describe("Camera direction / shot description"),
          sfx: z.string().optional().describe("Audio cue or music note"),
          onScreenText: z
            .string()
            .optional()
            .describe("Text overlay that appears on screen"),
        }),
      )
      .min(2)
      .max(14)
      .describe("All scenes in order — minimum hook + CTA"),
    ariaTip: z
      .string()
      .optional()
      .describe("ARIA's production tip for this specific script"),
    captionHook: z
      .string()
      .optional()
      .describe("Suggested caption opening line"),
    hashtags: z
      .array(z.string())
      .optional()
      .describe("3–6 hashtags without the # symbol"),
  }),
  component: ScriptCardComp,
});

// ─── Library export ──────────────────────────────────────────────────────────
export const ariaLibrary = createLibrary({
  root: "IdeaBatch", // default root; model can override per response
  components: [
    TrendCard,
    TrendGrid,
    SongCard,
    ContentIdea,
    IdeaBatch,
    AnalyticsSnapshot,
    RateCard,
    GrowthRoadmap,
    QuickActions,
    InfoAlert,
    ScriptCard, // ← new
  ],
});

export default ariaLibrary;
