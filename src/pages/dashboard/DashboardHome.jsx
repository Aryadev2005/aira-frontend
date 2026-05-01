import React from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import DailyBrief from '@/components/dashboard/DailyBrief';
import WorkflowCards from '@/components/dashboard/WorkflowCards';
import TrendCard from '@/components/dashboard/TrendCard';
import SongCard from '@/components/dashboard/SongCard';
import { useTrends, useSongs, useProfile, useAnalyticsDashboard, useBrainGreet } from '@/hooks/useApi';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
};

function StatSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-card border border-border rounded-xl p-4 text-center animate-pulse">
          <div className="h-7 bg-muted rounded-lg mx-auto w-16 mb-2" />
          <div className="h-3 bg-muted rounded mx-auto w-20" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardHome() {
  const { data: profileData } = useProfile();
  const { dbUser } = useFirebaseAuth();

  const niche = profileData?.data?.user?.niches?.[0] || 'Lifestyle';
  const platform = profileData?.data?.user?.primary_platform || 'Instagram';
  const displayName = dbUser?.name || profileData?.data?.user?.name || 'Creator';

  const { data: trendsData, isLoading: trendsLoading } = useTrends({ niche });
  const { data: songsData, isLoading: songsLoading } = useSongs({ niche, platform });
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useAnalyticsDashboard();
  const { data: greetData } = useBrainGreet({ sessionId: 'dashboard' });

  const trends = trendsData?.data?.trends || [];
  const songs = songsData?.data?.songs || [];
  const analytics = analyticsData?.data;

  // Build stats from real analytics data; fall back to null so we can show skeleton
  const stats = analytics
    ? [
        { value: analytics.trendLeadHours ? `${analytics.trendLeadHours}h` : (analytics.growthStage || '—'), label: 'Trend lead' },
        { value: analytics.healthScore != null ? `${analytics.healthScore}` : (analytics.currentHealthScore ?? '—'), label: 'Health score' },
        { value: analytics.contentIdeas ?? analytics.weeklyIdeas ?? '—', label: 'Content ideas' },
      ]
    : null;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground font-body text-sm">{getGreeting()} 👋</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-foreground mt-1">
            {greetData?.data?.greeting
              ? greetData.data.greeting.split(/[.!?]/)[0].trim()
              : `Hi, ${displayName}!`}
          </h1>
        </div>
        <button className="p-2.5 rounded-lg bg-card border border-border hover:shadow-warm-sm transition-shadow">
          <Bell size={18} className="text-muted-foreground" />
        </button>
      </motion.div>

      <motion.div variants={item}>
        <DailyBrief />
      </motion.div>

      <motion.div variants={item}>
        <WorkflowCards />
      </motion.div>

      {/* Stats */}
      <motion.div variants={item}>
        <h3 className="font-body font-semibold text-sm text-muted-foreground tracking-wider uppercase mb-4">
          AIRA Stats
        </h3>
        {analyticsLoading ? (
          <StatSkeleton />
        ) : analyticsError ? (
          <div className="text-destructive text-sm font-body">Could not load data</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {(stats || []).map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="font-heading text-2xl text-primary">{s.value}</p>
                <p className="text-muted-foreground text-xs font-body mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Trending */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-body font-semibold text-sm text-muted-foreground tracking-wider uppercase">
            Trending for you
          </h3>
          <Link to="/dashboard/discover" className="text-primary text-xs font-body font-semibold hover:underline">
            See all →
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {trendsLoading ? (
            [1, 2, 3].map(i => <div key={i} className="min-w-[200px] h-40 bg-muted rounded-xl animate-pulse" />)
          ) : (
            trends.slice(0, 5).map((t) => (
              <TrendCard key={t.id} trend={t} />
            ))
          )}
        </div>
      </motion.div>

      {/* Songs */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-body font-semibold text-sm text-muted-foreground tracking-wider uppercase">
            Songs trending now
          </h3>
          <Link to="/dashboard/songs" className="text-primary text-xs font-body font-semibold hover:underline">
            See all →
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {songsLoading ? (
            [1, 2, 3].map(i => <div key={i} className="min-w-[200px] h-20 bg-muted rounded-xl animate-pulse" />)
          ) : (
            songs.slice(0, 5).map((s) => (
              <SongCard key={s.id} song={s} />
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}