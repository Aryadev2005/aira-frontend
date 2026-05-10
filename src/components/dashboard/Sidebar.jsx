// src/components/dashboard/Sidebar.jsx
// ── v2 redesign: grouped nav, usage card, upgrade CTA ─────────────────────────
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
  X,
  Menu,
} from "lucide-react";
import { useFirebaseAuth } from "@/lib/FirebaseAuthContext";
import { useProfile, useCreditsWallet } from "@/hooks/useApi";

// ── Nav structure ─────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Discover",
    items: [
      { icon: Home, label: "Home", path: "/dashboard" },
      {
        icon: Compass,
        label: "Discover",
        path: "/dashboard/discover",
        hot: true,
      },
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

// Flat list for mobile bar
const NAV_FLAT = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Compass, label: "Discover", path: "/dashboard/discover" },
  { icon: Clapperboard, label: "Studio", path: "/dashboard/studio" },
  { icon: CalendarDays, label: "Calendar", path: "/dashboard/calendar" },
  { icon: User, label: "Profile", path: "/dashboard/profile" },
];

// ── Usage bar ─────────────────────────────────────────────────────────────────
function UsageCard({ walletData }) {
  const usedPct = walletData?.usedPct ?? 34;
  const planLabel = walletData?.planLabel ?? "Free";
  const nextReset = walletData?.nextResetAt;
  const remaining = Math.max(0, 100 - usedPct);
  const isLow = remaining < 20;
  const isMid = remaining >= 20 && remaining < 40;

  const resetLabel = nextReset
    ? new Date(nextReset).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : null;

  const fillColor = isLow
    ? "bg-red-500"
    : isMid
      ? "bg-amber-500"
      : "bg-[hsl(var(--sidebar-primary))]";

  return (
    <div className="mx-3 mb-3 rounded-xl bg-white/6 border border-white/8 px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1 font-body text-[11px] text-sidebar-foreground/60">
          <Zap size={10} /> Usage
        </span>
        <span className="font-body text-[11px] font-semibold text-sidebar-foreground/80">
          {usedPct}%
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${fillColor}`}
          style={{ width: `${remaining}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="font-body text-[10px] text-sidebar-foreground/40">
          {planLabel} plan
        </span>
        {resetLabel && (
          <span className="font-body text-[10px] text-amber-400/70">
            Resets {resetLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useFirebaseAuth();
  const { data: profileData } = useProfile();
  const { data: walletData } = useCreditsWallet();

  const user = profileData?.data?.user;
  const name = user?.name || "Creator";
  const handle = user?.instagram_handle
    ? `@${user.instagram_handle}`
    : user?.youtube_channel_name
      ? user.youtube_channel_name
      : "@creator";
  const initials = name.charAt(0).toUpperCase();
  const plan = walletData?.plan ?? "free";
  const isPro = plan === "pro" || plan === "max";

  const isActive = (path) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  return (
    <aside className="hidden lg:flex flex-col w-56 xl:w-60 h-screen bg-sidebar border-r border-sidebar-border flex-shrink-0 overflow-hidden">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="font-heading text-xl text-sidebar-foreground tracking-tight">
          ARIA
        </div>
        <span
          className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full
          ${isPro ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-sidebar-foreground/50"}`}
        >
          {isPro ? "Pro" : "Free"}
        </span>
      </div>

      {/* User card */}
      <button
        onClick={() => navigate("/dashboard/profile")}
        className="mx-3 mb-4 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/6 hover:bg-white/10 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-full bg-[hsl(var(--sidebar-primary))] flex items-center justify-center
                        font-heading text-sm text-white flex-shrink-0"
        >
          {initials}
        </div>
        <div className="min-w-0 text-left flex-1">
          <p className="font-body text-sm font-semibold text-sidebar-foreground truncate">
            {name}
          </p>
          <p className="font-body text-[11px] text-sidebar-foreground/50 truncate">
            {handle}
          </p>
        </div>
        <ChevronRight
          size={13}
          className="text-sidebar-foreground/30 flex-shrink-0"
        />
      </button>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-4 pb-2">
        {NAV_GROUPS.map((g) => (
          <div key={g.label}>
            <p className="px-2 mb-1 font-body text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
              {g.label}
            </p>
            <div className="space-y-0.5">
              {g.items.map((it) => {
                const active = isActive(it.path);
                const Icon = it.icon;
                return (
                  <Link
                    key={it.path}
                    to={it.path}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-body text-sm transition-colors
                      ${
                        active
                          ? "bg-[hsl(var(--sidebar-primary))] text-white"
                          : "text-sidebar-foreground/60 hover:bg-white/6 hover:text-sidebar-foreground"
                      }`}
                  >
                    <Icon size={15} />
                    <span className="flex-1">{it.label}</span>
                    {it.hot && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sign out */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-body text-sm
                     text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors mt-1"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </nav>

      {/* Bottom: usage + upgrade */}
      <div className="border-t border-sidebar-border pt-3">
        <UsageCard walletData={walletData} />

        {!isPro && (
          <button
            onClick={() => navigate("/dashboard/settings?tab=credits")}
            className="mx-3 mb-3 w-[calc(100%-24px)] flex items-center justify-between gap-2
                       bg-[hsl(var(--sidebar-primary))] hover:opacity-90 transition-opacity
                       rounded-xl px-3 py-2.5"
          >
            <div className="text-left">
              <p className="font-body text-[13px] font-semibold text-white">
                Upgrade to Pro
              </p>
              <p className="font-body text-[10px] text-white/60">
                Unlimited trends · brand alerts
              </p>
            </div>
            <Sparkles size={14} className="text-white/80 flex-shrink-0" />
          </button>
        )}
      </div>
    </aside>
  );
}

// ── Mobile bottom bar ─────────────────────────────────────────────────────────
function MobileBar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { logout } = useFirebaseAuth();
  const { data: profileData } = useProfile();
  const { data: walletData } = useCreditsWallet();

  const name = profileData?.data?.user?.name || "Creator";
  const plan = walletData?.plan ?? "free";
  const isPro = plan === "pro" || plan === "max";

  const isActive = (path) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  return (
    <>
      {/* Bottom tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border
                      flex items-center justify-around px-2 py-2 safe-area-bottom"
      >
        {NAV_FLAT.map((it) => {
          const active = isActive(it.path);
          const Icon = it.icon;
          return (
            <Link
              key={it.path}
              to={it.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors
                ${active ? "text-[hsl(var(--sidebar-primary))]" : "text-sidebar-foreground/40 hover:text-sidebar-foreground/70"}`}
            >
              <Icon size={20} />
              <span className="font-body text-[9px]">{it.label}</span>
            </Link>
          );
        })}

        {/* Menu button */}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-sidebar-foreground/40
                     hover:text-sidebar-foreground/70 transition-colors"
        >
          <Menu size={20} />
          <span className="font-body text-[9px]">More</span>
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative ml-auto w-72 h-full bg-sidebar flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-5 pb-3">
              <div className="font-heading text-lg text-sidebar-foreground">
                ARIA
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-sidebar-foreground/50 hover:text-sidebar-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {/* User */}
            <div className="mx-4 mb-4 flex items-center gap-2.5 bg-white/6 rounded-xl px-3 py-2">
              <div
                className="w-8 h-8 rounded-full bg-[hsl(var(--sidebar-primary))] flex items-center justify-center
                              font-heading text-sm text-white"
              >
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-sidebar-foreground">
                  {name}
                </p>
                <p className="font-body text-[11px] text-sidebar-foreground/50">
                  {isPro ? "Pro plan" : "Free plan"}
                </p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-4 pb-4">
              {NAV_GROUPS.map((g) => (
                <div key={g.label}>
                  <p className="px-2 mb-1 font-body text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                    {g.label}
                  </p>
                  {g.items.map((it) => {
                    const active = isActive(it.path);
                    const Icon = it.icon;
                    return (
                      <Link
                        key={it.path}
                        to={it.path}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-body text-sm transition-colors
                          ${
                            active
                              ? "bg-[hsl(var(--sidebar-primary))] text-white"
                              : "text-sidebar-foreground/60 hover:bg-white/6 hover:text-sidebar-foreground"
                          }`}
                      >
                        <Icon size={15} />
                        {it.label}
                        {it.hot && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}

              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-body text-sm
                           text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <LogOut size={15} /> Sign out
              </button>
            </nav>

            {/* Bottom */}
            <div className="border-t border-sidebar-border pt-3">
              <UsageCard walletData={walletData} />
              {!isPro && (
                <Link
                  to="/dashboard/settings?tab=credits"
                  onClick={() => setOpen(false)}
                  className="mx-3 mb-3 flex items-center justify-between gap-2
                             bg-[hsl(var(--sidebar-primary))] rounded-xl px-3 py-2.5"
                >
                  <div>
                    <p className="font-body text-[13px] font-semibold text-white">
                      Upgrade to Pro
                    </p>
                    <p className="font-body text-[10px] text-white/60">
                      Unlimited trends · brand alerts
                    </p>
                  </div>
                  <Sparkles size={14} className="text-white/80" />
                </Link>
              )}
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
