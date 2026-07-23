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
import { SortableTableHead } from "@/components/ui/sortable-table-head";
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
import { CalendarDateRangePicker } from "@/components/dashboard/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
// Mock Data Interfaces
interface Ticket {
  id: string;
  createdDate?: string;
  createdAt?: string;
  tapper?: string;
  idTiket: string;
  agent: string;
  teamLeader?: string;
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [ticketColumnFilters, setTicketColumnFilters] = useState<Record<string, string[]>>({});
  const [debouncedTicketFilters, setDebouncedTicketFilters] = useState<Record<string, string[]>>({});

  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (key: string, order: "asc" | "desc") => {
    setSortBy(key);
    setSortOrder(order);
    setTicketPage(1);
  };

  // Sync OCA States
  const [syncDateRange, setSyncDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date()
  });


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setDebouncedTicketFilters(ticketColumnFilters);
      setTicketPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, ticketColumnFilters]);

  // Pagination States
  const [ticketPage, setTicketPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Data States
  const { data: ticketsResponse, isLoading: isLoadingTickets, isFetching: isFetchingTickets } = useQuery({
    queryKey: ["qa-tickets", ticketPage, itemsPerPage, debouncedSearch, debouncedTicketFilters, sortBy, sortOrder],
    queryFn: async () => {
      const filtersParam = Object.keys(debouncedTicketFilters).length > 0 ? `&filters=${encodeURIComponent(JSON.stringify(debouncedTicketFilters))}` : '';
      const sortParam = sortBy ? `&sortBy=${sortBy}&sortOrder=${sortOrder}` : '';
      const res = await api.get(`/qa/form-tapping/tickets?page=${ticketPage}&limit=${itemsPerPage}&search=${encodeURIComponent(debouncedSearch)}${filtersParam}${sortParam}`);
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

  const tickets: Ticket[] = ticketsResponse?.data || [];
  
  const totalTicketPages = ticketsResponse?.meta?.totalPages || ticketsResponse?.totalPages || 1;
  const totalTicketsCount = ticketsResponse?.meta?.total || ticketsResponse?.total || 0;
  
  // File State
  const [file, setFile] = useState<File | null>(null);


  
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
      setIsImportModalOpen(false);
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
    if (!syncDateRange?.from || !syncDateRange?.to) {
      toast.error("Please select both Start Date and End Date");
      return;
    }
    const startDate = format(syncDateRange.from, "yyyy-MM-dd");
    const endDate = format(syncDateRange.to, "yyyy-MM-dd");
    syncOcaMutation.mutate({ startDate, endDate });
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
    <div className="h-full bg-slate-50/50 dark:bg-slate-950 flex flex-col p-8 overflow-hidden relative">
      {/* Subtle background glows for elegance */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-indigo-400/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col gap-2 mb-8 shrink-0 relative z-10">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-slate-500 mb-2">
          <span>Quality Assurance</span>
          <span className="text-slate-300 mx-1">•</span>
          <span className="text-slate-800 dark:text-slate-200">Form Tapping</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">Form Tapping</h1>
            <p className="text-slate-500 mt-2 text-lg font-light">Kelola tiket QA pending, import data baru, dan evaluasi performa agent.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative z-10">
          <div className="flex items-center justify-between mb-4 shrink-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Search ticket ID or agent..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-11 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-slate-400" 
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarDateRangePicker date={syncDateRange} setDate={setSyncDateRange} />
                <Button 
                  onClick={handleSyncOca} 
                  disabled={syncOcaMutation.isPending}
                  className="h-11 px-4 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 shadow-sm font-semibold transition-colors flex items-center"
                >
                  {syncOcaMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CloudUpload className="w-4 h-4 mr-2" />}
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
              
              <Button onClick={() => setIsImportModalOpen(true)} className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition-all">Import Data</Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_4px_20px_rgb(0,0,0,0.03)] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-slate-200/50 dark:after:bg-slate-800/50">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="w-[50px] font-bold text-slate-500 uppercase tracking-wider text-xs">#</TableHead>
                    <SortableTableHead columnKey="createdAt" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-bold text-slate-500 uppercase tracking-wider text-xs">Created Date</SortableTableHead>
                    <SortableTableHead columnKey="tapper" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-bold text-slate-500 uppercase tracking-wider text-xs">
                      <div className="flex items-center">
                        Tapper
                        <ColumnFilterPopover columnKey="tapper" columnLabel="Tapper" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.tapper || []} />
                      </div>
                    </SortableTableHead>
                    <SortableTableHead columnKey="idTiket" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-bold text-slate-500 uppercase tracking-wider text-xs">ID Tiket</SortableTableHead>
                    <SortableTableHead columnKey="agent" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-bold text-slate-500 uppercase tracking-wider text-xs">
                      <div className="flex items-center">
                        Agent
                        <ColumnFilterPopover columnKey="agent" columnLabel="Agent" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.agent || []} />
                      </div>
                    </SortableTableHead>
                    <SortableTableHead columnKey="teamLeader" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-bold text-slate-500 uppercase tracking-wider text-xs">
                      <div className="flex items-center">
                        Nama TL
                        <ColumnFilterPopover columnKey="teamLeader" columnLabel="Team Leader" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.teamLeader || []} />
                      </div>
                    </SortableTableHead>
                    <SortableTableHead columnKey="channel" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-bold text-slate-500 uppercase tracking-wider text-xs">
                      <div className="flex items-center">
                        Channel
                        <ColumnFilterPopover columnKey="channel" columnLabel="Channel" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.channel || []} />
                      </div>
                    </SortableTableHead>
                    <SortableTableHead columnKey="jenisInteraksi" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-bold text-slate-500 uppercase tracking-wider text-xs">
                      <div className="flex items-center">
                        Jenis Interaksi
                        <ColumnFilterPopover columnKey="jenisInteraksi" columnLabel="Jenis Interaksi" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.jenisInteraksi || []} />
                      </div>
                    </SortableTableHead>
                    <SortableTableHead columnKey="kipLevel2" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-bold text-slate-500 uppercase tracking-wider text-xs">
                      <div className="flex items-center">
                        KIP Level 2
                        <ColumnFilterPopover columnKey="kipLevel2" columnLabel="KIP Level 2" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.kipLevel2 || []} />
                      </div>
                    </SortableTableHead>
                    <SortableTableHead columnKey="kipLevel3" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-bold text-slate-500 uppercase tracking-wider text-xs">
                      <div className="flex items-center">
                        KIP Level 3
                        <ColumnFilterPopover columnKey="kipLevel3" columnLabel="KIP Level 3" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.kipLevel3 || []} />
                      </div>
                    </SortableTableHead>
                    <SortableTableHead columnKey="inOutSla" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-bold text-slate-500 uppercase tracking-wider text-xs">
                      <div className="flex items-center">
                        IN/OUT SLA
                        <ColumnFilterPopover columnKey="inOutSla" columnLabel="IN/OUT SLA" columnFilters={ticketColumnFilters} setColumnFilters={setTicketColumnFilters} options={ticketFilterOptions?.inOutSla || []} />
                      </div>
                    </SortableTableHead>
                    <SortableTableHead columnKey="handlingTime" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="font-bold text-slate-500 uppercase tracking-wider text-xs">AHT</SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={cn("transition-opacity duration-200", isFetchingTickets ? "opacity-50 pointer-events-none" : "opacity-100")}>
                  {tickets.length === 0 && !isFetchingTickets ? (
                    <TableRow>
                      <TableCell colSpan={12} className="h-[400px]">
                        <div className="flex flex-col items-center justify-center text-center h-full">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <FolderOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No pending tickets available</h3>
                          <p className="text-sm text-slate-500 max-w-[250px] mb-6">You're all caught up! Import a new batch of tickets to start your review session.</p>
                          <Button variant="outline" className="rounded-xl shadow-sm border-slate-200 text-slate-600 dark:text-slate-300 font-semibold" onClick={() => setIsImportModalOpen(true)}>
                            Import Data Now <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((t, i) => (
                      <TableRow key={t.id} className="cursor-pointer group relative transition-all duration-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:z-10 hover:scale-[1.002] border-b border-slate-100 dark:border-slate-800/50" onClick={() => router.push(`/quality-assurance/form-tapping/${t.id}`)}>
                        <TableCell className="text-slate-400 font-medium group-hover:text-indigo-500 transition-colors">{(ticketPage - 1) * itemsPerPage + i + 1}</TableCell>
                        <TableCell className="text-slate-500 whitespace-nowrap group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                          {t.createdDate ? new Date(t.createdDate).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : t.createdAt ? new Date(t.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : '-'}
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 font-medium uppercase group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.tapper || '-'}</TableCell>
                        <TableCell className="font-black text-slate-900 dark:text-white uppercase group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors drop-shadow-sm">{t.idTiket || '-'}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 font-medium uppercase group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.agent || '-'}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 font-medium uppercase group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.teamLeader || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t.channel ? t.channel.charAt(0) : '-'}</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.channel || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 font-medium max-w-[200px] truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors" title={t.jenisInteraksi || '-'}>{t.jenisInteraksi || '-'}</TableCell>
                        <TableCell className="text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">{t.kipLevel2 || '-'}</TableCell>
                        <TableCell className="text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">{t.kipLevel3 || '-'}</TableCell>
                        <TableCell>
                          <span className={cn("px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all duration-300 border", t.inOutSla === "IN" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] group-hover:bg-rose-500/20 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]")}>
                            {t.inOutSla || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-500 font-bold group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">{t.handlingTime || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500 font-medium">
                    Showing {(ticketPage - 1) * itemsPerPage + 1} to {Math.min(ticketPage * itemsPerPage, totalTicketsCount)} of {totalTicketsCount} tickets
                  </span>
                  <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setTicketPage(1); }}>
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
                    <Button variant="outline" size="sm" className="h-9 rounded-lg border-slate-200 text-slate-600 shadow-sm" onClick={() => setTicketPage(p => Math.max(1, p - 1))} disabled={ticketPage === 1}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                    </Button>
                    <div className="flex items-center gap-1">
                      {getPaginationRange(ticketPage, totalTicketPages).map((pageNumber, idx) => (
                        <Button
                          key={idx}
                          variant={ticketPage === pageNumber ? "default" : "ghost"}
                          size="sm"
                          className={cn("w-9 h-9 rounded-lg", ticketPage === pageNumber ? "bg-slate-900 text-white shadow-md" : "text-slate-600", pageNumber === "..." ? "pointer-events-none" : "")}
                          onClick={() => typeof pageNumber === "number" && setTicketPage(pageNumber)}
                          disabled={pageNumber === "..."}
                        >
                          {pageNumber}
                        </Button>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="h-9 rounded-lg border-slate-200 text-slate-600 shadow-sm" onClick={() => setTicketPage(p => Math.min(totalTicketPages, p + 1))} disabled={ticketPage === totalTicketPages}>
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
          </div>
      </div>

      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-transparent border-0 shadow-none p-0">
          <div className="max-w-4xl mx-auto w-full">
            <div className={cn("relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-all shadow-xl", uploadMutation.isPending ? "opacity-70 pointer-events-none" : "hover:border-indigo-400 dark:hover:border-indigo-500 group")}>
              
              {uploadMutation.isPending && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm rounded-3xl">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Importing Data...</h3>
                  <p className="text-slate-500 font-medium">Please wait while we process your tickets</p>
                </div>
              )}

              <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <UploadCloud className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Drag & drop your file here</h3>
              <p className="text-slate-500 text-center mb-10 max-w-lg text-base">
                Upload a CSV or RAW DSC (.xlsx) file containing your latest tickets. Make sure the headers match our standard format. Maximum file size is 10MB.
              </p>
              
              <div className="flex flex-col items-center gap-6 w-full max-w-md relative">
                <Input 
                  type="file" 
                  accept=".csv, .xlsx" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)} 
                  disabled={uploadMutation.isPending}
                />
                
                <div className="flex items-center gap-4 w-full">
                  <div className="flex items-center justify-center flex-1 h-12 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm pointer-events-none group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-colors px-4">
                    <span className="text-slate-500 font-medium truncate text-sm">{file ? file.name : "or click to browse from computer"}</span>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}

