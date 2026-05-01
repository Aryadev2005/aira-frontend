import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Handshake, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLaunchTiming, useLaunchPackage, useBrandAlert, useProfile } from '@/hooks/useApi';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function Launch() {
  const { data: profileData } = useProfile();
  const {
    data: timingData,
    isLoading: timingLoading,
    error: timingError,
  } = useLaunchTiming();
  const {
    data: brandAlertData,
    isLoading: brandLoading,
    error: brandError,
  } = useBrandAlert();
  const { mutateAsync: generatePackage, isPending: packageLoading } = useLaunchPackage();

  const [sessionIdea, setSessionIdea] = useState('');
  const [postingPackage, setPostingPackage] = useState(null);
  const [packageError, setPackageError] = useState(null);

  // timing data shape: { bestSlots: [...] } or { instagram: { monday: [...] }, bestDay, bestTime }
  const timing = timingData?.data;
  // brand data shape: { brandOpportunities: [...], pitchTemplate: { subject, body } }
  const brandData = brandAlertData?.data;

  const handleGeneratePackage = async () => {
    setPackageError(null);
    try {
      const data = await generatePackage({
        idea: sessionIdea || 'general content',
        platform: profileData?.data?.user?.primary_platform || 'instagram',
        niche: profileData?.data?.user?.niches?.[0] || 'lifestyle',
      });
      setPostingPackage(data?.data);
    } catch (e) {
      console.error('Package generation failed', e);
      setPackageError('Could not generate package. Please try again.');
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="font-heading text-2xl text-foreground mb-1">Launch</h1>
        <p className="text-muted-foreground font-body text-sm">Timing intelligence &amp; brand deals</p>
      </motion.div>

      {/* ── Posting Timing ── */}
      <motion.div variants={item}>
        <h3 className="font-body font-semibold text-sm text-muted-foreground tracking-wider uppercase mb-4">
          Best Posting Times
        </h3>
        {timingLoading ? (
          <div className="animate-pulse bg-muted rounded-xl h-32" />
        ) : timingError ? (
          <div className="text-destructive text-sm font-body">Could not load data</div>
        ) : timing ? (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            {/* bestSlots array shape */}
            {timing.bestSlots?.length > 0 && (
              <div className="space-y-2">
                {timing.bestSlots.map((slot, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-body text-sm text-foreground capitalize">{slot.day || slot.label}</span>
                    <span className="font-body font-semibold text-primary text-sm">{slot.time}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Weekly schedule shape */}
            {timing.bestDay && (
              <>
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl">
                  <Clock size={18} className="text-primary" />
                  <div>
                    <p className="font-body font-semibold text-sm text-foreground">Best: {timing.bestDay} at {timing.bestTime}</p>
                    {timing.timezone && <p className="text-xs text-muted-foreground font-body">{timing.timezone}</p>}
                  </div>
                </div>
                {timing.note && <p className="text-muted-foreground font-body text-xs">{timing.note}</p>}
                {/* Day-by-day grid */}
                {timing.instagram && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {DAYS.filter(d => timing.instagram[d]).map((day) => (
                      <div key={day} className="bg-muted rounded-lg p-2 text-center">
                        <p className="text-xs font-body font-semibold text-foreground capitalize">{day.slice(0, 3)}</p>
                        {timing.instagram[day]?.slice(0, 2).map((t, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground font-body">{t}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}
      </motion.div>

      {/* ── Auto Posting Package ── */}
      <motion.div variants={item}>
        <h3 className="font-body font-semibold text-sm text-muted-foreground tracking-wider uppercase mb-4">
          Auto Posting Package
        </h3>
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-2 block">Content Idea (optional)</label>
            <Textarea
              placeholder="Describe your content idea, or leave blank for AI to decide..."
              value={sessionIdea}
              onChange={(e) => setSessionIdea(e.target.value)}
              className="bg-background border-border rounded-xl font-body text-sm min-h-[80px] resize-none"
            />
          </div>
          {packageError && <p className="text-destructive text-sm font-body">{packageError}</p>}
          <Button
            onClick={handleGeneratePackage}
            disabled={packageLoading}
            className="bg-primary hover:bg-primary/90 text-white rounded-pill px-6 font-body font-semibold shadow-warm"
          >
            {packageLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2"><Zap size={16} /> Generate Package</span>
            )}
          </Button>
          {packageLoading && <div className="animate-pulse bg-muted rounded-xl h-24" />}
          {postingPackage && !packageLoading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {postingPackage.caption && (
                <div className="bg-muted rounded-xl p-4">
                  <p className="font-body font-semibold text-xs text-muted-foreground mb-1">CAPTION</p>
                  <p className="font-body text-sm text-foreground whitespace-pre-line">{postingPackage.caption}</p>
                </div>
              )}
              {postingPackage.hashtags && (
                <div className="bg-muted rounded-xl p-4">
                  <p className="font-body font-semibold text-xs text-muted-foreground mb-1">HASHTAGS</p>
                  <p className="font-body text-sm text-primary">
                    {typeof postingPackage.hashtags === 'object'
                      ? Object.values(postingPackage.hashtags).flat().join(' ')
                      : postingPackage.hashtags}
                  </p>
                </div>
              )}
              {postingPackage.storyCopy && (
                <div className="bg-muted rounded-xl p-4">
                  <p className="font-body font-semibold text-xs text-muted-foreground mb-1">STORY COPY</p>
                  <p className="font-body text-sm text-foreground">{postingPackage.storyCopy}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Brand Deal Alerts ── */}
      <motion.div variants={item}>
        <h3 className="font-body font-semibold text-sm text-muted-foreground tracking-wider uppercase mb-4">
          Brand Deal Alerts
        </h3>
        {brandLoading ? (
          <div className="animate-pulse bg-muted rounded-xl h-32" />
        ) : brandError ? (
          <div className="text-destructive text-sm font-body">Could not load data</div>
        ) : brandData ? (
          <div className="space-y-3">
            {brandData.brandOpportunities?.map((opp, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Handshake size={16} className="text-primary" />
                  <span className="font-body font-semibold text-sm text-foreground">{opp.brand || opp.name}</span>
                  {opp.budget && (
                    <span className="ml-auto px-2 py-0.5 bg-primary/10 text-primary rounded-pill text-[10px] font-body font-semibold">
                      {opp.budget}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground font-body text-xs leading-relaxed">{opp.description || opp.details}</p>
                {opp.requirements && <p className="text-xs text-foreground/60 font-body mt-1">Req: {opp.requirements}</p>}
              </div>
            ))}
            {(!brandData.brandOpportunities || brandData.brandOpportunities.length === 0) && (
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Sparkles size={24} className="text-primary mx-auto mb-3" />
                <p className="font-body text-sm text-muted-foreground">No active brand deals right now. Check back soon!</p>
              </div>
            )}
            {brandData.pitchTemplate && (
              <div className="bg-accent text-accent-foreground rounded-xl p-5">
                <p className="font-body font-semibold text-sm mb-2">📧 Ready-to-Send Pitch</p>
                <p className="font-body text-xs font-semibold text-accent-foreground/70 mb-1">Subject: {brandData.pitchTemplate.subject}</p>
                <p className="font-body text-sm text-accent-foreground/80 whitespace-pre-line">{brandData.pitchTemplate.body}</p>
              </div>
            )}
          </div>
        ) : null}
      </motion.div>

      {/* ── Content Calendar (coming soon) ── */}
      <motion.div variants={item} className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-base text-foreground">Content Calendar</h3>
            <span className="px-2 py-0.5 rounded-pill bg-muted text-muted-foreground text-[10px] font-body font-semibold">Coming soon</span>
          </div>
        </div>
        <p className="text-muted-foreground font-body text-xs leading-relaxed">
          AI-generated month-by-month plan tailored to your audience and trending moments.
        </p>
      </motion.div>
    </motion.div>
  );
}