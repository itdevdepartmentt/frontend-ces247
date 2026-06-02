"use client";

import { useEffect, useState } from "react";
import { NewsForm } from "@/components/news/NewsForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Plus, 
  Search, 
  Trash2, 
  Newspaper, 
  Info, 
  FileQuestion, 
  AlertCircle 
} from "lucide-react";
import { useNews } from "@/hooks/use-news";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import React, { Suspense } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Recursively find the first image node in TipTap JSON
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

function NewsPageContent({ isAdmin }: { isAdmin: boolean }) {
  const { user } = useAuth(true);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Read initial states from search parameters
  const initialPage = Number(searchParams.get("page") || 1);
  const initialCategory = searchParams.get("category") || "All";
  const initialSearch = searchParams.get("search") || "";
  const initialLimit = Number(searchParams.get("limit") || 6);

  const [input, setInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit); // Default 6 is better for large card layouts
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [isViewingDrafts, setIsViewingDrafts] = useState(false);

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }

    if (selectedCategory && selectedCategory !== "All") {
      params.set("category", selectedCategory);
    } else {
      params.delete("category");
    }

    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    } else {
      params.delete("search");
    }

    if (limit !== 6) {
      params.set("limit", String(limit));
    } else {
      params.delete("limit");
    }

    const newUrl = `${pathname}?${params.toString()}`;
    if (window.location.search !== `?${params.toString()}`) {
      router.replace(newUrl, { scroll: false });
    }
  }, [page, selectedCategory, debouncedSearch, limit, pathname, router, searchParams]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const pageParam = searchParams.get("page");
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("search");
    const limitParam = searchParams.get("limit");

    const p = pageParam ? parseInt(pageParam, 10) : 1;
    const cat = categoryParam || "All";
    const s = searchParam || "";
    const lim = limitParam ? parseInt(limitParam, 10) : 6;

    if (p !== page) setPage(p);
    if (cat !== selectedCategory) setSelectedCategory(cat);
    if (s !== input) {
      setInput(s);
      setDebouncedSearch(s);
    }
    if (lim !== limit) setLimit(lim);
  }, [searchParams]);

  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Determine status and category filters based on the selected tab
  const currentStatus = isViewingDrafts ? "DRAFT" : "PUBLISHED";
  const currentCategory = selectedCategory !== "All" ? selectedCategory : undefined;

  const { news, meta, createNews, updateNews, deleteNews, isLoading } = useNews(
    {
      page,
      limit,
      search: debouncedSearch.trim(), // Trimming spaces on client query
      category: currentCategory,
      status: currentStatus,
    },
  );
  const totalPages = meta ? meta.lastPage : 1;
  const currentPage = meta ? meta.page : 1;

  // --- Smart Pagination Logic ---
  const getPaginationItems = () => {
    const items: (number | string)[] = [];
    const siblingCount = 1;

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    items.push(1);

    const startPage = Math.max(2, currentPage - siblingCount);
    const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

    if (startPage > 2) {
      items.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(i);
    }

    if (endPage < totalPages - 1) {
      items.push("...");
    }

    if (totalPages > 1) {
      items.push(totalPages);
    }

    return items;
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setPage(currentPage - 1);
    }
  };

  const handleSubmit = async (payload: any) => {
    try {
      const isDraft = payload.status === "DRAFT";
      if (selectedNews) {
        await updateNews({ id: selectedNews.id, ...payload });
        toast.success(isDraft ? "Draft berhasil diperbarui" : "Berita berhasil diperbarui");
      } else {
        await createNews(payload);
        toast.success(isDraft ? "Draft berhasil disimpan" : "Berita berhasil dipublikasikan");
      }
      setIsDialogOpen(false);
      setSelectedNews(null);
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan berita.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus berita ini?")) {
      try {
        await deleteNews(id);
        toast.success("Berita berhasil dihapus");
      } catch (error) {
        toast.error("Terjadi kesalahan saat menghapus berita.");
      }
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setPage(1); // Reset to page 1 on new search
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  // Debounce search query to prevent excessive backend stress
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(input);
    }, 500);

    return () => clearTimeout(timer);
  }, [input]);
  const categoryOptions = ["All", "News", "Informasi", "Permintaan", "Komplain"];

  return (
    <div className="p-6 md:p-10 space-y-8 mt-12 md:mt-0 select-none">
      
      {/* Premium Sleek Header */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-transparent dark:bg-gradient-to-r dark:from-slate-100 dark:via-slate-200 dark:to-indigo-300 dark:bg-clip-text tracking-tight">
            Berita dan Informasi
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          
          {/* Glowing Search Bar */}
          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <Input
              placeholder="Cari berita..."
              className="pl-9 pr-8 py-5 rounded-2xl bg-white/80 dark:bg-slate-950/45 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 shadow-sm dark:shadow-inner transition-all duration-200"
              value={input}
              onChange={handleSearch}
            />
            {input && (
              <span className="absolute right-3 top-3 text-[10px] bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-mono">
                ESC
              </span>
            )}
          </div>

          {/* Rows Limit Controls */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/45 px-3 py-2 shadow-sm dark:shadow-inner">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Baris</span>
            <select
              value={limit}
              onChange={handleLimitChange}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer pr-1"
            >
              <option value={6} className="bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300">6 Baris</option>
              <option value={10} className="bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300">10 Baris</option>
              <option value={16} className="bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300">16 Baris</option>
            </select>
          </div>

          {/* Create News Pop-Up (Admins Only) */}
          {user?.role === "ADMIN" && (
            <>
              <Button
                variant={isViewingDrafts ? "default" : "outline"}
                className={cn(
                  "rounded-2xl py-5 px-5 font-semibold transition-all duration-200 cursor-pointer shadow-sm border-slate-200 dark:border-slate-800",
                  isViewingDrafts 
                    ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-amber-500/20" 
                    : "bg-white/80 dark:bg-slate-950/45 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                )}
                onClick={() => setIsViewingDrafts(!isViewingDrafts)}
              >
                <FileQuestion className="mr-1.5 h-4 w-4" /> 
                {isViewingDrafts ? "Lihat Publikasi" : "Lihat Draft"}
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-5 px-5 font-semibold shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedNews(null)}
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Tambah Berita
                </Button>
              </DialogTrigger>
              
              {/* Jaw-dropping Premium Pop-Up Container */}
              <DialogContent className="w-[98vw] sm:max-w-[96vw] lg:max-w-6xl rounded-[28px] border border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/98 backdrop-blur-md max-h-[92vh] overflow-y-auto p-5 md:p-8 shadow-[0_0_80px_rgba(99,102,241,0.08)] dark:shadow-[0_0_80px_rgba(99,102,241,0.16)]">
                <DialogHeader className="border-b border-slate-100 dark:border-slate-900 pb-4 mb-4">
                  <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                    <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-650 dark:text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                      <Newspaper className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-transparent dark:bg-gradient-to-r dark:from-slate-100 dark:to-indigo-200 dark:bg-clip-text">
                      {selectedNews ? "Edit Berita Korporat" : "Buat Pengumuman Baru"}
                    </span>
                  </DialogTitle>
                </DialogHeader>
                <NewsForm initialData={selectedNews} onSubmit={handleSubmit} />
              </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Segmented Category Filter Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/40 p-1 backdrop-blur-sm shadow-sm dark:shadow-inner">
          {categoryOptions.map((option) => (
            <button
              key={option}
              onClick={() => handleCategoryChange(option)}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer",
                selectedCategory === option
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/30"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Larger Cards (md:grid-cols-2 for massive aesthetic space) */}
      <div className="grid gap-8 md:grid-cols-2">
        {isLoading ? (
          Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-850 bg-slate-950/40 p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 w-full">
                  <Skeleton className="h-3 w-16 bg-slate-800" />
                  <Skeleton className="h-7 w-[80%] bg-slate-800" />
                </div>
                <Skeleton className="h-3 w-20 bg-slate-800" />
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full bg-slate-800" />
                <Skeleton className="h-4 w-full bg-slate-800" />
                <Skeleton className="h-4 w-[60%] bg-slate-800" />
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-900">
                <Skeleton className="h-6 w-24 bg-slate-800" />
                <Skeleton className="h-8 w-20 bg-slate-800" />
              </div>
            </div>
          ))
        ) : news.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-12 text-center text-slate-450 dark:text-slate-500">
            <Newspaper className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-400">Tidak Ada Pengumuman</p>
            <p className="text-xs text-slate-550 dark:text-slate-600 mt-1">
              Tidak ada pengumuman yang cocok dengan pencarian kata kunci atau filter kategori Anda.
            </p>
          </div>
        ) : (
          news.map((item) => {
            return (
              <div 
                key={item.id} 
                onClick={() => router.push(`/news/${item.id}`)}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/45 p-0 shadow-xl dark:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-indigo-950/5 dark:hover:shadow-indigo-950/15 cursor-pointer"
              >
                {/* Card Main Body */}
                <div className="p-6 md:p-8 space-y-4">
                  {/* Category & Status inline badges */}
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "rounded-full border px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg",
                      item.category === "Informasi" && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                      item.category === "Permintaan" && "bg-purple-500/10 border-purple-500/30 text-purple-550 dark:text-purple-400",
                      item.category === "Komplain" && "bg-rose-500/10 border-rose-500/30 text-rose-400",
                      item.category === "News" && "bg-sky-500/10 border-sky-500/30 text-sky-500 dark:text-sky-400",
                      (!item.category || item.category === "All") && "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                    )}>
                      {item.category || "Informasi"}
                    </span>
                    {item.status === "DRAFT" && (
                      <span className="rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-500 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg">
                        DRAFT
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl md:text-2xl font-bold text-slate-850 dark:text-slate-100 leading-snug group-hover:text-indigo-650 dark:group-hover:text-white transition-colors line-clamp-2">
                    {item.title}
                  </h2>

                  <p className="text-sm leading-relaxed text-slate-550 dark:text-slate-400 line-clamp-3">
                    {item.summary}
                  </p>

                  <div className="h-px bg-slate-150 dark:bg-slate-900/80 my-4" />

                  <div className="flex items-center justify-between gap-4 pt-2">
                    {/* Author details with profile avatar badge */}
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-300">
                        {item.authorName?.charAt(0).toUpperCase() || "A"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.authorName || "Anonim"}</span>
                        <span className="text-[10px] text-slate-450 dark:text-slate-505 font-medium mt-0.5">
                          {item.updatedAt ? format(new Date(item.updatedAt), "yyyy-MM-dd HH:mm") : ""}
                        </span>
                      </div>
                    </div>

                    {/* Highly responsive CTA Actions */}
                    <div className="flex items-center gap-2">
                      {user?.role === "ADMIN" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNews(item);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4.5 w-4.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-rose-500 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rethemed pagination controls */}
      {meta && (
        <div className="mt-8 flex items-center justify-center gap-2 select-none">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">Halaman</span>

          {getPaginationItems().map((item, index) => (
            <React.Fragment key={index}>
              {item === "..." ? (
                <span className="px-2 text-slate-400 dark:text-slate-600 text-xs">...</span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setPage(item as number)}
                  className={cn(
                    "h-8 w-8 rounded-xl p-0 text-xs font-bold transition-all duration-255 cursor-pointer",
                    currentPage === item
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/30"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850",
                  )}
                >
                  {item}
                </Button>
              )}
            </React.Fragment>
          ))}

          <div className="flex gap-1 ml-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-0 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewsPage(props: { isAdmin: boolean }) {
  return (
    <Suspense fallback={
      <div className="p-6 md:p-10 space-y-8 mt-12 md:mt-0 select-none">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
      </div>
    }>
      <NewsPageContent {...props} />
    </Suspense>
  );
}
