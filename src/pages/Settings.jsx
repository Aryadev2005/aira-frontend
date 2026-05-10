// src/pages/Settings.jsx
// ── ARIA Settings — with Credits tab + Razorpay integration ──────────────────
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  Link2,
  Zap,
  CheckCircle2,
  XCircle,
  Instagram,
  Youtube,
  Loader2,
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  ShoppingCart,
  AlertTriangle,
  History,
  BarChart2,
  Sparkles,
  CheckCircle,
  X,
} from "lucide-react";
import {
  useIntegrationStatus,
  useDisconnectPlatform,
  useProfile,
} from "@/hooks/useApi";
import {
  useCreditsWallet,
  useCreditsHistory,
  useCreditsPacks,
} from "@/hooks/useApi";
import { useRazorpay } from "@/hooks/useRazorpay";
import { api } from "@/lib/api";

// ── Animation presets ─────────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 22 } },
};

// ── Platforms config ──────────────────────────────────────────────────────────
const platforms = [
  {
    id: "instagram",
    label: "Instagram",
    Icon: Instagram,
    iconColor: "#e1306c",
    bg: "bg-purple-500/10",
    description: "Reels analytics, niche detection, and engagement insights",
  },
  {
    id: "youtube",
    label: "YouTube",
    Icon: Youtube,
    iconColor: "#FF0000",
    bg: "bg-red-500/10",
    description: "Channel analytics, video trends, and subscriber insights",
  },
];

const OAUTH_ERROR_MESSAGES = {
  youtube_denied: "YouTube access was denied. Please try again.",
  youtube_failed: "YouTube connection failed. Please try again.",
  invalid_state: "Session expired. Please try connecting again.",
  youtube_error: "YouTube connection error. Please try again.",
};

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "credits", label: "Credits & Usage", icon: Zap },
];

// ── Action key labels ─────────────────────────────────────────────────────────
const ACTION_LABELS = {
  content_generation: "Content Generation",
  viral_ideas: "Viral Ideas",
  aria_chat: "ARIA Chat",
  hook_rewrite: "Hook Rewrite",
  song_recommendations: "Song Recommendations",
  caption_analysis: "Caption Analysis",
  bio_analysis: "Bio Analysis",
  posting_package: "Posting Package",
  weekly_report: "Weekly Report",
  content_calendar: "Content Calendar",
  brand_alert: "Brand Alert",
  growth_roadmap: "Growth Roadmap",
  rate_card: "Rate Card",
  script_writing: "Script Writing",
  brand_pitch: "Brand Pitch",
  archetype_detection: "Archetype Detection",
  voice_portrait: "Voice Portrait",
  video_analysis: "Video Analysis",
  competitor_gap: "Competitor Gap",
  trend_browse: "Browse Trends",
  song_browse: "Browse Songs",
};

// ── Transaction styling ───────────────────────────────────────────────────────
function txStyle(type) {
  switch (type) {
    case "debit":
      return {
        icon: ArrowDownRight,
        color: "text-red-400",
        bg: "bg-red-500/10",
        sign: "-",
      };
    case "grant":
      return {
        icon: ArrowUpRight,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        sign: "+",
      };
    case "topup":
      return {
        icon: ShoppingCart,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        sign: "+",
      };
    case "rollover":
      return {
        icon: RefreshCw,
        color: "text-violet-400",
        bg: "bg-violet-500/10",
        sign: "+",
      };
    default:
      return {
        icon: Zap,
        color: "text-muted-foreground",
        bg: "bg-muted",
        sign: "",
      };
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Toast component ───────────────────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border
        ${
          type === "success"
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/15 border-red-500/30 text-red-400"
        }`}
    >
      {type === "success" ? (
        <CheckCircle size={16} />
      ) : (
        <AlertTriangle size={16} />
      )}
      <span className="font-body text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CREDITS TAB
// ══════════════════════════════════════════════════════════════════════════════
function CreditsTab() {
  const { data: profileData } = useProfile();
  const user = profileData?.data?.user;

  const {
    data: walletData,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = useCreditsWallet();
  const { data: packsData } = useCreditsPacks();
  const {
    initiatePayment,
    isLoading: paymentLoading,
    error: paymentError,
    clearError,
  } = useRazorpay();

  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const { data: historyData, isLoading: historyLoading } = useCreditsHistory({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const [buyingPack, setBuyingPack] = useState(null); // which pack is being purchased
  const [toast, setToast] = useState(null); // { message, type }

  // Data structure: hooks unwrap backend response
  // So: packsData.data = { packs: [...] }
  const wallet = walletData?.data?.wallet;
  const plan = walletData?.data?.plan ?? "free";
  const planLimit = walletData?.data?.planLimit ?? 50;
  const packs = packsData?.data?.packs ?? walletData?.data?.topupPacks ?? [];
  const transactions =
    historyData?.data?.transactions ??
    walletData?.data?.recentTransactions ??
    [];
  const totalTx = historyData?.data?.total ?? transactions.length;

  const balance = wallet?.balance ?? 0;
  const pct =
    planLimit > 0 ? Math.min(100, Math.round((balance / planLimit) * 100)) : 0;
  const isLow = pct < 20;
  const isMid = pct >= 20 && pct < 50;
  const barColor = isLow ? "bg-red-500" : isMid ? "bg-amber-500" : "bg-primary";

  // Usage breakdown from history
  const spendByAction = {};
  transactions
    .filter((t) => t.type === "debit")
    .forEach((t) => {
      const key = t.action_key || "other";
      spendByAction[key] = (spendByAction[key] || 0) + Math.abs(t.amount);
    });
  const topActions = Object.entries(spendByAction)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // ── Handle pack purchase ───────────────────────────────────────────────────
  const handleBuyPack = async (pack) => {
    if (paymentLoading || buyingPack) return;
    setBuyingPack(pack.id);
    clearError();

    try {
      await initiatePayment({
        packId: pack.id,
        userName: user?.name || "",
        userEmail: user?.email || "",
        userPhone: user?.phone || "",
        onSuccess: (credits) => {
          setToast({
            message: `🎉 ${credits} credits added to your wallet!`,
            type: "success",
          });
          refetchWallet();
        },
        onFailure: (msg) => {
          setToast({ message: msg, type: "error" });
        },
      });
    } finally {
      setBuyingPack(null);
    }
  };

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            key="toast"
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* ── Wallet card ── */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-heading text-lg text-foreground">
                Credit Wallet
              </h3>
              <p className="font-body text-sm text-muted-foreground capitalize">
                {plan} plan · {planLimit} credits/month
              </p>
            </div>
            <button
              onClick={() => refetchWallet()}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              title="Refresh balance"
            >
              <RefreshCw size={14} className="text-muted-foreground" />
            </button>
          </div>

          {/* Balance */}
          <div className="mb-3">
            <span className="font-heading text-5xl text-foreground">
              {balance}
            </span>
            <span className="font-body text-lg text-muted-foreground ml-2">
              credits left
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden mb-1.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mb-4">
            <p className="font-body text-xs text-muted-foreground">
              {isLow ? "⚠️ Running low" : `${pct}% remaining`}
            </p>
            {wallet?.nextResetAt && (
              <p className="font-body text-xs text-muted-foreground">
                Resets{" "}
                {new Date(wallet.nextResetAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            )}
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Plan", val: wallet?.planCredits ?? 0, icon: Sparkles },
              {
                label: "Rollover",
                val: wallet?.rolloverCredits ?? 0,
                icon: RefreshCw,
              },
              {
                label: "Top-up",
                val: wallet?.topupCredits ?? 0,
                icon: ShoppingCart,
              },
            ].map(({ label, val, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl bg-muted/50 p-3 text-center"
              >
                <Icon
                  size={13}
                  className="text-muted-foreground mx-auto mb-1"
                />
                <p className="font-heading text-xl text-foreground">{val}</p>
                <p className="font-body text-[11px] text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Lifetime */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-border">
            <div>
              <p className="font-body text-xs text-muted-foreground">
                Lifetime earned
              </p>
              <p className="font-heading text-base text-emerald-500">
                +{wallet?.totalGranted ?? 0}
              </p>
            </div>
            <div>
              <p className="font-body text-xs text-muted-foreground">
                Lifetime spent
              </p>
              <p className="font-heading text-base text-red-400">
                -{wallet?.totalSpent ?? 0}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Usage breakdown ── */}
        {topActions.length > 0 && (
          <motion.div
            variants={item}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h3 className="font-heading text-base text-foreground mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-primary" /> Usage breakdown
            </h3>
            <div className="space-y-3">
              {topActions.map(([key, spent]) => {
                const max = topActions[0][1];
                const barPct = Math.round((spent / max) * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="font-body text-sm text-foreground">
                        {ACTION_LABELS[key] ?? key}
                      </span>
                      <span className="font-body text-sm font-semibold text-foreground">
                        {spent} cr
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-all"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Buy credits / Top-up packs ── */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="font-heading text-base text-foreground mb-1 flex items-center gap-2">
            <ShoppingCart size={16} className="text-primary" /> Buy credits
          </h3>
          <p className="font-body text-sm text-muted-foreground mb-4">
            Credits never expire · Secure payment via Razorpay
          </p>

          {/* Payment error */}
          {paymentError && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle
                size={14}
                className="text-red-400 mt-0.5 shrink-0"
              />
              <p className="font-body text-sm text-red-400">{paymentError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {packs.map((pack) => {
              const isBuying = buyingPack === pack.id;
              const isDisabled = paymentLoading || !!buyingPack;
              // Best value badge for the 1000 pack
              const isBestValue = pack.id === "pack_1000";

              return (
                <button
                  key={pack.id}
                  onClick={() => handleBuyPack(pack)}
                  disabled={isDisabled}
                  className={`relative flex flex-col items-start p-4 rounded-xl border transition-all text-left
                    ${
                      isBestValue
                        ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                        : "border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/20"
                    }
                    ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  {isBestValue && (
                    <span
                      className="absolute top-2.5 right-2.5 font-body text-[10px] font-semibold
                      px-1.5 py-0.5 rounded-full bg-primary/20 text-primary"
                    >
                      Best value
                    </span>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-primary" />
                    <span className="font-heading text-xl text-foreground">
                      {pack.credits}
                    </span>
                    <span className="font-body text-xs text-muted-foreground">
                      credits
                    </span>
                  </div>

                  <div className="w-full flex items-center justify-between mb-3">
                    <span className="font-heading text-lg text-foreground">
                      ₹{pack.amountInr}
                    </span>
                    <span className="font-body text-[11px] text-muted-foreground">
                      ₹{(pack.amountInr / pack.credits).toFixed(2)}/cr
                    </span>
                  </div>

                  <div
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg
                    font-body text-sm font-semibold transition-all
                    ${
                      isBestValue
                        ? "bg-primary text-white"
                        : "bg-muted text-foreground group-hover:bg-muted/80"
                    }
                  `}
                  >
                    {isBuying ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <CreditCard size={13} />
                        Buy now
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <img
              src="https://badges.razorpay.com/badge-light.png"
              alt="Razorpay"
              className="h-4 opacity-50"
              onError={(e) =>
                /** @type {HTMLElement} */ (e.target.style.display = "none")
              }
            />
            <p className="font-body text-[11px] text-muted-foreground">
              Secured by Razorpay · UPI, Cards, Net Banking accepted
            </p>
          </div>
        </motion.div>

        {/* ── Transaction history ── */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-base text-foreground flex items-center gap-2">
              <History size={16} className="text-primary" /> Transaction history
            </h3>
            <span className="font-body text-xs text-muted-foreground">
              {totalTx} total
            </span>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2
                size={22}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-10 text-center">
              <Zap
                size={28}
                className="text-muted-foreground/30 mx-auto mb-2"
              />
              <p className="font-body text-sm text-muted-foreground">
                No transactions yet
              </p>
              <p className="font-body text-xs text-muted-foreground/50 mt-1">
                Credits will appear here after your first AI action
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx) => {
                const style = txStyle(tx.type);
                const Icon = style.icon;
                const absAmt = Math.abs(tx.amount);
                return (
                  <div key={tx.id} className="flex items-center gap-3 py-3">
                    <div
                      className={`w-8 h-8 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}
                    >
                      <Icon size={14} className={style.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-foreground truncate">
                        {tx.description ||
                          ACTION_LABELS[tx.action_key] ||
                          tx.type}
                      </p>
                      <p className="font-body text-[11px] text-muted-foreground">
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-body text-sm font-semibold ${style.color}`}
                      >
                        {style.sign}
                        {absAmt}
                      </p>
                      {tx.balance_after != null && (
                        <p className="font-body text-[10px] text-muted-foreground">
                          bal: {tx.balance_after}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalTx > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="font-body text-sm px-4 py-1.5 rounded-lg bg-muted
                  hover:bg-muted/80 disabled:opacity-30 transition-all"
              >
                Previous
              </button>
              <span className="font-body text-sm text-muted-foreground">
                Page {page + 1} of {Math.ceil(totalTx / PAGE_SIZE)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * PAGE_SIZE >= totalTx}
                className="font-body text-sm px-4 py-1.5 rounded-lg bg-muted
                  hover:bg-muted/80 disabled:opacity-30 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>

        {/* ── Credit cost reference ── */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="font-heading text-base text-foreground mb-4">
            Credit costs
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {[
              { label: "Browse Trends / Songs", cost: 0 },
              { label: "ARIA Chat", cost: 3 },
              { label: "Hook Rewrite", cost: 2 },
              { label: "Viral Ideas Refresh", cost: 5 },
              { label: "Song Recommendations", cost: 5 },
              { label: "Caption Analysis", cost: 8 },
              { label: "Content Generation", cost: 10 },
              { label: "Weekly Report", cost: 15 },
              { label: "Voice Portrait", cost: 15 },
              { label: "Growth Roadmap", cost: 20 },
              { label: "Brand Pitch", cost: 25 },
              { label: "Competitor Gap", cost: 30 },
            ].map(({ label, cost }) => (
              <div
                key={label}
                className="flex items-center justify-between py-1.5 border-b border-border/40"
              >
                <span className="font-body text-sm text-foreground">
                  {label}
                </span>
                <span
                  className={`font-body text-sm font-semibold
                  ${cost === 0 ? "text-emerald-500" : "text-foreground"}`}
                >
                  {cost === 0 ? "Free" : `${cost} cr`}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATIONS TAB
// ══════════════════════════════════════════════════════════════════════════════
function IntegrationsTab() {
  const { data: statusData, isLoading, refetch } = useIntegrationStatus();
  const disconnectMutation = useDisconnectPlatform();
  const [searchParams] = useSearchParams();
  const [oauthError, setOauthError] = useState(null);
  const [oauthSuccess, setOauthSuccess] = useState(null);
  const [connectingPlatform, setConnectingPlatform] = useState(null);

  const status = statusData?.data?.integrations ?? {};

  useEffect(() => {
    const error = searchParams.get("oauth_error");
    const success = searchParams.get("oauth_success");
    if (error)
      setOauthError(OAUTH_ERROR_MESSAGES[error] || "Connection failed.");
    if (success)
      setOauthSuccess(
        `${success.charAt(0).toUpperCase() + success.slice(1)} connected!`,
      );
  }, [searchParams]);

  const handleConnect = async (platformId) => {
    setConnectingPlatform(platformId);
    try {
      if (platformId === "youtube") {
        const { data } = await api.get(
          "/integrations/youtube/auth-url?flow=settings",
        );
        if (data?.authUrl) window.location.href = data.authUrl;
      } else if (platformId === "instagram") {
        window.location.href = "/onboarding?reconnect=instagram";
      }
    } catch {
      setOauthError("Failed to initiate connection. Please try again.");
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (platformId) => {
    if (!window.confirm(`Disconnect ${platformId}?`)) return;
    try {
      await disconnectMutation.mutateAsync(platformId);
      refetch();
    } catch {}
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {oauthError && (
        <motion.div
          variants={item}
          className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
        >
          <AlertTriangle
            size={16}
            className="text-destructive mt-0.5 shrink-0"
          />
          <p className="flex-1 font-body text-sm text-destructive">
            {oauthError}
          </p>
          <button onClick={() => setOauthError(null)}>
            <X size={14} className="text-destructive/60" />
          </button>
        </motion.div>
      )}
      {oauthSuccess && (
        <motion.div
          variants={item}
          className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
        >
          <CheckCircle2
            size={16}
            className="text-emerald-500 mt-0.5 shrink-0"
          />
          <p className="flex-1 font-body text-sm text-emerald-500">
            {oauthSuccess}
          </p>
          <button onClick={() => setOauthSuccess(null)}>
            <X size={14} className="text-emerald-500/60" />
          </button>
        </motion.div>
      )}

      {platforms.map(({ id, label, Icon, iconColor, bg, description }) => {
        const connected = status[id]?.connected;
        const handle = status[id]?.handle;
        return (
          <motion.div
            key={id}
            variants={item}
            className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4"
          >
            <div
              className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}
            >
              <Icon size={22} style={{ color: iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-heading text-base text-foreground">
                  {label}
                </h3>
                {connected ? (
                  <span className="flex items-center gap-1 text-emerald-500 font-body text-[11px] font-semibold">
                    <CheckCircle2 size={11} /> Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground font-body text-[11px]">
                    <XCircle size={11} /> Not connected
                  </span>
                )}
              </div>
              {handle && (
                <p className="font-body text-sm text-muted-foreground mb-1">
                  @{handle}
                </p>
              )}
              <p className="font-body text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            <div className="shrink-0">
              {connected ? (
                <button
                  onClick={() => handleDisconnect(id)}
                  disabled={disconnectMutation.isPending}
                  className="font-body text-sm px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(id)}
                  disabled={connectingPlatform === id}
                  className="font-body text-sm px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  {connectingPlatform === id && (
                    <Loader2 size={12} className="animate-spin" />
                  )}
                  Connect
                </button>
              )}
            </div>
          </motion.div>
        );
      })}

      <motion.div
        variants={item}
        className="rounded-2xl border border-border bg-card/50 p-4 text-center"
      >
        <p className="font-body text-sm text-muted-foreground">
          More integrations coming soon · TikTok, X, LinkedIn
        </p>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    TABS.find((t) => t.id === tabFromUrl) ? tabFromUrl : "integrations",
  );

  const switchTab = (id) => {
    setActiveTab(id);
    setSearchParams(id === "integrations" ? {} : { tab: id });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 lg:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <SettingsIcon size={20} className="text-primary" />
            <h1 className="font-heading text-2xl text-foreground">Settings</h1>
          </div>
          <p className="font-body text-sm text-muted-foreground">
            Manage your connections, credits, and account.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-7">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                font-body text-sm font-medium transition-all
                ${
                  activeTab === id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "integrations" && <IntegrationsTab />}
            {activeTab === "credits" && <CreditsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
