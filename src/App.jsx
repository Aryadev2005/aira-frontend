import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { FirebaseAuthProvider } from '@/lib/FirebaseAuthContext';

import Landing from '@/pages/Landing';
import Onboarding from '@/pages/Onboarding';
import SignIn from '@/pages/SignIn';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import DashboardHome from '@/pages/dashboard/DashboardHome';
import Discover from '@/pages/dashboard/Discover';
import Studio from '@/pages/dashboard/Studio';
import Songs from '@/pages/dashboard/Songs';
import AriaBrain from '@/pages/dashboard/AriaBrain';
import VideoDNA from '@/pages/dashboard/VideoDNA';
import Profile from '@/pages/dashboard/Profile';
import Launch from '@/pages/dashboard/Launch';

function App() {
  return (
    <FirebaseAuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="discover" element={<Discover />} />
              <Route path="studio" element={<Studio />} />
              <Route path="songs" element={<Songs />} />
              <Route path="brain" element={<AriaBrain />} />
              <Route path="video-dna" element={<VideoDNA />} />
              <Route path="profile" element={<Profile />} />
              <Route path="launch" element={<Launch />} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </FirebaseAuthProvider>
  )
}

export default App