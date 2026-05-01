import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Sparkles, TrendingUp, Users } from 'lucide-react';
import { niches } from '@/lib/mockData';
import { useDiscoverIntelligence, useCompetitorMoves, useProfile, useOpportunities } from '@/hooks/useApi';

const badges = ['ALL', 'HOT', 'RISING', 'NEW'];
const badgeStyles = {
  HOT: 'bg-primary text-white',
  RISING: 'bg-rising text-white',
  NEW: 'bg-new-badge text-white',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
};

export default function Discover() {
  const [selectedNiche, setSelectedNiche] = useState('All');
  const [selectedBadge, setSelectedBadge] = useState('ALL');

  const { data: profileData } = useProfile();
  const userNiche = profileData?.data?.user?.niches?.[0] || 'lifestyle';
  const platform = profileData?.data?.user?.primary_platform || 'instagram';

  const {
    data: intelligenceData,
    isLoading,
    error,
    refetch,
  } = useDiscoverIntelligence({
    niche: selectedNiche === 'All' ? userNiche : selectedNiche,
    platform,
    badge: selectedBadge === 'ALL' ? '' : selectedBadge,
  });

  // Backend returns: { data: { intelligence: { opportunities, ariaTopPick, competitorMoves }, meta } }
  const intelligence = intelligenceData?.data?.intelligence;
  const trends = intelligence?.opportunities || [];
  const topPick = intelligence?.ariaTopPick;
  const inlineCompetitorMoves = intelligence?.competitorMoves || [];

  // Separate competitor moves query
  const { data: competitorData } = useCompetitorMoves();
  // Backend returns: { data: { weeklyWinners: [], gaps: [] } }
  const weeklyWinners = competitorData?.data?.weeklyWinners || [];

  // Opportunities from the dedicated endpoint
  const { data: opportunitiesData } = useOpportunities();
  const opportunities = opportunitiesData?.data?.opportunities || [];

  if (isLoading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  if (error) return (
    <div className="bg-destructive/10 text-destructive rounded-xl p-4 font-body text-sm">
      Could not load trends. {error.message}
    </div>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="font-heading text-2xl text-foreground mb-1">Discover</h1>
        <p className="text-muted-foreground font-body text-sm">48h early trend radar for your niche</p>
      </motion.div>

      {/* Niche filter */}
      <motion.div variants={item} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['All', ...niches.slice(0, 10)].map((n) => (
          <button
            key={n}
            onClick={() => setSelectedNiche(n)}
            className={`px-4 py-1.5 rounded-pill text-xs font-body font-semibold whitespace-nowrap transition-colors ${
              selectedNiche === n
                ? 'bg-primary text-white'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {n}
          </button>
        ))}
      </motion.div>

      {/* Badge filter */}
      <motion.div variants={item} className="flex items-center gap-2">
        {badges.map((b) => (
          <button
            key={b}
            onClick={() => setSelectedBadge(b)}
            className={`px-3 py-1 rounded-pill text-xs font-body font-semibold transition-colors ${
              selectedBadge === b
                ? 'bg-foreground text-background'
                : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            {b}
          </button>
        ))}
        <button
          onClick={() => refetch()}
          className="ml-auto p-2 rounded-lg bg-card border border-border hover:shadow-warm-sm transition-shadow"
        >
          <RefreshCw size={16} className="text-muted-foreground" />
        </button>
      </motion.div>

      {/* Top pick */}
      {topPick && (
        <motion.div variants={item} className="bg-accent text-accent-foreground rounded-xl p-6 shadow-warm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-primary" />
            <span className="text-primary text-xs font-body font-semibold tracking-wider">AIRA TOP PICK</span>
          </div>
          <h3 className="font-heading text-xl text-accent-foreground mb-2">{topPick.title}</h3>
          <p className="text-accent-foreground/70 font-body text-sm leading-relaxed mb-3">
            {topPick.recommendation || topPick.reason}
          </p>
          <div className="flex items-center gap-3">
            {topPick.badge && (
              <span className={`px-2.5 py-0.5 rounded-pill text-[10px] font-body font-semibold ${badgeStyles[topPick.badge] || 'bg-muted'}`}>
                {topPick.badge}
              </span>
            )}
            {topPick.score != null && (
              <span className="text-primary text-sm font-body font-bold">Score: {topPick.score}</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Trend Grid */}
      {trends.length > 0 && (
        <motion.div variants={container} className="grid sm:grid-cols-2 gap-4">
          {trends.map((trend, idx) => (
            <motion.div
              key={trend.id || idx}
              variants={item}
              whileHover={{ scale: 1.01, y: -2 }}
              className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-warm transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2.5 py-0.5 rounded-pill text-[10px] font-body font-semibold ${badgeStyles[trend.badge] || 'bg-muted text-muted-foreground'}`}>
                  {trend.badge || trend.signal || 'NEW'}
                </span>
                {trend.score != null && (
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${
                    trend.score >= 90 ? 'border-primary text-primary' : 'border-rising text-rising'
                  }`}>
                    <span className="text-xs font-body font-bold">{trend.score}</span>
                  </div>
                )}
              </div>
              <h4 className="font-body font-semibold text-foreground mb-1">{trend.title}</h4>
              <p className="text-muted-foreground font-body text-xs leading-relaxed mb-3">{trend.description}</p>
              <p className="text-muted-foreground font-body text-xs">{trend.niche}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Opportunities section */}
      {opportunities.length > 0 && (
        <motion.div variants={item}>
          <h3 className="font-body font-semibold text-sm text-muted-foreground tracking-wider uppercase mb-4">
            Opportunities
          </h3>
          <div className="space-y-3">
            {opportunities.slice(0, 3).map((opp, idx) => (
              <div key={opp.id || idx} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-foreground truncate">{opp.title}</p>
                  <p className="text-muted-foreground font-body text-xs mt-0.5 line-clamp-1">{opp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Weekly Winners from competitor moves */}
      {weeklyWinners.length > 0 && (
        <motion.div variants={item}>
          <h3 className="font-body font-semibold text-sm text-muted-foreground tracking-wider uppercase mb-4">
            Competitor Moves
          </h3>
          <div className="space-y-3">
            {weeklyWinners.map((w, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rising/10 flex items-center justify-center flex-shrink-0">
                  <Users size={18} className="text-rising" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-foreground">{w.handle || w.creator}</p>
                  <p className="text-muted-foreground font-body text-xs mt-0.5">{w.insight || w.gap}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Inline competitor moves from intelligence feed */}
      {inlineCompetitorMoves.length > 0 && weeklyWinners.length === 0 && (
        <motion.div variants={item}>
          <h3 className="font-body font-semibold text-sm text-muted-foreground tracking-wider uppercase mb-4">
            What Competitors Are Doing
          </h3>
          <div className="space-y-3">
            {inlineCompetitorMoves.map((m, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl p-4">
                <p className="font-body text-sm text-foreground">{m.move || m.title || m}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}