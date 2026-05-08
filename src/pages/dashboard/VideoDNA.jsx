import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Sparkles, ChevronDown, ChevronUp, TrendingUp, Eye, Clock, Scissors, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVideoDNA, useVideoDNAHistory, useCompetitorGap } from '@/hooks/useApi';

// ── Animation variants ─────────────────────────────────────────────────────
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } },
};

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
  const { data: historyData } = useVideoDNAHistory();

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
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Analysis failed. Please try again.');
    }
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
                  result.analysisType === 'deep_multimodal' ? 'bg-green-600' : 'bg-yellow-600'
                }`}>
                  {result.analysisType === 'deep_multimodal' ? '⚡ Deep' : '📊 Metadata'}
                </span>
              </div>
            </div>
          </div>

          {/* Overall Score */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing score={result.overallScore} size={100} label={result.scoreVerdict} />
              <div className="flex-1 space-y-3 w-full">
                <ScoreBar label="Hook Strength"      score={result.hookAnalysis?.hookScore} />
                <ScoreBar label="Retention Score"    score={result.retentionAnalysis?.retentionScore} />
                <ScoreBar label="SEO & Viral Score"  score={result.seoViralAnalysis?.seoScore} />
                <ScoreBar label="Value Density"      score={result.valueDensityAnalysis?.valueDensityScore} />
              </div>
            </div>
          </div>

          {/* Hook Analysis */}
          <CollapsibleSection title="Hook Analyst" icon={Sparkles} defaultOpen>
            <div className="space-y-3 pt-1">
              <div className="flex gap-4">
                <ScoreRing score={result.hookAnalysis?.hookScore ?? 0} size={60} />
                <div className="flex-1">
                  <p className="text-sm font-body text-foreground">{result.hookAnalysis?.ariaVerdict}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-body">
                    Title/Thumb alignment: {result.hookAnalysis?.thumbnailTitleAlignment}/100
                  </p>
                </div>
              </div>
              {result.hookAnalysis?.improvements?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground font-body">Fixes:</p>
                  {result.hookAnalysis.improvements.map((fix, i) => (
                    <div key={i} className="flex gap-2 text-xs font-body text-muted-foreground">
                      <span className="text-primary">→</span><span>{fix}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Retention Analysis */}
          <CollapsibleSection title="Retention Architect" icon={Eye}>
            <div className="space-y-3 pt-1">
              <p className="text-sm font-body text-foreground">{result.retentionAnalysis?.pacingVerdict}</p>
              {result.retentionAnalysis?.dropOffEvents?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold font-body">Drop-off Events:</p>
                  {result.retentionAnalysis.dropOffEvents.map((ev, i) => (
                    <div key={i} className="bg-muted rounded-lg p-3 text-xs font-body">
                      <p className="font-semibold text-destructive">⬇ At {ev.timestamp}s — {ev.reason}</p>
                      <p className="text-muted-foreground mt-1">Fix: {ev.fix}</p>
                    </div>
                  ))}
                </div>
              )}
              {result.retentionAnalysis?.talkingHeadWarning && (
                <p className="text-xs text-yellow-500 font-body">
                  ⚠️ Too much talking-head footage. Add B-roll every 15-20 seconds.
                </p>
              )}
              {result.hasHeatmap && (
                <p className="text-xs text-green-500 font-body">✓ Powered by real YouTube replay heatmap data</p>
              )}
            </div>
          </CollapsibleSection>

          {/* SEO & Viral */}
          <CollapsibleSection title="SEO & Viral Strategy" icon={TrendingUp}>
            <div className="space-y-3 pt-1">
              {result.seoViralAnalysis?.titleOptimization && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-body">Optimised Title:</p>
                  <p className="text-sm font-semibold font-body mt-0.5">{result.seoViralAnalysis.titleOptimization}</p>
                </div>
              )}
              {result.seoViralAnalysis?.missingKeywords?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold font-body mb-1">Missing Keywords:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.seoViralAnalysis.missingKeywords.map((kw, i) => (
                      <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-body">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.seoViralAnalysis?.tagSuggestions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold font-body mb-1">Suggested Tags:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.seoViralAnalysis.tagSuggestions.map((tag, i) => (
                      <span key={i} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-body">{tag}</span>
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
                        {Math.floor(opp.start / 60)}:{String(opp.start % 60).padStart(2,'0')} –
                        {Math.floor(opp.end / 60)}:{String(opp.end % 60).padStart(2,'0')}
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

          {/* Value Density / Cheat Sheet */}
          <CollapsibleSection title="Value Density Cheat Sheet" icon={Clock}>
            <div className="space-y-2 pt-1">
              <p className="text-sm font-body text-foreground">{result.valueDensityAnalysis?.contentSummary}</p>
              {result.valueDensityAnalysis?.cheatSheet?.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {result.valueDensityAnalysis.cheatSheet.map((point, i) => (
                    <div key={i} className="flex gap-2 text-xs font-body">
                      <span className="text-muted-foreground w-10 flex-shrink-0">
                        {Math.floor(point.timestamp / 60)}:{String(point.timestamp % 60).padStart(2,'0')}
                      </span>
                      <span className="text-foreground">{point.point}</span>
                    </div>
                  ))}
                </div>
              )}
              {result.valueDensityAnalysis?.fluffTimestamps?.length > 0 && (
                <p className="text-xs text-yellow-500 font-body">
                  ⚠️ Fluff detected at: {result.valueDensityAnalysis.fluffTimestamps.map(t =>
                    `${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`).join(', ')}
                </p>
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
            <div className="flex items-center gap-3">
              <ScoreRing score={gapResult.opportunityScore} size={60} label="Opportunity" />
              <p className="text-sm font-body text-foreground">
                Analysed <strong>{gapResult.videosAnalysed}</strong> top videos in <strong>{gapResult.niche}</strong>.
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

      {/* History */}
      {historyData?.data?.length > 0 && (
        <motion.div variants={item}>
          <h2 className="font-heading text-base font-semibold text-foreground mb-3">Recent Analyses</h2>
          <div className="space-y-2">
            {historyData.data.slice(0, 5).map((item) => (
              <div key={item.videoId}
                className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setUrl(`https://youtube.com/watch?v=${item.videoId}`)}>
                {item.thumbnailUrl && (
                  <img src={item.thumbnailUrl} alt={item.videoTitle}
                    className="w-16 h-9 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-semibold text-foreground truncate">{item.videoTitle}</p>
                  <p className="text-xs text-muted-foreground font-body">{item.channelName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-primary font-body">{item.score}</p>
                  <p className="text-xs text-muted-foreground font-body">{item.verdict}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}