import React from "react";
import { motion } from "framer-motion";
import { User, Instagram, Youtube, BarChart3, Heart, Star } from "lucide-react";

const healthColor = (score = 0) => {
  if (score >= 80)
    return {
      ring: "stroke-green-500",
      text: "text-green-600",
      label: "Excellent",
    };
  if (score >= 60)
    return { ring: "stroke-primary", text: "text-primary", label: "Good" };
  if (score >= 40)
    return {
      ring: "stroke-orange-500",
      text: "text-orange-500",
      label: "Fair",
    };
  return { ring: "stroke-red-500", text: "text-red-500", label: "Needs Work" };
};

function HealthRing({ score = 0 }) {
  const pct = Math.min(Math.max(score, 0), 100);
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const c = healthColor(pct);

  return (
    <div className="flex flex-col items-center">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-border"
        />
        <motion.circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className={c.ring}
          style={{ transform: "rotate(-90deg)", transformOrigin: "28px 28px" }}
        />
        <text
          x="28"
          y="33"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          className={c.text}
          fill="currentColor"
        >
          {pct}
        </text>
      </svg>
      <span className={`text-[10px] font-semibold font-body mt-0.5 ${c.text}`}>
        {c.label}
      </span>
    </div>
  );
}

function StatPill({ label, value, icon: Icon }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 bg-muted/40 rounded-xl min-w-[60px]">
      {Icon && <Icon size={12} className="text-muted-foreground" />}
      <span className="font-heading text-base text-foreground leading-tight">
        {value || "—"}
      </span>
      <span className="text-[10px] text-muted-foreground font-body text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

export default function ProfileCard({ data }) {
  if (!data) return null;

  // Normalise
  const profile = data.profile ?? data.user ?? data;

  const name = profile.name || "Creator";
  const archetype = profile.archetype_label || profile.archetype || "Creator";
  const niche = Array.isArray(profile.niches)
    ? profile.niches[0]
    : profile.niche || "";
  const platform = profile.primary_platform || "Instagram";
  const followers = profile.follower_range || profile.followers || "—";
  const engagement =
    profile.engagement_rate != null ? `${profile.engagement_rate}%` : "—";
  const healthScore = Number(profile.health_score ?? 0);
  const growthStage = profile.growth_stage || "—";
  const igHandle = profile.instagram_handle;
  const ytHandle = profile.youtube_handle;

  const archetypeEmoji = {
    ENTERTAINER: "🎭",
    EDUCATOR: "📚",
    LIFESTYLE: "✨",
    FITNESS: "💪",
    FOOD: "🍴",
    TRAVEL: "✈️",
    FASHION: "👗",
    TECH: "💻",
    BEAUTY: "💄",
    BUSINESS: "💼",
    CREATOR: "🎨",
  };
  const emoji = archetypeEmoji[profile.archetype?.toUpperCase()] ?? "🎯";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mt-3 w-full max-w-xl bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header gradient band */}
      <div className="h-12 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

      {/* Profile row */}
      <div className="px-4 -mt-6 pb-3 flex items-end gap-3">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl bg-card border-2 border-border flex items-center justify-center text-2xl shadow-sm shrink-0">
          {emoji}
        </div>
        <div className="flex-1 min-w-0 pb-1">
          <p className="font-heading text-base text-foreground leading-tight">
            {name}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold font-body border border-primary/20">
              {archetype}
            </span>
            {niche && (
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-body border border-border">
                {niche}
              </span>
            )}
          </div>
        </div>
        {/* Health ring */}
        <HealthRing score={healthScore} />
      </div>

      {/* Stats row */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <StatPill label="Followers" value={followers} icon={User} />
          <StatPill label="Engagement" value={engagement} icon={Heart} />
          <StatPill label="Stage" value={growthStage} icon={Star} />
          <StatPill label="Platform" value={platform} icon={BarChart3} />
        </div>
      </div>

      {/* Handles */}
      {(igHandle || ytHandle) && (
        <div className="px-4 py-2.5 border-t border-border flex gap-3">
          {igHandle && (
            <div className="flex items-center gap-1.5">
              <Instagram size={13} className="text-pink-500" />
              <span className="text-xs text-muted-foreground font-body">
                @{igHandle}
              </span>
            </div>
          )}
          {ytHandle && (
            <div className="flex items-center gap-1.5">
              <Youtube size={13} className="text-red-500" />
              <span className="text-xs text-muted-foreground font-body">
                @{ytHandle}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
