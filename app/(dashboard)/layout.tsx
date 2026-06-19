"use client";

import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { LogoLoader } from "@/components/ui/logo-loader";

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

      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
}