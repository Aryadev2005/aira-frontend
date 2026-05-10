// src/components/dashboard/Sidebar.jsx
// ── Redesigned ARIA Sidebar with credit widget ────────────────────────────────
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Compass,
  Clapperboard,
  Rocket,
  Music,
  Brain,
  BarChart3,
  User,
  Settings,
  CalendarDays,
  LogOut,
  Zap,
  ChevronRight,
  Sparkles,
  TrendingUp,
  X,
  Menu,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { useFirebaseAuth } from "@/lib/FirebaseAuthContext";
import { useProfile } from "@/hooks/useApi";
import { useCreditsWallet } from "@/hooks/useApi";

// ── Nav structure ─────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Discover",
    items: [
      { icon: Home, label: "Home", path: "/dashboard" },
      { icon: Compass, label: "Discover", path: "/dashboard/discover" },
      { icon: Music, label: "Songs", path: "/dashboard/songs" },
    ],
  },
  {
    label: "Create",
    items: [
      { icon: Clapperboard, label: "Studio", path: "/dashboard/studio" },
      { icon: Rocket, label: "Launch", path: "/dashboard/launch" },
      { icon: CalendarDays, label: "Calendar", path: "/dashboard/calendar" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { icon: Brain, label: "ARIA Brain", path: "/dashboard/brain" },
      { icon: BarChart3, label: "Video DNA", path: "/dashboard/video-dna" },
      { icon: TrendingUp, label: "Profile", path: "/dashboard/profile" },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: User, label: "Profile", path: "/dashboard/profile" },
      { icon: Settings, label: "Settings", path: "/dashboard/settings" },
    ],
  },
];

// Flat list for mobile
const NAV_FLAT = NAV_GROUPS.flatMap((g) => g.items);

// ── Credit bar sub-component ──────────────────────────────────────────────────
function CreditBar({ usedPct, planLabel, planMultiplier, nextResetAt, plan }) {
  const remaining = Math.max(0, 100 - (usedPct ?? 0));
  const isLow = remaining < 20;
  const isMid = remaining >= 20 && remaining < 40;

  const barColor = isLow
    ? "bg-red-500"
    : isMid
      ? "bg-amber-500"
      : "bg-[hsl(var(--sidebar-primary))]";

  // "Resets Jan 15" label
  const resetLabel = nextResetAt
    ? new Date(nextResetAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <div className="px-3 pb-3">
      <div
        className="rounded-2xl border border-white/8 bg-white/4 p-3.5 cursor-pointer
          hover:bg-white/6 transition-colors"
        onClick={() =>
          (window.location.href = "/dashboard/settings?tab=credits")
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-[hsl(var(--sidebar-primary))]" />
            <span className="font-body text-[11px] font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
              Usage
            </span>
          </div>
          {isLow && <AlertCircle size={12} className="text-red-400" />}
        </div>

        {/* Big percentage */}
        <div className="flex items-end gap-1 mb-2">
          <span className="font-heading text-2xl text-sidebar-foreground leading-none">
            {usedPct != null ? `${Math.round(usedPct)}%` : "—"}
          </span>
          <span className="font-body text-xs text-sidebar-foreground/40 mb-0.5">
            used
          </span>
        </div>

        {/* Progress bar — shows REMAINING (green → red) */}
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${remaining}%` }}
          />
        </div>

        {/* Plan label + reset hint */}
        <div className="flex items-center justify-between mt-2">
          <p className="font-body text-[10px] text-sidebar-foreground/40">
            {planLabel ?? "Free"} plan
          </p>
          {plan === "free" ? (
            <p className="font-body text-[10px] text-amber-500/70">
              Upgrade to refresh
            </p>
          ) : resetLabel ? (
            <p className="font-body text-[10px] text-sidebar-foreground/30">
              Resets {resetLabel}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
// ── Desktop sidebar ───────────────────────────────────────────────────────────
function DesktopSidebar() {
  const location = useLocation();
  const { logout } = useFirebaseAuth();
  const { data: profileData } = useProfile();
  const { data: walletData } = useCreditsWallet();
  const usedPct = walletData?.usedPct;
  const planLabel = walletData?.planLabel ?? "Free";
  const planMultiplier = walletData?.planMultiplier ?? "Free plan";
  const nextResetAt = walletData?.nextResetAt;
  const isPro = ["pro", "max", "brand", "starter"].includes(
    walletData?.plan ?? "free",
  );

  const user = profileData?.data?.user;
  const plan = walletData?.data?.plan ?? user?.subscription_tier ?? "free";

  const displayName = user?.name || "Creator";
  const initial = displayName[0]?.toUpperCase() || "A";

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const PLAN_BADGE = {
    free: { label: "Free", cls: "bg-white/10 text-white/50" },
    pro: {
      label: "Pro",
      cls: "bg-[hsl(var(--sidebar-primary))]/20 text-[hsl(var(--sidebar-primary))]",
    },
    max: { label: "Max", cls: "bg-violet-500/20 text-violet-400" },
    brand: { label: "Brand", cls: "bg-blue-500/20 text-blue-400" },
  };
  const badge = PLAN_BADGE[plan] ?? PLAN_BADGE.free;

  return (
    <aside className="hidden lg:flex flex-col w-[220px] xl:w-[240px] bg-sidebar text-sidebar-foreground h-screen fixed left-0 top-0 border-r border-white/6 z-40">
      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-5 pt-6 pb-5">
        <Link
          to="/"
          className="font-heading text-[22px] text-[hsl(var(--sidebar-primary))] tracking-tight"
        >
          ARIA
        </Link>
        <span
          className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}
        >
          {badge.label}
        </span>
      </div>

      {/* ── User card ── */}
      <div className="px-3 mb-5">
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          onClick={() => (window.location.href = "/dashboard/profile")}
        >
          <div className="w-8 h-8 rounded-full bg-[hsl(var(--sidebar-primary))] flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white text-[13px] font-bold">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body font-semibold text-sm text-sidebar-foreground truncate leading-tight">
              {displayName}
            </p>
            <p className="font-body text-[11px] text-sidebar-foreground/40 truncate leading-tight">
              @{user?.instagram_handle || user?.youtube_handle || "creator"}
            </p>
          </div>
          <ChevronRight
            size={13}
            className="text-sidebar-foreground/25 shrink-0"
          />
        </div>
      </div>

      {/* ── Nav groups ── */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-5 scrollbar-none">
        {NAV_GROUPS.slice(0, 3).map((group) => (
          <div key={group.label}>
            <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/25 px-3 mb-1.5">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ icon: Icon, label, path }) => {
                const active = isActive(path);
                return (
                  <li key={path}>
                    <Link
                      to={path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-[13px] font-medium transition-all duration-150
                        ${
                          active
                            ? "bg-[hsl(var(--sidebar-primary))] text-white shadow-sm shadow-[hsl(var(--sidebar-primary))]/30"
                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5"
                        }`}
                    >
                      <Icon
                        size={15}
                        className={
                          active ? "text-white" : "text-sidebar-foreground/40"
                        }
                      />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Account group — no section label, just bare items */}
        <div>
          <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/25 px-3 mb-1.5">
            Account
          </p>
          <ul className="space-y-0.5">
            {[
              { icon: User, label: "Profile", path: "/dashboard/profile" },
              {
                icon: Settings,
                label: "Settings",
                path: "/dashboard/settings",
              },
            ].map(({ icon: Icon, label, path }) => {
              const active = isActive(path);
              return (
                <li key={path}>
                  <Link
                    to={path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-[13px] font-medium transition-all duration-150
                      ${
                        active
                          ? "bg-[hsl(var(--sidebar-primary))] text-white shadow-sm shadow-[hsl(var(--sidebar-primary))]/30"
                          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5"
                      }`}
                  >
                    <Icon
                      size={15}
                      className={
                        active ? "text-white" : "text-sidebar-foreground/40"
                      }
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-[13px] font-medium
                  text-sidebar-foreground/40 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* ── Credit widget ── */}
      <div className="mt-3">
        <CreditBar
          usedPct={usedPct}
          planLabel={planLabel}
          planMultiplier={planMultiplier}
          nextResetAt={nextResetAt}
          plan={walletData?.plan ?? "free"}
        />

        {/* Upgrade CTA — only for free tier */}
        {!isPro && (
          <div className="px-3 pb-5">
            <Link
              to="/dashboard/settings?tab=credits"
              className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl
                bg-[hsl(var(--sidebar-primary))]/12 border border-[hsl(var(--sidebar-primary))]/20
                hover:bg-[hsl(var(--sidebar-primary))]/18 transition-colors group"
            >
              <div>
                <p className="font-body text-[12px] font-semibold text-[hsl(var(--sidebar-primary))]">
                  Upgrade to Pro
                </p>
                <p className="font-body text-[10px] text-sidebar-foreground/40">
                  Unlimited tools · brand alerts
                </p>
              </div>
              <Sparkles
                size={14}
                className="text-[hsl(var(--sidebar-primary))] shrink-0 group-hover:scale-110 transition-transform"
              />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Mobile bottom bar ─────────────────────────────────────────────────────────
function MobileBar() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { logout } = useFirebaseAuth();
  const { data: walletData } = useCreditsWallet();
  const usedPct = walletData?.usedPct;
  const planLabel = walletData?.planLabel ?? "Free";
  const planMultiplier = walletData?.planMultiplier ?? "Free plan";
  const nextResetAt = walletData?.nextResetAt;
  const isPro = ["pro", "max", "brand", "starter"].includes(
    walletData?.plan ?? "free",
  );
  const balance = walletData?.data?.wallet?.balance;

  // Show 5 items in bar; rest in drawer
  const PRIMARY = NAV_FLAT.slice(0, 4);

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <>
      {/* Bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-white/8 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-1">
          {PRIMARY.map(({ icon: Icon, label, path }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors
                  ${active ? "text-[hsl(var(--sidebar-primary))]" : "text-sidebar-foreground/40"}`}
              >
                <Icon size={20} />
                <span className="font-body text-[9px] font-medium">
                  {label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-sidebar-foreground/40"
          >
            <Menu size={20} />
            <span className="font-body text-[9px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative ml-auto w-72 bg-sidebar h-full flex flex-col overflow-y-auto border-l border-white/8">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-5">
              <span className="font-heading text-xl text-[hsl(var(--sidebar-primary))]">
                ARIA
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-white/8"
              >
                <X size={16} className="text-sidebar-foreground/60" />
              </button>
            </div>

            {/* All nav */}
            <div className="px-4 flex-1 space-y-5">
              {NAV_GROUPS.slice(0, 3).map((group) => (
                <div key={group.label}>
                  <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/25 px-2 mb-1.5">
                    {group.label}
                  </p>
                  {group.items.map(({ icon: Icon, label, path }) => {
                    const active = isActive(path);
                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm font-medium mb-0.5 transition-all
                          ${
                            active
                              ? "bg-[hsl(var(--sidebar-primary))] text-white"
                              : "text-sidebar-foreground/60 hover:bg-white/6 hover:text-sidebar-foreground"
                          }`}
                      >
                        <Icon size={16} />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Credits + logout at bottom */}
            <div className="px-4 pb-6 pt-3 border-t border-white/8">
              <CreditBar
                usedPct={usedPct}
                planLabel={planLabel}
                planMultiplier={planMultiplier}
                nextResetAt={nextResetAt}
                plan={walletData?.plan ?? "free"}
              />
              <div className="flex gap-2 mt-3">
                <Link
                  to="/dashboard/settings"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/6 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors font-body text-sm"
                >
                  <Settings size={14} /> Settings
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/15 transition-colors font-body text-sm"
                >
                  <LogOut size={14} /> Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileBar />
    </>
  );
}
