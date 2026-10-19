"use client";

import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import "@/components/layout/operations.css";
import { LogoLoader } from "@/components/ui/logo-loader";

export default function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth(true);

  if (isLoading) {
    return <LogoLoader fullscreen />;
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 p-4 dark:bg-black">
        <div className="text-xl font-medium text-white">Access Denied</div>
      </div>
    );
  }

  return (
    <div className="operations-shell">
      <Sidebar />
      <main className="operations-workspace flex-1 overflow-y-auto px-4 pb-8 pt-24 md:px-6 md:pt-16 xl:px-8">
        {children}
      </main>
    </div>
  );
}
