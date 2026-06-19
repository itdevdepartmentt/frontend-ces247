"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  /* ── Minimalist & Elegant Theme Tokens ── */
  const tokens = isDark
    ? {
        bg: "rgba(3, 5, 8, 0.8)",
        backdropBlur: "12px",
        ringColor: "rgba(255, 255, 255, 0.1)",
        ringHighlight: "rgba(255, 255, 255, 0.8)",
        textColor: "rgba(255, 255, 255, 0.5)",
        logoFilter: "brightness(1.1)",
      }
    : {
        bg: "rgba(255, 255, 255, 0.8)",
        backdropBlur: "12px",
        ringColor: "rgba(0, 0, 0, 0.05)",
        ringHighlight: "rgba(0, 0, 0, 0.8)",
        textColor: "rgba(0, 0, 0, 0.5)",
        logoFilter: "none",
      };

  /* ═══════════════════════════════════════════════
     FULLSCREEN / LARGE — Minimalist Splash
  ═══════════════════════════════════════════════ */
  if (size === "lg" || fullscreen) {
    return (
      <div
        aria-label="Loading"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-500"
        style={{
          backgroundColor: tokens.bg,
          backdropFilter: `blur(${tokens.backdropBlur})`,
          WebkitBackdropFilter: `blur(${tokens.backdropBlur})`,
        }}
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
                stroke={tokens.ringColor}
                strokeWidth="1.5"
              />
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke={tokens.ringHighlight}
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
              className="object-contain animate-pulse"
              style={{ filter: tokens.logoFilter, animationDuration: '3s' }}
            />
          </div>

          {/* Elegant Text */}
          <div className="mt-6 flex flex-col items-center gap-1.5">
            <div
              className="text-sm font-medium tracking-[0.2em] uppercase"
              style={{ color: tokens.textColor }}
            >
              CESIA
            </div>
            {message && (
              <div
                className="text-[10px] tracking-widest uppercase opacity-60"
                style={{ color: tokens.textColor }}
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
            <circle cx="50" cy="50" r="48" fill="none" stroke={tokens.ringColor} strokeWidth="2" />
            <circle
              cx="50" cy="50" r="48" fill="none"
              stroke={tokens.ringHighlight} strokeWidth="2"
              strokeDasharray="300" strokeDashoffset="225" strokeLinecap="round"
            />
          </svg>
          <Image
            src="/ces247-3.svg"
            alt="CESIA Logo"
            width={24}
            height={24}
            priority
            className="object-contain"
            style={{ filter: tokens.logoFilter }}
          />
        </div>
        {message && (
          <span
            className="text-xs font-medium tracking-[0.15em] uppercase animate-pulse"
            style={{ color: tokens.textColor, animationDuration: '2.5s' }}
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
          <circle cx="50" cy="50" r="48" fill="none" stroke={tokens.ringColor} strokeWidth="3" />
          <circle
            cx="50" cy="50" r="48" fill="none"
            stroke={tokens.ringHighlight} strokeWidth="3"
            strokeDasharray="300" strokeDashoffset="225" strokeLinecap="round"
          />
        </svg>
      </div>
      {message && (
        <span className="text-[11px] font-medium tracking-wide" style={{ color: tokens.textColor }}>
          {message}
        </span>
      )}
    </div>
  );
}

export default LogoLoader;
