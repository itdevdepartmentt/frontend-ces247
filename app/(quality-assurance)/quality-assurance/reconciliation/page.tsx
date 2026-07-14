"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import {
  FileText, CheckCircle2, XCircle, Clock, Search, ExternalLink, ShieldCheck, ChevronRight, MessageSquare, Copy, ChevronLeft, Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";


export default function QaReconciliationPage() {
  const { user } = useAuth(true);


  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: rekons, isLoading, refetch } = useQuery({
    queryKey: ["qa-reconciliation", sortBy, sortOrder, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sortBy) {
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
      }
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get(`/qa/reconciliation?${params.toString()}`);
      return res.data;
    },
    enabled: !!user,
    refetchInterval: 3000,
  });

  const handleSort = (key: string, order: "asc" | "desc") => {
    setSortBy(key);
    setSortOrder(order);
  };

  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedRekonId, setSelectedRekonId] = useState<string | null>(null);
  const [qcNotes, setQcNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const data = rekons || [];
  
  const totalPages = Math.ceil(data.length / itemsPerPage) || 1;
  const paginatedData = data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const currentRekon = data.find((r: any) => r.id === selectedRekonId);

  const handleReply = async () => {
    if (!currentRekon || !qcNotes.trim()) return;
    try {
      setIsSubmitting(true);
      await api.post(`/qa/reconciliation/${currentRekon.id}/reply`, {
        message: qcNotes,
      });
      setQcNotes("");
      refetch();
    } catch (error) {
      alert("Gagal mengirim pesan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReview = (rekon: any) => {
    setSelectedRekonId(rekon.id);
    setQcNotes("");
    setReviewOpen(true);
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!currentRekon) return;
    try {
      setIsSubmitting(true);
      await api.patch(`/qa/reconciliation/${currentRekon.id}/${action}`, {
        qcResponseNotes: qcNotes,
      });
      alert(`Berhasil: Pengajuan rekon berhasil di-${action === 'approve' ? 'setujui' : 'tolak'}.`);
      setReviewOpen(false);
      refetch();
    } catch (error) {
      alert("Gagal: Terjadi kesalahan saat memproses.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data rekonsiliasi ini?')) {
      try {
        await api.delete(`/qa/reconciliation/${id}`);
        toast.success("Berhasil menghapus rekonsiliasi.");
        refetch();
      } catch (error) {
        toast.error("Gagal menghapus rekonsiliasi.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <div className="px-6 py-5 sm:px-8 border-b border-zinc-100 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl shrink-0 z-10 relative">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
          Rekonsiliasi QA
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
          Daftar pengajuan peninjauan ulang skor QA dari Team Leader ke Quality Control.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              placeholder="Cari ID Tiket, Agent, TL, alasan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 sm:p-8 z-10 relative">
        <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-zinc-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-xl">
              <TableRow className="border-b border-zinc-100 dark:border-zinc-800">
                <TableHead className="font-semibold text-zinc-500 text-xs text-center">No</TableHead>
                <SortableTableHead columnKey="createdAt" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-zinc-500 text-xs">Tgl Pengajuan</SortableTableHead>
                <SortableTableHead columnKey="idTiket" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-zinc-500">ID Tiket</SortableTableHead>
                <SortableTableHead columnKey="agentName" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-zinc-500">Nama Agent</SortableTableHead>
                <SortableTableHead columnKey="tlName" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-zinc-500">TL / QC</SortableTableHead>
                <SortableTableHead columnKey="tlReason" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-zinc-500 max-w-[200px]">Alasan TL</SortableTableHead>
                <SortableTableHead columnKey="proposedScoreValiditas" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-zinc-500 text-center">Validitas</SortableTableHead>
                <SortableTableHead columnKey="proposedScoreServiceLevel" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-zinc-500 text-center">Service Lvl</SortableTableHead>
                <SortableTableHead columnKey="proposedScoreKalimat" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-zinc-500 text-center">Kalimat</SortableTableHead>
                <SortableTableHead columnKey="proposedScoreResponTime" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-zinc-500 text-center">Respon</SortableTableHead>
                <SortableTableHead columnKey="proposedScoreDokumentasi" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-zinc-500 text-center">Dokumen</SortableTableHead>
                <SortableTableHead columnKey="status" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-zinc-500 text-center">Status</SortableTableHead>
                <SortableTableHead columnKey="qcResponseNotes" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-zinc-500 min-w-[300px]">Notes QC</SortableTableHead>
                <TableHead className="font-semibold text-zinc-500 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="h-[300px]">
                    <div className="flex flex-col items-center justify-center text-center h-full">
                      <ShieldCheck className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-4" />
                      <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Belum ada Rekonsiliasi</h3>
                      <p className="text-sm text-zinc-500">Belum ada pengajuan rekon yang dibuat atau diterima.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row: any, i: number) => (
                  <TableRow key={row.id} className="transition-colors border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50">
                    <TableCell className="text-zinc-400 font-medium text-xs text-center w-10">
                      {(page - 1) * itemsPerPage + i + 1}
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap text-xs">
                      {new Date(row.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">{row.idTiket}</TableCell>
                    <TableCell className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">{row.agentName}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-bold text-sm text-zinc-900 dark:text-white">{row.tlName}</div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                        <ChevronRight className="w-3 h-3" /> {row.qcName}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-500 min-w-[200px] max-w-[300px]">
                      {row.reason ? (
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-3 whitespace-pre-wrap break-words text-xs">{row.reason}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 shrink-0 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => {
                              navigator.clipboard.writeText(row.reason);
                              toast.success("Reason disalin ke clipboard!");
                            }}
                            title="Copy full reason"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : "-"}
                    </TableCell>
                    
                    {/* Score columns show Before -> After */}
                    <TableCell className="text-center text-xs whitespace-nowrap">
                      <span className="text-zinc-400 line-through">{row.oldScoreValiditas}</span> <span className="text-indigo-600 font-bold">{row.proposedScoreValiditas}</span>
                    </TableCell>
                    <TableCell className="text-center text-xs whitespace-nowrap">
                      <span className="text-zinc-400 line-through">{row.oldScoreServiceLevel}</span> <span className="text-indigo-600 font-bold">{row.proposedScoreServiceLevel}</span>
                    </TableCell>
                    <TableCell className="text-center text-xs whitespace-nowrap">
                      <span className="text-zinc-400 line-through">{row.oldScoreKalimat}</span> <span className="text-indigo-600 font-bold">{row.proposedScoreKalimat}</span>
                    </TableCell>
                    <TableCell className="text-center text-xs whitespace-nowrap">
                      <span className="text-zinc-400 line-through">{row.oldScoreResponTime}</span> <span className="text-indigo-600 font-bold">{row.proposedScoreResponTime}</span>
                    </TableCell>
                    <TableCell className="text-center text-xs whitespace-nowrap">
                      <span className="text-zinc-400 line-through">{row.oldScoreDokumentasi}</span> <span className="text-indigo-600 font-bold">{row.proposedScoreDokumentasi}</span>
                    </TableCell>

                    <TableCell className="text-center">
                      {row.status === "PENDING" && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600"><Clock className="w-3 h-3"/> PENDING</span>}
                      {row.status === "APPROVED" && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3 h-3"/> APPROVED</span>}
                      {row.status === "REJECTED" && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600"><XCircle className="w-3 h-3"/> REJECTED</span>}
                    </TableCell>
                    
                    <TableCell className="text-zinc-500 min-w-[300px] max-w-[400px]">
                      {row.qcResponseNotes ? (
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-3 whitespace-pre-wrap break-words text-xs">{row.qcResponseNotes}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 shrink-0 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => {
                              navigator.clipboard.writeText(row.qcResponseNotes);
                              toast.success("Notes disalin ke clipboard!");
                            }}
                            title="Copy full notes"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-center flex justify-center gap-2 items-center">
                      <Button variant="outline" size="sm" onClick={() => handleOpenReview(row)} className="h-8 text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600">
                        <FileText className="w-3 h-3 mr-1" /> Review
                      </Button>
                      {user?.role === 'QC' && (
                        <Button variant="outline" size="icon" onClick={() => handleDelete(row.id)} className="h-8 w-8 text-xs font-semibold hover:bg-rose-50 hover:text-rose-600 border-zinc-200 dark:border-zinc-800 text-zinc-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 font-medium">
              Showing {data.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} - {Math.min(page * itemsPerPage, data.length)} of {data.length} records
            </span>
            <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setPage(1); }}>
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
            <Button variant="outline" size="sm" className="h-8 rounded-lg" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 rounded-lg" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Review Rekonsiliasi
            </DialogTitle>
            <DialogDescription>
              Tinjau pengajuan rekon dari <strong className="text-zinc-900 dark:text-white">{currentRekon?.tlName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="text-xs font-bold text-zinc-500 mb-1">ALASAN TL:</div>
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {currentRekon?.reason}
              </div>
            </div>
            
            <div className="grid gap-2 mt-2">
              <Label className="font-semibold text-zinc-700 dark:text-zinc-300">Catatan Rekon</Label>
              {currentRekon?.discussions?.length > 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                  {currentRekon.discussions.map((msg: any, i: number) => (
                    <div key={i} className="text-sm">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{msg.name} ({msg.sender}): </span>
                      <span className="text-zinc-600 dark:text-zinc-400">{msg.message}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <Textarea
                id="qcNotes"
                placeholder="Tambahkan catatan rekon di sini..."
                value={qcNotes}
                onChange={e => setQcNotes(e.target.value)}
                className="min-h-[80px] resize-none mt-2"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row items-center sm:justify-between w-full gap-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReply} disabled={isSubmitting || !qcNotes.trim()} className="rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                Kirim Catatan
              </Button>
            </div>
            {(user?.role === "QC" || user?.role === "ADMIN" || user?.role === "TL_QC") && (
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                {currentRekon?.status !== 'REJECTED' && (
                  <Button variant="outline" onClick={() => handleAction('reject')} disabled={isSubmitting} className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700">Tolak Rekon</Button>
                )}
                {currentRekon?.status !== 'APPROVED' && (
                  <Button onClick={() => handleAction('approve')} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Setujui & Update Skor</Button>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
