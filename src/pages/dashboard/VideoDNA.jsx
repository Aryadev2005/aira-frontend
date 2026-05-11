import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Sparkles, ChevronDown, ChevronUp, TrendingUp, Eye, Clock, Scissors, Search, History, RefreshCw, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVideoDNA, useVideoDNAHistory, useCompetitorGap } from '@/hooks/useApi';

// ── Animation variants ─────────────────────────────────────────────────────
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } },
};

// ── History helpers ────────────────────────────────────────────────────────
function gradeColor(grade) {
  if (!grade) return 'bg-muted text-muted-foreground';
  if (grade.startsWith('A')) return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
  if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
  if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff  = Date.now() - new Date(dateStr).getTime();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins  = Math.floor(diff / 60000);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return 'just now';
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ScoreRing({ score, size = 80, label }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={size*0.08} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={size*0.08}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          fill="var(--foreground)" fontSize={size * 0.22} fontWeight="700">
          {score}
        </text>
      </svg>
      {label && <span className="text-xs text-muted-foreground font-body">{label}</span>}
    </div>
  );
}

function ScoreBar({ label, score }) {
  if (score === undefined || score === null) return null;
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-body text-sm text-foreground">{label}</span>
        <span className="font-body text-sm font-semibold">{score}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} />
      </div>
    </div>
  );
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-primary" />
          <span className="font-heading text-sm font-semibold text-foreground">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── History Card ───────────────────────────────────────────────────────────
// NOTE: API returns snake_case fields (video_id, video_title, channel_name,
// thumbnail_url, analysed_at) — do NOT use camelCase here.
function HistoryCard({ entry, onReanalyse }) {
  const {
    video_id,
    video_title,
    channel_name,
    score,
    grade,
    verdict,
    thumbnail_url,
    analysed_at,
  } = entry;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 group hover:border-border/60 transition-colors"
    >
      {/* Thumbnail */}
      {thumbnail_url
        ? <img src={thumbnail_url} alt={video_title} className="w-16 h-9 rounded-lg object-cover flex-shrink-0" />
        : <div className="w-16 h-9 rounded-lg bg-muted flex-shrink-0" />
      }

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body font-semibold text-foreground truncate">
          {video_title || video_id}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {channel_name && (
            <span className="text-xs text-muted-foreground font-body truncate">{channel_name}</span>
          )}
          {analysed_at && (
            <span className="text-xs text-muted-foreground font-body flex items-center gap-1 flex-shrink-0">
              <Clock size={10} />{timeAgo(analysed_at)}
            </span>
          )}
        </div>
        {verdict && (
          <p className="text-xs text-muted-foreground font-body italic mt-0.5 truncate">"{verdict}"</p>
        )}
      </div>

      {/* Score + grade + hover actions */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          {grade && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full font-body ${gradeColor(grade)}`}>
              {grade}
            </span>
          )}
          {score != null && (
            <span className="text-sm font-bold font-heading text-primary">{score}</span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onReanalyse(video_id)}
            title="Re-analyse"
            className="p-1.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
          >
            <RefreshCw size={12} />
          </button>
          <a
            href={`https://youtube.com/watch?v=${video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open on YouTube"
            className="p-1.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function VideoDNA() {
  const [url, setUrl]               = useState('');
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);
  const [nicheInput, setNicheInput] = useState('');
  const [gapResult, setGapResult]   = useState(null);
  const [gapError, setGapError]     = useState(null);

  const { mutateAsync: analyseVideo, isPending: analyzing } = useVideoDNA();
  const { mutateAsync: analyseGap,   isPending: gapLoading } = useCompetitorGap();

  // FIX 1: also grab refetch so we can update history right after an analysis
  const { data: historyData, refetch: refetchHistory } = useVideoDNAHistory();

  // FIX 2: axios wraps the response → historyData.data = { success, data: [...] }
  //        so the actual array lives at historyData?.data?.data, NOT historyData?.data
  const historyEntries = historyData?.data?.data ?? [];

  const extractVideoId = (input) => {
    const match = input.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const handleAnalyse = async () => {
    if (!url.trim()) return;
    setResult(null);
    setError(null);

    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    try {
      const data = await analyseVideo({ videoId });
      setResult(data.data);
      // FIX 3: refresh history so the new entry appears without a page reload
      refetchHistory();
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Analysis failed. Please try again.');
    }
  };

  // Clicking ↺ on a history card fills the URL input and scrolls to top
  const handleReanalyse = (videoId) => {
    setUrl(`https://youtube.com/watch?v=${videoId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGapAnalysis = async () => {
    if (!nicheInput.trim()) return;
    setGapResult(null);
    setGapError(null);
    try {
      const data = await analyseGap({ niche: nicheInput.trim() });
      setGapResult(data.data);
    } catch (e) {
      setGapError(e?.response?.data?.message ?? 'Gap analysis failed.');
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-10">

      {/* Header */}
      <motion.div variants={item}>
        <h1 className="font-heading text-2xl text-foreground mb-1">Video DNA</h1>
        <p className="text-muted-foreground font-body text-sm">
          Multimodal AI analysis — Hook · Retention · SEO · Value Density
        </p>
      </motion.div>

      {/* URL Input */}
      <motion.div variants={item} className="space-y-2">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Link2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyse()}
              placeholder="Paste YouTube URL here..."
              className="pl-10 bg-card border-border rounded-pill font-body text-sm h-11"
            />
          </div>
          <Button onClick={handleAnalyse} disabled={analyzing}
            className="bg-primary hover:bg-primary/90 text-white rounded-pill px-6 font-body font-semibold h-11">
            {analyzing
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="flex items-center gap-2"><Sparkles size={16} />Analyse</span>}
          </Button>
        </div>
        {error && <p className="text-destructive text-sm font-body">{error}</p>}
      </motion.div>

      {/* Loading State */}
      {analyzing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-xl p-6 text-center">
          <div className="w-10 h-10 mx-auto border-2 border-border border-t-primary rounded-full animate-spin mb-4" />
          <p className="font-heading text-lg text-foreground mb-3">ARIA is reading the DNA...</p>
          <div className="space-y-1.5 text-left max-w-xs mx-auto">
            {['Fetching YouTube metadata', 'Scraping replay heatmap', 'Running Hook Analyst', 'Running Retention Architect', 'Running SEO Strategist', 'Computing Value Density'].map((step, i) => (
              <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.35 }} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground text-xs font-body">{step}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Video meta card */}
          <div className="bg-muted rounded-xl p-4 flex gap-4">
            {result.thumbnailUrl && (
              <img src={result.thumbnailUrl} alt={result.videoTitle}
                className="w-28 h-16 rounded-lg object-cover flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-body font-semibold text-sm text-foreground truncate">{result.videoTitle}</p>
              <p className="text-muted-foreground text-xs font-body mt-0.5">
                {result.channelName} · {result.publishedAt} · {result.duration}
              </p>
              <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground font-body flex-wrap">
                <span>👁 {result.viewCount}</span>
                <span>❤️ {result.likeCount}</span>
                <span>💬 {result.commentCount}</span>
                <span>📊 {result.engagementRate}%</span>
                <span className={`px-2 py-0.5 rounded-full text-white text-xs ${
                  result.analysisEngine?.includes('v2') ? 'bg-green-600' : 'bg-yellow-600'
                }`}>
                  {result.analysisEngine?.includes('v2') ? '⚡ Deep' : '📊 Metadata'}
                </span>
              </div>
            </div>
          </div>

          {/* Overall Score */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <ScoreRing score={result.overallScore} size={100} label={result.scoreVerdict} />
                <span className="text-xs font-body font-bold text-primary mt-1">{result.grade}</span>
              </div>
              <div className="flex-1 space-y-3 w-full">
                <ScoreBar label="Hook Strength"    score={result.hookScore} />
                <ScoreBar label="Engagement Score" score={result.engagementScore} />
                <ScoreBar label="Content Quality"  score={result.contentQualityScore} />
                <ScoreBar label="SEO Score"        score={result.seoScore} />
              </div>
            </div>
            {result.engagementRate && (
              <div className="mt-4 flex gap-4 text-xs font-body text-muted-foreground flex-wrap">
                <span>📊 ER: <strong className="text-foreground">{result.engagementRate}%</strong></span>
                <span>⚡ vs Niche: <strong className="text-foreground">{result.erVsBenchmark}x</strong></span>
                <span>👁 Velocity: <strong className="text-foreground">{result.viewVelocityScore}/100</strong></span>
                <span>⏱ Duration: <strong className="text-foreground">{result.durationScore}/100</strong></span>
                <span className="text-green-500 text-[10px]">v2 deterministic</span>
              </div>
            )}
          </div>

          {/* Hook Analysis */}
          <CollapsibleSection title="Hook Analyst" icon={Sparkles} defaultOpen>
            <div className="space-y-3 pt-1">
              <div className="flex gap-4">
                <ScoreRing score={result.hookScore ?? 0} size={60} />
                <div className="flex-1">
                  <p className="text-sm font-body text-foreground">{result.hookAnalysis}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-body">
                    Hook Score: {result.hookScore}/100
                  </p>
                </div>
              </div>
              {result.improvedHook && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-body">Improved Hook:</p>
                  <p className="text-sm font-semibold font-body mt-0.5">{result.improvedHook}</p>
                </div>
              )}
              {result.actionItems?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground font-body">Action Items:</p>
                  {result.actionItems.map((actionItem, i) => (
                    <div key={i} className="flex gap-2 text-xs font-body text-muted-foreground">
                      <span className="text-primary">→</span><span>{actionItem}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Next Video Suggestion */}
          <CollapsibleSection title="Next Video Suggestion" icon={Eye}>
            <div className="space-y-3 pt-1">
              {result.nextVideoSuggestion && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-body">Suggested Next Video:</p>
                  <p className="text-sm font-semibold font-body mt-0.5">{result.nextVideoSuggestion}</p>
                </div>
              )}
              {result.nextVideoReason && (
                <p className="text-sm font-body text-foreground">{result.nextVideoReason}</p>
              )}
            </div>
          </CollapsibleSection>

          {/* SEO & Viral Strategy */}
          <CollapsibleSection title="SEO & Viral Strategy" icon={TrendingUp}>
            <div className="space-y-3 pt-1">
              {result.betterTitle && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-body">Optimised Title:</p>
                  <p className="text-sm font-semibold font-body mt-0.5">{result.betterTitle}</p>
                </div>
              )}
              {result.titleAnalysis && (
                <p className="text-sm font-body text-foreground">{result.titleAnalysis}</p>
              )}
              {result.benchmarkStats?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold font-body mb-1">Benchmark Stats:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.benchmarkStats.map((stat, i) => (
                      <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-body">{stat}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Shorts Opportunities */}
          {result.shortsOpportunities?.length > 0 && (
            <CollapsibleSection title={`Shorts Opportunities (${result.shortsOpportunities.length})`} icon={Scissors}>
              <div className="space-y-3 pt-1">
                {result.shortsOpportunities.map((opp, i) => (
                  <div key={i} className="bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold font-body text-foreground">
                        {Math.floor(opp.start / 60)}:{String(opp.start % 60).padStart(2, '0')} –&nbsp;
                        {Math.floor(opp.end   / 60)}:{String(opp.end   % 60).padStart(2, '0')}
                      </span>
                      <span className="text-xs text-primary font-body">Viral Score: {opp.viralScore}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-body">{opp.reason}</p>
                    <p className="text-xs font-body mt-1 bg-card rounded p-2 text-foreground">{opp.caption}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* ARIA Insight */}
          <CollapsibleSection title="ARIA Insight" icon={Clock}>
            <div className="space-y-2 pt-1">
              <p className="text-sm font-body text-foreground">{result.ariaInsight}</p>
              {result.benchmarkAnalysis && (
                <div className="bg-muted rounded-lg p-3 mt-2">
                  <p className="text-xs text-muted-foreground font-body">Benchmark Analysis:</p>
                  <p className="text-sm font-body mt-0.5">{result.benchmarkAnalysis}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>

        </motion.div>
      )}

      {/* Competitor Gap Analysis */}
      <motion.div variants={item} className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground mb-1 flex items-center gap-2">
            <Search size={16} className="text-primary" /> Competitor Gap Analysis
          </h2>
          <p className="text-xs text-muted-foreground font-body">
            ARIA analyses the top 10 videos in your niche and finds the topic no one has covered.
          </p>
        </div>
        <div className="flex gap-3">
          <Input
            value={nicheInput}
            onChange={(e) => setNicheInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGapAnalysis()}
            placeholder="e.g. personal finance, skincare, tech reviews"
            className="bg-background border-border rounded-pill font-body text-sm h-10"
          />
          <Button onClick={handleGapAnalysis} disabled={gapLoading}
            variant="outline" className="rounded-pill px-5 font-body text-sm h-10">
            {gapLoading
              ? <div className="w-4 h-4 border-2 border-border border-t-foreground rounded-full animate-spin" />
              : 'Analyse'}
          </Button>
        </div>
        {gapError && <p className="text-destructive text-sm font-body">{gapError}</p>}

        {gapResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {/* Platform source badges */}
            {gapResult.platformsAnalysed?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-body">Analysed from:</span>
                {gapResult.platformsAnalysed.map((p) => (
                  <span key={p}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-body font-medium">
                    {p === 'Instagram Reels' ? '🎬' : '📺'} {p}
                    {p === 'Instagram Reels' && gapResult.instagramReelsCount > 0
                      ? ` (${gapResult.instagramReelsCount})` : ''}
                    {p === 'YouTube' && gapResult.youtubeVideosCount > 0
                      ? ` (${gapResult.youtubeVideosCount})` : ''}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <ScoreRing score={gapResult.opportunityScore} size={60} label="Opportunity" />
              <p className="text-sm font-body text-foreground">
                Analysed <strong>{gapResult.videosAnalysed}</strong> top
                {gapResult.platformsAnalysed?.length > 1 ? ' posts' : ' videos'} in{' '}
                <strong>{gapResult.niche}</strong>.
                Avg engagement: <strong>{gapResult.avgEngagementRate}%</strong>
              </p>
            </div>

            {gapResult.missedTopics?.length > 0 && (
              <div>
                <p className="text-xs font-semibold font-body text-green-500 mb-1.5">🎯 Untouched Topics (Your Opportunity):</p>
                <div className="flex flex-wrap gap-1.5">
                  {gapResult.missedTopics.map((t, i) => (
                    <span key={i} className="bg-green-500/10 text-green-600 text-xs px-2 py-0.5 rounded-full font-body">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {gapResult.overservedTopics?.length > 0 && (
              <div>
                <p className="text-xs font-semibold font-body text-red-500 mb-1.5">🚫 Saturated (Avoid):</p>
                <div className="flex flex-wrap gap-1.5">
                  {gapResult.overservedTopics.map((t, i) => (
                    <span key={i} className="bg-destructive/10 text-destructive text-xs px-2 py-0.5 rounded-full font-body">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {gapResult.scriptTemplate && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-xs font-semibold font-body mb-2">📝 ARIA Script Template:</p>
                <pre className="text-xs font-body text-foreground whitespace-pre-wrap leading-relaxed">
                  {gapResult.scriptTemplate}
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ── Recent Analyses (History) ──────────────────────────────────────
          Root cause of history not showing was two bugs in the original:
          1. historyData?.data → wrong nesting. Axios wraps response so the
             array lives at historyData?.data?.data (success wrapper inside).
          2. Field names were camelCase (item.videoId) but the API returns
             snake_case (video_id, video_title, thumbnail_url, analysed_at).
          Both are fixed via historyEntries derived above + HistoryCard below.
      ───────────────────────────────────────────────────────────────────── */}
      {historyEntries.length > 0 && (
        <motion.div variants={item} className="space-y-3">
          <div className="flex items-center gap-2">
            <History size={15} className="text-muted-foreground" />
            <h2 className="font-heading text-base font-semibold text-foreground">Recent Analyses</h2>
            <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-body">
              {historyEntries.length}
            </span>
          </div>
          <div className="space-y-2">
            {historyEntries.map((entry, i) => (
              <HistoryCard
                key={entry.video_id ?? i}
                entry={entry}
                onReanalyse={handleReanalyse}
              />
            ))}
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
