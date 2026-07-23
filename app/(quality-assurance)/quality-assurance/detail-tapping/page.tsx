"use client";

import React, { useState, useEffect } from "react";
import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { Check, Search, Download, Filter, Eye, AlertTriangle, MessageSquare, ListTodo, FileText, ChevronRight, Copy, ChevronLeft, BarChart3, Zap, Clock, FileCheck, Users, Edit3, Loader2, MessageCircle, Scale, X, ShieldAlert } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
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

export default function DetailTappingPage() {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>("");
  const [agent, setAgent] = useState<string>("");
  const [teamLeader, setTeamLeader] = useState<string>("");
  const [peak, setPeak] = useState<string>("");
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const { user } = useAuth();
  const canSeeTapper = user?.role === "QC" || user?.role === "TL_QC";

  const [page, setPage] = useState(1);

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

  const [komitmenOpen, setKomitmenOpen] = useState(false);
  const [komitmenText, setKomitmenText] = useState("");
  const [isSubmittingKomitmen, setIsSubmittingKomitmen] = useState(false);

  const queryClient = useQueryClient();

  const handleOpenKomitmen = (row: any) => {
    setSelectedRow(row);
    setKomitmenText(row.komitmen || "");
    setKomitmenOpen(true);
  };

  const handleSubmitKomitmen = async () => {
    if (!selectedRow || !user) return;
    try {
      setIsSubmittingKomitmen(true);
      await api.patch(`/qa/form-tapping/${selectedRow.id}/komitmen`, {
        komitmen: komitmenText,
      });
      toast.success("Komitmen berhasil disimpan");
      setKomitmenOpen(false);
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["qa-detail-tapping"] });
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan komitmen");
    } finally {
      setIsSubmittingKomitmen(false);
    }
  };

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
      toast.success("Berhasil: Pengajuan Rekonsiliasi berhasil dikirim ke QC.");
      setRekonOpen(false);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Gagal: Terjadi kesalahan saat mengajukan Rekonsiliasi.";
      toast.error(errMsg);
    } finally {
      setIsSubmittingRekon(false);
    }
  };

  const handleApproveKomitmen = async (id: string) => {
    try {
      await api.patch(`/qa/form-tapping/${id}/komitmen/approve`);
      toast.success("Berhasil menyetujui komitmen.");
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyetujui komitmen.");
    }
  };

  const handleRejectKomitmen = async (id: string) => {
    try {
      await api.patch(`/qa/form-tapping/${id}/komitmen/reject`);
      toast.success("Berhasil menolak komitmen.");
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menolak komitmen.");
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

  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch detail tapping data
  const { data: response, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["qa-detail-tapping", page, itemsPerPage, year, month, agent, peak, teamLeader, debouncedSearch, debouncedColumnFilters, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", itemsPerPage.toString());
      if (year) params.set("year", year);
      if (month) params.set("month", month);
      if (agent) params.set("agent", agent);
      if (teamLeader) params.set("teamLeader", teamLeader);
      if (peak) params.set("peak", peak);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("sortOrder", sortOrder);
      if (Object.keys(debouncedColumnFilters).length > 0) {
        params.set("filters", JSON.stringify(debouncedColumnFilters));
      }
      const res = await api.get(`/qa/form-tapping/detail-tapping?${params.toString()}`);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const handleSort = (key: string, order: "asc" | "desc") => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const data = response?.data || [];
  const meta = response?.meta || { total: 0, page: 1, totalPages: 1 };
  const stats = response?.stats || {
    totalSampling: 0, qaScore: 0, totalNC: 0,
    ncValiditas: 0, ncServiceLevel: 0, ncKalimat: 0, ncResponTime: 0, ncDokumentasi: 0,
    eksekutorPercentage: 0, totalEksekutorTappings: 0,
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
          <p className="text-slate-500 font-medium">Loading Detail Tapping data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-5 sm:px-8 border-b border-slate-100 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shrink-0 z-10 relative">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          DETAIL TAPPING
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Daftar lengkap hasil evaluasi tapping beserta breakdown skor NC.
        </p>
      </div>

      <div className="flex-1 overflow-auto space-y-6 p-6 sm:p-8 z-10 relative">


      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Total Sampling</div>
            <div className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">{stats.totalSampling.toLocaleString()}</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 w-14 h-14 rounded-full flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">QA Score</div>
            <div className={cn("text-4xl font-extrabold", stats.qaScore >= 97 ? "text-emerald-600" : "text-rose-600")}>{stats.qaScore}</div>
          </div>
          <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", stats.qaScore >= 97 ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500" : "bg-rose-50 dark:bg-rose-900/30 text-rose-500")}>
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
        {user?.role !== 'TL' && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">% Tapping Eksekutor</div>
              <div className="text-4xl font-extrabold text-indigo-600">{stats.eksekutorPercentage}%</div>
              <div className="text-xs font-medium text-slate-500 mt-1">{stats.totalEksekutorTappings} / {stats.totalSampling} tappings</div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 w-14 h-14 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        )}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Total NC</div>
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

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-wrap">
        <Select value={agent || "all"} onValueChange={(v) => { setAgent(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[200px] h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium">
            <SelectValue placeholder="All Agents" />
          </SelectTrigger>
          <SelectContent className="rounded-xl max-h-[300px]">
            <SelectItem value="all">All Agents</SelectItem>
            {(detailOptions?.agents || []).map((a: string) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={teamLeader || "all"} onValueChange={(v) => { setTeamLeader(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium">
            <SelectValue placeholder="All Team Leader" />
          </SelectTrigger>
          <SelectContent className="rounded-xl max-h-[300px]">
            <SelectItem value="all">All Team Leader</SelectItem>
            {(detailOptions?.teamLeaders || []).map((a: string) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={year} onValueChange={(v) => { setYear(v); setPage(1); }}>
          <SelectTrigger className="w-[120px] h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {(detailOptions?.years || [new Date().getFullYear()]).map((y: number) => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={month || "all"} onValueChange={(v) => { setMonth(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium">
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
          <SelectTrigger className="w-[120px] h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search Ticket, Agent, QC..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      {/* Detail Table */}
      <div className={cn("bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1", isFetching ? "opacity-60" : "")}>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 dark:border-slate-800 hover:bg-transparent">
              <TableHead className="w-[50px] font-semibold text-slate-500">#</TableHead>
              <SortableTableHead columnKey="createdAt" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500">Tanggal Tapping</SortableTableHead>
              <SortableTableHead columnKey="createdDate" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500">Created Date</SortableTableHead>
              <SortableTableHead columnKey="agent" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500">Nama Agent</SortableTableHead>
              <SortableTableHead columnKey="teamLeader" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500">Nama TL</SortableTableHead>
              {canSeeTapper && (
                <TableHead className="font-semibold text-slate-500">
                  <div className="flex items-center">
                    <span className="flex items-center gap-1 cursor-pointer select-none" onClick={() => handleSort("tapper", sortOrder === "asc" ? "desc" : "asc")}>
                      Tapper (QC)
                      {sortBy === "tapper" && (
                        <span className="text-indigo-500">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </span>
                    <ColumnFilterPopover columnKey="tapper" columnLabel="Tapper" columnFilters={columnFilters} setColumnFilters={setColumnFilters} options={historyOptions?.tapper || []} />
                  </div>
                </TableHead>
              )}
              <SortableTableHead columnKey="idTiket" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500">ID Tiket</SortableTableHead>
              <SortableTableHead columnKey="solusi" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500">Solusi</SortableTableHead>
              <SortableTableHead columnKey="tagging" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500">Tagging</SortableTableHead>
              <SortableTableHead columnKey="notes" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 min-w-[300px]">Notes QC</SortableTableHead>
              <SortableTableHead columnKey="scoreValiditas" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 text-center">Validitas</SortableTableHead>
              <SortableTableHead columnKey="scoreServiceLevel" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 text-center">Service Level</SortableTableHead>
              <SortableTableHead columnKey="scoreKalimat" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 text-center">Kalimat</SortableTableHead>
              <SortableTableHead columnKey="scoreResponTime" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 text-center">Respon Time</SortableTableHead>
              <SortableTableHead columnKey="scoreDokumentasi" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 text-center">Dokumentasi</SortableTableHead>
              <TableHead className="font-semibold text-slate-500 text-center">Total</TableHead>
              <SortableTableHead columnKey="komitmen" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-semibold text-slate-500 min-w-[200px]">Komitmen</SortableTableHead>
              {user?.role === "TL" && (
                <TableHead className="font-semibold text-slate-500 text-center">Aksi</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={16} className="h-[300px]">
                  <div className="flex flex-col items-center justify-center text-center h-full">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No data found</h3>
                    <p className="text-sm text-slate-500">Try adjusting the filters to see results.</p>
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
                  <TableRow key={row.id} className={cn("transition-colors border-b border-slate-50 dark:border-slate-800/50", isNC ? "bg-rose-50/30 dark:bg-rose-900/10" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50")}>
                    <TableCell className="text-slate-400 font-medium">{(page - 1) * itemsPerPage + i + 1}</TableCell>
                    <TableCell className="text-slate-500 font-medium whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="text-slate-500 whitespace-nowrap">
                      {row.createdDate ? new Date(row.createdDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">{row.agent}</TableCell>
                    <TableCell className="text-slate-500 whitespace-nowrap">{row.teamLeader || "-"}</TableCell>
                    {canSeeTapper && (
                      <TableCell className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{row.tapper}</TableCell>
                    )}
                    <TableCell className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{row.idTiket}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 min-w-[150px]">{row.solusi?.replace(/ \| /g, ", ") || "-"}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{row.tagging || "-"}</TableCell>
                    <TableCell className="text-slate-500 min-w-[300px] max-w-[400px]">
                      {row.notes ? (
                        <div className="flex items-start justify-between gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="line-clamp-3 whitespace-pre-wrap break-words text-xs cursor-help">{row.notes}</p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[400px] max-h-[300px] overflow-auto z-[100]" side="bottom" align="start">
                              <p className="whitespace-pre-wrap text-sm">{row.notes}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 shrink-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                onClick={() => {
                                  navigator.clipboard.writeText(row.notes);
                                  toast.success("Notes disalin ke clipboard!");
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
                    <TableCell className={cn("text-center font-bold", row.scoreValiditas < 30 ? "text-rose-600" : "text-slate-700 dark:text-slate-300")}>{row.scoreValiditas}</TableCell>
                    <TableCell className={cn("text-center font-bold", row.scoreServiceLevel < 30 ? "text-rose-600" : "text-slate-700 dark:text-slate-300")}>{row.scoreServiceLevel}</TableCell>
                    <TableCell className={cn("text-center font-bold", row.scoreKalimat < 10 ? "text-rose-600" : "text-slate-700 dark:text-slate-300")}>{row.scoreKalimat}</TableCell>
                    <TableCell className={cn("text-center font-bold", row.scoreResponTime < 15 ? "text-rose-600" : "text-slate-700 dark:text-slate-300")}>{row.scoreResponTime}</TableCell>
                    <TableCell className={cn("text-center font-bold", row.scoreDokumentasi < 15 ? "text-rose-600" : "text-slate-700 dark:text-slate-300")}>{row.scoreDokumentasi}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-bold", total >= 97 ? "bg-emerald-50 text-emerald-600" : total >= 80 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-600")}>
                        {total}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 min-w-[200px] align-top">
                      <div className="flex flex-col gap-2">
                        {user?.role === "USER" && user?.name !== row.agent ? (
                          <span className="text-slate-500 font-medium">-</span>
                        ) : row.komitmen ? (
                          <div className="flex flex-col gap-1">
                            {row.komitmenStatus === 'PENDING' && row.komitmen !== '[Menunggu Approval TL]' && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit mb-1 border border-amber-200">MENUNGGU APPROVAL TL</span>
                            )}
                            {row.komitmenStatus === 'APPROVED' && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit mb-1 border border-emerald-200">DISETUJUI</span>
                            )}
                            {row.komitmenStatus === 'REJECTED' && user?.role === 'USER' && user?.name === row.agent && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded w-fit mb-1 border border-rose-200">DITOLAK TL (HARAP REVISI)</span>
                            )}
                            <p className="text-xs whitespace-pre-wrap">{row.komitmen}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum ada komitmen</span>
                        )}
                        {user?.role === "USER" && user?.name === row.agent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenKomitmen(row)}
                            className="h-7 w-fit text-[10px] uppercase font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 mt-1"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" /> {row.komitmen ? "Edit Komitmen" : "Isi Komitmen"}
                          </Button>
                        )}
                        {user?.role === "TL" && user?.name === row.teamLeader && row.komitmenStatus === 'PENDING' && (
                          <div className="flex gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleApproveKomitmen(row.id)} 
                              className="h-7 px-2 text-[10px] font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                              <Check className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleRejectKomitmen(row.id)} 
                              className="h-7 px-2 text-[10px] font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                            >
                              <X className="w-3 h-3 mr-1" /> Tolak
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {user?.role === "TL" && (
                      <TableCell className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenRekon(row)} 
                          disabled={row.hasPendingRekon}
                          className="h-8 gap-2 text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50"
                        >
                          {row.hasPendingRekon ? (
                            <><Clock className="w-3 h-3" /> Pending Rekon</>
                          ) : (
                            <><Scale className="w-3 h-3" />Rekon</>
                          )}
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
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-slate-500">
              Showing <span className="font-bold text-slate-900 dark:text-white">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(page * itemsPerPage, meta.total)}</span> of <span className="font-bold text-slate-900 dark:text-white">{meta.total}</span> records
            </div>
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
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Ajukan Rekonsiliasi QA</DialogTitle>
            <DialogDescription>
              Ajukan peninjauan ulang terhadap hasil tapping tiket <strong className="text-slate-900 dark:text-white">{selectedRow?.idTiket}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-5 gap-3">
              {[
                { key: 'scoreValiditas', label: 'Validitas', max: 30 },
                { key: 'scoreServiceLevel', label: 'Service Lvl', max: 30 },
                { key: 'scoreKalimat', label: 'Kalimat', max: 10 },
                { key: 'scoreResponTime', label: 'Respon', max: 15 },
                { key: 'scoreDokumentasi', label: 'Dokumen', max: 15 },
              ].map(item => {
                const originalScore = selectedRow?.[item.key] ?? 0;
                const proposedScore = rekonScores[item.key as keyof typeof rekonScores] ?? originalScore;
                const isChanged = proposedScore !== originalScore;
                
                return (
                  <div key={item.key} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${isChanged ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30' : 'bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800'}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">{item.label}</span>
                    <div className="flex items-center gap-1 w-full justify-center">
                      <span className={`text-xs font-medium w-6 text-center ${isChanged ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{originalScore}</span>
                      {isChanged && <ChevronRight className="w-3 h-3 text-indigo-400" />}
                      <input
                        type="number"
                        min={0}
                        max={item.max}
                        value={proposedScore}
                        onChange={(e) => {
                          let val = parseInt(e.target.value) || 0;
                          if (val > item.max) val = item.max;
                          if (val < 0) val = 0;
                          setRekonScores(s => ({ ...s, [item.key]: val }));
                        }}
                        className={`w-10 h-7 text-center text-sm font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isChanged ? 'bg-white dark:bg-slate-950 text-indigo-600 border border-indigo-200 dark:border-indigo-800' : 'bg-transparent border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                      />
                    </div>
                  </div>
                )
              })}
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

      <Dialog open={komitmenOpen} onOpenChange={setKomitmenOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Isi Komitmen</DialogTitle>
            <DialogDescription>
              Silakan tuliskan komitmen Anda terhadap hasil evaluasi QA untuk tiket <strong className="text-slate-900 dark:text-white">{selectedRow?.idTiket}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="komitmen" className="font-semibold">Komitmen (Freetext)</Label>
              <Textarea
                id="komitmen"
                placeholder="Tulis komitmen Anda di sini untuk perbaikan layanan..."
                value={komitmenText}
                onChange={e => setKomitmenText(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKomitmenOpen(false)} disabled={isSubmittingKomitmen} className="rounded-xl">Batal</Button>
            <Button 
              onClick={handleSubmitKomitmen} 
              disabled={isSubmittingKomitmen || !komitmenText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2"
            >
              {isSubmittingKomitmen ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
              Simpan Komitmen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
