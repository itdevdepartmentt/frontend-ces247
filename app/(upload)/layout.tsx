"use client";

import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { LogoLoader } from "@/components/ui/logo-loader";

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If not logged in, useAuth redirects to /login automatically.
  const { user, isLoading } = useAuth(true);


  if (isLoading) {
    return <LogoLoader fullscreen />;
  }
  if (user?.role !== "ADMIN" && user?.role !== "QC" && user?.role !== "TL_QC" && user?.role !== "TL")
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 p-4 dark:bg-black">
        <div className="text-white text-xl font-medium">Access Denied</div>
      </div>
    );
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-4 dark:bg-slate-950">
          {children}
      </main>
    </div>
  );
}
