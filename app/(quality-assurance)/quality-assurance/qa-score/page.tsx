"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { TrendingUp, Users, Award, AlertTriangle, Target, ChevronLeft, ChevronRight, Loader2, Copy, MessageCircle, Edit3, ShieldCheck, Search, Inbox, UserX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";

const COLORS = {
  primary: "#6366f1",
  secondary: "#ec4899",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  orange: "#f97316",
  teal: "#14b8a6",
  rose: "#f43f5e",
};

const PARAM_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6",
];

const TARGET_SCORE = 97;

export default function QaScorePage() {
  const router = useRouter();
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>("");
  const [agent, setAgent] = useState<string>("");
  const [teamLeader, setTeamLeader] = useState<string>("");
  const [peak, setPeak] = useState<string>("");

  const { user } = useAuth();
  const canSeeTapper = user?.role === "QC" || user?.role === "TL_QC";
  const [ncPage, setNcPage] = useState(1);
  const [ncPerPage, setNcPerPage] = useState(10);
  const [ncSearch, setNcSearch] = useState("");
  const [nonNcSearch, setNonNcSearch] = useState("");

  const [komitmenOpen, setKomitmenOpen] = useState(false);
  const [komitmenText, setKomitmenText] = useState("");
  const [isSubmittingKomitmen, setIsSubmittingKomitmen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);

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
      queryClient.invalidateQueries({ queryKey: ["qa-score-dashboard"] });
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan komitmen");
    } finally {
      setIsSubmittingKomitmen(false);
    }
  };

  const queryClient = useQueryClient();

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ["qa-detail-tapping-options"],
    queryFn: async () => {
      const res = await api.get("/qa/form-tapping/detail-tapping/options");
      return res.data;
    },
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["qa-score-dashboard", year, month, agent, peak, teamLeader],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.set("year", year);
      if (month) params.set("month", month);
      if (agent) params.set("agent", agent);
      if (teamLeader) params.set("teamLeader", teamLeader);
      if (peak) params.set("peak", peak);
      const res = await api.get(`/qa/form-tapping/qa-score?${params.toString()}`);
      return res.data;
    },
  });

  const monthlyScores = dashboardData?.monthlyScores || [];
  let agentRanking = [...(dashboardData?.agentRanking || [])];
  let teamLeaderRanking = [...(dashboardData?.teamLeaderRanking || [])];
  let ncDetails = [...(dashboardData?.ncDetails || [])];
  const nonNcDetails = [...(dashboardData?.nonNcDetails || [])];
  const topKipNc = dashboardData?.topKipNc || [];

  const parameterAchievement = dashboardData?.parameterAchievement || [];
  const totalSampling = dashboardData?.totalSampling || 0;

  const [agentSortBy, setAgentSortBy] = useState("qaScore");
  const [agentSortOrder, setAgentSortOrder] = useState<"asc" | "desc">("desc");
  const [tlSortBy, setTlSortBy] = useState("qaScore");
  const [tlSortOrder, setTlSortOrder] = useState<"asc" | "desc">("desc");
  const [ncSortBy, setNcSortBy] = useState("createdAt");
  const [ncSortOrder, setNcSortOrder] = useState<"asc" | "desc">("desc");
  const [nonNcSortBy, setNonNcSortBy] = useState("qaScore");
  const [nonNcSortOrder, setNonNcSortOrder] = useState<"asc" | "desc">("desc");
  const [nonNcPage, setNonNcPage] = useState(1);
  const [nonNcItemsPerPage, setNonNcItemsPerPage] = useState(10);

  const sortArray = (arr: any[], key?: string, order?: "asc" | "desc") => {
    if (!key) return arr;
    return arr.sort((a, b) => {
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

  agentRanking = sortArray(agentRanking, agentSortBy, agentSortOrder);
  teamLeaderRanking = sortArray(teamLeaderRanking, tlSortBy, tlSortOrder);
  ncDetails = sortArray(ncDetails, ncSortBy, ncSortOrder);

  const overallAvg = monthlyScores.length > 0
    ? (monthlyScores.reduce((s: number, m: any) => s + m.avgScore, 0) / monthlyScores.length).toFixed(2)
    : "0";

  // Filter NC by search
  const filteredNcDetails = ncSearch.trim()
    ? ncDetails.filter((nc: any) => {
        const q = ncSearch.toLowerCase();
        return (
          (nc.agent || "").toLowerCase().includes(q) ||
          (nc.teamLeader || "").toLowerCase().includes(q) ||
          (nc.idTiket || "").toLowerCase().includes(q) ||
          (nc.parameterPenilaian || "").toLowerCase().includes(q) ||
          (nc.subParameterPenilaian || "").toLowerCase().includes(q) ||
          (nc.notes || "").toLowerCase().includes(q)
        );
      })
    : ncDetails;

  const totalNcPages = Math.ceil(filteredNcDetails.length / ncPerPage);
  const paginatedNc = filteredNcDetails.slice((ncPage - 1) * ncPerPage, ncPage * ncPerPage);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 bg-slate-200 dark:bg-slate-700" />
          <Skeleton className="h-10 w-64 bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-3xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full rounded-2xl bg-slate-200 dark:bg-slate-700" />
          <Skeleton className="h-[400px] w-full rounded-2xl bg-slate-200 dark:bg-slate-700" />
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
          QA SCORE
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Dashboard evaluasi performa dan parameter pencapaian QA.
        </p>
      </div>

      <div className="flex-1 overflow-auto space-y-6 p-6 sm:p-8 z-10 relative">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-wrap">
        <Select value={year} onValueChange={(v) => { setYear(v); setNcPage(1); }}>
          <SelectTrigger className="w-[120px] h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {(filterOptions?.years || [new Date().getFullYear()]).map((y: number) => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={month} onValueChange={(v) => { setMonth(v === "all" ? "" : v); setNcPage(1); }}>
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

        <Select value={peak || "all"} onValueChange={(v) => { setPeak(v === "all" ? "" : v); setNcPage(1); }}>
          <SelectTrigger className="w-[120px] h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium">
            <SelectValue placeholder="All Peak" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Peak</SelectItem>
            {(filterOptions?.peaks || []).map((p: number) => (
              <SelectItem key={p} value={p.toString()}>Peak {p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={agent || "all"} onValueChange={(v) => { setAgent(v === "all" ? "" : v); setNcPage(1); }}>
          <SelectTrigger className="w-[200px] h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium">
            <SelectValue placeholder="All Agents" />
          </SelectTrigger>
          <SelectContent className="rounded-xl max-h-[300px]">
            <SelectItem value="all">All Agents</SelectItem>
            {(filterOptions?.agents || []).map((a: string) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={teamLeader || "all"} onValueChange={(v) => { setTeamLeader(v === "all" ? "" : v); setNcPage(1); }}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium">
            <SelectValue placeholder="All Team Leader" />
          </SelectTrigger>
          <SelectContent className="rounded-xl max-h-[300px]">
            <SelectItem value="all">All Team Leader</SelectItem>
            {(filterOptions?.teamLeaders || []).map((a: string) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-indigo-50/50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30">
            <Target className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Target: {TARGET_SCORE}</span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-100/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group transition-all duration-500 hover:shadow-[0_8px_40px_rgb(99,102,241,0.12)] hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-indigo-500/30" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Sampling</p>
              <h4 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter drop-shadow-sm">{totalSampling.toLocaleString()}</h4>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50/80 dark:bg-indigo-500/10 backdrop-blur-md border border-indigo-100/50 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner group-hover:rotate-6 transition-transform duration-300">
              <Users className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-100/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group transition-all duration-500 hover:shadow-[0_8px_40px_rgb(16,185,129,0.12)] hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-emerald-500/30" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Overall Score</p>
              <div className="flex items-baseline gap-2">
                <h4 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter drop-shadow-sm">{overallAvg}</h4>
                <span className="text-sm font-bold text-emerald-500">/ 100</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur-md border border-emerald-100/50 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner group-hover:rotate-6 transition-transform duration-300">
              <Award className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-100/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group transition-all duration-500 hover:shadow-[0_8px_40px_rgb(244,63,94,0.12)] hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-rose-500/30" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total NC</p>
              <h4 className="text-5xl font-black text-rose-600 dark:text-rose-400 tracking-tighter drop-shadow-sm">{ncDetails.length}</h4>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-rose-50/80 dark:bg-rose-500/10 backdrop-blur-md border border-rose-100/50 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner group-hover:-rotate-6 transition-transform duration-300">
              <AlertTriangle className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      {/* QA Score Monthly Chart */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-100/50 dark:border-slate-800/50 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(99,102,241,0.08)] transition-all duration-500">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              QA Score Trend
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Pergerakan Rata-Rata Nilai Bulanan</p>
          </div>
          <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-100 dark:border-indigo-500/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-inner flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            Live Update
          </div>
        </div>
        {monthlyScores.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={monthlyScores} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorScoreArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" strokeOpacity={0.4} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#71717a", fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#71717a", fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip
                cursor={{ stroke: 'rgba(99, 102, 241, 0.4)', strokeWidth: 2, strokeDasharray: '4 4' }}
                contentStyle={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(226, 232, 240, 0.8)", borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
                itemStyle={{ color: "#18181b", fontWeight: "900", fontSize: "16px" }}
                labelStyle={{ color: "#71717a", fontWeight: "bold", fontSize: "12px", textTransform: "uppercase", marginBottom: "4px" }}
                formatter={(value: any) => [`${Number(value).toFixed(2)}`, "AVG SCORE"]}
              />
              <ReferenceLine y={TARGET_SCORE} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} label={{ value: `TARGET ${TARGET_SCORE}`, position: "insideTopRight", fill: "#ef4444", fontSize: 10, fontWeight: 800, backgroundColor: "#fff", padding: 4 }} />
              <Area 
                type="monotone" 
                dataKey="avgScore" 
                stroke="#6366f1" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorScoreArea)"
                activeDot={{ r: 8, strokeWidth: 0, fill: "#4f46e5", style: { filter: "drop-shadow(0px 0px 8px rgba(79,70,229,0.6))" } }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[320px] bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <TrendingUp className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">No Data Available</p>
          </div>
        )}
      </div>

      {/* Achievement Parameter Chart */}
      {parameterAchievement.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" />
            Achievement Parameter
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart 
              data={parameterAchievement} 
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              barCategoryGap="25%"
              barGap={6}
            >
              <defs>
                <linearGradient id="gradValiditas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PARAM_COLORS[0]} stopOpacity={1}/>
                  <stop offset="100%" stopColor={PARAM_COLORS[0]} stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="gradServiceLevel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PARAM_COLORS[1]} stopOpacity={1}/>
                  <stop offset="100%" stopColor={PARAM_COLORS[1]} stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="gradKalimat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PARAM_COLORS[2]} stopOpacity={1}/>
                  <stop offset="100%" stopColor={PARAM_COLORS[2]} stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="gradResponTime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PARAM_COLORS[3]} stopOpacity={1}/>
                  <stop offset="100%" stopColor={PARAM_COLORS[3]} stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="gradDokumentasi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PARAM_COLORS[4]} stopOpacity={1}/>
                  <stop offset="100%" stopColor={PARAM_COLORS[4]} stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#71717a", fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 12, fill: "#71717a", fontWeight: 500 }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "var(--accent)" }}
                contentStyle={{ backgroundColor: "var(--background)", color: "var(--foreground)", backdropFilter: "blur(8px)", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.12)" }}
                itemStyle={{ fontWeight: "bold" }}
                formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}%`, name]}
              />
              <Legend wrapperStyle={{ fontSize: "12px", fontWeight: 600, paddingTop: "20px" }} iconType="circle" />
              <Bar dataKey="validitas" name="Validitas" fill="url(#gradValiditas)" radius={[8, 8, 0, 0]} barSize={20} />
              <Bar dataKey="serviceLevel" name="Service Level" fill="url(#gradServiceLevel)" radius={[8, 8, 0, 0]} barSize={20} />
              <Bar dataKey="kalimat" name="Kalimat" fill="url(#gradKalimat)" radius={[8, 8, 0, 0]} barSize={20} />
              <Bar dataKey="responTime" name="Respon Time" fill="url(#gradResponTime)" radius={[8, 8, 0, 0]} barSize={20} />
              <Bar dataKey="dokumentasi" name="Dokumentasi" fill="url(#gradDokumentasi)" radius={[8, 8, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}


      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Ranking Table */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Agent Ranking
          </h3>
          <div className="overflow-auto max-h-[400px] rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <Table>
              <TableHeader className="bg-slate-50/90 dark:bg-slate-900/90 sticky top-0 z-10 backdrop-blur-xl shadow-sm">
                <TableRow className="border-b border-slate-100 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className="w-[40px] font-semibold text-slate-500">#</TableHead>
                  <SortableTableHead columnKey="agent" currentSortBy={agentSortBy} currentSortOrder={agentSortOrder} onSort={(k, o) => { setAgentSortBy(k); setAgentSortOrder(o); }} className="font-semibold text-slate-500">Nama Agent</SortableTableHead>
                  <SortableTableHead columnKey="teamLeader" currentSortBy={agentSortBy} currentSortOrder={agentSortOrder} onSort={(k, o) => { setAgentSortBy(k); setAgentSortOrder(o); }} className="font-semibold text-slate-500">Nama TL</SortableTableHead>
                  <SortableTableHead columnKey="sampling" currentSortBy={agentSortBy} currentSortOrder={agentSortOrder} onSort={(k, o) => { setAgentSortBy(k); setAgentSortOrder(o); }} className="font-semibold text-slate-500 text-right">Sampling</SortableTableHead>
                  <SortableTableHead columnKey="qaScore" currentSortBy={agentSortBy} currentSortOrder={agentSortOrder} onSort={(k, o) => { setAgentSortBy(k); setAgentSortOrder(o); }} className="font-semibold text-slate-500 text-right">QA Score</SortableTableHead>
                  <SortableTableHead columnKey="achievement" currentSortBy={agentSortBy} currentSortOrder={agentSortOrder} onSort={(k, o) => { setAgentSortBy(k); setAgentSortOrder(o); }} className="font-semibold text-slate-500 text-center">Achievement</SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentRanking.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-[250px] text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                        <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                          <UserX className="w-7 h-7 text-slate-300 dark:text-slate-500" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-600 dark:text-slate-300">Belum ada data agent</h3>
                        <p className="text-sm">Sesuaikan filter untuk melihat data.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  agentRanking.map((a: any, i: number) => (
                    <TableRow key={a.agent} className="transition-all duration-300 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 hover:shadow-[inset_3px_0_0_0_rgba(99,102,241,0.8)] border-b border-slate-100 dark:border-slate-800/50 group cursor-default">
                      <TableCell className="font-medium">
                        {i === 0 ? <span className="text-2xl drop-shadow-sm filter">🥇</span> : 
                         i === 1 ? <span className="text-2xl drop-shadow-sm filter">🥈</span> : 
                         i === 2 ? <span className="text-2xl drop-shadow-sm filter">🥉</span> : 
                         <span className="text-slate-400 w-8 inline-block text-center">{i + 1}</span>}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase">{a.agent}</TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400 font-medium uppercase">{a.teamLeader || "-"}</TableCell>
                      <TableCell className="text-right text-slate-600 dark:text-slate-400 font-medium">{a.sampling.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-black text-lg">
                        <span className={cn(a.qaScore >= TARGET_SCORE ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500" : "text-rose-500")}>
                          {a.qaScore.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn("px-3 py-1.5 rounded-xl text-[11px] font-black tracking-widest uppercase shadow-sm border", a.achievement === "Achieved" ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400")}>
                          {a.achievement}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Team Leader Ranking Table */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            Team Leader Ranking
          </h3>
          <div className="overflow-auto max-h-[400px] rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <Table>
              <TableHeader className="bg-slate-50/90 dark:bg-slate-900/90 sticky top-0 z-10 backdrop-blur-xl shadow-sm">
                <TableRow className="border-b border-slate-100 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className="w-[40px] font-semibold text-slate-500">#</TableHead>
                  <SortableTableHead columnKey="teamLeader" currentSortBy={tlSortBy} currentSortOrder={tlSortOrder} onSort={(k, o) => { setTlSortBy(k); setTlSortOrder(o); }} className="font-semibold text-slate-500">Team Leader</SortableTableHead>
                  <SortableTableHead columnKey="sampling" currentSortBy={tlSortBy} currentSortOrder={tlSortOrder} onSort={(k, o) => { setTlSortBy(k); setTlSortOrder(o); }} className="font-semibold text-slate-500 text-right">Sampling</SortableTableHead>
                  <SortableTableHead columnKey="qaScore" currentSortBy={tlSortBy} currentSortOrder={tlSortOrder} onSort={(k, o) => { setTlSortBy(k); setTlSortOrder(o); }} className="font-semibold text-slate-500 text-right">QA Score</SortableTableHead>
                  <SortableTableHead columnKey="achievement" currentSortBy={tlSortBy} currentSortOrder={tlSortOrder} onSort={(k, o) => { setTlSortBy(k); setTlSortOrder(o); }} className="font-semibold text-slate-500 text-center">Achievement</SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamLeaderRanking.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-[250px] text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                        <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                          <UserX className="w-7 h-7 text-slate-300 dark:text-slate-500" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-600 dark:text-slate-300">Belum ada data TL</h3>
                        <p className="text-sm">Sesuaikan filter untuk melihat data.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  teamLeaderRanking.map((tl: any, i: number) => (
                    <TableRow key={tl.teamLeader} className="transition-all duration-300 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/20 hover:shadow-[inset_3px_0_0_0_rgba(16,185,129,0.8)] border-b border-slate-100 dark:border-slate-800/50 group cursor-default">
                      <TableCell className="font-medium">
                        {i === 0 ? <span className="text-2xl drop-shadow-sm filter">🥇</span> : 
                         i === 1 ? <span className="text-2xl drop-shadow-sm filter">🥈</span> : 
                         i === 2 ? <span className="text-2xl drop-shadow-sm filter">🥉</span> : 
                         <span className="text-slate-400 w-8 inline-block text-center">{i + 1}</span>}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase">{tl.teamLeader}</TableCell>
                      <TableCell className="text-right text-slate-600 dark:text-slate-400 font-medium">{tl.sampling.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-black text-lg">
                        <span className={cn(tl.qaScore >= TARGET_SCORE ? "text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500" : "text-rose-500")}>
                          {tl.qaScore.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn("px-3 py-1.5 rounded-xl text-[11px] font-black tracking-widest uppercase shadow-sm border", tl.achievement === "Achieved" ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400")}>
                          {tl.achievement}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Top 3 KIP NC Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="text-sm font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest flex items-center gap-2 mb-6">
          <AlertTriangle className="w-4 h-4" />
          Top 3 Parameter KIP 3 (NC)
        </h3>
        <div className="overflow-auto max-h-[320px] rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <Table>
            <TableHeader className="bg-slate-50/90 dark:bg-slate-900/90 sticky top-0 z-10 backdrop-blur-xl shadow-sm">
              <TableRow className="border-b border-slate-100 dark:border-slate-800 hover:bg-transparent">
                <TableHead className="w-[60px] font-semibold text-slate-500">Rank</TableHead>
                <TableHead className="font-semibold text-slate-500">KIP Level 3</TableHead>
                <TableHead className="w-[120px] font-semibold text-slate-500 text-center">Jumlah NC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topKipNc.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-slate-400 py-6">Tidak ada data KIP NC</TableCell>
                </TableRow>
              ) : (
                topKipNc.map((item: any, idx: number) => (
                  <TableRow key={idx} className="transition-all duration-300 hover:bg-rose-50/40 dark:hover:bg-rose-900/10 hover:shadow-[inset_3px_0_0_0_rgba(244,63,94,0.7)] border-b border-slate-100 dark:border-slate-800/50 cursor-default">
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                      {idx === 0 ? <span className="text-2xl drop-shadow-sm filter">🥇</span> : 
                       idx === 1 ? <span className="text-2xl drop-shadow-sm filter">🥈</span> : 
                       idx === 2 ? <span className="text-2xl drop-shadow-sm filter">🥉</span> : 
                       <span className="text-slate-400 w-8 inline-block text-center">{idx + 1}</span>}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-200">{item.kip}</TableCell>
                    <TableCell className="text-center font-bold text-rose-500">{item.count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Tiket Tanpa NC Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Tiket Tanpa NC
            <span className="ml-2 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-full text-[11px] font-bold">
              {nonNcSearch.trim()
                ? `${nonNcDetails.filter((t: any) => { const q = nonNcSearch.toLowerCase(); return (t.agent||"").toLowerCase().includes(q)||(t.teamLeader||"").toLowerCase().includes(q)||(t.idTiket||"").toLowerCase().includes(q); }).length} / ${nonNcDetails.length}`
                : nonNcDetails.length}
            </span>
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              value={nonNcSearch}
              onChange={(e) => { setNonNcSearch(e.target.value); setNonNcPage(1); }}
              placeholder="Cari agent, ID tiket, atau TL..."
              className="pl-9 h-9 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
        </div>
        <div className="overflow-auto max-h-[400px] rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <Table>
            <TableHeader className="bg-slate-50/90 dark:bg-slate-900/90 sticky top-0 z-10 backdrop-blur-xl shadow-sm">
              <TableRow className="border-b border-slate-100 dark:border-slate-800 hover:bg-transparent">
                <TableHead className="w-[40px] font-semibold text-slate-500">#</TableHead>
                <SortableTableHead columnKey="idTiket" currentSortBy={nonNcSortBy} currentSortOrder={nonNcSortOrder} onSort={(k, o) => { setNonNcSortBy(k); setNonNcSortOrder(o); }} className="font-semibold text-slate-500">ID Tiket</SortableTableHead>
                <SortableTableHead columnKey="score" currentSortBy={nonNcSortBy} currentSortOrder={nonNcSortOrder} onSort={(k, o) => { setNonNcSortBy(k); setNonNcSortOrder(o); }} className="font-semibold text-slate-500 text-center">QA Score</SortableTableHead>
                <SortableTableHead columnKey="agent" currentSortBy={nonNcSortBy} currentSortOrder={nonNcSortOrder} onSort={(k, o) => { setNonNcSortBy(k); setNonNcSortOrder(o); }} className="font-semibold text-slate-500">Nama Agent</SortableTableHead>
                <SortableTableHead columnKey="teamLeader" currentSortBy={nonNcSortBy} currentSortOrder={nonNcSortOrder} onSort={(k, o) => { setNonNcSortBy(k); setNonNcSortOrder(o); }} className="font-semibold text-slate-500">Nama TL</SortableTableHead>
                {canSeeTapper && (
                  <SortableTableHead columnKey="tapper" currentSortBy={nonNcSortBy} currentSortOrder={nonNcSortOrder} onSort={(k, o) => { setNonNcSortBy(k); setNonNcSortOrder(o); }} className="font-semibold text-slate-500">Tapper</SortableTableHead>
                )}
                <SortableTableHead columnKey="createdAt" currentSortBy={nonNcSortBy} currentSortOrder={nonNcSortOrder} onSort={(k, o) => { setNonNcSortBy(k); setNonNcSortOrder(o); }} className="font-semibold text-slate-500">Tanggal Tapping</SortableTableHead>
                <SortableTableHead columnKey="peak" currentSortBy={nonNcSortBy} currentSortOrder={nonNcSortOrder} onSort={(k, o) => { setNonNcSortBy(k); setNonNcSortOrder(o); }} className="font-semibold text-slate-500 text-center">Peak</SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                let rows = [...nonNcDetails];
                if (nonNcSearch.trim()) {
                  const q = nonNcSearch.toLowerCase();
                  rows = rows.filter((t: any) =>
                    (t.agent || "").toLowerCase().includes(q) ||
                    (t.teamLeader || "").toLowerCase().includes(q) ||
                    (t.idTiket || "").toLowerCase().includes(q)
                  );
                }
                
                if (nonNcSortBy) {
                  rows = sortArray(rows, nonNcSortBy, nonNcSortOrder);
                }

                const totalFiltered = rows.length;
                const totalPages = Math.ceil(totalFiltered / nonNcItemsPerPage) || 1;
                const paginatedRows = rows.slice((nonNcPage - 1) * nonNcItemsPerPage, nonNcPage * nonNcItemsPerPage);

                if (paginatedRows.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-400 py-12">Tidak ada tiket tanpa NC</TableCell>
                    </TableRow>
                  );
                }

                return paginatedRows.map((t: any, i: number) => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50 group" onClick={() => router.push(`/quality-assurance/form-tapping/${t.id}`)}>
                    <TableCell className="text-slate-400 font-medium">{(nonNcPage - 1) * nonNcItemsPerPage + i + 1}</TableCell>
                    <TableCell className="font-bold text-slate-900 dark:text-white uppercase">{t.idTiket}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold">
                        {t.score}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase">{t.agent}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400 font-medium uppercase">{t.teamLeader || "-"}</TableCell>
                    {canSeeTapper && (
                      <TableCell className="text-slate-500 dark:text-slate-400 font-medium uppercase">{t.tapper || "-"}</TableCell>
                    )}
                    <TableCell className="text-slate-500 font-medium whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="text-center text-slate-600 dark:text-slate-400 font-medium">Peak {t.peak}</TableCell>
                  </TableRow>
                ))
              })()}
            </TableBody>
          </Table>
        </div>
      </div>



      {/* NC Detail Table */}
      {ncDetails.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              NC Detail (Non-Compliant Tickets)
              <span className="ml-2 px-2 py-0.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-full text-[11px] font-bold">
                {ncSearch.trim() ? `${filteredNcDetails.length} / ${ncDetails.length}` : ncDetails.length}
              </span>
            </h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                value={ncSearch}
                onChange={(e) => { setNcSearch(e.target.value); setNcPage(1); }}
                placeholder="Cari agent, ID tiket, parameter..."
                className="pl-9 h-9 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className="w-[50px] font-semibold text-slate-500">#</TableHead>
                  <SortableTableHead columnKey="idTiket" currentSortBy={ncSortBy} currentSortOrder={ncSortOrder} onSort={(k, o) => { setNcSortBy(k); setNcSortOrder(o); }} className="font-semibold text-slate-500">ID Tiket</SortableTableHead>
                  <SortableTableHead columnKey="score" currentSortBy={ncSortBy} currentSortOrder={ncSortOrder} onSort={(k, o) => { setNcSortBy(k); setNcSortOrder(o); }} className="font-semibold text-slate-500 text-center">QA Score</SortableTableHead>
                  <SortableTableHead columnKey="agent" currentSortBy={ncSortBy} currentSortOrder={ncSortOrder} onSort={(k, o) => { setNcSortBy(k); setNcSortOrder(o); }} className="font-semibold text-slate-500">Nama Agent</SortableTableHead>
                  <SortableTableHead columnKey="teamLeader" currentSortBy={ncSortBy} currentSortOrder={ncSortOrder} onSort={(k, o) => { setNcSortBy(k); setNcSortOrder(o); }} className="font-semibold text-slate-500">Nama TL</SortableTableHead>
                  <SortableTableHead columnKey="parameterPenilaian" currentSortBy={ncSortBy} currentSortOrder={ncSortOrder} onSort={(k, o) => { setNcSortBy(k); setNcSortOrder(o); }} className="font-semibold text-slate-500">Parameter Penilaian</SortableTableHead>
                  <SortableTableHead columnKey="subParameterPenilaian" currentSortBy={ncSortBy} currentSortOrder={ncSortOrder} onSort={(k, o) => { setNcSortBy(k); setNcSortOrder(o); }} className="font-semibold text-slate-500">Sub Parameter</SortableTableHead>
                  <SortableTableHead columnKey="notes" currentSortBy={ncSortBy} currentSortOrder={ncSortOrder} onSort={(k, o) => { setNcSortBy(k); setNcSortOrder(o); }} className="font-semibold text-slate-500 min-w-[300px]">Notes QC</SortableTableHead>
                  <SortableTableHead columnKey="createdAt" currentSortBy={ncSortBy} currentSortOrder={ncSortOrder} onSort={(k, o) => { setNcSortBy(k); setNcSortOrder(o); }} className="font-semibold text-slate-500">Tanggal Tapping</SortableTableHead>
                  <SortableTableHead columnKey="peak" currentSortBy={ncSortBy} currentSortOrder={ncSortOrder} onSort={(k, o) => { setNcSortBy(k); setNcSortOrder(o); }} className="font-semibold text-slate-500 text-center">Peak</SortableTableHead>
                  <SortableTableHead columnKey="komitmen" currentSortBy={ncSortBy} currentSortOrder={ncSortOrder} onSort={(k, o) => { setNcSortBy(k); setNcSortOrder(o); }} className="font-semibold text-slate-500 min-w-[200px]">Komitmen</SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedNc.map((nc: any, i: number) => (
                  <TableRow key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50 group">
                    <TableCell className="text-slate-400 font-medium">{(ncPage - 1) * ncPerPage + i + 1}</TableCell>
                    <TableCell className="font-bold text-indigo-600 dark:text-indigo-400">{nc.idTiket || "-"}</TableCell>
                    <TableCell className="text-center font-bold text-rose-600 dark:text-rose-400">{nc.score ?? "-"}</TableCell>
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{nc.agent}</TableCell>
                    <TableCell className="text-slate-500 font-medium">{nc.teamLeader || "-"}</TableCell>
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs">{nc.parameterPenilaian || "-"}</span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs">{nc.subParameterPenilaian || "-"}</span>
                    </TableCell>
                    <TableCell className="text-slate-500 min-w-[300px] max-w-[400px]">
                      {nc.notes ? (
                        <div className="flex items-start justify-between gap-2">
                          <UiTooltip>
                            <TooltipTrigger asChild>
                              <p className="line-clamp-3 whitespace-pre-wrap break-words text-xs cursor-help">{nc.notes}</p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[400px] max-h-[300px] overflow-auto z-[100]" side="bottom" align="start">
                              <p className="whitespace-pre-wrap text-sm">{nc.notes}</p>
                            </TooltipContent>
                          </UiTooltip>
                          <UiTooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 shrink-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                onClick={() => {
                                  navigator.clipboard.writeText(nc.notes);
                                  toast.success("Notes disalin ke clipboard!");
                                }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Salin teks</p>
                            </TooltipContent>
                          </UiTooltip>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-slate-500 font-medium whitespace-nowrap">
                      {new Date(nc.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="text-center text-slate-600 dark:text-slate-400 font-medium">
                      Peak {nc.peak}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 min-w-[200px] align-top">
                      <div className="flex flex-col gap-1 relative group/komit">
                        {nc.komitmen === '[Komitmen Disembunyikan]' || nc.komitmen === '[Menunggu Approval TL]' ? (
                          <span className="text-xs text-slate-400 italic">{nc.komitmen}</span>
                        ) : nc.komitmen ? (
                          <p className="text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-300 pr-6 leading-relaxed">{nc.komitmen}</p>
                        ) : (
                          user?.role === "USER" && user?.name === nc.agent ? null : <span className="text-slate-400 font-medium text-center w-full">-</span>
                        )}
                        
                        {user?.role === "USER" && user?.name === nc.agent && (
                          nc.komitmen ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenKomitmen(nc)}
                              className="h-6 w-6 absolute -top-1 -right-2 opacity-0 group-hover/komit:opacity-100 transition-opacity text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
                              title="Edit Komitmen"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenKomitmen(nc)}
                              className="h-7 w-fit text-[11px] font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/30"
                            >
                              <MessageCircle className="w-3 h-3 mr-1.5" /> Isi Komitmen
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 font-medium">
                Showing {filteredNcDetails.length === 0 ? 0 : (ncPage - 1) * ncPerPage + 1} - {Math.min(ncPage * ncPerPage, filteredNcDetails.length)} of {filteredNcDetails.length} records
              </span>
              <Select value={ncPerPage.toString()} onValueChange={(v) => { setNcPerPage(Number(v)); setNcPage(1); }}>
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
              <Button variant="outline" size="sm" className="h-8 rounded-lg" onClick={() => setNcPage(p => Math.max(1, p - 1))} disabled={ncPage === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 rounded-lg" onClick={() => setNcPage(p => Math.min(totalNcPages, p + 1))} disabled={ncPage === totalNcPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>

      <Dialog open={komitmenOpen} onOpenChange={setKomitmenOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Isi Komitmen</DialogTitle>
            <DialogDescription>
              Silakan tuliskan komitmen Anda terhadap evaluasi tiket <strong className="text-slate-900 dark:text-white">{selectedRow?.idTiket}</strong>.
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
