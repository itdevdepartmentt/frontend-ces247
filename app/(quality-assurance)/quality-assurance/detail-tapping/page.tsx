"use client";

import React, { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import {
  BarChart3, AlertTriangle, ChevronLeft, ChevronRight,
  FileText, ShieldAlert, Zap, MessageSquare, Clock, FileCheck, Users, Edit3, Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ColumnFilterPopover } from "@/components/ui/column-filter-popover";
import { Search } from "lucide-react";

const ITEMS_PER_PAGE = 50;

export default function DetailTappingPage() {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>("");
  const [agent, setAgent] = useState<string>("");
  const [peak, setPeak] = useState<string>("");
  const [page, setPage] = useState(1);
  const { user } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [debouncedColumnFilters, setDebouncedColumnFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setDebouncedColumnFilters(columnFilters);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, columnFilters]);

  const [rekonOpen, setRekonOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [rekonReason, setRekonReason] = useState("");
  const [rekonScores, setRekonScores] = useState({
    scoreValiditas: 0,
    scoreServiceLevel: 0,
    scoreKalimat: 0,
    scoreResponTime: 0,
    scoreDokumentasi: 0,
  });
  const [isSubmittingRekon, setIsSubmittingRekon] = useState(false);

  const handleOpenRekon = (row: any) => {
    setSelectedRow(row);
    setRekonScores({
      scoreValiditas: row.scoreValiditas,
      scoreServiceLevel: row.scoreServiceLevel,
      scoreKalimat: row.scoreKalimat,
      scoreResponTime: row.scoreResponTime,
      scoreDokumentasi: row.scoreDokumentasi,
    });
    setRekonReason("");
    setRekonOpen(true);
  };

  const handleSubmitRekon = async () => {
    if (!selectedRow || !user) return;
    try {
      setIsSubmittingRekon(true);
      await api.post("/qa/reconciliation", {
        qaFormTappingId: selectedRow.id,
        tlName: user.name,
        qcName: selectedRow.tapper || "QC",
        reason: rekonReason,
        proposedScoreValiditas: rekonScores.scoreValiditas,
        proposedScoreServiceLevel: rekonScores.scoreServiceLevel,
        proposedScoreKalimat: rekonScores.scoreKalimat,
        proposedScoreResponTime: rekonScores.scoreResponTime,
        proposedScoreDokumentasi: rekonScores.scoreDokumentasi,
        oldScoreValiditas: selectedRow.scoreValiditas,
        oldScoreServiceLevel: selectedRow.scoreServiceLevel,
        oldScoreKalimat: selectedRow.scoreKalimat,
        oldScoreResponTime: selectedRow.scoreResponTime,
        oldScoreDokumentasi: selectedRow.scoreDokumentasi,
      });
      alert("Berhasil: Pengajuan Rekonsiliasi berhasil dikirim ke QC.");
      setRekonOpen(false);
    } catch (error) {
      alert("Gagal: Terjadi kesalahan saat mengajukan Rekonsiliasi.");
    } finally {
      setIsSubmittingRekon(false);
    }
  };

  // Fetch filter options (custom detail tapping options + history column options)
  const { data: detailOptions } = useQuery({
    queryKey: ["qa-detail-tapping-options"],
    queryFn: async () => {
      const res = await api.get("/qa/form-tapping/detail-tapping/options");
      return res.data;
    },
  });

  const { data: historyOptions } = useQuery({
    queryKey: ["qa-history-options"],
    queryFn: async () => {
      const res = await api.get("/qa/form-tapping/options");
      return res.data;
    },
  });

  // Fetch detail tapping data
  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ["qa-detail-tapping", page, year, month, agent, peak, debouncedSearch, debouncedColumnFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", ITEMS_PER_PAGE.toString());
      if (year) params.set("year", year);
      if (month) params.set("month", month);
      if (agent) params.set("agent", agent);
      if (peak) params.set("peak", peak);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (Object.keys(debouncedColumnFilters).length > 0) {
        params.set("filters", JSON.stringify(debouncedColumnFilters));
      }
      const res = await api.get(`/qa/form-tapping/detail-tapping?${params.toString()}`);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const data = response?.data || [];
  const meta = response?.meta || { total: 0, page: 1, totalPages: 1 };
  const stats = response?.stats || {
    totalSampling: 0, qaScore: 0, totalNC: 0,
    ncValiditas: 0, ncServiceLevel: 0, ncKalimat: 0, ncResponTime: 0, ncDokumentasi: 0,
  };

  const ncCards = [
    { label: "NC Validitas", value: stats.ncValiditas, icon: ShieldAlert, color: "text-rose-600 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/50" },
    { label: "NC Service Level", value: stats.ncServiceLevel, icon: Zap, color: "text-orange-600 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800/50" },
    { label: "NC Penyampaian Kalimat", value: stats.ncKalimat, icon: MessageSquare, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50" },
    { label: "NC Respon Time", value: stats.ncResponTime, icon: Clock, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50" },
    { label: "NC Dokumentasi", value: stats.ncDokumentasi, icon: FileCheck, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800/50" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium">Loading Detail Tapping data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-5 sm:px-8 border-b border-zinc-100 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl shrink-0 z-10 relative">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
          DETAIL TAPPING
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
          Daftar lengkap hasil evaluasi tapping beserta breakdown skor NC.
        </p>
      </div>

      <div className="flex-1 overflow-auto space-y-6 p-6 sm:p-8 z-10 relative">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/40 dark:border-zinc-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-wrap">
        <Select value={agent || "all"} onValueChange={(v) => { setAgent(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[200px] h-10 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium">
            <SelectValue placeholder="All Agents" />
          </SelectTrigger>
          <SelectContent className="rounded-xl max-h-[300px]">
            <SelectItem value="all">All Agents</SelectItem>
            {(detailOptions?.agents || []).map((a: string) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={year} onValueChange={(v) => { setYear(v); setPage(1); }}>
          <SelectTrigger className="w-[120px] h-10 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {(detailOptions?.years || [new Date().getFullYear()]).map((y: number) => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={month || "all"} onValueChange={(v) => { setMonth(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[140px] h-10 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium">
            <SelectValue placeholder="All Months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Months</SelectItem>
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={peak || "all"} onValueChange={(v) => { setPeak(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[120px] h-10 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium">
            <SelectValue placeholder="All Peak" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Peak</SelectItem>
            {(detailOptions?.peaks || []).map((p: number) => (
              <SelectItem key={p} value={p.toString()}>Peak {p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            placeholder="Search Ticket, Agent, QC..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 h-10 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
          />
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Total Sampling</div>
            <div className="text-4xl font-extrabold text-zinc-800 dark:text-zinc-100">{stats.totalSampling.toLocaleString()}</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 w-14 h-14 rounded-full flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">QA Score</div>
            <div className={cn("text-4xl font-extrabold", stats.qaScore >= 97 ? "text-emerald-600" : "text-rose-600")}>{stats.qaScore}</div>
          </div>
          <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", stats.qaScore >= 97 ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500" : "bg-rose-50 dark:bg-rose-900/30 text-rose-500")}>
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Total NC</div>
            <div className="text-4xl font-extrabold text-rose-600">{stats.totalNC.toLocaleString()}</div>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-500 w-14 h-14 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* NC Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ncCards.map((card) => (
          <div key={card.label} className={cn("rounded-xl border p-4 shadow-sm flex items-center gap-3", card.color)}>
            <card.icon className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-2xl font-extrabold">{card.value.toLocaleString()}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Table */}
      <div className={cn("bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-zinc-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1", isFetching ? "opacity-60" : "")}>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
              <TableHead className="w-[50px] font-semibold text-zinc-500">#</TableHead>
              <TableHead className="font-semibold text-zinc-500">Tanggal Tapping</TableHead>
              <TableHead className="font-semibold text-zinc-500">Created Date</TableHead>
              <TableHead className="font-semibold text-zinc-500">
                <div className="flex items-center">
                  Tapper (QC)
                  <ColumnFilterPopover columnKey="tapper" columnLabel="Tapper" columnFilters={columnFilters} setColumnFilters={setColumnFilters} options={historyOptions?.tapper || []} />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-zinc-500">ID Tiket</TableHead>
              <TableHead className="font-semibold text-zinc-500 max-w-[250px]">Notes QC</TableHead>
              <TableHead className="font-semibold text-zinc-500 text-center">Validitas</TableHead>
              <TableHead className="font-semibold text-zinc-500 text-center">Service Level</TableHead>
              <TableHead className="font-semibold text-zinc-500 text-center">Kalimat</TableHead>
              <TableHead className="font-semibold text-zinc-500 text-center">Respon Time</TableHead>
              <TableHead className="font-semibold text-zinc-500 text-center">Dokumentasi</TableHead>
              <TableHead className="font-semibold text-zinc-500 text-center">Total</TableHead>
              {user?.role === "TL" && (
                <TableHead className="font-semibold text-zinc-500 text-center">Aksi</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="h-[300px]">
                  <div className="flex flex-col items-center justify-center text-center h-full">
                    <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-4" />
                    <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">No data found</h3>
                    <p className="text-sm text-zinc-500">Try adjusting the filters to see results.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row: any, i: number) => {
                const total = (row.scoreValiditas || 0) + (row.scoreServiceLevel || 0) +
                  (row.scoreKalimat || 0) + (row.scoreResponTime || 0) + (row.scoreDokumentasi || 0);
                const isNC = row.scoreValiditas < 30 || row.scoreServiceLevel < 30 ||
                  row.scoreKalimat < 10 || row.scoreResponTime < 15 || row.scoreDokumentasi < 15;
                return (
                  <TableRow key={row.id} className={cn("transition-colors border-b border-zinc-50 dark:border-zinc-800/50", isNC ? "bg-rose-50/30 dark:bg-rose-900/10" : "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50")}>
                    <TableCell className="text-zinc-400 font-medium">{(page - 1) * ITEMS_PER_PAGE + i + 1}</TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-zinc-500 whitespace-nowrap">
                      {row.createdDate ? new Date(row.createdDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </TableCell>
                    <TableCell className="font-bold text-zinc-900 dark:text-white whitespace-nowrap">{row.tapper}</TableCell>
                    <TableCell className="font-bold text-zinc-900 dark:text-white whitespace-nowrap">{row.idTiket}</TableCell>
                    <TableCell className="text-zinc-500 max-w-[250px] truncate" title={row.notes}>{row.notes || "OK"}</TableCell>
                    <TableCell className={cn("text-center font-bold", row.scoreValiditas < 30 ? "text-rose-600" : "text-zinc-700 dark:text-zinc-300")}>{row.scoreValiditas}</TableCell>
                    <TableCell className={cn("text-center font-bold", row.scoreServiceLevel < 30 ? "text-rose-600" : "text-zinc-700 dark:text-zinc-300")}>{row.scoreServiceLevel}</TableCell>
                    <TableCell className={cn("text-center font-bold", row.scoreKalimat < 10 ? "text-rose-600" : "text-zinc-700 dark:text-zinc-300")}>{row.scoreKalimat}</TableCell>
                    <TableCell className={cn("text-center font-bold", row.scoreResponTime < 15 ? "text-rose-600" : "text-zinc-700 dark:text-zinc-300")}>{row.scoreResponTime}</TableCell>
                    <TableCell className={cn("text-center font-bold", row.scoreDokumentasi < 15 ? "text-rose-600" : "text-zinc-700 dark:text-zinc-300")}>{row.scoreDokumentasi}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-bold", total >= 97 ? "bg-emerald-50 text-emerald-600" : total >= 80 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-600")}>
                        {total}
                      </span>
                    </TableCell>
                    {user?.role === "TL" && (
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => handleOpenRekon(row)} className="h-8 gap-2 text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200">
                          <Edit3 className="w-3 h-3" /> Rekon
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pb-4 px-4">
          <div className="text-sm font-medium text-zinc-500">
            Showing <span className="font-bold text-zinc-900 dark:text-white">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-zinc-900 dark:text-white">{Math.min(page * ITEMS_PER_PAGE, meta.total)}</span> of <span className="font-bold text-zinc-900 dark:text-white">{meta.total}</span> records
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="h-9 w-9 p-0 rounded-xl">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} className="h-9 w-9 p-0 rounded-xl">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        )}
      </div>
      </div>

      <Dialog open={rekonOpen} onOpenChange={setRekonOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Ajukan Rekonsiliasi QA</DialogTitle>
            <DialogDescription>
              Ajukan peninjauan ulang terhadap hasil tapping tiket <strong className="text-zinc-900 dark:text-white">{selectedRow?.idTiket}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-5 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] uppercase font-bold text-zinc-500">Validitas</Label>
                <Input type="number" min={0} max={30} value={rekonScores.scoreValiditas} onChange={e => setRekonScores(s => ({ ...s, scoreValiditas: Number(e.target.value) }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] uppercase font-bold text-zinc-500">Service Lvl</Label>
                <Input type="number" min={0} max={30} value={rekonScores.scoreServiceLevel} onChange={e => setRekonScores(s => ({ ...s, scoreServiceLevel: Number(e.target.value) }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] uppercase font-bold text-zinc-500">Kalimat</Label>
                <Input type="number" min={0} max={10} value={rekonScores.scoreKalimat} onChange={e => setRekonScores(s => ({ ...s, scoreKalimat: Number(e.target.value) }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] uppercase font-bold text-zinc-500">Respon</Label>
                <Input type="number" min={0} max={15} value={rekonScores.scoreResponTime} onChange={e => setRekonScores(s => ({ ...s, scoreResponTime: Number(e.target.value) }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] uppercase font-bold text-zinc-500">Dokumen</Label>
                <Input type="number" min={0} max={15} value={rekonScores.scoreDokumentasi} onChange={e => setRekonScores(s => ({ ...s, scoreDokumentasi: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid gap-2 mt-2">
              <Label htmlFor="reason" className="font-semibold">Alasan Rekon (Wajib)</Label>
              <Textarea
                id="reason"
                placeholder="Tulis alasan mengapa poin ini harus dikoreksi oleh QC..."
                value={rekonReason}
                onChange={e => setRekonReason(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRekonOpen(false)} disabled={isSubmittingRekon} className="rounded-xl">Batal</Button>
            <Button 
              onClick={handleSubmitRekon} 
              disabled={isSubmittingRekon || !rekonReason.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2"
            >
              {isSubmittingRekon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
              Kirim Pengajuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
