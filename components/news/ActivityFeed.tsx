"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useActivity } from "@/hooks/use-activity";
import { useAppNotifications } from "@/hooks/use-app-notifications";
import {
  Bell,
  MessageCircle,
  Check,
  CheckCheck,
  X,
  Heart,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ActivityFeed() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    activities,
    isLoading: isNewsLoading,
    unreadCount: newsUnreadCount,
    markAllAsRead: markAllNewsAsRead,
    markAsRead: markNewsAsRead,
  } = useActivity();

  const {
    notifications: appNotifs,
    isLoading: isAppNotifsLoading,
    unreadCount: appUnreadCount,
    markAllAsRead: markAllAppNotifsAsRead,
    markAsRead: markAppNotifAsRead,
  } = useAppNotifications();

  const isLoading = isNewsLoading || isAppNotifsLoading;
  const unreadCount = newsUnreadCount + appUnreadCount;

  // Combine and sort both lists
  const allActivities = [
    ...activities.map(a => ({ ...a, source: 'news' as const })),
    ...appNotifs.map(a => ({ ...a, source: 'app' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleActivityClick = async (activity: any) => {
    if (activity.source === 'news') {
      if (!activity.isRead) {
        await markNewsAsRead(activity.id);
      }
      setIsOpen(false);
      
      const hash = ["COMMENT", "REPLY", "LIKE"].includes(activity.type) && activity.commentId 
        ? `#comment-${activity.commentId}` 
        : "#comments";
        
      router.push(`/news/${activity.news.id}${hash}`);
    } else {
      if (!activity.isRead) {
        await markAppNotifAsRead(activity.id);
      }
      setIsOpen(false);
      if (activity.link) {
        router.push(activity.link);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (newsUnreadCount > 0) await markAllNewsAsRead();
    if (appUnreadCount > 0) await markAllAppNotifsAsRead();
  };

  const getActivityIcon = (type: string, source: 'news'|'app') => {
    if (source === 'app') {
      if (type.startsWith('QA_')) return <ClipboardCheck className="h-4 w-4" />;
      return <Bell className="h-4 w-4" />;
    }
    switch (type) {
      case "COMMENT":
      case "REPLY":
        return <MessageCircle className="h-4 w-4" />;
      case "LIKE":
        return <Heart className="h-4 w-4 fill-current text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity: any) => {
    if (activity.source === 'app') {
      return (
        <>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {activity.title}
          </span>
          <br />
          {activity.message}
        </>
      );
    }

    const newsTitle = activity.news.title.length > 40
      ? activity.news.title.slice(0, 40) + "..."
      : activity.news.title;

    switch (activity.type) {
      case "COMMENT":
        return (
          <>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {activity.actor.name}
            </span>{" "}
            mengomentari artikel{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {newsTitle}
            </span>
          </>
        );
      case "REPLY":
        return (
          <>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {activity.actor.name}
            </span>{" "}
            membalas komentar Anda di artikel{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {newsTitle}
            </span>
          </>
        );
      case "LIKE":
        return (
          <>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {activity.actor.name}
            </span>{" "}
            menyukai komentar Anda di artikel{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {newsTitle}
            </span>
          </>
        );
      default:
        return "Aktivitas baru";
    }
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex items-center justify-center h-10 w-10 rounded-2xl",
          "border transition-all duration-200 cursor-pointer",
          isOpen
            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400"
            : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 min-w-[20px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1 shadow-lg shadow-red-500/30 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-[380px] max-h-[480px] z-50",
            "flex flex-col",
            "rounded-2xl border border-slate-200 dark:border-slate-800/80",
            "bg-white/95 dark:bg-slate-950/98 backdrop-blur-xl",
            "shadow-2xl shadow-slate-900/10 dark:shadow-black/30",
            "overflow-hidden",
            "animate-in fade-in slide-in-from-top-2 duration-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/60">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              Aktivitas
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tandai semua dibaca
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Activity List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {isLoading ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : allActivities.length === 0 ? (
              <div className="p-10 text-center">
                <Bell className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Belum ada aktivitas.
                </p>
              </div>
            ) : (
              <div className="py-1">
                {allActivities.map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => handleActivityClick(activity)}
                    className={cn(
                      "w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors duration-150 cursor-pointer",
                      activity.isRead
                        ? "hover:bg-slate-50 dark:hover:bg-slate-900/40"
                        : "bg-indigo-50/50 dark:bg-indigo-500/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center",
                        activity.isRead
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                          : "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400"
                      )}
                    >
                      {getActivityIcon(activity.type, activity.source)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                        {getActivityText(activity)}
                      </p>
                      {activity.comment && (
                        <p className="text-xs text-slate-400 dark:text-slate-600 mt-1 truncate italic">
                          &ldquo;{activity.comment.content}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-600 mt-1.5">
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                          locale: localeId,
                        })}
                      </p>
                    </div>

                    {/* Unread Dot */}
                    {!activity.isRead && (
                      <div className="flex-shrink-0 mt-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/30" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Kelola Aktivitas */}
          <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800/60 p-2 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/news/activity/manage");
              }}
              className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
            >
              Kelola Semua Aktivitas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
