"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import {
  FileText, CheckCircle2, XCircle, Clock, Search, ExternalLink, ShieldCheck
} from "lucide-react";
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


  const { data: rekons, isLoading, refetch } = useQuery({
    queryKey: ["qa-reconciliation"],
    queryFn: async () => {
      const res = await api.get("/qa/reconciliation");
      return res.data;
    },
    enabled: !!user,
  });

  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedRekon, setSelectedRekon] = useState<any>(null);
  const [qcNotes, setQcNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenReview = (rekon: any) => {
    setSelectedRekon(rekon);
    setQcNotes("");
    setReviewOpen(true);
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedRekon) return;
    try {
      setIsSubmitting(true);
      await api.patch(`/qa/reconciliation/${selectedRekon.id}/${action}`, {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const data = rekons || [];

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
      </div>

      <div className="flex-1 overflow-auto p-6 sm:p-8 z-10 relative">
        <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-zinc-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="font-semibold text-zinc-500">Tgl Pengajuan</TableHead>
                <TableHead className="font-semibold text-zinc-500">TL / QC</TableHead>
                <TableHead className="font-semibold text-zinc-500 max-w-[200px]">Alasan TL</TableHead>
                <TableHead className="font-semibold text-zinc-500 text-center">Validitas</TableHead>
                <TableHead className="font-semibold text-zinc-500 text-center">Service Lvl</TableHead>
                <TableHead className="font-semibold text-zinc-500 text-center">Kalimat</TableHead>
                <TableHead className="font-semibold text-zinc-500 text-center">Respon</TableHead>
                <TableHead className="font-semibold text-zinc-500 text-center">Dokumen</TableHead>
                <TableHead className="font-semibold text-zinc-500 text-center">Status</TableHead>
                <TableHead className="font-semibold text-zinc-500 max-w-[200px]">Notes QC</TableHead>
                {(user?.role === "QC" || user?.role === "ADMIN") && (
                  <TableHead className="font-semibold text-zinc-500 text-center">Aksi</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-[300px]">
                    <div className="flex flex-col items-center justify-center text-center h-full">
                      <ShieldCheck className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-4" />
                      <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Belum ada Rekonsiliasi</h3>
                      <p className="text-sm text-zinc-500">Belum ada pengajuan rekon yang dibuat atau diterima.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row: any) => (
                  <TableRow key={row.id} className="transition-colors border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50">
                    <TableCell className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap text-xs">
                      {new Date(row.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-bold text-sm text-zinc-900 dark:text-white">{row.tlName}</div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                        <ChevronRight className="w-3 h-3" /> {row.qcName}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate" title={row.reason}>
                      {row.reason}
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
                    
                    <TableCell className="text-xs text-zinc-500 max-w-[200px] truncate" title={row.qcResponseNotes}>
                      {row.qcResponseNotes || "-"}
                    </TableCell>

                    {(user?.role === "QC" || user?.role === "ADMIN") && (
                      <TableCell className="text-center">
                        {row.status === "PENDING" ? (
                          <Button variant="outline" size="sm" onClick={() => handleOpenReview(row)} className="h-8 text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600">
                            Review
                          </Button>
                        ) : (
                          <span className="text-xs text-zinc-400">-</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Review Rekonsiliasi</DialogTitle>
            <DialogDescription>
              Tinjau pengajuan rekon dari <strong className="text-zinc-900 dark:text-white">{selectedRekon?.tlName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="text-xs font-bold text-zinc-500 mb-1">ALASAN TL:</div>
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {selectedRekon?.reason}
              </div>
            </div>
            <div className="grid gap-2 mt-2">
              <Label htmlFor="qcNotes" className="font-semibold">Catatan QC (Opsional)</Label>
              <Textarea
                id="qcNotes"
                placeholder="Tulis balasan atau penjelasan QC di sini..."
                value={qcNotes}
                onChange={e => setQcNotes(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex items-center sm:justify-between w-full">
            <Button variant="outline" onClick={() => handleAction('reject')} disabled={isSubmitting} className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700">Tolak Rekon</Button>
            <Button 
              onClick={() => handleAction('approve')} 
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              Setujui & Update Skor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
