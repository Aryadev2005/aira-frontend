// src/pages/dashboard/Launch.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Zap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useLaunchTiming,
  useLaunchPackage,
  useBrandAlert,
  useProfile,
  useCreateCalendarEntry,
} from "@/hooks/useApi";
import useCreatorFlow from "@/store/creatorFlow";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25 } },
};

// Convert "Fri 7:30 PM" to next occurrence date string "YYYY-MM-DD"
function nextDateForSlot(slotStr = "") {
  try {
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const match = slotStr.match(/^(\w{3})\s+(.+)$/);
    if (!match) return new Date().toISOString().split("T")[0];
    const targetDay = dayMap[match[1]];
    const now = new Date();
    const current = now.getDay();
    let diff = (targetDay - current + 7) % 7;
    if (diff === 0) diff = 7; // push to next week if same day
    const next = new Date(now);
    next.setDate(now.getDate() + diff);
    return next.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

// ── Save to Calendar confirmation modal ───────────────────────────────────────
function SaveToCalendarModal({
  idea,
  slot,
  platform,
  sessionId,
  onSave,
  onClose,
  saving,
}) {
  const [date, setDate] = useState(
    nextDateForSlot(slot?.day ? `${slot.day} ${slot.time}` : ""),
  );
  const [time, setTime] = useState(slot?.time || "");
  const [status, setStatus] = useState("ready");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28 }}
        className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <h3 className="font-heading text-base text-foreground">
              Save to Calendar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Summary card */}
        <div className="px-5 py-4 space-y-4">
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="font-body text-xs text-muted-foreground mb-1">
              Content
            </p>
            <p className="font-body text-sm font-semibold text-foreground line-clamp-2">
              {idea}
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1 capitalize">
              {platform}
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Scheduled Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5
                         font-body text-sm text-foreground outline-none focus:border-primary/40
                         focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Time */}
          <div>
            <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Posting Time{" "}
              <span className="font-normal">(IST · ARIA recommended)</span>
            </label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 7:30 PM IST"
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5
                         font-body text-sm text-foreground placeholder:text-muted-foreground/50
                         outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Status */}
          <div>
            <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5
                         font-body text-sm text-foreground outline-none focus:border-primary/40
                         focus:ring-1 focus:ring-primary/20 transition-all"
            >
              <option value="idea">Idea</option>
              <option value="script">Script ready</option>
              <option value="ready">Ready to post</option>
            </select>
          </div>
        </div>

        {/* Action */}
        <div className="px-5 pb-5">
          <button
            onClick={() => onSave({ date, time, status })}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white
                       rounded-xl font-body font-semibold text-sm hover:bg-primary/90
                       disabled:opacity-50 active:scale-[0.98] transition-all shadow-warm"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                Saving…
              </>
            ) : (
              <>
                <Calendar size={15} /> Save to Calendar
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Launch ───────────────────────────────────────────────────────────────
export default function Launch() {
  const navigate = useNavigate();

  // Zustand flow state
  const flowIdea = useCreatorFlow((s) => s.ideaText);
  const selectedIdea = useCreatorFlow((s) => s.selectedIdea);
  const studioSessionId = useCreatorFlow((s) => s.studioSessionId);
  const setLaunchCtx = useCreatorFlow((s) => s.setLaunchContext);

  const { data: profileData } = useProfile();
  const user = profileData?.data?.user;

  const { data: timingData, isLoading: timingLoading } = useLaunchTiming();
  const { data: brandAlertData, isLoading: brandLoading } = useBrandAlert();
  const { mutateAsync: generatePackage, isPending: packageLoading } =
    useLaunchPackage();
  const { mutateAsync: createEntry, isPending: savingToCalendar } =
    useCreateCalendarEntry();

  const timing = timingData?.data;
  const brandData = brandAlertData?.data;
  const bestSlot = timing?.bestSlots?.[0];

  const [sessionIdea, setSessionIdea] = useState(flowIdea || "");
  const [postingPackage, setPostingPackage] = useState(null);
  const [packageError, setPackageError] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarSaved, setCalendarSaved] = useState(false);

  // Pre-fill from flow
  useEffect(() => {
    if (flowIdea && !sessionIdea) setSessionIdea(flowIdea);
  }, [flowIdea]);

  // Store timing in Zustand
  useEffect(() => {
    if (bestSlot) {
      setLaunchCtx(null, `${bestSlot.day} ${bestSlot.time}`);
    }
  }, [bestSlot]);

  const handleGeneratePackage = async () => {
    setPackageError(null);
    try {
      const data = await generatePackage({
        idea: sessionIdea || "general content",
        platform: user?.primary_platform || "instagram",
        niche: user?.niches?.[0] || "lifestyle",
      });
      const pkg = data?.data;
      setPostingPackage(pkg);
      setLaunchCtx(pkg, bestSlot ? `${bestSlot.day} ${bestSlot.time}` : null);
    } catch (e) {
      setPackageError("Could not generate package. Please try again.");
    }
  };

  const handleSaveToCalendar = async ({ date, time, status }) => {
    try {
      await createEntry({
        title: sessionIdea || flowIdea || "Content",
        idea: selectedIdea?.contentAngle || sessionIdea,
        platform: user?.primary_platform || "instagram",
        niche: user?.niches?.[0] || "general",
        format: selectedIdea?.formatSuggestion || selectedIdea?.format,
        scheduled_date: date,
        scheduled_time: time,
        status,
        studio_session_id: studioSessionId || undefined,
        source: studioSessionId ? "discovery" : "manual",
        hook: postingPackage?.caption?.split("\n")?.[0] || selectedIdea?.hook,
        caption: postingPackage?.caption,
        hashtags: [
          ...(postingPackage?.hashtags?.mega || []),
          ...(postingPackage?.hashtags?.mid || []),
          ...(postingPackage?.hashtags?.niche || []),
        ],
        aria_tip: timing?.ariaReason,
      });
      setShowCalendarModal(false);
      setCalendarSaved(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5 pb-20"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="font-heading text-2xl text-foreground mb-1">Launch</h1>
        <p className="text-muted-foreground font-body text-sm">
          Timing intelligence · Brand deals · Schedule
        </p>
      </motion.div>

      {/* From flow indicator */}
      {flowIdea && (
        <motion.div
          variants={item}
          className="flex items-center gap-2 px-4 py-3 bg-primary/8 border border-primary/15 rounded-xl"
        >
          <Sparkles size={13} className="text-primary" />
          <p className="font-body text-xs text-primary">
            <span className="font-semibold">From Studio:</span>{" "}
            <span className="text-muted-foreground">
              {flowIdea.slice(0, 60)}
              {flowIdea.length > 60 ? "…" : ""}
            </span>
          </p>
        </motion.div>
      )}

      {/* Best Posting Times */}
      <motion.div variants={item}>
        <h3 className="font-body font-semibold text-xs text-muted-foreground tracking-wider uppercase mb-3">
          Best Posting Times
        </h3>
        {timingLoading ? (
          <div className="animate-pulse bg-muted rounded-xl h-28" />
        ) : timing?.bestSlots?.length > 0 ? (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {timing.bestSlots.map((slot, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-4 py-3.5
                  ${i < timing.bestSlots.length - 1 ? "border-b border-border" : ""}`}
              >
                <div>
                  <span className="font-body text-sm font-semibold text-foreground">
                    {slot.day}
                  </span>
                  {slot.reason && (
                    <p className="font-body text-xs text-muted-foreground mt-0.5">
                      {slot.reason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-body text-sm font-bold text-primary">
                    {slot.time}
                  </span>
                  <div
                    className="text-[10px] font-body font-semibold text-muted-foreground
                                  bg-muted px-2 py-0.5 rounded-full"
                  >
                    {slot.score}
                  </div>
                </div>
              </div>
            ))}
            {timing.nextBestSlotHoursAway > 0 && (
              <div className="px-4 py-2.5 bg-primary/5 flex items-center gap-2">
                <Clock size={12} className="text-primary" />
                <p className="font-body text-xs text-primary">
                  Next slot in{" "}
                  <span className="font-semibold">
                    {timing.nextBestSlotHoursAway}h
                  </span>
                  {timing.platformInsight && ` · ${timing.platformInsight}`}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm font-body bg-muted rounded-xl p-4">
            Complete your profile to get personalised timing.
          </div>
        )}
      </motion.div>

      {/* Posting Package */}
      <motion.div
        variants={item}
        className="bg-card border border-border rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h3 className="font-heading text-base text-foreground">
            Posting Package
          </h3>
        </div>

        <textarea
          value={sessionIdea}
          onChange={(e) => setSessionIdea(e.target.value)}
          placeholder="Your content idea (pre-filled from Studio if you came from there)"
          rows={3}
          className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3
                     font-body text-sm text-foreground placeholder:text-muted-foreground/50
                     resize-none outline-none focus:border-primary/40 focus:ring-1
                     focus:ring-primary/20 transition-all leading-relaxed"
        />

        {packageError && (
          <p className="text-destructive font-body text-xs">{packageError}</p>
        )}

        <Button
          onClick={handleGeneratePackage}
          disabled={packageLoading || !sessionIdea.trim()}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 font-body
                     font-semibold text-sm shadow-warm w-full"
        >
          {packageLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Zap size={15} /> Generate Package
            </span>
          )}
        </Button>

        {/* Package output */}
        {postingPackage && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 pt-2"
          >
            {postingPackage.brief && (
              <div>
                <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  One-liner
                </p>
                <p className="font-body text-sm font-semibold text-primary leading-snug">
                  {postingPackage.brief}
                </p>
              </div>
            )}
            {postingPackage.caption && (
              <div>
                <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Caption
                </p>
                <p className="font-body text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {postingPackage.caption}
                </p>
              </div>
            )}
            {postingPackage.contentKeywords?.length > 0 && (
              <div>
                <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Content Keywords
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {postingPackage.contentKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="font-body text-[11px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full"
                    >
                      [{kw}]
                    </span>
                  ))}
                </div>
              </div>
            )}
            {postingPackage.hashtags && (
              <div className="flex flex-wrap gap-1.5">
                {[
                  ...(postingPackage.hashtags.mega || []),
                  ...(postingPackage.hashtags.mid || []),
                  ...(postingPackage.hashtags.niche || []),
                ]
                  .slice(0, 12)
                  .map((h, i) => (
                    <span
                      key={i}
                      className="font-body text-[11px] px-2 py-0.5 bg-primary/10
                                           text-primary rounded-full"
                    >
                      {h}
                    </span>
                  ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Brand Alerts */}
      <motion.div variants={item}>
        <h3 className="font-body font-semibold text-xs text-muted-foreground tracking-wider uppercase mb-3">
          Brand Alerts
        </h3>
        {brandLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : brandData?.brandOpportunities?.length > 0 ? (
          <div className="space-y-2">
            {brandData.brandOpportunities.map((b, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-body font-semibold text-sm text-foreground">
                        {b.brand}
                      </p>
                      <span className="font-body text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                        {b.category}
                      </span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground">
                      {b.timing}
                    </p>
                    {b.pitchAngle && (
                      <p className="font-body text-xs text-primary/80 mt-1 italic">
                        "{b.pitchAngle}"
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-heading text-sm text-foreground">
                      {b.estimatedDeal}
                    </p>
                    <p className="font-body text-[10px] text-muted-foreground mt-0.5">
                      Fit {b.fitScore}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm font-body bg-muted rounded-xl p-4">
            Brand alerts loading…
          </div>
        )}
      </motion.div>

      {/* Save to Calendar CTA */}
      <motion.div
        variants={item}
        className="sticky bottom-4 left-0 right-0 px-0"
      >
        {calendarSaved ? (
          <div
            className="flex items-center justify-center gap-2 py-4 bg-emerald-500/15
                          border border-emerald-500/20 rounded-xl"
          >
            <CheckCircle2 size={16} className="text-emerald-600" />
            <p className="font-body font-semibold text-sm text-emerald-600">
              Saved to Calendar!
            </p>
            <button
              onClick={() => navigate("/dashboard/calendar")}
              className="ml-2 font-body text-xs text-emerald-700 underline"
            >
              View
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCalendarModal(true)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white
                       rounded-xl font-body font-semibold text-sm hover:bg-primary/90
                       active:scale-[0.98] transition-all shadow-warm"
          >
            <Calendar size={16} /> Save to Content Calendar
          </button>
        )}
      </motion.div>

      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendarModal && (
          <SaveToCalendarModal
            idea={sessionIdea || flowIdea || "Content"}
            slot={bestSlot}
            platform={user?.primary_platform || "instagram"}
            sessionId={studioSessionId}
            onSave={handleSaveToCalendar}
            onClose={() => setShowCalendarModal(false)}
            saving={savingToCalendar}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
