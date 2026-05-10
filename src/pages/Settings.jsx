// src/pages/Settings.jsx
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
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  History,
  Sparkles,
  CheckCircle,
  X,
} from "lucide-react";
import {
  useIntegrationStatus,
  useDisconnectPlatform,
  useProfile,
  useFetchYouTubeAnalytics,
} from "@/hooks/useApi";
import { useCreditsWallet, useCreditsHistory } from "@/hooks/useApi";
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

// ── Platforms ─────────────────────────────────────────────────────────────────
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

// ── Plans ─────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "plan_starter",
    tier: "starter",
    label: "Starter",
    price: 249,
    multiplier: "5×",
    features: "Content, hooks, songs",
    popular: false,
  },
  {
    id: "plan_pro",
    tier: "pro",
    label: "Pro",
    price: 499,
    multiplier: "15×",
    features: "+ Roadmap, Voice Portrait, Brand Pitch",
    popular: true,
  },
  {
    id: "plan_max",
    tier: "max",
    label: "Max",
    price: 749,
    multiplier: "40×",
    features: "+ Video DNA, Competitor gap",
    popular: false,
  },
  {
    id: "plan_brand",
    tier: "brand",
    label: "Brand",
    price: 999,
    multiplier: "100×",
    features: "Everything, unlimited feel",
    popular: false,
  },
];

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "credits", label: "Usage & Plan", icon: Zap },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function txStyle(type) {
  switch (type) {
    case "debit":
      return {
        icon: ArrowDownRight,
        color: "text-red-400",
        bg: "bg-red-500/10",
      };
    case "grant":
      return {
        icon: ArrowUpRight,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
      };
    case "topup":
      return {
        icon: ArrowUpRight,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
      };
    case "rollover":
      return {
        icon: RefreshCw,
        color: "text-violet-400",
        bg: "bg-violet-500/10",
      };
    default:
      return { icon: Zap, color: "text-muted-foreground", bg: "bg-muted" };
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3
        rounded-xl shadow-lg border max-w-sm
        ${
          type === "success"
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/15 border-red-500/30 text-red-400"
        }`}
    >
      {type === "success" ? (
        <CheckCircle size={16} className="shrink-0" />
      ) : (
        <AlertTriangle size={16} className="shrink-0" />
      )}
      <span className="font-body text-sm">{message}</span>
      <button
        onClick={onClose}
        className="ml-1 opacity-60 hover:opacity-100 shrink-0"
      >
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
  const user = profileData?.data?.user ?? profileData?.user;

  const {
    data: wallet,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = useCreditsWallet();
  const {
    initiatePlanPurchase,
    isLoading: purchasing,
    error: purchaseError,
    clearError,
  } = useRazorpay();

  const [page, setPage] = useState(0);
  const [buyingPlan, setBuyingPlan] = useState(null); // planId being purchased
  const [toast, setToast] = useState(null);

  const PAGE_SIZE = 20;
  const { data: historyData, isLoading: historyLoading } = useCreditsHistory({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  // Wallet data — all percentages, no raw credits
  const usedPct = wallet?.usedPct ?? 0;
  const remainingPct = wallet?.remainingPct ?? 100;
  const planLabel = wallet?.planLabel ?? "Free";
  const planMultiplier = wallet?.planMultiplier ?? "Free plan";
  const currentPlan = wallet?.plan ?? "free";
  const nextResetAt = wallet?.nextResetAt;
  const planUsedPct = wallet?.planUsedPct ?? 0;
  const rolloverPct = wallet?.rolloverPct ?? 0;
  const topupPct = wallet?.topupPct ?? 0;

  const transactions = historyData?.transactions ?? [];
  const totalTx = historyData?.total ?? 0;

  const isLow = remainingPct < 20;
  const isMid = remainingPct >= 20 && remainingPct < 40;
  const barColor = isLow ? "bg-red-500" : isMid ? "bg-amber-500" : "bg-primary";
  const ringColor = isLow
    ? "text-red-500"
    : isMid
      ? "text-amber-500"
      : "text-primary";

  const resetLabel =
    nextResetAt && currentPlan !== "free"
      ? new Date(nextResetAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

  // ── Buy plan ──────────────────────────────────────────────────────────────
  const handleBuyPlan = async (plan) => {
    if (purchasing || buyingPlan) return;
    // Don't allow buying current plan
    if (plan.tier === currentPlan) return;

    setBuyingPlan(plan.id);
    clearError();

    await initiatePlanPurchase({
      planId: plan.id,
      userName: user?.name ?? "",
      userEmail: user?.email ?? "",
      userPhone: user?.phone ?? "",
      onSuccess: (data) => {
        setToast({
          message: data?.message ?? `${plan.label} plan activated!`,
          type: "success",
        });
        refetchWallet();
      },
      onFailure: (msg) => {
        setToast({ message: msg, type: "error" });
      },
    });

    setBuyingPlan(null);
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
        {/* ── Usage overview ── */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-heading text-lg text-foreground">
                Monthly Usage
              </h3>
              <p className="font-body text-sm text-muted-foreground">
                {planLabel} plan · {planMultiplier}
              </p>
            </div>
            <button
              onClick={() => refetchWallet()}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <RefreshCw size={14} className="text-muted-foreground" />
            </button>
          </div>

          {/* Donut + bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  className="text-muted/40"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeDasharray={`${usedPct} ${100 - usedPct}`}
                  strokeLinecap="round"
                  className={ringColor}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-[17px] text-foreground leading-tight">
                  {Math.round(remainingPct)}%
                </span>
                <span className="font-body text-[9px] text-muted-foreground">
                  left
                </span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-body text-sm text-foreground font-medium">
                  {Math.round(usedPct)}% used this month
                </span>
                {isLow && (
                  <span className="font-body text-xs text-red-400 font-semibold">
                    Running low
                  </span>
                )}
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              {currentPlan === "free" ? (
                <p className="font-body text-xs text-amber-500 mt-1.5">
                  Upgrade to refresh your allowance
                </p>
              ) : resetLabel ? (
                <p className="font-body text-xs text-muted-foreground mt-1.5">
                  Resets on {resetLabel}
                </p>
              ) : null}
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label: "Plan", pct: planUsedPct, color: "text-primary" },
              { label: "Rollover", pct: rolloverPct, color: "text-violet-400" },
              { label: "Top-up", pct: topupPct, color: "text-blue-400" },
            ].map(({ label, pct, color }) => (
              <div
                key={label}
                className="rounded-xl bg-muted/50 p-2.5 text-center"
              >
                <p className={`font-heading text-base ${color}`}>
                  {pct > 0 ? `${pct}%` : "—"}
                </p>
                <p className="font-body text-[11px] text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {wallet?.totalActionsCount > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="font-body text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {wallet.totalActionsCount}
                </span>{" "}
                AI actions used all time
              </p>
            </div>
          )}
        </motion.div>

        {/* ── Plans ── */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="font-heading text-base text-foreground mb-1 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> Plans
          </h3>
          <p className="font-body text-sm text-muted-foreground mb-4">
            Monthly allowance · resets every billing cycle
          </p>

          {/* Payment error */}
          {purchaseError && (
            <div
              className="mb-4 flex items-start gap-2 p-3 rounded-xl
              bg-red-500/10 border border-red-500/20"
            >
              <AlertTriangle
                size={14}
                className="text-red-400 mt-0.5 shrink-0"
              />
              <p className="font-body text-sm text-red-400 flex-1">
                {purchaseError}
              </p>
              <button onClick={clearError}>
                <X size={13} className="text-red-400/60" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {PLANS.map(
              ({ id, tier, label, price, multiplier, features, popular }) => {
                const isCurrent = currentPlan === tier;
                const isBuying = buyingPlan === id;
                const isDisabled = purchasing || !!buyingPlan;

                return (
                  <div
                    key={id}
                    className={`relative flex flex-col p-4 rounded-xl border transition-all
                    ${
                      isCurrent
                        ? "border-primary bg-primary/8"
                        : popular
                          ? "border-primary/25 bg-primary/4"
                          : "border-border bg-muted/30"
                    }`}
                  >
                    {/* Badge */}
                    {isCurrent && (
                      <span
                        className="absolute top-2.5 right-2.5 font-body text-[10px]
                      font-semibold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary"
                      >
                        Current
                      </span>
                    )}
                    {!isCurrent && popular && (
                      <span
                        className="absolute top-2.5 right-2.5 font-body text-[10px]
                      font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary"
                      >
                        Popular
                      </span>
                    )}

                    {/* Plan info */}
                    <p className="font-body text-xs text-muted-foreground mb-0.5">
                      {label}
                    </p>
                    <p className="font-heading text-xl text-foreground">
                      ₹{price}
                    </p>
                    <p
                      className={`font-body text-xs font-semibold mb-2
                    ${isCurrent || popular ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {multiplier} free plan
                    </p>
                    <p className="font-body text-[11px] text-muted-foreground leading-snug mb-3">
                      {features}
                    </p>

                    {/* Buy / Current button */}
                    {isCurrent ? (
                      <div
                        className="mt-auto w-full flex items-center justify-center gap-1.5
                      py-2 rounded-lg bg-primary/10 font-body text-xs font-semibold text-primary"
                      >
                        <CheckCircle size={12} />
                        Active
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          handleBuyPlan({ id, tier, label, price })
                        }
                        disabled={isDisabled}
                        className={`mt-auto w-full flex items-center justify-center gap-1.5
                        py-2 rounded-lg font-body text-xs font-semibold transition-all
                        ${
                          isDisabled
                            ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                            : popular
                              ? "bg-primary text-white hover:bg-primary/90"
                              : "bg-muted text-foreground hover:bg-muted/80"
                        }`}
                      >
                        {isBuying ? (
                          <>
                            <Loader2 size={11} className="animate-spin" />{" "}
                            Processing…
                          </>
                        ) : (
                          `Get ${label}`
                        )}
                      </button>
                    )}
                  </div>
                );
              },
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <img
              src="/razorpay.webp"
              alt="Razorpay"
              className="h-14 "
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <p className="font-body text-[11px] text-muted-foreground">
              Secured by Razorpay · UPI, Cards, Net Banking
            </p>
          </div>
        </motion.div>

        {/* ── Activity history ── */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-base text-foreground flex items-center gap-2">
              <History size={16} className="text-primary" /> Activity
            </h3>
            <span className="font-body text-xs text-muted-foreground">
              {totalTx} actions
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
                No activity yet
              </p>
              <p className="font-body text-xs text-muted-foreground/50 mt-1">
                Your usage history appears here after your first AI action
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx) => {
                const style = txStyle(tx.type);
                const Icon = style.icon;
                return (
                  <div key={tx.id} className="flex items-center gap-3 py-3">
                    <div
                      className={`w-8 h-8 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}
                    >
                      <Icon size={14} className={style.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-foreground truncate">
                        {tx.description}
                      </p>
                      <p className="font-body text-[11px] text-muted-foreground">
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                    {tx.costLabel && (
                      <p
                        className={`font-body text-xs shrink-0 ${style.color}`}
                      >
                        {tx.costLabel}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

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
      </motion.div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATIONS TAB
// ══════════════════════════════════════════════════════════════════════════════
function IntegrationsTab() {
  const { data: statusData, refetch } = useIntegrationStatus();
  const disconnectMutation = useDisconnectPlatform();
  const fetchYTAnalytics = useFetchYouTubeAnalytics();
  const [searchParams] = useSearchParams();
  const [oauthError, setOauthError] = useState(null);
  const [oauthSuccess, setOauthSuccess] = useState(null);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [ytFetchSuccess, setYtFetchSuccess] = useState(false);

  const status = statusData?.data?.connections ?? {};

  useEffect(() => {
    const error = searchParams.get("oauth_error");
    const success = searchParams.get("oauth_success");
    if (error)
      setOauthError(OAUTH_ERROR_MESSAGES[error] || "Connection failed.");
    if (success) {
      setOauthSuccess(
        `${success.charAt(0).toUpperCase() + success.slice(1)} connected!`,
      );
      refetch();
    }
  }, [searchParams]);

  const handleConnect = async (platformId) => {
    setConnectingPlatform(platformId);
    try {
      if (platformId === "youtube") {
        const res = await api.get(
          "/integrations/youtube/auth-url?flow=settings",
        );
        const redirectUrl = res?.data?.url ?? res?.url ?? res?.authUrl;
        if (redirectUrl) window.location.href = redirectUrl;
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

  const handleFetchYTAnalytics = async () => {
    setYtFetchSuccess(false);
    try {
      await fetchYTAnalytics.mutateAsync();
      setYtFetchSuccess(true);
      refetch();
    } catch {
      setOauthError("Could not fetch YouTube analytics. Please try again.");
    }
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
          className="flex items-start gap-3 p-4 rounded-xl
            bg-destructive/10 border border-destructive/20"
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
          className="flex items-start gap-3 p-4 rounded-xl
            bg-emerald-500/10 border border-emerald-500/20"
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
        const isYouTube = id === "youtube";
        const analyticsReady = isYouTube ? status[id]?.analyticsReady : null;
        const analyticsScrapedAt = isYouTube
          ? status[id]?.analyticsScrapedAt
          : null;
        const isFetching = isYouTube && fetchYTAnalytics.isPending;

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

              {/* YouTube analytics status banner */}
              {isYouTube && connected && (
                <div className="mt-3">
                  {analyticsReady ? (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-body text-xs text-emerald-500">
                        <CheckCircle2 size={11} />
                        ARIA analytics ready
                        {analyticsScrapedAt && (
                          <span className="text-muted-foreground ml-1">
                            ·{" "}
                            {new Date(analyticsScrapedAt).toLocaleDateString(
                              "en-IN",
                              { day: "numeric", month: "short" },
                            )}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={handleFetchYTAnalytics}
                        disabled={isFetching}
                        className="flex items-center gap-1 font-body text-xs text-muted-foreground
                          hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          size={11}
                          className={isFetching ? "animate-spin" : ""}
                        />
                        Refresh
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-between p-3 rounded-xl
                      bg-amber-500/10 border border-amber-500/20"
                    >
                      <div>
                        <p className="font-body text-xs font-semibold text-amber-500 mb-0.5">
                          Analytics not fetched yet
                        </p>
                        <p className="font-body text-[11px] text-muted-foreground">
                          Fetch your channel data so ARIA can personalise
                          everything for you.
                        </p>
                      </div>
                      <button
                        onClick={handleFetchYTAnalytics}
                        disabled={isFetching}
                        className="ml-3 shrink-0 flex items-center gap-1.5 font-body text-xs
                          px-3 py-1.5 rounded-lg bg-amber-500 text-white
                          hover:bg-amber-600 transition-colors disabled:opacity-60"
                      >
                        {isFetching ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Sparkles size={11} />
                        )}
                        {isFetching ? "Fetching…" : "Fetch Analytics"}
                      </button>
                    </div>
                  )}
                  {ytFetchSuccess && (
                    <p className="font-body text-xs text-emerald-500 mt-2 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Analytics updated — ARIA is now
                      fully personalised for your YouTube channel.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="shrink-0">
              {connected ? (
                <button
                  onClick={() => handleDisconnect(id)}
                  disabled={disconnectMutation.isPending}
                  className="font-body text-sm px-4 py-2 rounded-xl bg-destructive/10
                    text-destructive hover:bg-destructive/20 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(id)}
                  disabled={connectingPlatform === id}
                  className="font-body text-sm px-4 py-2 rounded-xl bg-primary text-white
                    hover:bg-primary/90 transition-colors flex items-center gap-2"
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
// MAIN PAGE
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
            Manage your connections and plan.
          </p>
        </motion.div>

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
