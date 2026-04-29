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

// ── SONGS ─────────────────────────────────────────────────────────────────
export const useSongs = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: ['songs', filters],
    queryFn: () => api.get(`/songs${params ? `?${params}` : ''}`),
  });
};

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

// ── ARIA BRAIN ────────────────────────────────────────────────────────────
export const useAriaChat = () =>
  useMutation({ mutationFn: (body) => api.post('/aria/chat', body) });

// ── VIDEO DNA ─────────────────────────────────────────────────────────────
export const useVideoDNA = () =>
  useMutation({ mutationFn: (body) => api.post('/aria/video-dna', body) });

export const useVideoDNAHistory = () =>
  useQuery({ queryKey: ['video-dna-history'], queryFn: () => api.get('/aria/video-dna/history') });

// ── CALENDAR ─────────────────────────────────────────────────────────────
export const useGenerateCalendar = () =>
  useMutation({ mutationFn: (body) => api.post('/calendar/generate', body) });

export const useSavedCalendar = () =>
  useQuery({ queryKey: ['saved-calendar'], queryFn: () => api.get('/calendar/saved') });
