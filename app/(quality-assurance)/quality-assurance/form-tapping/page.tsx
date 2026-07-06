"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Play, StopCircle, Trash2, CloudUpload, Star, Clock, ListChecks, CheckCircle2, FolderOpen, ArrowRight, UploadCloud, FileText, ChevronLeft, ChevronRight, Loader2, ListFilter, X, Pencil, BarChart3, List } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ColumnFilterPopover } from "@/components/ui/column-filter-popover";

// Mock Data Interfaces
interface Ticket {
  id: string;
  createdDate?: string;
  createdAt?: string;
  tapper?: string;
  idTiket: string;
  agent: string;
  channel: string;
  jenisInteraksi: string;
  kipLevel2: string;
  kipLevel3: string;
  inOutSla: string;
  projectId: string;
  perusahaan: string;
  customerRequests: string;
  agentResponse: string;
  handlingTime?: string;
}
export default function FormTappingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("data-tiket");
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [ticketColumnFilters, setTicketColumnFilters] = useState<Record<string, string[]>>({});
  const [historyColumnFilters, setHistoryColumnFilters] = useState<Record<string, string[]>>({});
  const [debouncedTicketFilters, setDebouncedTicketFilters] = useState<Record<string, string[]>>({});
  const [debouncedHistoryFilters, setDebouncedHistoryFilters] = useState<Record<string, string[]>>({});

  // Sync OCA States
  const [syncStartDate, setSyncStartDate] = useState("");
  const [syncEndDate, setSyncEndDate] = useState("");


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setDebouncedTicketFilters(ticketColumnFilters);
      setDebouncedHistoryFilters(historyColumnFilters);
      setTicketPage(1);
      setHistoryPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, ticketColumnFilters, historyColumnFilters]);

  // Pagination States
  const [ticketPage, setTicketPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Data States
  const { data: ticketsResponse, isLoading: isLoadingTickets, isFetching: isFetchingTickets } = useQuery({
    queryKey: ["qa-tickets", ticketPage, debouncedSearch, debouncedTicketFilters],
    queryFn: async () => {
      const filtersParam = Object.keys(debouncedTicketFilters).length > 0 ? `&filters=${encodeURIComponent(JSON.stringify(debouncedTicketFilters))}` : '';
      const res = await api.get(`/qa/form-tapping/tickets?page=${ticketPage}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(debouncedSearch)}${filtersParam}`);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
  
  // Fetch History
  const { data: historyResponse, isLoading: isLoadingHistory, isFetching: isFetchingHistory } = useQuery({
    queryKey: ["qa-form-tapping", historyPage, debouncedSearch, debouncedHistoryFilters],
    queryFn: async () => {
      const filtersParam = Object.keys(debouncedHistoryFilters).length > 0 ? `&filters=${encodeURIComponent(JSON.stringify(debouncedHistoryFilters))}` : '';
      const res = await api.get(`/qa/form-tapping?page=${historyPage}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(debouncedSearch)}${filtersParam}`);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  // Fetch Filter Options
  const { data: ticketFilterOptions } = useQuery({
    queryKey: ["qa-ticket-filter-options"],
    queryFn: async () => {
      const res = await api.get("/qa/form-tapping/tickets/options");
      return res.data;
    },
  });

  const { data: historyFilterOptions } = useQuery({
    queryKey: ["qa-history-filter-options"],
    queryFn: async () => {
      const res = await api.get("/qa/form-tapping/options");
      return res.data;
    },
  });

  const tickets: Ticket[] = ticketsResponse?.data || [];
  const history = historyResponse?.data || [];
  
  const totalTicketPages = ticketsResponse?.meta?.totalPages || 1;
  const totalTicketsCount = ticketsResponse?.meta?.total || 0;
  
  const totalHistoryPages = historyResponse?.meta?.totalPages || 1;
  const totalHistoryCount = historyResponse?.meta?.total || 0;
  
  // File State
  const [file, setFile] = useState<File | null>(null);

  const handleExport = async () => {
    try {
      const endpoint = activeTab === "data-tiket" 
        ? "/qa/form-tapping/tickets/export"
        : "/qa/form-tapping/export";
      
      const activeFilters = activeTab === "data-tiket" ? debouncedTicketFilters : debouncedHistoryFilters;
      const filtersParam = Object.keys(activeFilters).length > 0 
        ? `&filters=${encodeURIComponent(JSON.stringify(activeFilters))}` 
        : '';
        
      toast.loading("Exporting data...", { id: "export" });
      const res = await api.get(`${endpoint}?search=${encodeURIComponent(debouncedSearch)}${filtersParam}`);
      
      const data = res.data;
      if (!data || data.length === 0) {
        toast.error("No data to export", { id: "export" });
        return;
      }
      
      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvRows = [];
      csvRows.push(headers.join(","));
      
      for (const row of data) {
        const values = headers.map(header => {
          const val = row[header];
          const escaped = ('' + (val ?? '')).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(","));
      }
      
      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("href", url);
      a.setAttribute("download", `Export_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success("Export successful", { id: "export" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to export data", { id: "export" });
    }
  };
  
  // Calculate Paginated Data
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
  
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await api.post("/qa/form-tapping/tickets/upload", formData);
    },
    onSuccess: (data: any) => {
      toast.success(data.data.message || "Tickets uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["qa-tickets"] });
      setFile(null);
      setActiveTab("data-tiket");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to upload tickets");
    },
  });

  const syncOcaMutation = useMutation({
    mutationFn: async (data: { startDate: string, endDate: string }) => {
      return await api.post("/qa/form-tapping/tickets/sync-oca", data);
    },
    onSuccess: (data: any) => {
      toast.success(data.data.message || "Tickets synced successfully");
      queryClient.invalidateQueries({ queryKey: ["qa-tickets"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to sync tickets from OCA");
    },
  });

  const handleSyncOca = () => {
    if (!syncStartDate || !syncEndDate) {
      toast.error("Please select both Start Date and End Date");
      return;
    }
    syncOcaMutation.mutate({ startDate: syncStartDate, endDate: syncEndDate });
  };

  const handleSyncToday = () => {
    const today = new Date().toISOString().split('T')[0];
    syncOcaMutation.mutate({ startDate: today, endDate: today });
  };


  const handleUpload = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    uploadMutation.mutate(formData);
  };
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/qa/form-tapping/${id}`);
    },
    onSuccess: () => {
      toast.success("Data deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["qa-form-tapping"] });
    },
  });

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="h-full bg-zinc-50/50 dark:bg-zinc-950 flex flex-col p-8 overflow-hidden relative">
      {/* Subtle background glows for elegance */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-indigo-400/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col gap-2 mb-8 shrink-0 relative z-10">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-2">
          <span>Quality Assurance</span>
          <span className="text-zinc-300 mx-1">•</span>
          <span className="text-zinc-800 dark:text-zinc-200">Form Tapping</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white uppercase">Form Tapping</h1>
            <p className="text-zinc-500 mt-2 text-lg font-light">Kelola tiket QA pending, import data baru, dan evaluasi performa agent.</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 relative z-10">
        <div className="flex justify-start mb-6 shrink-0 relative">
          <TabsList className="bg-transparent p-0 flex items-center border-b border-zinc-200 dark:border-zinc-800 w-full justify-start rounded-none h-auto">
            
            <TabsTrigger value="data-tiket" className="relative px-6 py-4 text-sm font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2">
              Pending Tickets
              <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors shadow-sm", activeTab === "data-tiket" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400")}>{totalTicketsCount}</span>
              {activeTab === "data-tiket" && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
            </TabsTrigger>
            
            <TabsTrigger value="import-data" className="relative px-6 py-4 text-sm font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Import Data
              {activeTab === "import-data" && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
            </TabsTrigger>
            
            <TabsTrigger value="history" className="relative px-6 py-4 text-sm font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Review History
              {activeTab === "history" && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* TAB: DATA TIKET */}
        <TabsContent value="data-tiket" className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 shrink-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/40 dark:border-zinc-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <Input 
                placeholder="Search ticket ID or agent..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 rounded-xl focus-visible:ring-zinc-400" 
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 h-11 shadow-sm">
                <input 
                  type="date" 
                  value={syncStartDate}
                  onChange={(e) => setSyncStartDate(e.target.value)}
                  className="bg-transparent text-sm font-medium focus:outline-none dark:text-zinc-200"
                />
                <span className="text-zinc-400 text-sm font-medium">-</span>
                <input 
                  type="date" 
                  value={syncEndDate}
                  onChange={(e) => setSyncEndDate(e.target.value)}
                  className="bg-transparent text-sm font-medium focus:outline-none dark:text-zinc-200"
                />
                <Button 
                  onClick={handleSyncOca} 
                  disabled={syncOcaMutation.isPending}
                  size="sm" 
                  className="h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 shadow-none font-semibold transition-colors flex items-center"
                >
                  {syncOcaMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5 mr-1.5" />}
                  Sync Range
                </Button>
              </div>
              
              <Button 
                onClick={handleSyncToday} 
                disabled={syncOcaMutation.isPending}
                className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition-all flex items-center"
              >
                {syncOcaMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CloudUpload className="w-4 h-4 mr-2" />}
                Sync Today
              </Button>
              
              <Button onClick={handleExport} className="h-11 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold shadow-md transition-all">Export</Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-zinc-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
                    <TableHead className="w-[50px] font-semibold text-zinc-500">#</TableHead>
                    <TableHead className="font-semibold text-zinc-500">Created Date</TableHead>
                    <TableHead className="font-semibold text-zinc-500">
                      <div className="flex items-center">
                        Tapper
                        <ColumnFilterPopover columnKey="tapper" columnLabel="Tapper" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.tapper || []} />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-zinc-500">ID Tiket</TableHead>
                    <TableHead className="font-semibold text-zinc-500">
                      <div className="flex items-center">
                        Agent
                        <ColumnFilterPopover columnKey="agent" columnLabel="Agent" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.agent || []} />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-zinc-500">
                      <div className="flex items-center">
                        Channel
                        <ColumnFilterPopover columnKey="channel" columnLabel="Channel" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.channel || []} />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-zinc-500">
                      <div className="flex items-center">
                        Jenis Interaksi
                        <ColumnFilterPopover columnKey="jenisInteraksi" columnLabel="Jenis Interaksi" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.jenisInteraksi || []} />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-zinc-500">
                      <div className="flex items-center">
                        KIP Level 2
                        <ColumnFilterPopover columnKey="kipLevel2" columnLabel="KIP Level 2" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.kipLevel2 || []} />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-zinc-500">
                      <div className="flex items-center">
                        KIP Level 3
                        <ColumnFilterPopover columnKey="kipLevel3" columnLabel="KIP Level 3" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.kipLevel3 || []} />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-zinc-500">
                      <div className="flex items-center">
                        IN/OUT SLA
                        <ColumnFilterPopover columnKey="inOutSla" columnLabel="IN/OUT SLA" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.inOutSla || []} />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-zinc-500">AHT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={cn("transition-opacity duration-200", isFetchingTickets ? "opacity-50 pointer-events-none" : "opacity-100")}>
                  {tickets.length === 0 && !isFetchingTickets ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-[400px]">
                        <div className="flex flex-col items-center justify-center text-center h-full">
                          <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900/50 rounded-full flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                            <FolderOpen className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                          </div>
                          <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">No pending tickets available</h3>
                          <p className="text-sm text-zinc-500 max-w-[250px] mb-6">You're all caught up! Import a new batch of tickets to start your review session.</p>
                          <Button variant="outline" className="rounded-xl shadow-sm border-zinc-200 text-zinc-600 dark:text-zinc-300 font-semibold" onClick={() => setActiveTab('import-data')}>
                            Import Data Now <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((t, i) => (
                      <TableRow key={t.id} className="cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-50 dark:border-zinc-800/50" onClick={() => router.push(`/quality-assurance/form-tapping/${t.id}`)}>
                        <TableCell className="text-zinc-400 font-medium">{(ticketPage - 1) * ITEMS_PER_PAGE + i + 1}</TableCell>
                        <TableCell className="text-zinc-500">
                          {t.createdDate ? new Date(t.createdDate).toLocaleDateString() : t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-zinc-700 dark:text-zinc-300 font-medium">{t.tapper || '-'}</TableCell>
                        <TableCell className="font-bold text-zinc-900 dark:text-white">{t.idTiket || '-'}</TableCell>
                        <TableCell className="text-zinc-700 dark:text-zinc-300 font-medium">{t.agent || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="bg-zinc-100 dark:bg-zinc-800 w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold text-zinc-500">{t.channel ? t.channel.charAt(0) : '-'}</span>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{t.channel || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-700 dark:text-zinc-300 font-medium max-w-[200px] truncate" title={t.jenisInteraksi || '-'}>{t.jenisInteraksi || '-'}</TableCell>
                        <TableCell className="text-zinc-500">{t.kipLevel2 || '-'}</TableCell>
                        <TableCell className="text-zinc-500">{t.kipLevel3 || '-'}</TableCell>
                        <TableCell>
                          <span className={cn("px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase", t.inOutSla === "IN" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                            {t.inOutSla || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-zinc-500 font-medium">{t.handlingTime || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {totalTicketPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-zinc-100 dark:border-zinc-800/50">
                  <span className="text-sm text-zinc-500 font-medium">
                    Showing {(ticketPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(ticketPage * ITEMS_PER_PAGE, totalTicketsCount)} of {totalTicketsCount} tickets
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 rounded-lg border-zinc-200 text-zinc-600 shadow-sm" onClick={() => setTicketPage(p => Math.max(1, p - 1))} disabled={ticketPage === 1}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                    </Button>
                    <div className="flex items-center gap-1">
                      {getPaginationRange(ticketPage, totalTicketPages).map((pageNumber, idx) => (
                        <Button
                          key={idx}
                          variant={ticketPage === pageNumber ? "default" : "ghost"}
                          size="sm"
                          className={cn("w-9 h-9 rounded-lg", ticketPage === pageNumber ? "bg-zinc-900 text-white shadow-md" : "text-zinc-600", pageNumber === "..." ? "pointer-events-none" : "")}
                          onClick={() => typeof pageNumber === "number" && setTicketPage(pageNumber)}
                          disabled={pageNumber === "..."}
                        >
                          {pageNumber}
                        </Button>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="h-9 rounded-lg border-zinc-200 text-zinc-600 shadow-sm" onClick={() => setTicketPage(p => Math.min(totalTicketPages, p + 1))} disabled={ticketPage === totalTicketPages}>
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
          </div>
        </TabsContent>

        {/* TAB: IMPORT DATA */}
        <TabsContent value="import-data" className="flex-1">
          <div className="max-w-4xl mx-auto mt-12">
            <div className={cn("relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md transition-all shadow-sm", uploadMutation.isPending ? "opacity-70 pointer-events-none" : "hover:border-indigo-400 dark:hover:border-indigo-500 group")}>
              
              {uploadMutation.isPending && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm rounded-3xl">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Importing Data...</h3>
                  <p className="text-zinc-500 font-medium">Please wait while we process your tickets</p>
                </div>
              )}

              <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <UploadCloud className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Drag & drop your file here</h3>
              <p className="text-zinc-500 text-center mb-10 max-w-lg text-base">
                Upload a CSV file containing your latest tickets. Make sure the headers match our standard format. Maximum file size is 10MB.
              </p>
              
              <div className="flex flex-col items-center gap-6 w-full max-w-md relative">
                <Input 
                  type="file" 
                  accept=".csv" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)} 
                  disabled={uploadMutation.isPending}
                />
                
                <div className="flex items-center gap-4 w-full">
                  <div className="flex items-center justify-center flex-1 h-12 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 shadow-sm pointer-events-none group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-colors px-4">
                    <span className="text-zinc-500 font-medium truncate text-sm">{file ? file.name : "or click to browse from computer"}</span>
                  </div>
                  {file && (
                    <Button 
                      className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition-all z-20" 
                      onClick={handleUpload} 
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : "Import Tickets"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB: HISTORY */}
        <TabsContent value="history" className="flex-1 overflow-hidden flex flex-col min-h-0">
          {(() => {
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
            );
          })()}
          <div className="flex-1 overflow-auto bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-zinc-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
                  <TableHead className="w-[50px] font-semibold text-zinc-500">#</TableHead>
                  <TableHead className="font-semibold text-zinc-500">Submit Date</TableHead>
                  <TableHead className="font-semibold text-zinc-500">Created Date</TableHead>
                  <TableHead className="font-semibold text-zinc-500">Ticket ID</TableHead>
                  <TableHead className="font-semibold text-zinc-500">
                    <div className="flex items-center">
                      Agent
                      <ColumnFilterPopover columnKey="agent" columnLabel="Agent" columnFilters={historyColumnFilters} setColumnFilters={setHistoryColumnFilters} options={historyFilterOptions?.agent || []} />
                    </div>
                  </TableHead>
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
                  <TableHead className="font-semibold text-zinc-500">AHT</TableHead>
                  <TableHead className="font-semibold text-zinc-500">Score</TableHead>
                  <TableHead className="text-right font-semibold text-zinc-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={cn("transition-opacity duration-200", isFetchingHistory ? "opacity-50 pointer-events-none" : "opacity-100")}>
                {history.length === 0 && !isFetchingHistory ? (
                  <TableRow>
                    <TableCell colSpan={13} className="h-[300px]">
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
                        <TableCell className="text-zinc-400 font-medium">{(historyPage - 1) * ITEMS_PER_PAGE + i + 1}</TableCell>
                        <TableCell className="text-zinc-500">{new Date(h.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-zinc-500">
                          {h.createdDate ? new Date(h.createdDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="font-bold text-zinc-900 dark:text-white">{h.idTiket}</TableCell>
                        <TableCell className="text-zinc-700 dark:text-zinc-300 font-medium">{h.agent}</TableCell>
                        <TableCell className="text-zinc-500">{h.tapper}</TableCell>
                        <TableCell className="text-zinc-500">{h.channel || '-'}</TableCell>
                        <TableCell className="text-zinc-500">{h.jenisInteraksi || '-'}</TableCell>
                        <TableCell className="text-zinc-500">{h.kipLevel2 || '-'}</TableCell>
                        <TableCell className="text-zinc-500">{h.kipLevel3 || '-'}</TableCell>
                        <TableCell className="text-zinc-500">{h.handlingTime || '-'}</TableCell>
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
            
            {totalHistoryPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-zinc-100 dark:border-zinc-800/50">
                <span className="text-sm text-zinc-500 font-medium">
                  Showing {(historyPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(historyPage * ITEMS_PER_PAGE, totalHistoryCount)} of {totalHistoryCount} reviews
                </span>
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
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

