# AIRA — Frontend ↔ Backend Integration Prompt
**For:** Gemini 2.5 Flash  
**Task:** Wire `aira_frontend` (React/Vite) to `trend_ai_backend` (Fastify/Node.js)

---

## CONTEXT

You are integrating two existing codebases for AIRA — India's AI creator OS.

**Frontend** (`aira_frontend`): React + Vite + TailwindCSS + React Router v6 + TanStack Query  
**Backend** (`trend_ai_backend`): Fastify + PostgreSQL + Firebase Auth + Redis + Groq AI  

The frontend currently uses stub auth (`FirebaseAuthContext.jsx`) and hardcoded mock data (`src/lib/mockData.js`). Your job is to replace all of that with real API calls to the backend.

---

## BACKEND — BASE URL & AUTH PATTERN

Every authenticated API call must:
1. Get the Firebase ID token: `await firebase.auth().currentUser.getIdToken()`
2. Send it as: `Authorization: Bearer <idToken>`
3. Base URL in dev: `http://localhost:3001` (or `VITE_API_BASE_URL` env var)
4. All routes are prefixed: `/api/v1/`

**Backend route map:**
```
POST   /api/v1/auth/firebase          — exchange Firebase idToken, creates/fetches user in DB
GET    /api/v1/auth/me                — get current session user
DELETE /api/v1/auth/account           — delete account

GET    /api/v1/users/profile          — full user profile
PUT    /api/v1/users/profile          — update name, instagramHandle, youtubeHandle, bio, fcmToken
PUT    /api/v1/users/onboarding       — complete onboarding (followerRange, primaryPlatform, niches[])
GET    /api/v1/users/stats            — creator stats
PUT    /api/v1/users/subscription     — update subscription tier

GET    /api/v1/trends/                — list live trends (query: ?niche=&platform=&badge=)
GET    /api/v1/trends/opportunities   — opportunity feed for Discover screen
GET    /api/v1/trends/festival-boosts — festival boost banners
GET    /api/v1/trends/competitor-moves — competitor moves

GET    /api/v1/songs/                 — live trending songs
GET    /api/v1/songs/recommendations  — song recommendations (query: ?niche=&platform=)

POST   /api/v1/content/generate       — generate script/caption/hooks (body: trendTitle, niche, platform, followerRange, contentFormat)
POST   /api/v1/content/hooks          — generate hook variations (body: topic, niche)
POST   /api/v1/content/repurpose      — repurpose content across platforms
GET    /api/v1/content/history        — content generation history

POST   /api/v1/analytics/scrape       — trigger Instagram/YouTube scrape (body: handle, platform)
GET    /api/v1/analytics/dashboard    — analytics dashboard data
GET    /api/v1/analytics/best-times   — best posting times
GET    /api/v1/analytics/archetype    — user archetype data
GET    /api/v1/analytics/growth       — [PRO] growth prediction
GET    /api/v1/analytics/competitors  — [PRO] competitor insights
GET    /api/v1/analytics/weekly-report — [PRO] weekly report

POST   /api/v1/aria/chat              — ARIA Brain chat (body: messages[], context{})
POST   /api/v1/aria/video-dna         — analyse YouTube URL (body: url)
GET    /api/v1/aria/video-dna/history — past analyses

POST   /api/v1/calendar/generate      — generate content calendar (body: niche, platform, followerRange, month, year)
GET    /api/v1/calendar/saved         — saved calendars
POST   /api/v1/calendar/save          — save a calendar
```

---

## STEP 1 — INSTALL FIREBASE & CREATE CONFIG FILES

### 1a. Install Firebase SDK
```bash
npm install firebase
```

### 1b. Create `src/lib/firebase.js`
```js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

### 1c. Create `src/lib/api.js` — centralised API client
```js
import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

export async function apiRequest(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message || 'API error'), { status: res.status, data: err });
  }
  return res.json();
}

export const api = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
};
```

### 1d. Create `.env` file in frontend root
```
VITE_API_BASE_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## STEP 2 — REPLACE `FirebaseAuthContext.jsx` WITH REAL FIREBASE AUTH

Replace the entire contents of `src/lib/FirebaseAuthContext.jsx` with:

```jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { api } from './api';

const FirebaseAuthContext = createContext();

export function FirebaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null); // full user from our DB
  const [loading, setLoading] = useState(true);

  // After Firebase auth, exchange token with our backend to create/fetch DB user
  const syncWithBackend = async (firebaseUser) => {
    if (!firebaseUser) { setDbUser(null); return; }
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/v1/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.data?.user || null);
      }
    } catch (e) {
      console.error('Backend sync failed', e);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      await syncWithBackend(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await syncWithBackend(cred.user);
    return cred;
  };

  const signUp = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    await syncWithBackend(cred.user);
    return cred;
  };

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await syncWithBackend(cred.user);
    return cred;
  };

  const logout = async () => {
    await signOut(auth);
    setDbUser(null);
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  // Check if onboarding is complete
  const needsOnboarding = dbUser && (!dbUser.primary_platform || !dbUser.niches?.length);

  return (
    <FirebaseAuthContext.Provider
      value={{ user, dbUser, loading, needsOnboarding, signIn, signUp, signInWithGoogle, logout, resetPassword, syncWithBackend }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  return ctx;
}
```

---

## STEP 3 — CREATE API HOOKS WITH TANSTACK QUERY

Create `src/hooks/useApi.js`:

```js
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
```

---

## STEP 4 — UPDATE EACH PAGE TO USE REAL DATA

### 4a. `src/pages/Onboarding.jsx`
Replace any mock submit logic with:
```js
import { useCompleteOnboarding } from '@/hooks/useApi';
import { useNavigate } from 'react-router-dom';

const { mutateAsync: completeOnboarding, isPending } = useCompleteOnboarding();

const handleSubmit = async () => {
  await completeOnboarding({ followerRange, primaryPlatform, niches });
  navigate('/dashboard');
};
```

### 4b. `src/pages/dashboard/Discover.jsx`
Replace mock trends and opportunity feed with:
```js
import { useTrends, useOpportunities, useFestivalBoosts } from '@/hooks/useApi';

const { data: trendsData, isLoading } = useTrends({ badge: activeFilter, niche: userNiche });
const { data: opportunitiesData } = useOpportunities();
const { data: festivalData } = useFestivalBoosts();

// Map backend shape to UI:
// trendsData.data.trends[] → opportunity cards
// opportunitiesData.data.opportunities[] → opportunity feed
// festivalData.data.boosts[] → festival banners
```

### 4c. `src/pages/dashboard/Songs.jsx`
Replace mock songs with:
```js
import { useSongs } from '@/hooks/useApi';

const { data, isLoading } = useSongs({ niche: userNiche, platform: userPlatform });
// data.data.songs[] → song cards
// song shape from backend: { id, title, artist, chart_position, chart_change, streams_today, language, signal }
```

### 4d. `src/pages/dashboard/AriaBrain.jsx`
Replace mock responses with real streaming chat:
```js
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';
import { auth } from '@/lib/firebase';

const { dbUser } = useFirebaseAuth();

const sendMessage = async (userMessage) => {
  const newMessages = [...messages, { role: 'user', content: userMessage }];
  setMessages(newMessages);
  setIsTyping(true);

  try {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/aria/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messages: newMessages,
        context: {
          // pass context from wherever the user came from
          niche: dbUser?.niches?.[0],
          platform: dbUser?.primary_platform,
          archetype: dbUser?.archetype,
        },
      }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, { role: 'assistant', content: data.data?.reply || data.data?.content }]);
  } finally {
    setIsTyping(false);
  }
};
```

### 4e. `src/pages/dashboard/VideoDNA.jsx`
Replace mock analysis result with:
```js
import { useVideoDNA } from '@/hooks/useApi';

const { mutateAsync: analyseVideo, isPending: analyzing } = useVideoDNA();

const handleAnalyse = async () => {
  const data = await analyseVideo({ url: youtubeUrl });
  setResult(data.data); // backend returns: overallScore, hookStrength, titleSEO, nicheBenchmark, ariaSays, actionItems, nextVideo
};
```

### 4f. `src/pages/dashboard/Studio.jsx`
Replace mock content generation with:
```js
import { useGenerateContent, useGenerateHooks } from '@/hooks/useApi';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

const { dbUser } = useFirebaseAuth();
const { mutateAsync: generateContent, isPending } = useGenerateContent();

const handleGenerate = async () => {
  const data = await generateContent({
    trendTitle: selectedTrend,
    niche: dbUser?.niches?.[0] || 'Lifestyle',
    platform: dbUser?.primary_platform || 'Instagram',
    followerRange: dbUser?.follower_range || '10K-50K',
    contentFormat: selectedFormat, // 'Reel' | 'Carousel' | 'Story'
  });
  setGeneratedContent(data.data);
  // data.data shape: { title, caption, script[], carousel_slides[], hashtags{}, ai_tip }
};
```

### 4g. `src/pages/dashboard/Profile.jsx`
Replace `mockUserProfile` with real data:
```js
import { useProfile } from '@/hooks/useApi';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

const { data, isLoading } = useProfile();
const { logout } = useFirebaseAuth();
const profile = data?.data?.user;

// Map to UI:
// profile.name, profile.email, profile.niches, profile.primary_platform
// profile.follower_range, profile.engagement_rate, profile.health_score
// profile.subscription_tier ('free' | 'pro'), profile.growth_stage
```

### 4h. `src/pages/dashboard/DashboardHome.jsx`
Replace both mock arrays (`mockTrends`, `mockSongs`) with real hooks:
```js
import { useTrends, useSongs, useProfile } from '@/hooks/useApi';

const { data: profileData } = useProfile();
const niche = profileData?.data?.user?.niches?.[0] || 'Lifestyle';
const platform = profileData?.data?.user?.primary_platform || 'Instagram';

const { data: trendsData, isLoading: trendsLoading } = useTrends({ niche });
const { data: songsData, isLoading: songsLoading } = useSongs({ niche, platform });

const trends = trendsData?.data?.trends || [];
const songs = songsData?.data?.songs || [];
```

---

## STEP 5 — ADD ROUTE GUARDS

Create `src/components/ProtectedRoute.jsx`:
```jsx
import { Navigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, needsOnboarding } = useFirebaseAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/signin" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  return children;
}
```

Update `src/App.jsx` — wrap dashboard route:
```jsx
import ProtectedRoute from '@/components/ProtectedRoute';

// In Routes:
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
  {/* ...child routes unchanged */}
</Route>
```

---

## STEP 6 — SIDEBAR USER DATA

Update `src/components/dashboard/Sidebar.jsx` to show real user info instead of hardcoded "Arjun" / "Free plan":
```jsx
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

const { dbUser, logout } = useFirebaseAuth();
const displayName = dbUser?.name || 'Creator';
const plan = dbUser?.subscription_tier || 'free';
const initial = displayName[0]?.toUpperCase() || 'A';

// Replace hardcoded values in JSX:
// "Arjun" → {displayName}
// "Free plan" → {plan === 'pro' ? 'Pro' : 'Free plan'}
// Avatar initial → {initial}
// Logout button onClick → logout()
```

---

## STEP 7 — ERROR & LOADING STATES

For every page that fetches data, wrap in a consistent loading/error pattern:
```jsx
if (isLoading) return (
  <div className="space-y-4">
    {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
  </div>
);

if (error) return (
  <div className="bg-destructive/10 text-destructive rounded-xl p-4 font-body text-sm">
    Could not load data. {error.message}
  </div>
);
```

---

## STEP 8 — BACKEND CORS CONFIG UPDATE

In `trend_ai_backend`, update `src/app.js` CORS origin to include the frontend dev URL:
```js
await app.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  // ...rest unchanged
});
```

And add to backend `.env`:
```
ALLOWED_ORIGINS=http://localhost:5173,https://your-production-domain.com
```

---

## STEP 9 — PRO GATE COMPONENT

Create `src/components/ProGate.jsx` to mirror Flutter's `ProGate` widget:
```jsx
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProGate({ children, feature = 'This feature' }) {
  const { dbUser } = useFirebaseAuth();
  if (dbUser?.subscription_tier === 'pro') return children;
  return (
    <div className="bg-card border border-border rounded-xl p-8 text-center">
      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock size={20} className="text-primary" />
      </div>
      <h3 className="font-heading text-xl text-foreground mb-2">{feature} is Pro</h3>
      <p className="text-muted-foreground font-body text-sm mb-6">Upgrade to access this feature — ₹499/month</p>
      <Button className="bg-primary text-white font-body">Upgrade to Pro</Button>
    </div>
  );
}
```

Use it to wrap pro-only sections like analytics growth charts:
```jsx
<ProGate feature="Growth Prediction">
  <GrowthChart />
</ProGate>
```

---

## COMPLETE FILE LIST TO CREATE/MODIFY

| Action | File |
|--------|------|
| **Create** | `src/lib/firebase.js` |
| **Create** | `src/lib/api.js` |
| **Create** | `src/hooks/useApi.js` |
| **Create** | `src/components/ProtectedRoute.jsx` |
| **Create** | `src/components/ProGate.jsx` |
| **Create** | `.env` (frontend root) |
| **Replace** | `src/lib/FirebaseAuthContext.jsx` |
| **Modify** | `src/App.jsx` — add ProtectedRoute |
| **Modify** | `src/pages/Onboarding.jsx` — real API call |
| **Modify** | `src/pages/dashboard/DashboardHome.jsx` — replace mockTrends/mockSongs |
| **Modify** | `src/pages/dashboard/Discover.jsx` — replace mock data |
| **Modify** | `src/pages/dashboard/Songs.jsx` — replace mock data |
| **Modify** | `src/pages/dashboard/AriaBrain.jsx` — real chat API |
| **Modify** | `src/pages/dashboard/VideoDNA.jsx` — real analysis API |
| **Modify** | `src/pages/dashboard/Studio.jsx` — real content generation |
| **Modify** | `src/pages/dashboard/Profile.jsx` — real user profile |
| **Modify** | `src/components/dashboard/Sidebar.jsx` — real user data |
| **Modify** | Backend `src/app.js` — CORS origins |
| **Modify** | Backend `.env` — add ALLOWED_ORIGINS |

---

## IMPORTANT NOTES FOR GEMINI

1. **Do not touch** any UI/styling code — only data fetching and auth logic.
2. The backend returns `{ success: true, data: { ... } }` — always unwrap `.data` before using.
3. Keep all `mockData.js` exports — they serve as fallbacks if `isLoading` or `isError`.
4. The `FirebaseAuthContext` `dbUser` object mirrors the backend `users` table columns: `id`, `name`, `email`, `niches`, `primary_platform`, `follower_range`, `subscription_tier`, `is_pro`, `archetype`, `health_score`, `engagement_rate`, `growth_stage`.
5. The `aria/chat` endpoint expects `messages` in OpenAI format: `[{ role: 'user'|'assistant', content: string }]`.
6. For the `video-dna` endpoint, the YouTube URL can be full (`https://www.youtube.com/watch?v=xxx`) or short (`https://youtu.be/xxx`).
7. For `useTrends`, the `badge` filter values are: `HOT`, `RISING`, `NEW`, `ALL`.
8. `requirePro` middleware on the backend returns HTTP 403 with `{ error: 'FORBIDDEN' }` — handle this in `ProGate`.
