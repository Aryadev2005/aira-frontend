import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { niches } from '@/lib/mockData';
import { useCompleteOnboarding } from '@/hooks/useApi';

const followerRanges = ['Under 1K', '1K–10K', '10K–50K', '50K–100K', '100K–500K', '500K+'];
const platforms = [
  { name: 'Instagram', desc: 'Reels, Stories, Posts' },
  { name: 'YouTube', desc: 'Videos, Shorts, Lives' },
  { name: 'Both', desc: 'Multi-platform creator' },
  { name: 'Other', desc: 'TikTok, Twitter, etc.' },
];

const stepVariants = {
  enter: { opacity: 0, x: 50 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [followerRange, setFollowerRange] = useState('');
  const [platform, setPlatform] = useState('');
  const [selectedNiches, setSelectedNiches] = useState([]);

  const toggleNiche = (n) => {
    setSelectedNiches((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : prev.length < 5 ? [...prev, n] : prev
    );
  };

  const canContinue = () => {
    if (step === 0) return !!followerRange;
    if (step === 1) return !!platform;
    if (step === 2) return selectedNiches.length > 0;
    return false;
  };

  const { mutateAsync: completeOnboarding, isPending } = useCompleteOnboarding();

  const handleContinue = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      try {
        await completeOnboarding({
          followerRange,
          primaryPlatform: platform,
          niches: selectedNiches
        });
        navigate('/dashboard');
      } catch (err) {
        console.error('Onboarding failed', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((step + 1) / 3) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-2">
            <span className="text-muted-foreground font-body text-sm">Step {step + 1} of 3</span>
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', damping: 25 }}
              >
                <h2 className="font-heading text-3xl text-foreground text-center mb-2">
                  How big is your audience?
                </h2>
                <p className="text-muted-foreground font-body text-center mb-8">
                  This helps us tailor trends and recommendations to your level
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {followerRanges.map((r) => (
                    <button
                      key={r}
                      onClick={() => setFollowerRange(r)}
                      className={`px-4 py-3 rounded-xl font-body text-sm font-medium transition-all ${
                        followerRange === r
                          ? 'bg-primary text-white border-2 border-primary shadow-warm'
                          : 'bg-card border-2 border-border text-foreground hover:border-primary/30'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', damping: 25 }}
              >
                <h2 className="font-heading text-3xl text-foreground text-center mb-2">
                  Where do you post most?
                </h2>
                <p className="text-muted-foreground font-body text-center mb-8">
                  We'll optimize everything for your primary platform
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setPlatform(p.name)}
                      className={`px-4 py-5 rounded-xl text-center transition-all ${
                        platform === p.name
                          ? 'bg-primary text-white border-2 border-primary shadow-warm'
                          : 'bg-card border-2 border-border text-foreground hover:border-primary/30'
                      }`}
                    >
                      <p className="font-body font-semibold text-sm">{p.name}</p>
                      <p className={`font-body text-xs mt-1 ${platform === p.name ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {p.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', damping: 25 }}
              >
                <h2 className="font-heading text-3xl text-foreground text-center mb-2">
                  What do you create?
                </h2>
                <p className="text-muted-foreground font-body text-center mb-8">
                  Pick 1–5 niches to personalize your trend feed
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {niches.map((n) => (
                    <button
                      key={n}
                      onClick={() => toggleNiche(n)}
                      className={`px-4 py-2 rounded-pill text-sm font-body font-medium transition-all ${
                        selectedNiches.includes(n)
                          ? 'bg-primary text-white shadow-warm-sm'
                          : 'bg-card border border-border text-foreground hover:border-primary/30'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs font-body text-center mt-3">
                  {selectedNiches.length}/5 selected
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 flex justify-center">
            <Button
              onClick={handleContinue}
              disabled={!canContinue() || isPending}
              className="bg-primary hover:bg-primary/90 text-white rounded-pill px-10 py-6 font-body font-semibold shadow-warm text-base disabled:opacity-40"
            >
              {isPending ? 'Saving...' : (step === 2 ? 'Start exploring →' : 'Continue →')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}