"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useNews } from "@/hooks/use-news";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft, Clock, Calendar, User, Newspaper,
  Info, FileQuestion, AlertCircle, Eye, Edit, Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, lazy, Suspense } from "react";
import api from "@/lib/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const NewsRenderer = lazy(() => import("@/components/news/NewsRenderer").then(m => ({ default: m.NewsRenderer })));
const NewsForm = lazy(() => import("@/components/news/NewsForm").then(m => ({ default: m.NewsForm })));
const CommentSection = lazy(() => import("@/components/news/CommentSection").then(m => ({ default: m.CommentSection })));

// Skeleton untuk NewsForm saat lazy loading
function NewsFormSkeleton() {
  return (
    <div className="space-y-5 py-2">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20 bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-16 bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-[300px] w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl ml-auto" />
    </div>
  );
}

// Skeleton untuk NewsRenderer
function NewsRendererSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <Skeleton className="h-4 w-full bg-slate-200 dark:bg-slate-800" />
      <Skeleton className="h-4 w-[95%] bg-slate-200 dark:bg-slate-800" />
      <Skeleton className="h-4 w-[80%] bg-slate-200 dark:bg-slate-800" />
      <Skeleton className="h-[200px] w-full bg-slate-200 dark:bg-slate-800 rounded-2xl my-4" />
      <Skeleton className="h-4 w-[90%] bg-slate-200 dark:bg-slate-800" />
      <Skeleton className="h-4 w-full bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

// Recursively find the first image in TipTap JSON
const extractFirstImage = (content: any): string | null => {
  if (!content) return null;
  if (content.type === "image" && content.attrs?.src) {
    return content.attrs.src;
  }
  if (Array.isArray(content.content)) {
    for (const child of content.content) {
      const img = extractFirstImage(child);
      if (img) return img;
    }
  }
  return null;
};

// Calculate reading time based on 200 WPM
const calculateReadingTime = (content: any): number => {
  if (!content) return 1;
  const traverse = (node: any): string => {
    if (!node) return "";
    let text = "";
    if (node.text) text += node.text + " ";
    if (node.content) {
      for (const child of node.content) {
        text += traverse(child);
      }
    }
    return text;
  };
  const fullText = traverse(content).trim();
  const words = fullText.split(/\s+/).filter(word => word.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
};


export default function NewsDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth(false);
  const { article, isLoading, updateNews, isBookmarked, toggleBookmark, isTogglingBookmark } = useNews({}, id as string);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [localViewCount, setLocalViewCount] = useState<number | null>(null);

  // Increment view count once on mount
  useEffect(() => {
    if (id) {
      api.patch(`/news/${id}/view`).catch(() => {});
      // Optimistically reflect +1 once article is loaded
    }
  }, [id]);

  // Sync local view count from article data + optimistic +1
  useEffect(() => {
    if (article) {
      setLocalViewCount((article.viewCount ?? 0) + 1);
    }
  }, [article]);

  const handleEditSubmit = async (payload: any) => {
    try {
      await updateNews({ id: id as string, ...payload });
      toast.success("Artikel berhasil diperbarui!");
      setIsEditOpen(false);
    } catch {
      toast.error("Gagal memperbarui artikel.");
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.error("Silakan login untuk menyimpan bookmark.");
      return;
    }
    try {
      await toggleBookmark();
      toast.success(isBookmarked ? "Bookmark dihapus." : "Artikel disimpan ke Bookmark!");
    } catch {
      toast.error("Gagal mengubah status bookmark.");
    }
  };

  if (isLoading) return <NewsDetailSkeleton />;
  if (!article) {
    return (
      <div className="container mx-auto py-24 max-w-4xl px-6 text-center text-slate-450 dark:text-slate-500">
        <Newspaper className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-700 mb-4" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Artikel Tidak Ditemukan</h2>
        <p className="text-sm text-slate-550 dark:text-slate-500 mt-2">
          Artikel berita yang Anda cari tidak ada atau telah dihapus oleh administrator.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-lg"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Portal
        </button>
      </div>
    );
  }

  const readingTime = calculateReadingTime(article.content);
  const canEdit = user?.role === "ADMIN" || user?.role === "QC";

  return (
    <div className="container mx-auto max-w-4xl px-6 py-10">

      {/* Top Bar: back + edit button */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer shadow-lg"
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

        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={handleBookmark}
              disabled={isTogglingBookmark}
              title={isBookmarked ? "Hapus Bookmark" : "Simpan ke Bookmark"}
              className={cn(
                "flex items-center justify-center h-10 w-10 rounded-full border transition-all cursor-pointer shadow-sm group disabled:opacity-50",
                isBookmarked 
                  ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30" 
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900"
              )}
            >
              <Bookmark className={cn(
                "h-4 w-4 transition-colors", 
                isBookmarked 
                  ? "fill-indigo-500 text-indigo-500" 
                  : "text-slate-500 dark:text-slate-400 group-hover:text-indigo-500"
              )} />
            </button>
          )}

          {canEdit && (
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Artikel</span>
            </button>
          )}
        </div>
      </div>

      <article className="space-y-8">

        {/* Header */}
        <header className="space-y-6">

          {/* Category Pill Tag */}
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest backdrop-blur-md shadow-md",
            article.category === "Informasi" && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
            article.category === "Permintaan" && "bg-purple-500/10 border-purple-500/30 text-purple-500 dark:text-purple-400",
            article.category === "Komplain" && "bg-rose-500/10 border-rose-500/30 text-rose-400",
            article.category === "News" && "bg-sky-500/10 border-sky-500/30 text-sky-500 dark:text-sky-400",
            (!article.category || article.category === "All") && "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
          )}>
            {article.category === "Informasi" && <Info className="h-3.5 w-3.5" />}
            {article.category === "Permintaan" && <FileQuestion className="h-3.5 w-3.5" />}
            {article.category === "Komplain" && <AlertCircle className="h-3.5 w-3.5" />}
            {(article.category === "News" || !article.category || article.category === "All") && <Newspaper className="h-3.5 w-3.5" />}
            {article.category || "Informasi"}
          </span>

          {/* Large Editorial Title */}
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl leading-tight text-slate-900 dark:text-transparent dark:bg-gradient-to-r dark:from-slate-100 dark:via-slate-200 dark:to-indigo-300 dark:bg-clip-text">
            {article.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-y-4 gap-x-6 text-sm text-slate-500 dark:text-slate-400 border-b border-slate-150 dark:border-slate-900 pb-6">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                {article.authorName?.charAt(0).toUpperCase() || "A"}
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-350">{article.authorName || "Anonim"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span><span className="font-semibold text-slate-600 dark:text-slate-400">Created: </span>{format(new Date(article.createdAt), "MMMM d, yyyy HH:mm")}</span>
            </div>

            {article.updatedAt && article.updatedAt !== article.createdAt && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span><span className="font-semibold text-slate-600 dark:text-slate-400">Last Updated: </span>{format(new Date(article.updatedAt), "MMMM d, yyyy HH:mm")}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span>Estimasi {readingTime} Menit Baca</span>
            </div>

            {/* View Count */}
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span>{localViewCount !== null ? localViewCount.toLocaleString("id-ID") : (article.viewCount ?? 0).toLocaleString("id-ID")} dilihat</span>
            </div>
          </div>
        </header>

        {/* Rich-Text Content */}
        <div className="pt-4">
          <Suspense fallback={<NewsRendererSkeleton />}>
            <NewsRenderer content={article.content} />
          </Suspense>
        </div>

        {/* Comments */}
        <Suspense fallback={<div className="mt-12 pt-10 border-t border-slate-200 dark:border-slate-800/60 animate-pulse"><div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" /></div>}>
          <CommentSection newsId={id as string} />
        </Suspense>
      </article>

      {/* Edit Dialog */}
      {canEdit && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="w-[98vw] sm:max-w-[96vw] lg:max-w-6xl rounded-[28px] border border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/98 backdrop-blur-md max-h-[92vh] overflow-y-auto p-5 md:p-8  ">
            <DialogHeader className="border-b border-slate-100 dark:border-slate-900 pb-4 mb-4">
              <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-650 dark:text-indigo-400 ">
                  <Edit className="h-5 w-5" />
                </div>
                <span className="font-bold text-slate-900 dark:text-transparent dark:bg-gradient-to-r dark:from-slate-100 dark:to-indigo-200 dark:bg-clip-text">
                  Edit Artikel
                </span>
              </DialogTitle>
            </DialogHeader>
            <Suspense fallback={<NewsFormSkeleton />}>
              <NewsForm initialData={article} onSubmit={handleEditSubmit} />
            </Suspense>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function NewsDetailSkeleton() {
  return (
    <div className="container mx-auto py-24 max-w-4xl px-6 space-y-8">
      <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-28 bg-slate-800" />
        <Skeleton className="h-12 w-[85%] bg-slate-800" />
        <Skeleton className="h-6 w-[50%] bg-slate-800" />
      </div>
      <Skeleton className="h-[350px] w-full rounded-3xl bg-slate-800" />
      <div className="pt-4 space-y-3">
        <Skeleton className="h-4 w-full bg-slate-800" />
        <Skeleton className="h-4 w-[95%] bg-slate-800" />
        <Skeleton className="h-4 w-[60%] bg-slate-800" />
      </div>
    </div>
  );
}
