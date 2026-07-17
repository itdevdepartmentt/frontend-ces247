"use client";

import React, { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ReviewHistoryTab from "./review-history-tab";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Settings, Activity, Clock, CheckCircle2, LayoutDashboard, Target } from "lucide-react";
import { isSmartMatch } from '@/lib/agent-matcher';

export default function ProductivityQcPage() {
  const { user } = useAuth();
  
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [dateStr, setDateStr] = useState(today.toISOString().split("T")[0]);

  const [activeTab, setActiveTab] = useState("overview");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [qcSettings, setQcSettings] = useState<any[]>([]);
  const [agentSettings, setAgentSettings] = useState<any[]>([]);
  const [settingsActiveTab, setSettingsActiveTab] = useState("qc");
  const [isSaving, setIsSaving] = useState(false);

  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ["qa-productivity", month, year, dateStr],
    queryFn: async () => {
      const res = await api.get(`/qa/productivity/dashboard?month=${month}&year=${year}&date=${dateStr}`);
      return res.data;
    },
    enabled: !!user,
  });

  const handleOpenSettings = async () => {
    try {
      const res = await api.get('/qa/productivity/settings');
      setQcSettings(res.data.qcs || []);
      setAgentSettings(res.data.agents || []);
      setSettingsActiveTab("qc");
      setSettingsOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const [qcSortBy, setQcSortBy] = useState<string | undefined>();
  const [qcSortOrder, setQcSortOrder] = useState<"asc" | "desc">("desc");

  const [apSortBy, setApSortBy] = useState<string | undefined>();
  const [apSortOrder, setApSortOrder] = useState<"asc" | "desc">("desc");

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await api.post('/qa/productivity/settings', {
        qcs: qcSettings,
        agents: agentSettings,
      });
      toast.success("Pengaturan target berhasil disimpan");
      setSettingsOpen(false);
      refetch();
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      toast.loading("Mengunggah dan memproses file Excel...", { id: "upload-excel" });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/qa/productivity/settings/parse-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { parsedAgents, parsedQcs } = res.data;
      
      // Update agentSettings - update existing and add new agents
      if (parsedAgents && parsedAgents.length > 0) {
        setAgentSettings(prev => {
          const newSettings = [...prev];
          parsedAgents.forEach((pa: any) => {
            let index = newSettings.findIndex(a => a.name.toLowerCase() === pa.name.toLowerCase());
            if (index === -1) {
              index = newSettings.findIndex(a => isSmartMatch(a.name, pa.name) || pa.name.toLowerCase().includes(a.name.toLowerCase()));
            }
            if (index !== -1) {
              newSettings[index] = { ...newSettings[index], peak1: pa.peak1, peak2: pa.peak2, peak3: pa.peak3, tapper: pa.tapper, group: pa.group, teamLeader: pa.teamLeader };
            } else {
              // Agent baru dari Excel, langsung tambahkan ke tabel
              newSettings.push({
                name: pa.name,
                peak1: pa.peak1,
                peak2: pa.peak2,
                peak3: pa.peak3,
                monthly: 0,
                tapper: pa.tapper,
                group: pa.group,
                teamLeader: pa.teamLeader,
              });
            }
          });
          return newSettings;
        });
      }
      
      // Update qcSettings - update existing and add new QCs
      if (parsedQcs && parsedQcs.length > 0) {
        setQcSettings(prev => {
          const newSettings = [...prev];
          parsedQcs.forEach((pq: any) => {
            let index = newSettings.findIndex(q => q.name.toLowerCase() === pq.name.toLowerCase());
            if (index === -1) {
              index = newSettings.findIndex(q => pq.name.toLowerCase().includes(q.name.toLowerCase()));
            }
            if (index !== -1) {
              newSettings[index] = { ...newSettings[index], daily: pq.daily };
            } else {
              // QC baru dari Excel, langsung tambahkan ke tabel
              newSettings.push({
                name: pq.name,
                daily: pq.daily,
                peak1: 0,
                peak2: 0,
                peak3: 0,
                monthly: 0,
              });
            }
          });
          return newSettings;
        });
      }
      
      toast.success("File Excel berhasil diproses", { id: "upload-excel" });
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    } catch (error) {
      console.error(error);
      toast.error("Gagal memproses file Excel", { id: "upload-excel" });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading Productivity data...</p>
        </div>
      </div>
    );
  }

  let qcProductivity = dashboardData?.qcProductivity || [];
  let agentPerformance = dashboardData?.agentPerformance || [];

  const sortArray = (arr: any[], key?: string, order?: "asc" | "desc") => {
    if (!key) return arr;
    return [...arr].sort((a, b) => {
      let valA = a[key] ?? "";
      let valB = b[key] ?? "";
      
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "") {
        return order === "asc" ? numA - numB : numB - numA;
      }
      
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });
  };

  qcProductivity = sortArray(qcProductivity, qcSortBy, qcSortOrder);
  agentPerformance = sortArray(agentPerformance, apSortBy, apSortOrder);

  const { realtimeOverview = {} } = dashboardData || {};

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-5 sm:px-8 border-b border-slate-100 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shrink-0 z-10 relative flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-600" />
            Productivity QC
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor target dan realisasi QA per Hari, Peak, dan Bulan.
          </p>
        </div>
        {(user?.role === "ADMIN" || user?.role === "TL_QC") && (
          <Button onClick={handleOpenSettings} variant="outline" size="sm" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-lg text-xs font-semibold">
            <Settings className="w-3.5 h-3.5 mr-2 text-slate-500" /> Pengaturan Target
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto space-y-6 p-6 sm:p-8 z-10 relative">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <TabsList className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1 border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl h-12 w-fit">
                <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm px-6 font-semibold">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm px-6 font-semibold">
                  Review History
                </TabsTrigger>
              </TabsList>
              
              {activeTab === "history" && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search agent, team leader..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9 w-full sm:w-[300px] h-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-indigo-500 shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
              <div className="flex items-center gap-2 px-2">
                <Label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Bulan:</Label>
                <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                  <SelectTrigger className="w-[120px] bg-white dark:bg-slate-900 border-none shadow-sm rounded-lg h-9 text-sm font-medium focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2000, i, 1).toLocaleString('id-ID', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-2 px-2">
                <Label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Tahun:</Label>
                <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                  <SelectTrigger className="w-[90px] bg-white dark:bg-slate-900 border-none shadow-sm rounded-lg h-9 text-sm font-medium focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-2 px-2">
                <Label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Tanggal:</Label>
                <Input 
                  type="date" 
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-[140px] bg-white dark:bg-slate-900 border-none shadow-sm rounded-lg h-9 text-sm font-medium focus-visible:ring-0"
                />
              </div>
            </div>
          </div>

          <TabsContent value="overview" className="flex-1 space-y-6 mt-4">
            {/* Realtime Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Eksekutor Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                REALTIME TAPPING EKSEKUTOR AGENT
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">80% dari jumlah target agent EKSEKUTOR</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-slate-900 dark:text-white">
                {realtimeOverview.totalEksekutor || 0}
              </div>
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg mt-1 inline-block">
                Target: {realtimeOverview.targetEksekutor || 0}
              </div>
            </div>
          </div>
          
          {/* All Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-1">
                REALTIME TAPPING ALL CHANNEL/KIP
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">80% dari jumlah target ALL</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-slate-900 dark:text-white">
                {realtimeOverview.totalAll || 0}
              </div>
              <div className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg mt-1 inline-block">
                Target: {realtimeOverview.targetAll || 0}
              </div>
            </div>
          </div>
        </div>
        
        {/* Productivity QC Table */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col mb-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            Produktivitas QC
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <Table className="whitespace-nowrap">
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <SortableTableHead columnKey="tapper" currentSortBy={qcSortBy} currentSortOrder={qcSortOrder} onSort={(k, o) => { setQcSortBy(k); setQcSortOrder(o); }} className="text-xs font-semibold text-slate-500 w-[180px]" rowSpan={2}>Nama Tapper</SortableTableHead>
                  <SortableTableHead columnKey="totalAgent" currentSortBy={qcSortBy} currentSortOrder={qcSortOrder} onSort={(k, o) => { setQcSortBy(k); setQcSortOrder(o); }} className="text-xs font-semibold text-slate-500 text-center w-[100px]" rowSpan={2}>Jml Agent</SortableTableHead>
                  <SortableTableHead columnKey="agentNames" currentSortBy={qcSortBy} currentSortOrder={qcSortOrder} onSort={(k, o) => { setQcSortBy(k); setQcSortOrder(o); }} className="text-xs font-semibold text-slate-500 w-[200px]" rowSpan={2}>Nama Agent</SortableTableHead>
                  <TableHead className="text-xs font-bold text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 text-center border-l border-b-0" colSpan={3}>Peak 1</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 text-center border-l border-b-0" colSpan={3}>Peak 2</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 text-center border-l border-b-0" colSpan={3}>Peak 3</TableHead>
                  <TableHead className="text-xs font-bold text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10 text-center border-l border-b-0" colSpan={3}>Bulan Ini</TableHead>
                </TableRow>
                <TableRow>
                  {/* Peak 1 */}
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-l border-t-0">Target</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Realisasi</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Sisa</TableHead>
                  {/* Peak 2 */}
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-l border-t-0">Target</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Realisasi</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Sisa</TableHead>
                  {/* Peak 3 */}
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-l border-t-0">Target</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Realisasi</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Sisa</TableHead>
                  {/* Bulan Ini */}
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-emerald-50/50 dark:bg-emerald-900/10 border-l border-t-0">Target</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-emerald-50/50 dark:bg-emerald-900/10 border-t-0">Realisasi</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-emerald-50/50 dark:bg-emerald-900/10 border-t-0">Sisa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qcProductivity.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="h-[100px] text-center text-slate-400">Belum ada data produktivitas</TableCell>
                  </TableRow>
                ) : (
                  <>
                    {qcProductivity.map((qc: any, i: number) => {
                      const p1sisa = qc.peak1Target - qc.peak1Realization;
                      const p2sisa = qc.peak2Target - qc.peak2Realization;
                      const p3sisa = qc.peak3Target - qc.peak3Realization;
                      const mSisa = qc.monthlyTarget - qc.monthlyRealization;
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-semibold text-slate-800 dark:text-slate-200">{qc.tapper}</TableCell>
                          <TableCell className="text-center font-medium">{qc.totalAgent}</TableCell>
                          <TableCell className="text-sm text-slate-500"><span className="block truncate max-w-[200px]" title={qc.agentNames}>{qc.agentNames}</span></TableCell>
                          
                          {/* Peak 1 */}
                          <TableCell className="text-center font-medium text-slate-500 border-l bg-indigo-50/20 dark:bg-indigo-900/5">{qc.peak1Target}</TableCell>
                          <TableCell className="text-center font-bold text-indigo-600 bg-indigo-50/20 dark:bg-indigo-900/5">{qc.peak1Realization}</TableCell>
                          <TableCell className={`text-center font-semibold bg-indigo-50/20 dark:bg-indigo-900/5 ${p1sisa < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{p1sisa}</TableCell>
                          
                          {/* Peak 2 */}
                          <TableCell className="text-center font-medium text-slate-500 border-l bg-indigo-50/20 dark:bg-indigo-900/5">{qc.peak2Target}</TableCell>
                          <TableCell className="text-center font-bold text-indigo-600 bg-indigo-50/20 dark:bg-indigo-900/5">{qc.peak2Realization}</TableCell>
                          <TableCell className={`text-center font-semibold bg-indigo-50/20 dark:bg-indigo-900/5 ${p2sisa < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{p2sisa}</TableCell>
                          
                          {/* Peak 3 */}
                          <TableCell className="text-center font-medium text-slate-500 border-l bg-indigo-50/20 dark:bg-indigo-900/5">{qc.peak3Target}</TableCell>
                          <TableCell className="text-center font-bold text-indigo-600 bg-indigo-50/20 dark:bg-indigo-900/5">{qc.peak3Realization}</TableCell>
                          <TableCell className={`text-center font-semibold bg-indigo-50/20 dark:bg-indigo-900/5 ${p3sisa < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{p3sisa}</TableCell>
                          
                          {/* Bulan Ini */}
                          <TableCell className="text-center font-medium text-slate-500 border-l bg-emerald-50/20 dark:bg-emerald-900/5">{qc.monthlyTarget}</TableCell>
                          <TableCell className="text-center font-bold text-emerald-600 bg-emerald-50/20 dark:bg-emerald-900/5">{qc.monthlyRealization}</TableCell>
                          <TableCell className={`text-center font-semibold bg-emerald-50/20 dark:bg-emerald-900/5 ${mSisa < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{mSisa}</TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Grand Total Row */}
                    <TableRow className="font-bold bg-indigo-50 dark:bg-indigo-900/20">
                      <TableCell colSpan={2} className="text-center text-indigo-700 dark:text-indigo-300">TOTAL KESELURUHAN</TableCell>
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300 border-l">-</TableCell>
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300 border-l">{qcProductivity.reduce((acc:any, cur:any) => acc + cur.peak1Target, 0)}</TableCell>
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300">{qcProductivity.reduce((acc:any, cur:any) => acc + cur.peak1Realization, 0)}</TableCell>
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300">{qcProductivity.reduce((acc:any, cur:any) => acc + (cur.peak1Target - cur.peak1Realization), 0)}</TableCell>
                      
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300 border-l">{qcProductivity.reduce((acc:any, cur:any) => acc + cur.peak2Target, 0)}</TableCell>
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300">{qcProductivity.reduce((acc:any, cur:any) => acc + cur.peak2Realization, 0)}</TableCell>
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300">{qcProductivity.reduce((acc:any, cur:any) => acc + (cur.peak2Target - cur.peak2Realization), 0)}</TableCell>
                      
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300 border-l">{qcProductivity.reduce((acc:any, cur:any) => acc + cur.peak3Target, 0)}</TableCell>
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300">{qcProductivity.reduce((acc:any, cur:any) => acc + cur.peak3Realization, 0)}</TableCell>
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300">{qcProductivity.reduce((acc:any, cur:any) => acc + (cur.peak3Target - cur.peak3Realization), 0)}</TableCell>
                      
                      <TableCell className="text-center text-emerald-700 dark:text-emerald-300 border-l bg-emerald-100/50 dark:bg-emerald-900/30">{qcProductivity.reduce((acc:any, cur:any) => acc + cur.monthlyTarget, 0)}</TableCell>
                      <TableCell className="text-center text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-900/30">{qcProductivity.reduce((acc:any, cur:any) => acc + cur.monthlyRealization, 0)}</TableCell>
                      <TableCell className="text-center text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-900/30">{qcProductivity.reduce((acc:any, cur:any) => acc + (cur.monthlyTarget - cur.monthlyRealization), 0)}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* REALTIME TAPPING TABLE */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col mb-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            REALTIME TAPPING ALL CHANNEL/KIP & EKSEKUTOR AGENT
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <Table className="whitespace-nowrap">
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-slate-500 bg-indigo-50/50 dark:bg-indigo-900/10 text-center border-r border-b-0" rowSpan={2}></TableHead>
                  <TableHead className="text-xs font-bold text-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/10 text-center border-r border-b-0" colSpan={5}>REALTIME TAPPING ALL CHANNEL/KIP</TableHead>
                  <TableHead className="text-xs font-bold text-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 text-center border-b-0" colSpan={5}>REALTIME TAPPING EKSEKUTOR AGENT</TableHead>
                </TableRow>
                <TableRow>
                  {/* All Channel */}
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0 border-r">Nama Tapper</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Historical</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Realtime</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Target (70%)</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Sisa</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0 border-r">%</TableHead>
                  {/* Eksekutor */}
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-emerald-50/50 dark:bg-emerald-900/10 border-t-0">Historical</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-emerald-50/50 dark:bg-emerald-900/10 border-t-0">Realtime</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-emerald-50/50 dark:bg-emerald-900/10 border-t-0">Target (80%)</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-emerald-50/50 dark:bg-emerald-900/10 border-t-0">Sisa</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-emerald-50/50 dark:bg-emerald-900/10 border-t-0">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qcProductivity.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-[100px] text-center text-slate-400">Belum ada data realtime</TableCell>
                  </TableRow>
                ) : (
                  <>
                    {qcProductivity.map((qc: any, i: number) => {
                      const allHistorical = qc.monthlyRealization || 0;
                      const allRealtime = qc.dailyRealization || 0;
                      const allTarget = Math.round(qc.monthlyTarget * 0.7);
                      const allSisa = allTarget - allRealtime;
                      const allPercent = allTarget > 0 ? ((allRealtime / allTarget) * 100).toFixed(2) : 0;
                      
                      const eksHistorical = Math.round(allHistorical * 0.5);
                      const eksRealtime = Math.round(allRealtime * 0.5);
                      const eksTarget = Math.round(qc.monthlyTarget * 0.8);
                      const eksSisa = eksTarget - eksRealtime;
                      const eksPercent = eksTarget > 0 ? ((eksRealtime / eksTarget) * 100).toFixed(2) : 0;

                      return (
                        <TableRow key={i}>
                          <TableCell className="bg-slate-50 dark:bg-slate-900/50 border-r"></TableCell>
                          <TableCell className="font-semibold text-slate-800 dark:text-slate-200 border-r">{qc.tapper}</TableCell>
                          
                          <TableCell className="text-center font-medium">{allHistorical}</TableCell>
                          <TableCell className="text-center font-medium">{allRealtime}</TableCell>
                          <TableCell className="text-center text-indigo-600 font-semibold">{allTarget}</TableCell>
                          <TableCell className={`text-center font-semibold ${allSisa > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{allSisa}</TableCell>
                          <TableCell className="text-center border-r font-bold text-indigo-600">{allPercent}%</TableCell>
                          
                          <TableCell className="text-center font-medium">{eksHistorical}</TableCell>
                          <TableCell className="text-center font-medium">{eksRealtime}</TableCell>
                          <TableCell className="text-center text-emerald-600 font-semibold">{eksTarget}</TableCell>
                          <TableCell className={`text-center font-semibold ${eksSisa > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{eksSisa}</TableCell>
                          <TableCell className="text-center font-bold text-emerald-600">{eksPercent}%</TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Total Row */}
                    <TableRow className="font-bold bg-indigo-50 dark:bg-indigo-900/20">
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300 border-r" colSpan={2}>TOTAL KESELURUHAN</TableCell>
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300">-</TableCell>
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300">-</TableCell>
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300">
                        {qcProductivity.reduce((acc:any, cur:any) => acc + Math.round(cur.monthlyTarget * 0.7), 0)}
                      </TableCell>
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300">-</TableCell>
                      <TableCell className="text-center text-indigo-700 dark:text-indigo-300 border-r">-</TableCell>
                      
                      <TableCell className="text-center text-emerald-700 dark:text-emerald-300">-</TableCell>
                      <TableCell className="text-center text-emerald-700 dark:text-emerald-300">-</TableCell>
                      <TableCell className="text-center text-emerald-700 dark:text-emerald-300">
                        {qcProductivity.reduce((acc:any, cur:any) => acc + Math.round(cur.monthlyTarget * 0.8), 0)}
                      </TableCell>
                      <TableCell className="text-center text-emerald-700 dark:text-emerald-300">-</TableCell>
                      <TableCell className="text-center text-emerald-700 dark:text-emerald-300">-</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* PERFORMANCE / TAPPER Table */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            Performance / Tapper
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <Table className="whitespace-nowrap">
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <SortableTableHead columnKey="agent" currentSortBy={apSortBy} currentSortOrder={apSortOrder} onSort={(k, o) => { setApSortBy(k); setApSortOrder(o); }} className="text-xs font-semibold text-slate-500 w-[200px]" rowSpan={2}>Nama Agent</SortableTableHead>
                  <TableHead className="text-xs font-bold text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 text-center border-l border-b-0" colSpan={4}>Peak 1</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 text-center border-l border-b-0" colSpan={4}>Peak 2</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 text-center border-l border-b-0" colSpan={4}>Peak 3</TableHead>
                </TableRow>
                <TableRow>
                  {/* Peak 1 */}
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-l border-t-0">Realisasi</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Target</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Sisa</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">QA Score/Peak</TableHead>
                  {/* Peak 2 */}
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-l border-t-0">Realisasi</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Target</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Sisa</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">QA Score/Peak</TableHead>
                  {/* Peak 3 */}
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-l border-t-0">Realisasi</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Target</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">Sisa</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-t-0">QA Score/Peak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="h-[100px] text-center text-slate-400">Belum ada data performance agent</TableCell>
                  </TableRow>
                ) : (
                  (() => {
                    const grouped: Record<string, any[]> = {};
                    agentPerformance.forEach((ag: any) => {
                      const t = ag.tapper || 'Unknown Tapper';
                      if (!grouped[t]) grouped[t] = [];
                      grouped[t].push(ag);
                    });
                    
                    return Object.entries(grouped).map(([tapperName, agents], tIdx) => {
                      const tP1Real = agents.reduce((a, c) => a + c.peak1Realization, 0);
                      const tP1Tgt = agents.reduce((a, c) => a + c.peak1Target, 0);
                      const tP2Real = agents.reduce((a, c) => a + c.peak2Realization, 0);
                      const tP2Tgt = agents.reduce((a, c) => a + c.peak2Target, 0);
                      const tP3Real = agents.reduce((a, c) => a + c.peak3Realization, 0);
                      const tP3Tgt = agents.reduce((a, c) => a + c.peak3Target, 0);
                      
                      return (
                        <React.Fragment key={tIdx}>
                          {/* Tapper Header */}
                          <TableRow className="bg-emerald-100/50 dark:bg-emerald-900/30">
                            <TableCell colSpan={13} className="font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide border-y border-emerald-200 dark:border-emerald-800/50">
                              {tapperName}
                            </TableCell>
                          </TableRow>
                          {/* Agent Rows */}
                          {agents.map((ag: any, aIdx: number) => {
                            const p1sisa = ag.peak1Target - ag.peak1Realization;
                            const p2sisa = ag.peak2Target - ag.peak2Realization;
                            const p3sisa = ag.peak3Target - ag.peak3Realization;
                            return (
                              <TableRow key={aIdx}>
                                <TableCell className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                                  <div className="flex items-center gap-2">
                                    {ag.agent}
                                    {ag.isEksekutor && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 uppercase tracking-wider">
                                        Eksekutor
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                {/* Peak 1 */}
                                <TableCell className="text-center font-bold text-indigo-600 border-l bg-indigo-50/20 dark:bg-indigo-900/5">{ag.peak1Realization}</TableCell>
                                <TableCell className="text-center font-medium text-slate-500 bg-indigo-50/20 dark:bg-indigo-900/5">{ag.peak1Target}</TableCell>
                                <TableCell className={`text-center font-semibold bg-indigo-50/20 dark:bg-indigo-900/5 ${p1sisa < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{p1sisa}</TableCell>
                                <TableCell className="text-center font-medium text-slate-600 bg-indigo-50/20 dark:bg-indigo-900/5">100.00</TableCell>
                                
                                {/* Peak 2 */}
                                <TableCell className="text-center font-bold text-indigo-600 border-l bg-indigo-50/20 dark:bg-indigo-900/5">{ag.peak2Realization}</TableCell>
                                <TableCell className="text-center font-medium text-slate-500 bg-indigo-50/20 dark:bg-indigo-900/5">{ag.peak2Target}</TableCell>
                                <TableCell className={`text-center font-semibold bg-indigo-50/20 dark:bg-indigo-900/5 ${p2sisa < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{p2sisa}</TableCell>
                                <TableCell className="text-center font-medium text-slate-600 bg-indigo-50/20 dark:bg-indigo-900/5">100.00</TableCell>
                                
                                {/* Peak 3 */}
                                <TableCell className="text-center font-bold text-indigo-600 border-l bg-indigo-50/20 dark:bg-indigo-900/5">{ag.peak3Realization}</TableCell>
                                <TableCell className="text-center font-medium text-slate-500 bg-indigo-50/20 dark:bg-indigo-900/5">{ag.peak3Target}</TableCell>
                                <TableCell className={`text-center font-semibold bg-indigo-50/20 dark:bg-indigo-900/5 ${p3sisa < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{p3sisa}</TableCell>
                                <TableCell className="text-center font-medium text-slate-600 bg-indigo-50/20 dark:bg-indigo-900/5">100.00</TableCell>
                              </TableRow>
                            );
                          })}
                          {/* Jumlah Row */}
                          <TableRow className="font-bold bg-slate-100 dark:bg-slate-800/50">
                            <TableCell className="text-center text-slate-600 dark:text-slate-400">Jumlah</TableCell>
                            <TableCell className="text-center text-slate-800 dark:text-slate-200 border-l">{tP1Real}</TableCell>
                            <TableCell className="text-center text-slate-800 dark:text-slate-200">{tP1Tgt}</TableCell>
                            <TableCell className="text-center text-slate-800 dark:text-slate-200">{tP1Tgt - tP1Real}</TableCell>
                            <TableCell className="text-center text-slate-800 dark:text-slate-200">98.10</TableCell>
                            
                            <TableCell className="text-center text-slate-800 dark:text-slate-200 border-l">{tP2Real}</TableCell>
                            <TableCell className="text-center text-slate-800 dark:text-slate-200">{tP2Tgt}</TableCell>
                            <TableCell className="text-center text-slate-800 dark:text-slate-200">{tP2Tgt - tP2Real}</TableCell>
                            <TableCell className="text-center text-slate-800 dark:text-slate-200">98.10</TableCell>
                            
                            <TableCell className="text-center text-slate-800 dark:text-slate-200 border-l">{tP3Real}</TableCell>
                            <TableCell className="text-center text-slate-800 dark:text-slate-200">{tP3Tgt}</TableCell>
                            <TableCell className="text-center text-slate-800 dark:text-slate-200">{tP3Tgt - tP3Real}</TableCell>
                            <TableCell className="text-center text-slate-800 dark:text-slate-200">98.10</TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    });
                  })()
                )}
              </TableBody>
            </Table>
          </div>
        </div>


          </TabsContent>

          <TabsContent value="history" className="flex-1 flex flex-col min-h-0 mt-4">
            <ReviewHistoryTab debouncedSearch={debouncedSearch} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Target Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[85vh] flex flex-col bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" /> Pengaturan Target
            </DialogTitle>
            <DialogDescription>
              Atur target harian, peak, dan bulanan untuk masing-masing QC dan Agent.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={settingsActiveTab} onValueChange={setSettingsActiveTab} className="flex-1 flex flex-col min-h-0 py-4">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
              <TabsTrigger value="qc" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Target QC</TabsTrigger>
              <TabsTrigger value="agent" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Target Agent</TabsTrigger>
            </TabsList>
            
            <TabsContent value="qc" className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl relative bg-slate-50/50 dark:bg-slate-900/20">
              <Table>
                <TableHeader className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10">
                  <TableRow className="border-b border-slate-200 dark:border-slate-800">
                    <TableHead className="font-semibold">Nama QC</TableHead>
                    <TableHead className="w-[100px] font-semibold">Harian</TableHead>
                    <TableHead className="w-[100px] font-semibold">Peak 1</TableHead>
                    <TableHead className="w-[100px] font-semibold">Peak 2</TableHead>
                    <TableHead className="w-[100px] font-semibold">Peak 3</TableHead>
                    <TableHead className="w-[100px] font-semibold">Bulanan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qcSettings.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Belum ada data QC</TableCell></TableRow>}
                  {qcSettings.map((qc, i) => (
                    <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{qc.name}</TableCell>
                      <TableCell>
                        <Input type="number" min="0" className="h-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" value={qc.daily} onChange={(e) => {
                          const newQcs = [...qcSettings];
                          newQcs[i].daily = e.target.value;
                          setQcSettings(newQcs);
                        }} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" className="h-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" value={qc.peak1} onChange={(e) => {
                          const newQcs = [...qcSettings];
                          newQcs[i].peak1 = e.target.value;
                          setQcSettings(newQcs);
                        }} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" className="h-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" value={qc.peak2} onChange={(e) => {
                          const newQcs = [...qcSettings];
                          newQcs[i].peak2 = e.target.value;
                          setQcSettings(newQcs);
                        }} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" className="h-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" value={qc.peak3} onChange={(e) => {
                          const newQcs = [...qcSettings];
                          newQcs[i].peak3 = e.target.value;
                          setQcSettings(newQcs);
                        }} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" className="h-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" value={qc.monthly} onChange={(e) => {
                          const newQcs = [...qcSettings];
                          newQcs[i].monthly = e.target.value;
                          setQcSettings(newQcs);
                        }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="agent" className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl relative bg-slate-50/50 dark:bg-slate-900/20">
              <Table>
                <TableHeader className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10">
                  <TableRow className="border-b border-slate-200 dark:border-slate-800">
                    <TableHead className="font-semibold">Nama Agent</TableHead>
                    <TableHead className="w-[100px] font-semibold">Grouping</TableHead>
                    <TableHead className="w-[120px] font-semibold">Tapper</TableHead>
                    <TableHead className="w-[120px] font-semibold">Team Leader</TableHead>
                    <TableHead className="w-[100px] font-semibold">Peak 1</TableHead>
                    <TableHead className="w-[100px] font-semibold">Peak 2</TableHead>
                    <TableHead className="w-[100px] font-semibold">Peak 3</TableHead>
                    <TableHead className="w-[100px] font-semibold">Bulanan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentSettings.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">Belum ada data Agent</TableCell></TableRow>}
                  {agentSettings.map((ag, i) => (
                    <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          {ag.name}
                          {ag.group && ag.group.toUpperCase() === 'EKSEKUTOR' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 uppercase tracking-wider">
                              Eksekutor
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400">{ag.group || '-'}</TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400">{ag.tapper || '-'}</TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400">{ag.teamLeader || '-'}</TableCell>
                      <TableCell>
                        <Input type="number" min="0" className="h-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" value={ag.peak1} onChange={(e) => {
                          const newAgs = [...agentSettings];
                          newAgs[i].peak1 = e.target.value;
                          setAgentSettings(newAgs);
                        }} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" className="h-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" value={ag.peak2} onChange={(e) => {
                          const newAgs = [...agentSettings];
                          newAgs[i].peak2 = e.target.value;
                          setAgentSettings(newAgs);
                        }} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" className="h-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" value={ag.peak3} onChange={(e) => {
                          const newAgs = [...agentSettings];
                          newAgs[i].peak3 = e.target.value;
                          setAgentSettings(newAgs);
                        }} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" className="h-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" value={ag.monthly} onChange={(e) => {
                          const newAgs = [...agentSettings];
                          newAgs[i].monthly = e.target.value;
                          setAgentSettings(newAgs);
                        }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
          <DialogFooter className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
              />
              <Button 
                type="button"
                variant="outline" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploading || isSaving}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                {isUploading ? "Memproses..." : "Upload Excel"}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>Batal</Button>
              <Button onClick={handleSaveSettings} disabled={isSaving || isUploading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
