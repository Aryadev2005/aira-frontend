import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/lib/FirebaseAuthContext";
import { api } from "@/lib/api";

const followerRanges = [
  "Under 1K",
  "1K–10K",
  "10K–50K",
  "50K–100K",
  "100K–500K",
  "500K+",
];

const stepVariants = {
  enter: { opacity: 0, x: 50 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dbUser, syncWithBackend, user } = useFirebaseAuth();

  const [step, setStep] = useState(0);
  const [followerRange, setFollowerRange] = useState("");
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [connectionStatus, setConnectionStatus] = useState({
    instagram: null,
    youtube: null,
  });
  const [analysingStatus, setAnalysingStatus] = useState("idle"); // idle | loading | done | error
  const [detectedNiche, setDetectedNiche] = useState(null);
  const [error, setError] = useState(null);

  // Handle redirect back from OAuth
  useEffect(() => {
    const successPlatform = searchParams.get("success");
    const errorParam = searchParams.get("error");
    const handle = searchParams.get("handle");

    if (successPlatform) {
      // OAuth succeeded — move to analysis step
      setConnectionStatus((prev) => ({
        ...prev,
        [successPlatform]: { connected: true, handle },
      }));
      setStep(2); // Jump to analysis step
      startNicheAnalysis(successPlatform, handle);
    }

    if (errorParam) {
      setError(getErrorMessage(errorParam));
      setStep(1); // Back to connect step
    }
  }, [searchParams]);

  const getErrorMessage = (code) => {
    const messages = {
      youtube_denied: "YouTube access was denied. Please try again.",
      youtube_failed: "YouTube connection failed. Please try again.",
      invalid_handle: "Please enter a valid Instagram username.",
      connection_failed: "Instagram connection failed. Please try again.",
    };
    return messages[code] || "Something went wrong. Please try again.";
  };

  const startNicheAnalysis = async (platform, handle) => {
    setAnalysingStatus("loading");
    try {
      // Poll for niche detection completion (backend scrape is async)
      let attempts = 0;
      const maxAttempts = 12; // 60 seconds total

      const poll = async () => {
        attempts++;
        const profile = await api.get("/users/me");

        if (profile?.data?.niches?.length > 0 && profile?.data?.archetype) {
          setDetectedNiche({
            niches: profile.data.niches,
            archetype: profile.data.archetype,
            archetypeLabel: profile.data.aria_last_analysis?.archetypeLabel,
            archetypeEmoji: profile.data.aria_last_analysis?.archetypeEmoji,
            ariaMessage: profile.data.aria_last_analysis?.ariaMessage,
          });
          setAnalysingStatus("done");

          // Sync the updated user to context
          await syncWithBackend(user);
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          // Timeout — use fallback and go to dashboard
          setAnalysingStatus("done");
          setDetectedNiche({
            niches: ["general"],
            archetype: "CREATOR",
            archetypeEmoji: "🎯",
            ariaMessage:
              "ARIA is still analysing your account. Check back in a few minutes for your full profile!",
          });
        }
      };

      // First call: trigger the analysis explicitly
      try {
        await api.post("/onboarding/connect", {
          handle,
          platform,
          followerRange,
        });
      } catch (e) {
        // If connect endpoint fails, still poll — background scrape may have started
        console.warn("Connect endpoint error (continuing poll):", e);
      }

      setTimeout(poll, 3000); // Start polling after 3s
    } catch (err) {
      console.error("Niche analysis failed:", err);
      setAnalysingStatus("error");
    }
  };

  const handleConnectInstagram = async () => {
    if (!instagramHandle.trim()) {
      setError("Please enter your Instagram username.");
      return;
    }
    const cleanHandle = instagramHandle.replace(/^@/, "").trim();
    try {
      setConnectingPlatform("instagram");
      setError(null);

      // Save follower range first
      await api.put("/users/onboarding", { followerRange });

      // POST username directly — Apify handles the scraping
      const res = await api.post("/integrations/instagram/connect-by-handle", {
        handle: cleanHandle,
      });

      if (res.data?.connected || res.connected) {
        setConnectionStatus((prev) => ({
          ...prev,
          instagram: { connected: true, handle: cleanHandle },
        }));
        setStep(2);
        startNicheAnalysis("instagram", cleanHandle);
      } else {
        throw new Error(res.data?.message || "Could not connect Instagram");
      }
    } catch (err) {
      console.error("Instagram connection error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not connect Instagram. Please check your username and try again.",
      );
      setConnectingPlatform(null);
    }
  };

  const handleConnectYouTube = async () => {
    try {
      setConnectingPlatform("youtube");
      setError(null);

      // Save follower range first
      await api.put("/users/onboarding", { followerRange });

      // Getting auth URL — pass flow=onboarding
      const res = await api.get(
        "/integrations/youtube/auth-url?flow=onboarding",
      );

      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error("YouTube configuration missing on server");
      }
    } catch (err) {
      console.error("YouTube connection error:", err);
      setError(
        err.message ||
          "Could not initiate YouTube connection. Please try again.",
      );
      setConnectingPlatform(null);
    }
  };

  const handleFinish = async () => {
    if (detectedNiche) {
      try {
        await api.post("/onboarding/finalise", {
          confirmedNiches: detectedNiche.niches,
          confirmedArchetype: detectedNiche.archetype,
          platform: connectionStatus.instagram?.connected
            ? "instagram"
            : "youtube",
          followerRange,
        });
      } catch (e) {
        console.warn("Finalise failed:", e);
      }
    }
    navigate("/dashboard");
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-2">
            <span className="text-muted-foreground font-body text-sm">
              Step {step + 1} of {totalSteps}
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 0: Followers */}
            {step === 0 && (
              <motion.div
                key="step0"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", damping: 25 }}
              >
                <h2 className="font-heading text-3xl text-foreground text-center mb-2">
                  How big is your audience?
                </h2>
                <p className="text-muted-foreground font-body text-center mb-8">
                  This helps ARIA tailor trends and recommendations to your
                  level
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {followerRanges.map((r) => (
                    <button
                      key={r}
                      onClick={() => setFollowerRange(r)}
                      className={`px-4 py-3 rounded-xl font-body text-sm font-medium transition-all ${
                        followerRange === r
                          ? "bg-primary text-white border-2 border-primary shadow-warm"
                          : "bg-card border-2 border-border text-foreground hover:border-primary/30"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 1: Connect account */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", damping: 25 }}
              >
                <h2 className="font-heading text-3xl text-foreground text-center mb-2">
                  Connect your account
                </h2>
                <p className="text-muted-foreground font-body text-center mb-2">
                  ARIA will analyse your content and automatically detect your
                  niche, archetype, and growth opportunities.
                </p>
                <p className="text-primary/70 font-body text-xs text-center mb-8">
                  🔒 Read-only access. ARIA never posts without your permission.
                </p>

                <div className="space-y-3">
                  {/* Instagram — username input */}
                  <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl">
                        📸
                      </div>
                      <div>
                        <p className="font-body font-semibold text-foreground">Connect Instagram</p>
                        <p className="font-body text-xs text-muted-foreground">Reels, Stories, Posts — ARIA reads your analytics</p>
                      </div>
                      {connectionStatus.instagram?.connected && (
                        <span className="ml-auto text-green-500 text-xs font-body font-medium">✓ Connected</span>
                      )}
                    </div>
                    {!connectionStatus.instagram?.connected && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="@yourusername"
                          value={instagramHandle}
                          onChange={(e) => setInstagramHandle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleConnectInstagram()}
                          disabled={!!connectingPlatform}
                          className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:opacity-50"
                        />
                        <button
                          onClick={handleConnectInstagram}
                          disabled={!!connectingPlatform || !instagramHandle.trim()}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-body font-semibold disabled:opacity-50 transition-opacity"
                        >
                          {connectingPlatform === "instagram" ? "⏳" : "Connect"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* YouTube */}
                  <button
                    onClick={handleConnectYouTube}
                    disabled={!!connectingPlatform}
                    className="w-full flex items-center gap-4 px-6 py-5 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/20 hover:border-red-500/50 transition-all disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white text-xl">
                      ▶
                    </div>
                    <div className="text-left">
                      <p className="font-body font-semibold text-foreground">
                        Connect YouTube
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        Videos, Shorts — ARIA analyses your channel
                      </p>
                    </div>
                    {connectingPlatform === "youtube" && (
                      <div className="ml-auto animate-spin text-red-500">⟳</div>
                    )}
                  </button>

                  {/* Skip option */}
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full py-3 text-muted-foreground font-body text-sm hover:text-foreground transition-colors"
                  >
                    Skip for now — connect later in Settings
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: ARIA analysing */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", damping: 25 }}
              >
                {analysingStatus === "loading" && (
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="text-4xl"
                      >
                        🔮
                      </motion.div>
                    </div>
                    <h2 className="font-heading text-2xl text-foreground mb-3">
                      ARIA is analysing your account
                    </h2>
                    <p className="text-muted-foreground font-body text-sm mb-6">
                      Detecting your niche, archetype, and growth opportunities…
                    </p>
                    <div className="space-y-2 text-left max-w-xs mx-auto">
                      {[
                        "Scanning recent content…",
                        "Detecting engagement patterns…",
                        "Building your creator profile…",
                      ].map((msg, i) => (
                        <motion.div
                          key={msg}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 1.5 }}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <span className="text-primary">✦</span> {msg}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {analysingStatus === "done" && detectedNiche && (
                  <div className="text-center">
                    <div className="text-5xl mb-4">
                      {detectedNiche.archetypeEmoji || "🎯"}
                    </div>
                    <h2 className="font-heading text-2xl text-foreground mb-1">
                      ARIA found your vibe
                    </h2>
                    <p className="text-primary font-body font-semibold text-lg mb-2">
                      {detectedNiche.archetypeLabel || detectedNiche.archetype}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {detectedNiche.niches.map((n) => (
                        <span
                          key={n}
                          className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-body font-medium"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                    {detectedNiche.ariaMessage && (
                      <div className="bg-card border border-border rounded-xl p-4 mb-6 text-left">
                        <p className="text-xs text-muted-foreground mb-1 font-body">
                          ARIA says
                        </p>
                        <p className="text-sm text-foreground font-body italic">
                          "{detectedNiche.ariaMessage}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {analysingStatus === "error" && (
                  <div className="text-center">
                    <div className="text-5xl mb-4">⚡</div>
                    <h2 className="font-heading text-2xl text-foreground mb-2">
                      Account connected!
                    </h2>
                    <p className="text-muted-foreground font-body text-sm">
                      ARIA will finish analysing your account in the background.
                      Check your profile in a few minutes.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="mt-10 flex justify-center gap-3">
            {step > 0 && analysingStatus !== "loading" && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="rounded-pill px-6 py-5 font-body"
              >
                ← Back
              </Button>
            )}

            {step === 0 && (
              <Button
                onClick={() => setStep(1)}
                disabled={!followerRange}
                className="bg-primary hover:bg-primary/90 text-white rounded-pill px-10 py-6 font-body font-semibold shadow-warm text-base disabled:opacity-40"
              >
                Continue →
              </Button>
            )}

            {step === 2 && analysingStatus !== "loading" && (
              <Button
                onClick={handleFinish}
                className="bg-primary hover:bg-primary/90 text-white rounded-pill px-10 py-6 font-body font-semibold shadow-warm text-base"
              >
                {analysingStatus === "done"
                  ? "Enter ARIA →"
                  : "Continue anyway →"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
