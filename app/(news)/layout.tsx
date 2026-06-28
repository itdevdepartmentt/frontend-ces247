"use client";

import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { LogoLoader } from "@/components/ui/logo-loader";
import dynamic from "next/dynamic";

const ActivityFeed = dynamic(
  () => import("@/components/news/ActivityFeed").then((m) => ({ default: m.ActivityFeed })),
  { ssr: false }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If not logged in, useAuth redirects to /login automatically.
  const { user, isLoading } = useAuth(true);

  if (isLoading) {
    return <LogoLoader fullscreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative">
        {/* Activity Feed Bell — All Users */}
        {user && (
          <div className="sticky top-0 z-40 flex justify-end px-6 py-3 pointer-events-none">
            <div className="pointer-events-auto">
              <ActivityFeed />
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
