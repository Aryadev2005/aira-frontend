import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── USER ──────────────────────────────────────────────────────────────────
export const useProfile = () =>
  useQuery({ queryKey: ['profile'], queryFn: () => api.get('/users/profile') });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.put('/users/profile', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
};

export const useCompleteOnboarding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.put('/users/onboarding', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
};

// ── TRENDS ────────────────────────────────────────────────────────────────
export const useTrends = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: ['trends', filters],
    queryFn: () => api.get(`/trends${params ? `?${params}` : ''}`),
  });
};

export const useOpportunities = () =>
  useQuery({ queryKey: ['opportunities'], queryFn: () => api.get('/trends/opportunities') });

export const useFestivalBoosts = () =>
  useQuery({ queryKey: ['festival-boosts'], queryFn: () => api.get('/trends/festival-boosts') });

// ── SONGS ─────────────────────────────────────────────────────────────────────

export const useSongs = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: ['songs', filters],
    queryFn:  () => api.get(`/songs${params ? `?${params}` : ''}`),
    staleTime: 1000 * 60 * 30,   // 30 min — matches hot window TTL
    retry: 1,
  });
};

export const useTopSongs = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: ['songs-top10', filters],
    queryFn:  () => api.get(`/songs/top10${params ? `?${params}` : ''}`),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
};

export const usePredictSongs = () =>
  useQuery({
    queryKey: ['songs-predict'],
    queryFn:  () => api.get('/songs/predict'),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

export const useSongsByMood = () =>
  useMutation({
    mutationFn: (vars) => {
      const { mood, niche, language } = vars || {};
      const params = new URLSearchParams({
        mood: mood || '',
        niche: niche || 'general',
        language: language || 'Hindi'
      }).toString();
      return api.get(`/songs/by-mood?${params}`);
    },
  });

export const useSongLanguages = () =>
  useQuery({
    queryKey: ['song-languages'],
    queryFn:  () => api.get('/songs/languages'),
    staleTime: 1000 * 60 * 60, // 1h — languages don't change often
  });

export const useSongTrajectory = (title, language) =>
  useQuery({
    queryKey: ['song-trajectory', title, language],
    queryFn:  () => api.get(`/songs/trajectory/${encodeURIComponent(title)}${language ? `?language=${language}` : ''}`),
    enabled:  !!title,
    staleTime: 1000 * 60 * 30,
  });

// ── CONTENT GENERATION ────────────────────────────────────────────────────
export const useGenerateContent = () =>
  useMutation({ mutationFn: (body) => api.post('/content/generate', body) });

export const useGenerateHooks = () =>
  useMutation({ mutationFn: (body) => api.post('/content/hooks', body) });

export const useContentHistory = () =>
  useQuery({ queryKey: ['content-history'], queryFn: () => api.get('/content/history') });

// ── ANALYTICS ─────────────────────────────────────────────────────────────
export const useAnalyticsDashboard = () =>
  useQuery({ queryKey: ['analytics-dashboard'], queryFn: () => api.get('/analytics/dashboard') });

export const useBestTimes = () =>
  useQuery({ queryKey: ['best-times'], queryFn: () => api.get('/analytics/best-times') });

export const useArchetype = () =>
  useQuery({ queryKey: ['archetype'], queryFn: () => api.get('/analytics/archetype') });

export const useTriggerScrape = () =>
  useMutation({ mutationFn: (body) => api.post('/analytics/scrape', body) });

export const useWeeklyReport = () =>
  useQuery({ queryKey: ['weekly-report'], queryFn: () => api.get('/analytics/weekly-report') });

// ── ARIA BRAIN ────────────────────────────────────────────────────────────
export const useAriaChat = () =>
  useMutation({ mutationFn: (body) => api.post('/brain/chat', body) });

export const useBrainGreet = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ['brain-greet', params],
    queryFn: () => api.get(`/brain/greet${qs ? `?${qs}` : ''}`),
    enabled: !!params.sessionId,
  });
};

// ── VIDEO DNA ─────────────────────────────────────────────────────────────
export const useVideoDNA = () =>
  useMutation({ mutationFn: (body) => api.post('/video-dna/analyse', body) });

export const useVideoDNAHistory = () =>
  useQuery({ queryKey: ['video-dna-history'], queryFn: () => api.get('/video-dna/history') });

// ── DISCOVER ──────────────────────────────────────────────────────────────
export const useDiscoverIntelligence = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: ['discover-intelligence', filters],
    queryFn: () => api.get(`/discover/intelligence${params ? `?${params}` : ''}`),
  });
};

export const useViralIdeas = () =>
  useQuery({
    queryKey: ['viralIdeas'],
    queryFn:  () => api.get('/trends/viral-ideas'),
    staleTime: 1000 * 60 * 60 * 2,
    retry: 1,
  });

export const useUpdateNiche = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (niche) => api.put('/users/niche', { niche }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['viralIdeas'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};


export const useCompetitorMoves = () =>
  useQuery({ queryKey: ['competitor-moves'], queryFn: () => api.get('/discover/competitors') });

// ── STUDIO ────────────────────────────────────────────────────────────────
export const useScriptStructure = () =>
  useMutation({ mutationFn: (body) => api.post('/studio/script/structure', body) });

export const useBGMMatch = () =>
  useMutation({ mutationFn: (body) => api.post('/studio/bgm/match', body) });

export const useEditingHelp = () =>
  useMutation({ mutationFn: (body) => api.post('/studio/editing/help', body) });

// ── LAUNCH ────────────────────────────────────────────────────────────────
export const useLaunchTiming = () =>
  useQuery({ queryKey: ['launch-timing'], queryFn: () => api.get('/launch/timing') });

export const useLaunchPackage = () =>
  useMutation({ mutationFn: (body) => api.post('/launch/package', body) });

export const useBrandAlert = () =>
  useQuery({ queryKey: ['brand-alert'], queryFn: () => api.get('/launch/brand-alert') });

// Note: /launch/rate-card does not exist in the backend — removed useRateCard.
// Use useLaunchPackage() for posting package generation instead.

// ── CALENDAR ─────────────────────────────────────────────────────────────
export const useGenerateCalendar = () =>
  useMutation({ mutationFn: (body) => api.post('/calendar/generate', body) });

export const useSavedCalendar = () =>
  useQuery({ queryKey: ['saved-calendar'], queryFn: () => api.get('/calendar/saved') });

// ── INTEGRATIONS ─────────────────────────────────────────────────────────
export const useIntegrationStatus = () =>
  useQuery({
    queryKey: ['integration-status'],
    queryFn: () => api.get('/integrations/status'),
    refetchInterval: 60_000,
  });

export const useConnectInstagramByHandle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (handle) => api.post('/integrations/instagram/connect-by-handle', { handle }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integration-status'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useYoutubeAuthUrl = () =>
  useMutation({ mutationFn: () => api.get('/integrations/youtube/auth-url') });

export const useDisconnectPlatform = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (platform) => api.delete(`/integrations/${platform}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integration-status'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useConnectHandle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/onboarding/connect', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['integration-status'] });
    },
  });
};


