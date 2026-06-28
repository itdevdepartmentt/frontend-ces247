"use client";

import Image from "next/image";

interface LogoLoaderProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullscreen?: boolean;
}

export function LogoLoader({
  size = "lg",
  message = "Memuat…",
  fullscreen = false,
}: LogoLoaderProps) {
  /* ═══════════════════════════════════════════════
     FULLSCREEN / LARGE — Minimalist Splash
  ═══════════════════════════════════════════════ */
  if (size === "lg" || fullscreen) {
    return (
      <div
        aria-label="Loading"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-500 bg-white/80 dark:bg-[#030508]/80 backdrop-blur-[12px]"
      >
        <div className="relative flex flex-col items-center animate-in fade-in duration-1000">
          {/* Logo Container */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: 80, height: 80 }}
          >
            {/* Minimalist Spinner Ring using Tailwind's animate-spin */}
            <svg
              className="absolute inset-0 w-full h-full animate-spin"
              style={{ animationDuration: '2s' }}
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                className="stroke-black/5 dark:stroke-white/10"
                strokeWidth="1.5"
              />
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                className="stroke-black/80 dark:stroke-white/80"
                strokeWidth="1.5"
                strokeDasharray="300"
                strokeDashoffset="225"
                strokeLinecap="round"
              />
            </svg>

            {/* Pulsing Logo using Tailwind's animate-pulse */}
            <Image
              src="/ces247-3.svg"
              alt="CESIA Logo"
              width={36}
              height={36}
              priority
              className="object-contain animate-pulse dark:brightness-110"
              style={{ animationDuration: '3s' }}
            />
          </div>

          {/* Elegant Text */}
          <div className="mt-6 flex flex-col items-center gap-1.5">
            <div
              className="text-sm font-medium tracking-[0.2em] uppercase text-black/50 dark:text-white/50"
            >
              CESIA
            </div>
            {message && (
              <div
                className="text-[10px] tracking-widest uppercase opacity-60 text-black/50 dark:text-white/50"
              >
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     MEDIUM — Section loading
  ═══════════════════════════════════════════════ */
  if (size === "md") {
    return (
      <div
        aria-label="Loading"
        className="flex flex-col items-center justify-center w-full min-h-[240px] gap-4"
      >
        <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
          <svg
            className="absolute inset-0 w-full h-full animate-spin"
            style={{ animationDuration: '1.5s' }}
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="50" r="48" fill="none" className="stroke-black/5 dark:stroke-white/10" strokeWidth="2" />
            <circle
              cx="50" cy="50" r="48" fill="none"
              className="stroke-black/80 dark:stroke-white/80" strokeWidth="2"
              strokeDasharray="300" strokeDashoffset="225" strokeLinecap="round"
            />
          </svg>
          <Image
            src="/ces247-3.svg"
            alt="CESIA Logo"
            width={24}
            height={24}
            priority
            className="object-contain dark:brightness-110"
          />
        </div>
        {message && (
          <span
            className="text-xs font-medium tracking-[0.15em] uppercase animate-pulse text-black/50 dark:text-white/50"
            style={{ animationDuration: '2.5s' }}
          >
            {message}
          </span>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     SMALL — Inline spinner
  ═══════════════════════════════════════════════ */
  return (
    <div aria-label="Loading" className="inline-flex items-center gap-2.5">
      <div className="relative flex items-center justify-center" style={{ width: 20, height: 20 }}>
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          style={{ animationDuration: '1s' }}
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="48" fill="none" className="stroke-black/5 dark:stroke-white/10" strokeWidth="3" />
          <circle
            cx="50" cy="50" r="48" fill="none"
            className="stroke-black/80 dark:stroke-white/80" strokeWidth="3"
            strokeDasharray="300" strokeDashoffset="225" strokeLinecap="round"
          />
        </svg>
      </div>
      {message && (
        <span className="text-[11px] font-medium tracking-wide text-black/50 dark:text-white/50">
          {message}
        </span>
      )}
    </div>
  );
}

export default LogoLoader;
