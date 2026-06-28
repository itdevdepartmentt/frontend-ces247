"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useMyActivity, ActivityFilter } from "@/hooks/use-my-activity";
import { ArrowLeft, Bookmark, MessageCircle, Heart, BellRing, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS: { id: ActivityFilter; label: string; icon: React.ElementType }[] = [
  { id: "ALL", label: "Semua", icon: Activity },
  { id: "BOOKMARKS", label: "Bookmarks", icon: Bookmark },
  { id: "COMMENTS", label: "Komentar", icon: MessageCircle },
  { id: "LIKES", label: "Disukai", icon: Heart },
];

export default function ManageActivityPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActivityFilter>("ALL");
  const { activities, isLoading } = useMyActivity(activeTab);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "COMMENT":
      case "REPLY":
        return <MessageCircle className="h-4 w-4" />;
      case "LIKE":
        return <Heart className="h-4 w-4 fill-current text-red-500" />;
      case "BOOKMARK":
        return <Bookmark className="h-4 w-4 fill-current text-indigo-500" />;
      default:
        return <BellRing className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity: any) => {
    const title = activity.newsTitle.length > 50 ? activity.newsTitle.slice(0, 50) + "..." : activity.newsTitle;

    switch (activity.type) {
      case "COMMENT":
        return <><span className="font-semibold text-slate-800 dark:text-slate-200">{activity.actorName}</span> mengomentari artikel <span className="font-semibold">{title}</span></>;
      case "REPLY":
        return <><span className="font-semibold text-slate-800 dark:text-slate-200">{activity.actorName}</span> membalas komentar Anda di artikel <span className="font-semibold">{title}</span></>;
      case "LIKE":
        return <><span className="font-semibold text-slate-800 dark:text-slate-200">{activity.actorName}</span> menyukai komentar Anda di artikel <span className="font-semibold">{title}</span></>;
      case "BOOKMARK":
        return <>Anda menyimpan artikel <span className="font-semibold">{title}</span> ke Bookmark</>;
      default:
        return "Aktivitas baru";
    }
  };

  const handleActivityClick = (activity: any) => {
    router.push(`/news/${activity.newsId}`);
  };

  return (
    <div className="container mx-auto max-w-4xl px-6 py-10 relative">
      
      {/* Sticky Header & Tabs Wrapper */}
      <div className="sticky top-0 z-30 -mx-6 -mt-6 px-6 pt-6 pb-2 mb-8 md:-mx-10 md:-mt-10 md:px-10 md:pt-10 bg-slate-50/90 dark:bg-[#020617]/90 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            {/* BISA Logo Link */}
            <Link href="/news" className="flex items-center gap-3 group">
              <Image src="/ces247-3.svg" alt="CESIA Logo" width={36} height={36} className="dark:brightness-200 group-hover:scale-105 transition-transform" />
              <div className="flex flex-col hidden sm:flex">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-0.5">
                  BISA
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center leading-none">
                  Berita <span className="text-indigo-400/60 dark:text-indigo-500/60 mx-1">•</span> 
                  Informasi <span className="text-indigo-400/60 dark:text-indigo-500/60 mx-1">•</span> 
                  Solusi &amp; Panduan
                </span>
              </div>
            </Link>
          </div>
          
          {/* Page Title & Description (Right side) */}
          <div className="hidden md:flex flex-col items-end text-right">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Kelola Aktivitas
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-0.5">
              Riwayat interaksi dan daftar artikel yang Anda simpan.
            </p>
          </div>
        </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer",
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
            )}
          >
            <tab.icon className={cn("h-4 w-4", activeTab === tab.id && tab.id === "LIKES" && "fill-current text-red-500")} />
            {tab.label}
          </button>
        ))}
      </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900/60 rounded-[24px] border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse p-4">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                <div className="flex-1 space-y-2 mt-1">
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center px-6">
            <div className="h-16 w-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
              {activeTab === "BOOKMARKS" ? (
                <Bookmark className="h-8 w-8 text-indigo-300 dark:text-indigo-500/50" />
              ) : activeTab === "COMMENTS" ? (
                <MessageCircle className="h-8 w-8 text-indigo-300 dark:text-indigo-500/50" />
              ) : activeTab === "LIKES" ? (
                <Heart className="h-8 w-8 text-indigo-300 dark:text-indigo-500/50" />
              ) : (
                <Activity className="h-8 w-8 text-indigo-300 dark:text-indigo-500/50" />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
              Belum Ada Aktivitas
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-500 max-w-sm">
              {activeTab === "BOOKMARKS"
                ? "Anda belum menyimpan artikel apapun ke Bookmark."
                : "Belum ada interaksi yang tercatat untuk kategori ini."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => handleActivityClick(activity)}
                className="w-full flex items-start gap-4 p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group cursor-pointer"
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5 h-10 w-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform">
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-snug">
                    {getActivityText(activity)}
                  </p>
                  
                  {activity.content && (
                    <div className="mt-2 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic line-clamp-2">
                        &ldquo;{activity.content}&rdquo;
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                      locale: localeId,
                    })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
