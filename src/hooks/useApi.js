import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ── USER ──────────────────────────────────────────────────────────────────
export const useProfile = () =>
  useQuery({ queryKey: ["profile"], queryFn: () => api.get("/users/profile") });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.put("/users/profile", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};

export const useCompleteOnboarding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.put("/users/onboarding", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};

// ── TRENDS ────────────────────────────────────────────────────────────────
export const useTrends = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: ["trends", filters],
    queryFn: () => api.get(`/trends${params ? `?${params}` : ""}`),
  });
};

export const useOpportunities = () =>
  useQuery({
    queryKey: ["opportunities"],
    queryFn: () => api.get("/trends/opportunities"),
  });

export const useFestivalBoosts = () =>
  useQuery({
    queryKey: ["festival-boosts"],
    queryFn: () => api.get("/trends/festival-boosts"),
  });

// ── SONGS ─────────────────────────────────────────────────────────────────────

export const useSongs = (filters = {}, enabled = true) => {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null),
  );
  const params = new URLSearchParams(cleanFilters).toString();
  return useQuery({
    queryKey: ["songs", cleanFilters],
    queryFn: () => api.get(`/songs${params ? `?${params}` : ""}`),
    staleTime: 1000 * 60 * 30,
    retry: 2,
    retryDelay: 2000,
    enabled,
  });
};

export const useTopSongs = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: ["songs-top10", filters],
    queryFn: () => api.get(`/songs/top10${params ? `?${params}` : ""}`),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
};

export const usePredictSongs = () =>
  useQuery({
    queryKey: ["songs-predict"],
    queryFn: () => api.get("/songs/predict"),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

export const useSongsByMood = () =>
  useMutation({
    mutationFn: (vars) => {
      const v = /** @type {any} */ (vars);
      const { mood, niche, language } = v || {};
      const params = new URLSearchParams({
        mood: mood || "",
        niche: niche || "general",
        language: language || "Hindi",
      }).toString();
      return api.get(`/songs/by-mood?${params}`);
    },
  });

export const useSongLanguages = () =>
  useQuery({
    queryKey: ["song-languages"],
    queryFn: () => api.get("/songs/languages"),
    staleTime: 1000 * 60 * 60, // 1h — languages don't change often
  });

export const useSongNiches = () =>
  useQuery({
    queryKey: ["song-niches"],
    queryFn: () => api.get("/songs/niches"),
    staleTime: 1000 * 60 * 60, // 1h — niches don't change often
  });

export const useSongTrajectory = (title, language) =>
  useQuery({
    queryKey: ["song-trajectory", title, language],
    queryFn: () =>
      api.get(
        `/songs/trajectory/${encodeURIComponent(title)}${language ? `?language=${language}` : ""}`,
      ),
    enabled: !!title,
    staleTime: 1000 * 60 * 30,
  });

// ── CONTENT GENERATION ────────────────────────────────────────────────────
export const useGenerateContent = () =>
  useMutation({ mutationFn: (body) => api.post("/content/generate", body) });

export const useGenerateHooks = () =>
  useMutation({ mutationFn: (body) => api.post("/content/hooks", body) });

export const useContentHistory = () =>
  useQuery({
    queryKey: ["content-history"],
    queryFn: () => api.get("/content/history"),
  });

// ── ANALYTICS ─────────────────────────────────────────────────────────────
export const useAnalyticsDashboard = () =>
  useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => api.get("/analytics/dashboard"),
  });

export const useBestTimes = () =>
  useQuery({
    queryKey: ["best-times"],
    queryFn: () => api.get("/analytics/best-times"),
  });

export const useArchetype = () =>
  useQuery({
    queryKey: ["archetype"],
    queryFn: () => api.get("/analytics/archetype"),
  });

export const useTriggerScrape = () =>
  useMutation({ mutationFn: (body) => api.post("/analytics/scrape", body) });

export const useWeeklyReport = () =>
  useQuery({
    queryKey: ["weekly-report"],
    queryFn: () => api.get("/analytics/weekly-report"),
  });

// ── ARIA BRAIN ────────────────────────────────────────────────────────────
export const useAriaChat = () =>
  useMutation({ mutationFn: (body) => api.post("/brain/chat", body) });

export const useBrainGreet = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["brain-greet", params],
    queryFn: () => api.get(`/brain/greet${qs ? `?${qs}` : ""}`),
    enabled: !!params.sessionId,
  });
};

// ── VIDEO DNA (v2 Intelligence Engine) ───────────────────────────────────────
export const useVideoDNA = () =>
  useMutation({ mutationFn: (body) => api.post("/video-dna/analyse", body) });

export const useVideoDNAHistory = () =>
  useQuery({
    queryKey: ["video-dna-history"],
    queryFn: () => api.get("/video-dna/history"),
  });

export const useCompetitorGap = () =>
  useMutation({
    mutationFn: (body) => api.post("/video-dna/competitor-gap", body),
  });

// ── DISCOVER ──────────────────────────────────────────────────────────────
export const useDiscoverIntelligence = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: ["discover-intelligence", filters],
    queryFn: () => api.get(`/trends/viral-ideas${params ? `?${params}` : ""}`),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
};

export const useViralIdeas = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: ["viralIdeas", filters],
    queryFn: () => api.get(`/trends/viral-ideas${params ? `?${params}` : ""}`),
    staleTime: 1000 * 60 * 120,
    retry: 1,
  });
};

export const useRecordTrendInteraction = () =>
  useMutation({
    mutationFn: (body) => api.post("/trends/interaction", body),
  });

export const useUpdateNiche = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (niche) => api.put("/users/niche", { niche }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["viralIdeas"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useCompetitorMoves = () =>
  useQuery({
    queryKey: ["competitor-moves"],
    queryFn: () => api.get("/discover/competitors"),
  });

// ── STUDIO ────────────────────────────────────────────────────────────────
export const useScriptStructure = () =>
  useMutation({
    mutationFn: /** @param {Record<string, any>} body */ (body) =>
      api.post("/studio/script/structure", body),
  });

export const useBGMMatch = () =>
  useMutation({ mutationFn: (body) => api.post("/studio/bgm/match", body) });

export const useEditingHelp = () =>
  useMutation({ mutationFn: (body) => api.post("/studio/editing/help", body) });

// ── LAUNCH ────────────────────────────────────────────────────────────────
export const useLaunchTiming = () =>
  useQuery({
    queryKey: ["launch-timing"],
    queryFn: () => api.get("/launch/timing"),
  });

export const useLaunchPackage = () =>
  useMutation({ mutationFn: (body) => api.post("/launch/package", body) });

export const useBrandAlert = () =>
  useQuery({
    queryKey: ["brand-alert"],
    queryFn: () => api.get("/launch/brand-alert"),
  });

// Note: /launch/rate-card does not exist in the backend — removed useRateCard.
// Use useLaunchPackage() for posting package generation instead.

// ── CALENDAR ─────────────────────────────────────────────────────────────
export const useGenerateCalendar = () =>
  useMutation({
    mutationFn: /** @param {Record<string, any>} body */ (body) =>
      api.post("/calendar/generate", body),
  });

export const useSavedCalendar = () =>
  useQuery({
    queryKey: ["saved-calendar"],
    queryFn: () => api.get("/calendar/saved"),
  });

// ── INTEGRATIONS ─────────────────────────────────────────────────────────
export const useIntegrationStatus = (enabled = true) =>
  useQuery({
    queryKey: ["integration-status"],
    queryFn: () => api.get("/integrations/status"),
    refetchInterval: enabled ? 60_000 : false,
    staleTime: 1000 * 60 * 5,
    enabled,
  });

export const useConnectInstagramByHandle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (handle) =>
      api.post("/integrations/instagram/connect-by-handle", { handle }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integration-status"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useYoutubeAuthUrl = () =>
  useMutation({ mutationFn: () => api.get("/integrations/youtube/auth-url") });

export const useDisconnectPlatform = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (platform) => api.delete(`/integrations/${platform}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integration-status"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useConnectHandle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/onboarding/connect", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["integration-status"] });
    },
  });
};

export const useFetchYouTubeAnalytics = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/integrations/youtube/fetch-analytics"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integration-status"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

/**
 * useSwitchPlatform
 * Calls PATCH /profile/switch-platform.
 * On success, invalidates profile, integration-status, roadmap, analytics-dashboard,
 * and creator-analytics so every screen reflects the new platform immediately.
 */
export const useSwitchPlatform = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (platform) =>
      api.patch("/profile/switch-platform", { platform }),
    onSuccess: () => {
      // Invalidate every query that is platform-sensitive
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["integration-status"] });
      qc.invalidateQueries({ queryKey: ["analytics-dashboard"] });
      qc.invalidateQueries({ queryKey: ["creator-analytics"] });
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      qc.invalidateQueries({ queryKey: ["best-times"] });
      qc.invalidateQueries({ queryKey: ["brand-alert"] });
      qc.invalidateQueries({ queryKey: ["viralIdeas"] });
    },
  });
};

// ── ARIA IDENTITY (Step 7) ────────────────────────────────────────────────
export const useAriaIdentity = () =>
  useQuery({
    queryKey: ["aria-identity"],
    queryFn: () => api.get("/profile/aria-identity"),
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });

/**
 * @type {() => import('@tanstack/react-query').UseMutationResult<any, Error, {category: string; key: string; value: string}, unknown>}
 */
export const useUpdateAriaMemory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.put("/profile/aria-identity/memory", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-identity"] });
    },
  });
};

/**
 * @type {() => import('@tanstack/react-query').UseMutationResult<any, Error, {category: string; key: string}, unknown>}
 */
export const useDeleteAriaMemory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.delete(
        `/profile/aria-identity/memory?category=${data.category}&key=${data.key}`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-identity"] });
    },
  });
};

/**
 * @type {() => import('@tanstack/react-query').UseMutationResult<any, Error, undefined, unknown>}
 */
export const useRebuildVoicePortrait = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/profile/voice-portrait/rebuild"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-identity"] });
    },
  });
};

// ── ROADMAP ───────────────────────────────────────────────────────────────

/**
 * usePersonalisedRoadmap
 *
 * Normal load  → GET /analytics/roadmap          (serves from cache if available)
 * Force refresh → GET /analytics/roadmap?force=true  (busts cache, calls AI)
 *
 * The `force` flag is intentionally NOT part of the queryKey so React Query
 * doesn't create a second cache entry. Instead we use queryClient.invalidateQueries
 * to trigger a re-fetch of the same key after a force refresh.
 */
export const usePersonalisedRoadmap = () =>
  useQuery({
    queryKey: ["roadmap"],
    queryFn: () => api.get("/analytics/roadmap"),
    staleTime: 1000 * 60 * 60 * 6, // 6 hours — matches server cache TTL
    retry: 1,
  });

/**
 * useRefreshRoadmap
 * Calls the dedicated /roadmap/refresh endpoint which deletes the Redis cache
 * server-side and regenerates fresh from AI. On success, invalidates the
 * React Query roadmap cache so the UI re-fetches the new data.
 */
export const useRefreshRoadmap = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.get("/analytics/roadmap/refresh"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roadmap"] });
    },
  });
};

/**
 * useRoadmapActionStates
 * Fetches the persisted complete/dismissed state for all actions of a version.
 * Only runs when a valid roadmapVersion is available.
 */
export const useRoadmapActionStates = (roadmapVersion) =>
  useQuery({
    queryKey: ["roadmap-action-states", roadmapVersion],
    queryFn: () =>
      api.get(
        `/analytics/roadmap/action-states?version=${encodeURIComponent(roadmapVersion)}`,
      ),
    enabled: !!roadmapVersion,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });

/**
 * useCompleteRoadmapAction
 */
export const useCompleteRoadmapAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/analytics/roadmap/action/complete", data),
    onSuccess: (_res, variables) => {
      const v = /** @type {any} */ (variables);
      qc.invalidateQueries({
        queryKey: ["roadmap-action-states", v.roadmapVersion],
      });
    },
  });
};

/**
 * useDismissRoadmapAction
 */
export const useDismissRoadmapAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/analytics/roadmap/action/dismiss", data),
    onSuccess: (_res, variables) => {
      const v = /** @type {any} */ (variables);
      qc.invalidateQueries({
        queryKey: ["roadmap-action-states", v.roadmapVersion],
      });
    },
  });
};

// ── CREATOR ANALYTICS (Full ARIA analysis tab) ────────────────────────────
export const useCreatorAnalytics = () =>
  useQuery({
    queryKey: ["creator-analytics"],
    queryFn: () => api.get("/profile/creator-analytics"),
    staleTime: 1000 * 60 * 60 * 6, // 6 hours — matches backend cache
    retry: 1,
  });

export const useRefreshCreatorAnalytics = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/profile/creator-analytics/refresh"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creator-analytics"] });
    },
  });
};

// ── SUGGESTION FEEDBACK (Step 6 on Frontend) ──────────────────────────────
export const useSuggestionFeedback = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/brain/suggestion-feedback", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-identity"] });
    },
  });
};

// ── STUDIO EXTENDED ───────────────────────────────────────────────────────────
export const useScriptHistory = () =>
  useQuery({
    queryKey: ["script-history"],
    queryFn: () => api.get("/studio/history"),
    staleTime: 1000 * 60 * 5,
  });

export const useSaveSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: /** @param {Record<string, any>} body */ (body) =>
      api.post("/studio/session/save", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["script-history"] });
    },
  });
};

export const useLearnFromEdit = () =>
  useMutation({
    mutationFn: /** @param {Record<string, any>} body */ (body) =>
      api.post("/studio/learn", body),
  });

export const useRegenerateSection = () =>
  useMutation({
    mutationFn: /** @param {Record<string, any>} body */ (body) =>
      api.post("/studio/script/regenerate-section", body),
  });

export const useTogglePin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (scriptId) => api.patch(`/studio/pin/${scriptId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["script-history"] });
    },
  });
};

// ── CALENDAR ENTRIES ──────────────────────────────────────────────────────
export const useCalendarEntries = (month) =>
  useQuery({
    queryKey: ["calendar-entries", month],
    queryFn: () =>
      api.get(`/calendar/entries${month ? `?month=${month}` : ""}`),
    staleTime: 1000 * 60 * 5, // 5 min — entries change often
    retry: 1,
  });

export const useCreateCalendarEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: /** @param {Record<string, any>} body */ (body) =>
      api.post("/calendar/entries", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-entries"] });
    },
  });
};

export const useUpdateCalendarEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: /** @param {{ id: string, [key: string]: any }} body */ ({
      id,
      ...body
    }) => api.patch(`/calendar/entries/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-entries"] });
    },
  });
};

export const useDeleteCalendarEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: /** @param {string} id */ (id) =>
      api.delete(`/calendar/entries/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-entries"] });
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// CREDITS HOOKS (v2) — Replace the existing credits hooks in src/hooks/useApi.js
//
// API now returns usedPct / remainingPct instead of raw credit numbers.
// These hooks expose ONLY what the frontend needs to render.
// ─────────────────────────────────────────────────────────────────────────────

// ── GET /api/v1/credits/wallet ────────────────────────────────────────────────
// Returns:
//   usedPct, remainingPct         — for progress bar
//   planLabel, planMultiplier     — "Pro", "15× the free plan"
//   planUsedPct, rolloverPct, topupPct — for breakdown
//   totalActionsCount, nextResetAt — for stats
//   topupPacks                    — for upsell
export const useCreditsWallet = () =>
  useQuery({
    queryKey: ["credits-wallet"],
    queryFn: () => api.get("/credits/wallet"),
    staleTime: 1000 * 60, // 1 min
    refetchInterval: 1000 * 60, // background refresh
    retry: 1,
    select: (res) => res.data, // unwrap { success, data } envelope
  });

// ── GET /api/v1/credits/history ───────────────────────────────────────────────
// Returns shaped transactions: type, description, costLabel ("~1.2% of plan"),
// featureCharge, aiCharge — no raw credit amounts.
export const useCreditsHistory = ({ limit = 20, offset = 0 } = {}) =>
  useQuery({
    queryKey: ["credits-history", limit, offset],
    queryFn: () => api.get(`/credits/history?limit=${limit}&offset=${offset}`),
    staleTime: 1000 * 30,
    retry: 1,
    select: (res) => res.data,
  });

// ── GET /api/v1/credits/packs ─────────────────────────────────────────────────
export const useCreditsPacks = () =>
  useQuery({
    queryKey: ["credits-packs"],
    queryFn: () => api.get("/credits/packs"),
    staleTime: 1000 * 60 * 60 * 24,
    retry: 1,
    select: (res) => res.data,
  });

// ── POST /api/v1/credits/topup ────────────────────────────────────────────────
// Used by useRazorpay hook after payment verification.
export const useBuyTopup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/credits/topup", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credits-wallet"] });
      qc.invalidateQueries({ queryKey: ["credits-history"] });
    },
  });
};

// ── NOTES ─────────────────────────────────────────────────────────────────────

export const useNotes = (filters = {}) => {
  const params = new URLSearchParams(
    Object.fromEntries(
      Object.entries(filters).filter(
        ([, v]) => v !== undefined && v !== null && v !== "",
      ),
    ),
  ).toString();
  return useQuery({
    queryKey: ["notes", filters],
    queryFn: () => api.get(`/notes${params ? `?${params}` : ""}`),
    staleTime: 1000 * 60 * 2,
    retry: 1,
    select: (res) => res?.data ?? res,
  });
};

export const useCreateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/notes", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
};

export const useUpdateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/notes/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
};

export const useDeleteNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/notes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
};

export const useToggleNotePin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/notes/${id}/pin`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
};

export const useRewriteHook = () =>
  useMutation({
    mutationFn: (body) => api.post("/content/rewrite-hook", body),
  });
