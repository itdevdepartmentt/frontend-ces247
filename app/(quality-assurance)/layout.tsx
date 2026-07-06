"use client";

import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { LogoLoader } from "@/components/ui/logo-loader";

export default function QualityAssuranceLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth(true);

  if (isLoading) {
    return <LogoLoader fullscreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
