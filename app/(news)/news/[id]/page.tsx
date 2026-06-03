"use client";

import { useParams } from "next/navigation";
import { format } from "date-fns";
import { NewsRenderer } from "@/components/news/NewsRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { useNews } from "@/hooks/use-news";
import { ArrowLeft, Clock, Calendar, User, Newspaper, Info, FileQuestion, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { article, isLoading } = useNews({}, id as string);

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

  return (
    <div className="container mx-auto max-w-4xl px-6 py-10">
      
      {/* Premium Circular Back Button */}
      <button
        onClick={() => window.history.back()}
        className="mb-8 flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer shadow-lg"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <article className="space-y-8">
        
        {/* Modern High-End Layout Header */}
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

          {/* Clean Editorial Metadata Section */}
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
          </div>
        </header>



        {/* Dynamic Rich-Text Renderer */}
        <div className="pt-4">
          <NewsRenderer content={article.content} />
        </div>
      </article>
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
