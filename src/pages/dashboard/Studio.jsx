import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Sparkles, Music, Scissors, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  useGenerateContent,
  useScriptStructure,
  useBGMMatch,
  useEditingHelp,
} from '@/hooks/useApi';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

const platforms = ['Instagram', 'YouTube'];
const types = ['Reel', 'Carousel', 'Short', 'Video'];
const TABS = [
  { id: 'generate', label: 'Generate', icon: Sparkles },
  { id: 'script', label: 'Script Structure', icon: FileText },
  { id: 'bgm', label: 'BGM Match', icon: Music },
  { id: 'editing', label: 'Editing Help', icon: Scissors },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
      {copied ? <Check size={14} className="text-rising" /> : <Copy size={14} className="text-muted-foreground" />}
    </button>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
};

// ── Generate Tab ──────────────────────────────────────────────────────────────
function GenerateTab({ dbUser }) {
  const [platform, setPlatform] = useState('Instagram');
  const [type, setType] = useState('Reel');
  const [idea, setIdea] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const { mutateAsync: generateContent, isPending: generating } = useGenerateContent();

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setError(null);
    try {
      const res = await generateContent({
        trendTitle: idea,
        niche: dbUser?.niches?.[0] || 'Lifestyle',
        platform,
        followerRange: dbUser?.follower_range || '1K-10K',
        contentFormat: type,
      });

      const data = res.data;
      setResult({
        hook: data.hooks?.[0] || data.title || '',
        script: Array.isArray(data.script) ? data.script.join('\n') : data.script || '',
        caption: data.caption || '',
        hashtags: typeof data.hashtags === 'object' ? Object.values(data.hashtags).flat().join(' ') : data.hashtags || '',
        bestTime: data.ai_tip || 'Check analytics for best time',
      });
    } catch (e) {
      console.error('Generation failed', e);
      setError('Could not generate content. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="font-body text-sm font-medium text-foreground mb-2 block">Platform</label>
        <div className="flex gap-2">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-4 py-2 rounded-pill text-sm font-body font-semibold transition-colors ${
                platform === p ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="font-body text-sm font-medium text-foreground mb-2 block">Content Type</label>
        <div className="flex gap-2 flex-wrap">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-pill text-sm font-body font-semibold transition-colors ${
                type === t ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="font-body text-sm font-medium text-foreground mb-2 block">Your Idea</label>
        <Textarea
          placeholder="e.g. Street food vendor in Old Delhi who's been making chaat for 30 years..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          className="bg-card border-border rounded-xl font-body text-sm min-h-[100px] resize-none"
        />
      </div>

      {error && <p className="text-destructive text-sm font-body">{error}</p>}

      <Button
        onClick={handleGenerate}
        disabled={generating}
        className="bg-primary hover:bg-primary/90 text-white rounded-pill px-8 font-body font-semibold shadow-warm"
      >
        {generating ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles size={16} /> Generate Script
          </span>
        )}
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {[
            { label: '🎣 Hook', content: result.hook },
            { label: '📝 Script', content: result.script },
            { label: '💬 Caption', content: result.caption },
            { label: '#️⃣ Hashtags', content: result.hashtags },
            { label: '⏰ Best Time', content: result.bestTime },
          ].map((card) => (
            <div key={card.label} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body font-semibold text-sm text-foreground">{card.label}</span>
                <CopyButton text={card.content} />
              </div>
              <p className="text-foreground/80 font-body text-sm leading-relaxed whitespace-pre-line">{card.content}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ── Script Structure Tab ──────────────────────────────────────────────────────
function ScriptTab({ dbUser }) {
  const [idea, setIdea] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { mutateAsync: getStructure, isPending } = useScriptStructure();

  const handle = async () => {
    if (!idea.trim()) return;
    setError(null);
    try {
      const res = await getStructure({
        idea,
        platform: dbUser?.primary_platform || 'instagram',
        niche: dbUser?.niches?.[0] || 'general',
      });
      setResult(res.data);
    } catch (e) {
      console.error('Script structure failed', e);
      setError('Could not load data');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="font-body text-sm font-medium text-foreground mb-2 block">Content Idea</label>
        <Textarea
          placeholder="Describe your content idea..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          className="bg-card border-border rounded-xl font-body text-sm min-h-[100px] resize-none"
        />
      </div>
      {error && <p className="text-destructive text-sm font-body">{error}</p>}
      <Button
        onClick={handle}
        disabled={isPending}
        className="bg-primary hover:bg-primary/90 text-white rounded-pill px-8 font-body font-semibold shadow-warm"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...
          </span>
        ) : (
          <span className="flex items-center gap-2"><FileText size={16} /> Get Script Structure</span>
        )}
      </Button>
      {isPending && <div className="animate-pulse bg-muted rounded-xl h-32" />}
      {result && !isPending && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {result.sections?.map((section, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body font-semibold text-sm text-foreground">{section.label || section.name}</span>
                {section.duration && <span className="text-xs text-muted-foreground font-body">{section.duration}</span>}
              </div>
              <p className="text-foreground/80 font-body text-sm leading-relaxed">{section.content || section.description}</p>
              {section.tip && <p className="text-primary font-body text-xs mt-2">💡 {section.tip}</p>}
            </div>
          ))}
          {result.overallTip && (
            <div className="bg-accent text-accent-foreground rounded-xl p-4 font-body text-sm">
              <span className="font-semibold">ARIA says: </span>{result.overallTip}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ── BGM Match Tab ─────────────────────────────────────────────────────────────
function BGMTab({ dbUser }) {
  const [idea, setIdea] = useState('');
  const [mood, setMood] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { mutateAsync: matchBGM, isPending } = useBGMMatch();

  const handle = async () => {
    if (!idea.trim()) return;
    setError(null);
    try {
      const res = await matchBGM({
        idea,
        mood,
        platform: dbUser?.primary_platform || 'instagram',
        niche: dbUser?.niches?.[0] || 'general',
      });
      setResult(res.data);
    } catch (e) {
      console.error('BGM match failed', e);
      setError('Could not load data');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="font-body text-sm font-medium text-foreground mb-2 block">Content Idea</label>
        <Textarea
          placeholder="What is this content about?"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          className="bg-card border-border rounded-xl font-body text-sm min-h-[80px] resize-none"
        />
      </div>
      <div>
        <label className="font-body text-sm font-medium text-foreground mb-2 block">Mood (optional)</label>
        <Input
          placeholder="e.g. energetic, calm, emotional..."
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="bg-card border-border rounded-xl font-body text-sm"
        />
      </div>
      {error && <p className="text-destructive text-sm font-body">{error}</p>}
      <Button
        onClick={handle}
        disabled={isPending}
        className="bg-primary hover:bg-primary/90 text-white rounded-pill px-8 font-body font-semibold shadow-warm"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Matching...
          </span>
        ) : (
          <span className="flex items-center gap-2"><Music size={16} /> Match BGM</span>
        )}
      </Button>
      {isPending && <div className="animate-pulse bg-muted rounded-xl h-32" />}
      {result && !isPending && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {result.suggestions?.map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5">
              <p className="font-body font-semibold text-sm text-foreground mb-1">{s.name || s.track}</p>
              <p className="text-muted-foreground font-body text-xs">{s.reason || s.description}</p>
              {s.bpm && <p className="text-primary font-body text-xs mt-1">🎵 {s.bpm} BPM · {s.mood}</p>}
            </div>
          ))}
          {result.ariaNote && (
            <div className="bg-accent text-accent-foreground rounded-xl p-4 font-body text-sm">
              {result.ariaNote}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ── Editing Help Tab ──────────────────────────────────────────────────────────
function EditingTab({ dbUser }) {
  const [problem, setProblem] = useState('');
  const [tool, setTool] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { mutateAsync: getEditingHelp, isPending } = useEditingHelp();

  const handle = async () => {
    if (!problem.trim() || !tool.trim()) return;
    setError(null);
    try {
      const res = await getEditingHelp({ problem, tool });
      setResult(res.data);
    } catch (e) {
      console.error('Editing help failed', e);
      setError('Could not load data');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="font-body text-sm font-medium text-foreground mb-2 block">Editing Tool</label>
        <Input
          placeholder="e.g. CapCut, Premiere Pro, DaVinci..."
          value={tool}
          onChange={(e) => setTool(e.target.value)}
          className="bg-card border-border rounded-xl font-body text-sm"
        />
      </div>
      <div>
        <label className="font-body text-sm font-medium text-foreground mb-2 block">Problem / Question</label>
        <Textarea
          placeholder="Describe the editing problem you're facing..."
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          className="bg-card border-border rounded-xl font-body text-sm min-h-[100px] resize-none"
        />
      </div>
      {error && <p className="text-destructive text-sm font-body">{error}</p>}
      <Button
        onClick={handle}
        disabled={isPending || !problem.trim() || !tool.trim()}
        className="bg-primary hover:bg-primary/90 text-white rounded-pill px-8 font-body font-semibold shadow-warm"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Getting help...
          </span>
        ) : (
          <span className="flex items-center gap-2"><Scissors size={16} /> Get Editing Help</span>
        )}
      </Button>
      {isPending && <div className="animate-pulse bg-muted rounded-xl h-32" />}
      {result && !isPending && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {result.steps?.map((step, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5">
              <p className="font-body font-semibold text-sm text-primary mb-1">Step {i + 1}</p>
              <p className="text-foreground/80 font-body text-sm leading-relaxed">{step}</p>
            </div>
          ))}
          {result.tips?.length > 0 && (
            <div className="bg-accent text-accent-foreground rounded-xl p-4">
              <p className="font-body font-semibold text-sm mb-2">Pro Tips</p>
              {result.tips.map((tip, i) => (
                <p key={i} className="font-body text-sm text-accent-foreground/80 mb-1">• {tip}</p>
              ))}
            </div>
          )}
          {result.summary && (
            <div className="bg-card border border-border rounded-xl p-4 font-body text-sm text-foreground/80">
              {result.summary}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ── Main Studio Component ─────────────────────────────────────────────────────
export default function Studio() {
  const [activeTab, setActiveTab] = useState('generate');
  const { dbUser } = useFirebaseAuth();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="font-heading text-2xl text-foreground mb-1">Studio</h1>
        <p className="text-muted-foreground font-body text-sm">Generate scripts, hooks, BGM & editing help</p>
      </motion.div>

      {/* Tab navigation */}
      <motion.div variants={item} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-body font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </motion.div>

      <motion.div variants={item}>
        {activeTab === 'generate' && <GenerateTab dbUser={dbUser} />}
        {activeTab === 'script' && <ScriptTab dbUser={dbUser} />}
        {activeTab === 'bgm' && <BGMTab dbUser={dbUser} />}
        {activeTab === 'editing' && <EditingTab dbUser={dbUser} />}
      </motion.div>
    </motion.div>
  );
}