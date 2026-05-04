import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';

export default function Dashboard() {
  const location = useLocation();
  const isBrainPage = location.pathname === '/dashboard/brain' || location.pathname.startsWith('/dashboard/brain/');

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={`lg:ml-60 ${isBrainPage ? 'h-[calc(100vh-60px)] lg:h-screen' : 'p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8'}`}>
        <div className={isBrainPage ? 'h-full w-full' : 'max-w-5xl mx-auto'}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}