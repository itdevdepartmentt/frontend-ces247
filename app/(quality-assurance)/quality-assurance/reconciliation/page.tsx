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
import { Check, Search, Download, Filter, Eye, AlertTriangle, MessageSquare, ListTodo, FileText, ChevronRight, Copy, CheckCircle2, XCircle, Clock, ShieldCheck, ChevronLeft, Trash2 } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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
      <div className="p-6 md:p-8 space-y-6">
        <TableSkeleton columns={8} rows={10} />
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <div className="px-6 py-5 sm:px-8 border-b border-slate-100 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shrink-0 z-10 relative">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          Rekonsiliasi QA
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Daftar pengajuan peninjauan ulang skor QA dari Team Leader ke Quality Control.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari ID Tiket, Agent, TL, alasan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
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
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-xl">
              <TableRow className="border-b border-slate-100 dark:border-slate-800">
                <TableHead className="font-semibold text-slate-500 text-xs text-center">No</TableHead>
                <SortableTableHead columnKey="createdAt" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 text-xs">Tgl Pengajuan</SortableTableHead>
                <SortableTableHead columnKey="idTiket" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500">ID Tiket</SortableTableHead>
                <SortableTableHead columnKey="agentName" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500">Nama Agent</SortableTableHead>
                <SortableTableHead columnKey="peak" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 text-center">Peak</SortableTableHead>
                <SortableTableHead columnKey="tlName" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500">TL / QC</SortableTableHead>
                <SortableTableHead columnKey="tlReason" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 max-w-[200px]">Alasan TL</SortableTableHead>
                <SortableTableHead columnKey="proposedScoreValiditas" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 text-center">Validitas</SortableTableHead>
                <SortableTableHead columnKey="proposedScoreServiceLevel" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 text-center">Service Lvl</SortableTableHead>
                <SortableTableHead columnKey="proposedScoreKalimat" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 text-center">Kalimat</SortableTableHead>
                <SortableTableHead columnKey="proposedScoreResponTime" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 text-center">Respon</SortableTableHead>
                <SortableTableHead columnKey="proposedScoreDokumentasi" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 text-center">Dokumen</SortableTableHead>
                <SortableTableHead columnKey="status" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 text-center">Status</SortableTableHead>
                <SortableTableHead columnKey="qcResponseNotes" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 min-w-[300px]">Notes QC</SortableTableHead>
                <TableHead className="font-semibold text-slate-500 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="h-[300px]">
                    <div className="flex flex-col items-center justify-center text-center h-full gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-2">
                        <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Belum ada Rekonsiliasi</h3>
                      <p className="text-sm text-slate-500">Tidak ada data rekonsiliasi yang sesuai dengan filter Anda.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row: any, i: number) => (
                  <TableRow key={row.id} className="transition-all duration-300 border-b border-slate-100 dark:border-slate-800/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 hover:shadow-[inset_3px_0_0_0_rgba(99,102,241,0.8)] cursor-default">
                    <TableCell className="text-slate-400 font-medium text-xs text-center w-10">
                      {(page - 1) * itemsPerPage + i + 1}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                      {new Date(row.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">{row.idTiket}</TableCell>
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{row.agentName}</TableCell>
                    <TableCell className="font-bold text-slate-500 text-xs text-center">{row.peak || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{row.tlName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <ChevronRight className="w-3 h-3" /> {row.qcName}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 min-w-[200px] max-w-[300px]">
                      {row.reason ? (
                        <div className="flex items-start justify-between gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="line-clamp-3 whitespace-pre-wrap break-words text-xs cursor-help">{row.reason}</p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[400px] max-h-[300px] overflow-auto z-[100]" side="bottom" align="start">
                              <p className="whitespace-pre-wrap text-sm">{row.reason}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 shrink-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                onClick={() => {
                                  navigator.clipboard.writeText(row.reason);
                                  toast.success("Reason disalin ke clipboard!");
                                }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Salin teks</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ) : "-"}
                    </TableCell>
                    
                    {/* Score columns show Before -> After */}
                    <TableCell className="text-center text-xs whitespace-nowrap">
                      <span className="text-slate-400 line-through">{row.oldScoreValiditas}</span> <span className="text-indigo-600 font-bold">{row.proposedScoreValiditas}</span>
                    </TableCell>
                    <TableCell className="text-center text-xs whitespace-nowrap">
                      <span className="text-slate-400 line-through">{row.oldScoreServiceLevel}</span> <span className="text-indigo-600 font-bold">{row.proposedScoreServiceLevel}</span>
                    </TableCell>
                    <TableCell className="text-center text-xs whitespace-nowrap">
                      <span className="text-slate-400 line-through">{row.oldScoreKalimat}</span> <span className="text-indigo-600 font-bold">{row.proposedScoreKalimat}</span>
                    </TableCell>
                    <TableCell className="text-center text-xs whitespace-nowrap">
                      <span className="text-slate-400 line-through">{row.oldScoreResponTime}</span> <span className="text-indigo-600 font-bold">{row.proposedScoreResponTime}</span>
                    </TableCell>
                    <TableCell className="text-center text-xs whitespace-nowrap">
                      <span className="text-slate-400 line-through">{row.oldScoreDokumentasi}</span> <span className="text-indigo-600 font-bold">{row.proposedScoreDokumentasi}</span>
                    </TableCell>

                    <TableCell className="text-center">
                      {row.status === "PENDING" && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600"><Clock className="w-3 h-3"/> PENDING</span>}
                      {row.status === "APPROVED" && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3 h-3"/> APPROVED</span>}
                      {row.status === "REJECTED" && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600"><XCircle className="w-3 h-3"/> REJECTED</span>}
                    </TableCell>
                    
                    <TableCell className="text-slate-500 min-w-[300px] max-w-[400px]">
                      {row.qcResponseNotes ? (
                        <div className="flex items-start justify-between gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="line-clamp-3 whitespace-pre-wrap break-words text-xs cursor-help">{row.qcResponseNotes}</p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[400px] max-h-[300px] overflow-auto z-[100]" side="bottom" align="start">
                              <p className="whitespace-pre-wrap text-sm">{row.qcResponseNotes}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 shrink-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                onClick={() => {
                                  navigator.clipboard.writeText(row.qcResponseNotes);
                                  toast.success("Response disalin ke clipboard!");
                                }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Salin teks</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-center flex justify-center gap-2 items-center">
                      <Button variant="outline" size="sm" onClick={() => handleOpenReview(row)} className="h-8 text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600">
                        <FileText className="w-3 h-3 mr-1" /> Review
                      </Button>
                      {user?.role === 'QC' && (
                        <Button variant="outline" size="icon" onClick={() => handleDelete(row.id)} className="h-8 w-8 text-xs font-semibold hover:bg-rose-50 hover:text-rose-600 border-slate-200 dark:border-slate-800 text-slate-500">
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
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 font-medium">
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
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Review Rekonsiliasi
            </DialogTitle>
            <DialogDescription>
              Tinjau pengajuan rekon dari <strong className="text-slate-900 dark:text-white">{currentRekon?.tlName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800/30 shrink-0">
              <div className="text-xs font-bold text-amber-600 dark:text-amber-500 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> ALASAN BANDING (TL):
              </div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {currentRekon?.reason}
              </div>
            </div>
            
            <div className="grid gap-2 mt-2">
              <Label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Diskusi
              </Label>
              {currentRekon?.discussions?.length > 0 ? (
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 max-h-[250px] overflow-y-auto custom-scrollbar">
                  {currentRekon.discussions.map((msg: any, i: number) => {
                    const isMe = msg.name === user?.name;
                    return (
                      <div key={i} className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold text-slate-500">{msg.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">{msg.sender}</span>
                          <span className="text-[9px] text-slate-400">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <div className={`text-sm px-3 py-2 rounded-2xl max-w-[85%] whitespace-pre-wrap ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-tr-sm' 
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-sm'
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 border-dashed dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <MessageSquare className="w-6 h-6 opacity-50" />
                  <span className="text-sm">Belum ada diskusi</span>
                </div>
              )}
              
              <Textarea
                id="qcNotes"
                placeholder="Ketik pesan balasan di sini..."
                value={qcNotes}
                onChange={e => setQcNotes(e.target.value)}
                className="min-h-[80px] resize-none mt-2 focus-visible:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (qcNotes.trim() && !isSubmitting) handleReply();
                  }
                }}
              />
              <p className="text-[10px] text-slate-400 text-right">Tekan Enter untuk mengirim, Shift+Enter untuk baris baru.</p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row items-center sm:justify-between w-full gap-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReply} disabled={isSubmitting || !qcNotes.trim()} className="rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                Kirim Catatan
              </Button>
            </div>
            {(user?.role === "QC" || user?.role === "ADMIN" || user?.role === "TL_QC" || (user?.role === "TL" && user?.name !== currentRekon?.tlName)) && (
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
