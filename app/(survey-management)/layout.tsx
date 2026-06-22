"use client";

import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { LogoLoader } from "@/components/ui/logo-loader";

export default function SurveyManagementLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth(true);

  if (isLoading) {
    return <LogoLoader fullscreen />;
  }



  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
}
