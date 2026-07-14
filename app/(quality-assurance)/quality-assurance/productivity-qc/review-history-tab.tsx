"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ListChecks, Star, Clock, CheckCircle2, FileText, ChevronLeft, ChevronRight, Pencil, Trash2, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ColumnFilterPopover } from "@/components/ui/column-filter-popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ReviewHistoryTab({ 
  debouncedSearch,
}: { 
  debouncedSearch: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [historyColumnFilters, setHistoryColumnFilters] = useState<Record<string, string[]>>({});
  const [debouncedHistoryFilters, setDebouncedHistoryFilters] = useState<Record<string, string[]>>({});
  const [historyPage, setHistoryPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHistoryFilters(historyColumnFilters);
      setHistoryPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [historyColumnFilters]);

  // Reset page when search changes
  useEffect(() => {
    setHistoryPage(1);
  }, [debouncedSearch]);

  const { data: historyResponse, isLoading: isLoadingHistory, isFetching: isFetchingHistory } = useQuery({
    queryKey: ["qa-form-tapping", historyPage, itemsPerPage, debouncedSearch, debouncedHistoryFilters],
    queryFn: async () => {
      const filtersParam = Object.keys(debouncedHistoryFilters).length > 0 ? `&filters=${encodeURIComponent(JSON.stringify(debouncedHistoryFilters))}` : '';
      const res = await api.get(`/qa/form-tapping?page=${historyPage}&limit=${itemsPerPage}&search=${encodeURIComponent(debouncedSearch)}${filtersParam}`);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const { data: historyFilterOptions } = useQuery({
    queryKey: ["qa-history-filter-options"],
    queryFn: async () => {
      const res = await api.get("/qa/form-tapping/options");
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/qa/form-tapping/${id}`);
    },
    onSuccess: () => {
      toast.success("Review history deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["qa-form-tapping"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete review history");
    },
  });

  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return await api.delete("/qa/form-tapping/delete-all");
    },
    onSuccess: (res: any) => {
      toast.success(`${res.data?.deleted ?? 0} riwayat berhasil dihapus`);
      queryClient.invalidateQueries({ queryKey: ["qa-form-tapping"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus semua riwayat");
    },
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await api.get("/qa/form-tapping/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `review-history-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Download berhasil");
    } catch {
      toast.error("Gagal mendownload riwayat");
    } finally {
      setIsDownloading(false);
    }
  };

  const history = historyResponse?.data || [];
  const totalHistoryPages = historyResponse?.meta?.totalPages || 1;
  const totalHistoryCount = historyResponse?.meta?.total || 0;

  const getPaginationRange = (currentPage: number, totalPages: number) => {
    if (totalPages <= 1) return [];
    const delta = 2;
    const range: (number | string)[] = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) {
      range.unshift("...");
    }
    if (currentPage + delta < totalPages - 1) {
      range.push("...");
    }
    range.unshift(1);
    range.push(totalPages);
    return range;
  };

  let totalS = 0;
  let totalDur = 0;
  history.forEach((h: any) => {
    totalS += (h.scoreValiditas || 0) + (h.scoreServiceLevel || 0) + (h.scoreKalimat || 0) + (h.scoreResponTime || 0) + (h.scoreDokumentasi || 0);
    totalDur += (h.tappingDuration || 0);
  });
  const avgScore = history.length > 0 ? (totalS / history.length).toFixed(1) : 0;
  const totalDurFormatted = formatTime(totalDur);
  const avgDurFormatted = formatTime(history.length > 0 ? Math.floor(totalDur / history.length) : 0);

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0 pt-4">
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 mb-4 shrink-0">
        <Button
          variant="outline"
          onClick={handleDownload}
          disabled={isDownloading || totalHistoryCount === 0}
          className="h-9 px-4 rounded-xl border-zinc-200 text-zinc-600 font-semibold shadow-sm hover:bg-zinc-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? "Mengunduh..." : "Download History"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setDeleteAllOpen(true)}
          disabled={totalHistoryCount === 0}
          className="h-9 px-4 rounded-xl border-red-200 text-red-600 font-semibold shadow-sm hover:bg-red-50 hover:border-red-300 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Hapus Semua
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 shrink-0">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Total Reviews</div>
            <div className="text-4xl font-extrabold text-zinc-800 dark:text-zinc-100">{totalHistoryCount}</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 w-14 h-14 rounded-full flex items-center justify-center"><ListChecks className="w-6 h-6" /></div>
        </div>
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Average Score</div>
            <div className="text-4xl font-extrabold text-zinc-800 dark:text-zinc-100">{avgScore}</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-500 w-14 h-14 rounded-full flex items-center justify-center"><Star className="w-6 h-6" /></div>
        </div>
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Total Time</div>
            <div className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100">{totalDurFormatted}</div>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-500 w-14 h-14 rounded-full flex items-center justify-center"><Clock className="w-6 h-6" /></div>
        </div>
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Average Time</div>
            <div className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100">{avgDurFormatted}</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 w-14 h-14 rounded-full flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-zinc-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
              <TableHead className="w-[50px] font-semibold text-zinc-500">#</TableHead>
              <TableHead className="font-semibold text-zinc-500">Submit Date</TableHead>
              <TableHead className="font-semibold text-zinc-500">Start Time</TableHead>
              <TableHead className="font-semibold text-zinc-500">Created Date</TableHead>
              <TableHead className="font-semibold text-zinc-500">Ticket ID</TableHead>
              <TableHead className="font-semibold text-zinc-500">Solusi</TableHead>
              <TableHead className="font-semibold text-zinc-500">Tagging</TableHead>
              <TableHead className="font-semibold text-zinc-500">
                <div className="flex items-center">
                  Agent
                  <ColumnFilterPopover columnKey="agent" columnLabel="Agent" columnFilters={historyColumnFilters} setColumnFilters={setHistoryColumnFilters} options={historyFilterOptions?.agent || []} />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-zinc-500">Team Leader</TableHead>
              <TableHead className="font-semibold text-zinc-500">
                <div className="flex items-center">
                  Tapper
                  <ColumnFilterPopover columnKey="tapper" columnLabel="Tapper" columnFilters={historyColumnFilters} setColumnFilters={setHistoryColumnFilters} options={historyFilterOptions?.tapper || []} />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-zinc-500">
                <div className="flex items-center">
                  Channel
                  <ColumnFilterPopover columnKey="channel" columnLabel="Channel" columnFilters={historyColumnFilters} setColumnFilters={setHistoryColumnFilters} options={historyFilterOptions?.channel || []} />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-zinc-500">
                <div className="flex items-center">
                  Jenis Interaksi
                  <ColumnFilterPopover columnKey="jenisInteraksi" columnLabel="Jenis Interaksi" columnFilters={historyColumnFilters} setColumnFilters={setHistoryColumnFilters} options={historyFilterOptions?.jenisInteraksi || []} />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-zinc-500">
                <div className="flex items-center">
                  KIP Level 2
                  <ColumnFilterPopover columnKey="kipLevel2" columnLabel="KIP Level 2" columnFilters={historyColumnFilters} setColumnFilters={setHistoryColumnFilters} options={historyFilterOptions?.kipLevel2 || []} />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-zinc-500">
                <div className="flex items-center">
                  KIP Level 3
                  <ColumnFilterPopover columnKey="kipLevel3" columnLabel="KIP Level 3" columnFilters={historyColumnFilters} setColumnFilters={setHistoryColumnFilters} options={historyFilterOptions?.kipLevel3 || []} />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-zinc-500">Agent AHT</TableHead>
              <TableHead className="font-semibold text-zinc-500">QC ATT</TableHead>
              <TableHead className="font-semibold text-zinc-500">Pause Reasons</TableHead>
              <TableHead className="font-semibold text-zinc-500">Score</TableHead>
              <TableHead className="text-right font-semibold text-zinc-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn("transition-opacity duration-200", isFetchingHistory ? "opacity-50 pointer-events-none" : "opacity-100")}>
            {history.length === 0 && !isFetchingHistory ? (
              <TableRow>
                <TableCell colSpan={17} className="h-[300px]">
                  <div className="flex flex-col items-center justify-center text-center h-full">
                    <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900/50 rounded-full flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                      <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">No review history found</h3>
                    <p className="text-sm text-zinc-500 max-w-[250px] mb-6">Complete an evaluation in the Pending Tickets tab and your history will appear here.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              history.map((h: any, i: number) => {
                const totalScore = (h.scoreValiditas || 0) + (h.scoreServiceLevel || 0) + (h.scoreKalimat || 0) + (h.scoreResponTime || 0) + (h.scoreDokumentasi || 0);
                return (
                  <TableRow key={h.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-50 dark:border-zinc-800/50">
                    <TableCell className="text-zinc-400 font-medium">{(historyPage - 1) * itemsPerPage + i + 1}</TableCell>
                    {/* Submit Time with date+time */}
                    <TableCell className="text-zinc-500 whitespace-nowrap">
                      {h.submitTime
                        ? new Date(h.submitTime).toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })
                        : new Date(h.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </TableCell>
                    {/* Start Time */}
                    <TableCell className="text-zinc-500 whitespace-nowrap">
                      {h.startTime
                        ? new Date(h.startTime).toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-zinc-500">{h.createdDate ? new Date(h.createdDate).toLocaleDateString("id-ID") : "-"}</TableCell>
                    <TableCell className="font-bold text-zinc-900 dark:text-white">{h.idTiket}</TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-300 min-w-[150px]">{h.solusi?.replace(/ \| /g, ", ") || "-"}</TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-300 whitespace-nowrap">{h.tagging || "-"}</TableCell>
                    <TableCell className="text-zinc-700 dark:text-zinc-300 font-medium">{h.agent}</TableCell>
                    <TableCell className="text-zinc-500">{h.teamLeader || '-'}</TableCell>
                    <TableCell className="text-zinc-500">{h.tapper}</TableCell>
                    <TableCell className="text-zinc-500">{h.channel || '-'}</TableCell>
                    <TableCell className="text-zinc-500">{h.jenisInteraksi || '-'}</TableCell>
                    <TableCell className="text-zinc-500">{h.kipLevel2 || '-'}</TableCell>
                    <TableCell className="text-zinc-500">{h.kipLevel3 || '-'}</TableCell>
                    <TableCell className="text-zinc-500">{h.handlingTime || '-'}</TableCell>
                    <TableCell className="text-zinc-500 font-mono text-xs">{formatTime(h.tappingDuration || 0)}</TableCell>
                    {/* Pause Reasons */}
                    <TableCell className="text-zinc-500 min-w-[180px]">
                      {Array.isArray(h.pauseReasons) && h.pauseReasons.length > 0 ? (
                        <div className="space-y-1">
                          {(h.pauseReasons as { reason: string; pausedAt: string }[]).map((pr, pi) => (
                            <div key={pi} className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded px-2 py-1">
                              <span className="font-semibold">{pi + 1}.</span> {pr.reason}
                              <div className="text-[10px] text-amber-500/70">{new Date(pr.pausedAt).toLocaleTimeString("id-ID")}</div>
                            </div>
                          ))}
                        </div>
                      ) : <span className="text-zinc-300">-</span>}
                    </TableCell>
                    <TableCell>
                      <span className={cn("px-3 py-1 rounded-full text-xs font-bold", totalScore >= 80 ? "bg-emerald-50 text-emerald-600" : totalScore >= 60 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-600")}>
                        {totalScore}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => router.push(`/quality-assurance/form-tapping/edit/${h.id}`)}
                          className="h-9 w-9 p-0 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteMutation.mutate(h.id)}
                          className="h-9 w-9 p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        
        <div className="flex items-center justify-between p-4 border-t border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 font-medium">
              Showing {(historyPage - 1) * itemsPerPage + 1} to {Math.min(historyPage * itemsPerPage, totalHistoryCount)} of {totalHistoryCount} reviews
            </span>
            <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setHistoryPage(1); }}>
              <SelectTrigger className="w-[80px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-lg border-zinc-200 text-zinc-600 shadow-sm" onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <div className="flex items-center gap-1">
              {getPaginationRange(historyPage, totalHistoryPages).map((pageNumber, idx) => (
                <Button
                  key={idx}
                  variant={historyPage === pageNumber ? "default" : "ghost"}
                  size="sm"
                  className={cn("w-9 h-9 rounded-lg", historyPage === pageNumber ? "bg-zinc-900 text-white shadow-md" : "text-zinc-600", pageNumber === "..." ? "pointer-events-none" : "")}
                  onClick={() => typeof pageNumber === "number" && setHistoryPage(pageNumber)}
                  disabled={pageNumber === "..."}
                >
                  {pageNumber}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-9 rounded-lg border-zinc-200 text-zinc-600 shadow-sm" onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))} disabled={historyPage === totalHistoryPages}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Hapus Semua Riwayat?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500">
              Tindakan ini akan menghapus <span className="font-bold text-zinc-800 dark:text-zinc-200">{totalHistoryCount} riwayat</span> secara permanen dan tidak dapat dibatalkan.
              Pertimbangkan untuk mendownload data terlebih dahulu sebelum menghapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAllMutation.mutate()}
              disabled={deleteAllMutation.isPending}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteAllMutation.isPending ? "Menghapus..." : "Ya, Hapus Semua"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
