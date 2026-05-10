import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";

const FULL_BLEED_PATHS = [
  "/dashboard/brain",
  "/dashboard/studio",
  "/dashboard/calendar",
];

const isFullBleed = (pathname) =>
  FULL_BLEED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

export default function Dashboard() {
  const location = useLocation();
  const fullBleed = isFullBleed(location.pathname);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main
        className={`flex-1 min-w-0 ${fullBleed ? "overflow-hidden h-full" : "overflow-y-auto pb-16 lg:pb-0"}`}
      >
        {fullBleed ? (
          <div className="h-full w-full">
            <Outlet />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
