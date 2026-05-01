import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVideoDNA, useVideoDNAHistory } from '@/hooks/useApi';

function ScoreRing({ score, size = 80, label }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = score >= 85 ? 'text-rising' : score >= 70 ? 'text-primary' : 'text-destructive';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-heading text-xl ${color}`}>{score}</span>
        </div>
      </div>
      {label && <span className="text-muted-foreground text-xs font-body">{label}</span>}
    </div>
  );
}

function ScoreBar({ label, score }) {
  const color = score >= 85 ? 'bg-rising' : score >= 70 ? 'bg-primary' : 'bg-destructive';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-body text-sm text-foreground">{label}</span>
        <span className="font-body text-sm font-semibold text-foreground">{score}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </div>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
};

export default function VideoDNA() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [analyzeError, setAnalyzeError] = useState(null);

  const { mutateAsync: analyseVideo, isPending: analyzing } = useVideoDNA();
  const { data: historyData } = useVideoDNAHistory();

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setResult(null);
    setAnalyzeError(null);

    // Extract video ID from URL — backend expects { videoId: string }
    const videoIdMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    );
    if (!videoIdMatch) {
      setAnalyzeError('Please enter a valid YouTube URL (youtube.com or youtu.be)');
      return;
    }

    try {
      const data = await analyseVideo({ videoId: videoIdMatch[1] });
      setResult(data.data);
    } catch (e) {
      console.error('Analysis failed', e);
      setAnalyzeError(e?.response?.data?.message || 'Analysis failed. Please try again.');
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="font-heading text-2xl text-foreground mb-1">Video DNA</h1>
        <p className="text-muted-foreground font-body text-sm">Analyse any YouTube video instantly</p>
      </motion.div>

      <motion.div variants={item} className="space-y-2">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Link2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Paste YouTube URL here..."
              className="pl-10 bg-card border-border rounded-pill font-body text-sm h-11"
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="bg-primary hover:bg-primary/90 text-white rounded-pill px-6 font-body font-semibold shadow-warm h-11"
          >
            {analyzing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={16} /> Analyse
              </span>
            )}
          </Button>
        </div>
        {analyzeError && (
          <p className="text-destructive text-sm font-body">{analyzeError}</p>
        )}
      </motion.div>

      {analyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-xl p-6 text-center"
        >
          <div className="w-10 h-10 mx-auto border-3 border-border border-t-primary rounded-full animate-spin mb-4" />
          <p className="font-heading text-lg text-foreground mb-3">AIRA is reading the DNA...</p>
          <div className="space-y-2 text-left max-w-xs mx-auto">
            {['Extracting video data', 'Analysing hook strength', 'Checking SEO signals', 'Comparing with niche'].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.4 }}
                className="flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground text-xs font-body">{step}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Video metadata */}
          {result.videoTitle && (
            <div className="bg-muted rounded-xl p-4">
              <p className="font-body font-semibold text-sm text-foreground">{result.videoTitle}</p>
              <p className="text-muted-foreground text-xs font-body mt-1">
                {result.channelName} · {result.publishedAt} · {result.duration}
              </p>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground font-body">
                <span>👁 {result.viewCount}</span>
                <span>❤️ {result.likeCount}</span>
                <span>💬 {result.commentCount}</span>
                <span>📊 {result.engagementRate}%</span>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing score={result.overallScore} size={100} label="Overall Score" />
              <div className="flex-1 space-y-4 w-full">
                {/* Backend returns hookScore, titleScore, benchmarkScore */}
                <ScoreBar label="Hook Strength" score={result.hookScore ?? result.hookStrength ?? 0} />
                <ScoreBar label="Title SEO" score={result.titleScore ?? result.titleSEO ?? 0} />
                <ScoreBar label="Niche Benchmark" score={result.benchmarkScore ?? result.nicheBenchmark ?? 0} />
              </div>
            </div>
            {result.scoreSummary && (
              <p className="text-muted-foreground font-body text-sm mt-4 leading-relaxed">{result.scoreSummary}</p>
            )}
          </div>

          <div className="bg-accent text-accent-foreground rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-primary" />
              <span className="font-body font-semibold text-sm">ARIA Says</span>
            </div>
            {/* Backend returns ariaInsight, not ariaSays */}
            <p className="text-accent-foreground/80 font-body text-sm leading-relaxed">
              {result.ariaInsight || result.ariaSays}
            </p>
          </div>

          {result.actionItems?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h4 className="font-body font-semibold text-sm text-foreground mb-3">✅ Action Items</h4>
              <ul className="space-y-2">
                {result.actionItems.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary font-body text-sm font-semibold mt-0.5">{i + 1}.</span>
                    <p className="text-muted-foreground font-body text-sm">{action}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-6">
            <h4 className="font-body font-semibold text-sm text-foreground mb-2">🎬 Next Video Suggestion</h4>
            {/* Backend returns nextVideoSuggestion + nextVideoReason */}
            <p className="font-body font-semibold text-sm text-primary mb-1">
              {result.nextVideoSuggestion || result.nextVideo}
            </p>
            {result.nextVideoReason && (
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{result.nextVideoReason}</p>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}