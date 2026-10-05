"use client";

import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { LogoLoader } from "@/components/ui/logo-loader";

export default function MassProcessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth(true);

  if (isLoading) return <LogoLoader fullscreen />;

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 p-4 dark:bg-black">
        <div className="text-xl font-medium text-white">Access Denied</div>
      </div>
    );
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
