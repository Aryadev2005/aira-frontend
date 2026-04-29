import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass, Clapperboard, Rocket, Music, Brain, BarChart3, User, Zap, LogOut } from 'lucide-react';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

const navItems = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: Compass, label: 'Discover', path: '/dashboard/discover' },
  { icon: Clapperboard, label: 'Studio', path: '/dashboard/studio' },
  { icon: Rocket, label: 'Launch', path: '/dashboard/launch' },
  { icon: Music, label: 'Songs', path: '/dashboard/songs' },
  { icon: Brain, label: 'ARIA Brain', path: '/dashboard/brain' },
  { icon: BarChart3, label: 'Video DNA', path: '/dashboard/video-dna' },
  { icon: User, label: 'Profile', path: '/dashboard/profile' },
];

export default function Sidebar() {
  const location = useLocation();
  const { dbUser, logout } = useFirebaseAuth();

  const displayName = dbUser?.name || 'Creator';
  const plan = dbUser?.subscription_tier || 'free';
  const initial = displayName[0]?.toUpperCase() || 'A';

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar text-sidebar-foreground h-screen fixed left-0 top-0 border-r border-sidebar-border">
        <div className="p-6">
          <Link to="/" className="font-heading text-2xl text-sidebar-primary">AIRA</Link>
        </div>

        <div className="px-3 flex-1">
          <div className="flex items-center gap-3 px-3 py-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">{initial}</span>
            </div>
            <div className="flex-1">
              <p className="font-body font-semibold text-sm text-sidebar-foreground truncate">{displayName}</p>
              <p className="font-body text-xs text-sidebar-foreground/50 capitalize">{plan === 'pro' ? 'Pro' : 'Free plan'}</p>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-destructive transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm transition-all ${
                  isActive(item.path)
                    ? 'bg-sidebar-primary/10 text-sidebar-primary font-semibold'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4">
          <div className="bg-sidebar-accent rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-sidebar-primary" />
              <span className="font-body font-semibold text-sm text-sidebar-foreground">Upgrade to Pro</span>
            </div>
            <p className="text-sidebar-foreground/50 text-xs font-body mb-3">
              Unlock unlimited trends & AI tools
            </p>
            <button className="w-full py-2 bg-sidebar-primary text-white rounded-pill text-xs font-body font-semibold hover:bg-sidebar-primary/90 transition-colors">
              ₹499/month
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border">
        <div className="flex items-center justify-around py-2">
          {[navItems[0], navItems[1], navItems[5], navItems[4], navItems[7]].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                isActive(item.path) ? 'text-sidebar-primary' : 'text-sidebar-foreground/50'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-body font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}