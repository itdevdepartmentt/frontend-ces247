"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, StopCircle, Clock, ListChecks, ArrowLeft, Loader2, Minus, Plus, User, Headset, Pencil, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Ticket {
  id: string;
  perusahaan?: string;
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
  customerRequests: string;
  agentResponse: string;
  handlingTime?: string;
  msisdn?: string;
  createdTicket?: string;
}

export default function EvaluateTicketPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const ticketId = params.id as string;

  // Fetch Ticket Data
  const { data: currentTicket, isLoading, isError } = useQuery<Ticket>({
    queryKey: ["qa-ticket", ticketId],
    queryFn: async () => {
      const res = await api.get(`/qa/form-tapping/tickets/${ticketId}`);
      return res.data;
    },
    enabled: !!ticketId,
  });

  // Review States
  const [formData, setFormData] = useState<Partial<Ticket>>({});

  useEffect(() => {
    if (currentTicket) {
      setFormData(currentTicket);
      
      // Prioritize the actual interaction date (createdTicket), then createdDate/createdAt, fallback to today
      const dateString = currentTicket.createdTicket || currentTicket.createdDate || currentTicket.createdAt;
      const date = dateString ? new Date(dateString) : new Date();
      
      const day = date.getDate();
      if (day >= 1 && day <= 10) setPeak(1);
      else if (day >= 11 && day <= 20) setPeak(2);
      else setPeak(3);
    }
  }, [currentTicket]);

  const handleInputChange = (field: keyof Ticket, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [isEditingForm, setIsEditingForm] = useState(false);

  const [isTapping, setIsTapping] = useState(false);
  const [tappingSeconds, setTappingSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Pause reason states
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [pauseReasonInput, setPauseReasonInput] = useState("");
  const [pauseReasons, setPauseReasons] = useState<{ reason: string; pausedAt: string }[]>([]);

  const handleStartTapping = () => {
    if (!startTime) setStartTime(new Date());
    setIsTapping(true);
  };

  const handlePauseTapping = () => {
    setIsTapping(false);
    setPauseDialogOpen(true);
    setPauseReasonInput("");
  };

  const handleConfirmPause = () => {
    if (pauseReasonInput.trim()) {
      setPauseReasons(prev => [...prev, {
        reason: pauseReasonInput.trim(),
        pausedAt: new Date().toISOString(),
      }]);
    }
    setPauseDialogOpen(false);
  };

  const handleSkipPauseReason = () => {
    setPauseDialogOpen(false);
  };
  
  const [scoreValiditas, setScoreValiditas] = useState(30);
  const [scoreServiceLevel, setScoreServiceLevel] = useState(30);
  const [scoreKalimat, setScoreKalimat] = useState(10);
  const [scoreResponTime, setScoreResponTime] = useState(15);
  const [scoreDokumentasi, setScoreDokumentasi] = useState(15);
  const [status, setStatus] = useState("Sample");
  const [solusi, setSolusi] = useState<string[]>([]);
  const [tagging, setTagging] = useState("");
  const [taggingCustom, setTaggingCustom] = useState("");
  const [notes, setNotes] = useState("");
  const [subParameterPenilaian, setSubParameterPenilaian] = useState<string[]>([]);
  const [parameterPenilaian, setParameterPenilaian] = useState<string[]>([]);
  
  // Auto-calculate default peak based on today's date
  const [peak, setPeak] = useState<number>(() => {
    const date = new Date().getDate();
    if (date <= 10) return 1;
    if (date <= 20) return 2;
    return 3;
  });

  // Auto-Save: Load draft on mount
  useEffect(() => {
    if (!ticketId) return;
    const savedDraft = localStorage.getItem(`draft_${ticketId}`);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.scoreValiditas !== undefined) setScoreValiditas(parsed.scoreValiditas);
        if (parsed.scoreServiceLevel !== undefined) setScoreServiceLevel(parsed.scoreServiceLevel);
        if (parsed.scoreKalimat !== undefined) setScoreKalimat(parsed.scoreKalimat);
        if (parsed.scoreResponTime !== undefined) setScoreResponTime(parsed.scoreResponTime);
        if (parsed.scoreDokumentasi !== undefined) setScoreDokumentasi(parsed.scoreDokumentasi);
        if (parsed.status) setStatus(parsed.status);
        if (parsed.solusi) setSolusi(parsed.solusi);
        if (parsed.tagging) setTagging(parsed.tagging);
        if (parsed.taggingCustom) setTaggingCustom(parsed.taggingCustom);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.subParameterPenilaian) setSubParameterPenilaian(parsed.subParameterPenilaian);
        if (parsed.parameterPenilaian) setParameterPenilaian(parsed.parameterPenilaian);
        if (parsed.tappingSeconds) setTappingSeconds(parsed.tappingSeconds);
        if (parsed.isTapping) setIsTapping(parsed.isTapping);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, [ticketId]);

  // Auto-Save: Save draft on change
  useEffect(() => {
    if (!ticketId) return;
    const draft = {
      scoreValiditas, scoreServiceLevel, scoreKalimat, scoreResponTime, scoreDokumentasi,
      status, solusi, tagging, taggingCustom, notes, subParameterPenilaian, parameterPenilaian,
      tappingSeconds, isTapping
    };
    localStorage.setItem(`draft_${ticketId}`, JSON.stringify(draft));
  }, [
    scoreValiditas, scoreServiceLevel, scoreKalimat, scoreResponTime, scoreDokumentasi,
    status, solusi, tagging, taggingCustom, notes, subParameterPenilaian, parameterPenilaian,
    tappingSeconds, isTapping, ticketId
  ]);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTapping) {
      interval = setInterval(() => {
        setTappingSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTapping]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const totalScore = scoreValiditas + scoreServiceLevel + scoreKalimat + scoreResponTime + scoreDokumentasi;

  const submitMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      return await api.post("/qa/form-tapping", reviewData);
    },
    onSuccess: () => {
      localStorage.removeItem(`draft_${ticketId}`);
      toast.success("Review submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["qa-form-tapping"] });
      queryClient.invalidateQueries({ queryKey: ["qa-tickets"] });
      router.push("/quality-assurance/form-tapping");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to submit review");
    }
  });

  const handleSubmitReview = () => {
    if (!currentTicket) return;
    
    // Validasi field yang wajib diisi (*)
    if (subParameterPenilaian.length === 0) {
      toast.error("Sub Parameter Penilaian wajib diisi (minimal pilih satu)");
      return;
    }
    
    if (parameterPenilaian.length === 0) {
      toast.error("Parameter Penilaian wajib diisi (minimal pilih satu)");
      return;
    }
    
    if (!status) {
      toast.error("Final Status wajib dipilih");
      return;
    }
    
    if (solusi.length === 0) {
      toast.error("Solusi wajib dipilih (minimal pilih satu)");
      return;
    }
    
    if (peak === null || peak === undefined) {
      toast.error("Peak wajib diisi");
      return;
    }

    if (tagging === "lainnya" && (!taggingCustom || taggingCustom.trim() === "")) {
      toast.error("Tagging Custom wajib diisi jika memilih Lainnya");
      return;
    } else if (!tagging || tagging.trim() === "") {
      toast.error("Tagging wajib diisi");
      return;
    }
    
    const reviewData = {
      tapper: user?.name || formData.tapper || "",
      idTiket: formData.idTiket,
      agent: formData.agent,
      teamLeader: formData.teamLeader || "",
      channel: formData.channel,
      jenisInteraksi: formData.jenisInteraksi,
      kipLevel2: formData.kipLevel2,
      kipLevel3: formData.kipLevel3,
      inOutSla: formData.inOutSla,
      projectId: formData.projectId,
      perusahaan: formData.perusahaan,
      customerRequests: formData.customerRequests,
      agentResponse: formData.agentResponse,
      handlingTime: formData.handlingTime,
      msisdn: formData.msisdn || null,
      createdTicket: formData.createdTicket ? new Date(formData.createdTicket).toISOString() : null,
      scoreValiditas,
      scoreServiceLevel,
      scoreKalimat,
      scoreResponTime,
      scoreDokumentasi,
      status,
      solusi: solusi.join(" | "),
      tagging: tagging === "lainnya" ? taggingCustom : tagging,
      notes,
      subParameterPenilaian: subParameterPenilaian.join(" | "),
      parameterPenilaian: parameterPenilaian.join(" | "),
      peak,
      tappingDuration: tappingSeconds,
      qaTicketId: currentTicket.id,
      pauseReasons,
      startTime: startTime?.toISOString() || null,
      submitTime: new Date().toISOString(),
    };
    
    submitMutation.mutate(reviewData);
  };

  // Hotkey Effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmitReview();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmitReview]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 min-h-[500px]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (isError || !currentTicket) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 min-h-[500px]">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Ticket not found</h2>
        <Button onClick={() => router.push("/quality-assurance/form-tapping")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pending Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-slate-950 flex flex-col overflow-hidden relative">
      <div className="w-full flex flex-col h-full overflow-hidden relative z-10">
        <div className="px-6 py-5 sm:px-8 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-transparent shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/quality-assurance/form-tapping")} className="rounded-full w-10 h-10 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              Evaluate Ticket
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-semibold tracking-wider font-mono border border-slate-200 dark:border-slate-700">{currentTicket.idTiket}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-5 self-end sm:self-auto">
            {/* Score next to timer - no card */}
            <div className="flex items-baseline gap-1">
              <span className={cn("text-3xl font-black leading-none", totalScore >= 80 ? "text-emerald-500" : totalScore >= 50 ? "text-amber-500" : "text-rose-500")}>{totalScore}</span>
              <span className="text-sm font-bold text-slate-400">/100</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm font-mono text-sm">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-700 dark:text-slate-300">{formatTime(tappingSeconds)}</span>
            </div>
            {!isTapping ? (
              <Button onClick={handleStartTapping} className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md transition-all">
                <Play className="w-4 h-4 mr-2" /> Start Review
              </Button>
            ) : (
              <Button onClick={handlePauseTapping} variant="destructive" className="h-10 px-6 rounded-xl font-semibold shadow-md transition-all">
                <StopCircle className="w-4 h-4 mr-2" /> Pause
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row bg-transparent relative">
          {/* Overlay when not tapping - covers ENTIRE content area */}
          {!isTapping && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md z-20 flex flex-col items-center justify-center transition-all p-4">
              <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgb(0,0,0,0.3)] rounded-3xl p-8 sm:p-10 max-w-sm text-center backdrop-blur-xl">
                <div className="w-16 h-16 bg-slate-900 dark:bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Play className="w-8 h-8 text-white dark:text-slate-900 ml-1" />
                </div>
                <h4 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white tracking-tight">Ready to evaluate?</h4>
                <p className="text-slate-500 mb-8 font-medium leading-relaxed">Start the timer to unlock the scoring sheet. This duration will be meticulously recorded.</p>
                  <Button onClick={handleStartTapping} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-xl shadow-slate-900/10 transition-all hover:-translate-y-0.5">Start Review Timer</Button>
              </div>
            </div>
          )}

          {/* Left Column: Information (Read Only) */}
          <div className="w-full sm:w-1/2 flex flex-col overflow-y-auto border-r border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="p-6 sm:p-8 space-y-10">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ticket Metadata</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingForm(!isEditingForm)} className={cn("h-8 px-3 rounded-lg font-bold text-xs shadow-sm transition-all border", isEditingForm ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}>
                    {isEditingForm ? <><Check className="w-3.5 h-3.5 mr-1.5" /> Done Editing</> : <><Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit Form</>}
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  <div className="flex flex-col gap-2.5">
                    <Label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Tapper</Label>
                    {isEditingForm ? (
                      <Input value={formData.tapper || ""} onChange={(e) => handleInputChange("tapper", e.target.value)} className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200" />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formData.tapper || "-"}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <Label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Agent</Label>
                    {isEditingForm ? (
                      <Input value={formData.agent || ""} onChange={(e) => handleInputChange("agent", e.target.value)} className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200" />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formData.agent || "-"}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <Label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Channel</Label>
                    {isEditingForm ? (
                      <Input value={formData.channel || ""} onChange={(e) => handleInputChange("channel", e.target.value)} className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200" />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                        {formData.channel || "-"}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <Label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">KIP Level 2</Label>
                    {isEditingForm ? (
                      <Input value={formData.kipLevel2 || ""} onChange={(e) => handleInputChange("kipLevel2", e.target.value)} className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200" />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formData.kipLevel2 || "-"}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <Label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">KIP Level 3</Label>
                    {isEditingForm ? (
                      <Input value={formData.kipLevel3 || ""} onChange={(e) => handleInputChange("kipLevel3", e.target.value)} className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200" />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formData.kipLevel3 || "-"}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <Label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">In/Out SLA</Label>
                    {isEditingForm ? (
                      <Input value={formData.inOutSla || ""} onChange={(e) => handleInputChange("inOutSla", e.target.value)} className={cn("h-11 font-bold tracking-widest", formData.inOutSla === "IN" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100")} />
                    ) : (
                      <div>
                        <span className={cn("px-3 py-1 rounded-full text-xs font-bold tracking-wider", formData.inOutSla === "IN" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                          {formData.inOutSla || "-"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <Label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">AHT</Label>
                    {isEditingForm ? (
                      <Input value={formData.handlingTime || ""} onChange={(e) => handleInputChange("handlingTime", e.target.value)} className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200" />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formData.handlingTime || "-"}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <Label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                      MSISDN <span className="text-rose-500">*</span>
                    </Label>
                    {isEditingForm ? (
                      <Input
                        value={formData.msisdn || ""}
                        onChange={(e) => handleInputChange("msisdn", e.target.value)}
                        placeholder="Nomor MSISDN pelanggan"
                        required
                        className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formData.msisdn || <span className="italic text-slate-400">-</span>}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <Label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Tgl. Tiket Dibuat</Label>
                    {isEditingForm ? (
                      <Input
                        type="datetime-local"
                        value={formData.createdTicket ? formData.createdTicket.slice(0, 16) : ""}
                        onChange={(e) => handleInputChange("createdTicket", e.target.value)}
                        className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {formData.createdTicket ? new Date(formData.createdTicket).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : <span className="italic text-slate-400">-</span>}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2"><User className="w-4 h-4" /> Customer Request</h3>
                  <div className="relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-2xl z-10 pointer-events-none"></div>
                    {isEditingForm ? (
                      <Textarea value={formData.customerRequests || ""} onChange={(e) => handleInputChange("customerRequests", e.target.value)} className="pl-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl min-h-[140px] shadow-sm resize-y text-sm font-medium leading-relaxed p-5" placeholder="Customer request details..." />
                    ) : (
                      <div className="pl-6 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 text-sm text-slate-800 dark:text-slate-200 leading-relaxed min-h-[140px] shadow-sm overflow-hidden whitespace-pre-wrap">
                        {formData.customerRequests || <span className="italic text-slate-400">No customer request provided</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2"><Headset className="w-4 h-4" /> Agent Response</h3>
                  <div className="relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-2xl z-10 pointer-events-none"></div>
                    {isEditingForm ? (
                      <Textarea value={formData.agentResponse || ""} onChange={(e) => handleInputChange("agentResponse", e.target.value)} className="pl-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl min-h-[140px] shadow-sm resize-y text-sm font-medium leading-relaxed p-5" placeholder="Agent response details..." />
                    ) : (
                      <div className="pl-6 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 text-sm text-slate-800 dark:text-slate-200 leading-relaxed min-h-[140px] shadow-sm overflow-hidden whitespace-pre-wrap">
                        {formData.agentResponse || <span className="italic text-slate-400">No agent response provided</span>}
                      </div>
                    )}
                  </div>
                </div>

              </section>
            </div>
          </div>

          {/* Right Column: Scoring */}
          <div className="w-full sm:w-1/2 flex flex-col overflow-y-auto relative bg-transparent">
            
            {/* Floating Glassmorphism Score Card */}
            <div className="sticky top-4 z-40 mx-6 sm:mx-8 mb-6 mt-4 p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-between transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)]">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Score</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white leading-none">{totalScore}</h2>
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-black tracking-widest uppercase shadow-sm",
                  totalScore < 100 ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                )}>
                  {totalScore < 100 ? "NON-COMPLIANT" : "COMPLIANT"}
                </div>
                {totalScore < 100 && (
                  <p className="text-[10px] font-bold text-rose-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Agent will be notified
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 sm:px-8 pb-8 space-y-10">
              <section>
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Evaluation Criteria</h3>
                <div className="space-y-6">
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Validitas Closing Case</Label>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Max 30 pts</span>
                    </div>
                    <div className="flex gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                      <button onClick={() => setScoreValiditas(30)} className={cn("flex-1 h-12 rounded-lg text-sm font-bold transition-all duration-300 active:scale-95", scoreValiditas === 30 ? "bg-emerald-500 shadow-md shadow-emerald-500/20 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50")}>Pass (30)</button>
                      <button onClick={() => setScoreValiditas(0)} className={cn("flex-1 h-12 rounded-lg text-sm font-bold transition-all duration-300 active:scale-95", scoreValiditas === 0 ? "bg-rose-500 shadow-md shadow-rose-500/20 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50")}>Fail (0)</button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Service Level Closing</Label>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Max 30 pts</span>
                    </div>
                    <div className="flex gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                      <button onClick={() => setScoreServiceLevel(30)} className={cn("flex-1 h-12 rounded-lg text-sm font-bold transition-all duration-300 active:scale-95", scoreServiceLevel === 30 ? "bg-emerald-500 shadow-md shadow-emerald-500/20 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50")}>Pass (30)</button>
                      <button onClick={() => setScoreServiceLevel(0)} className={cn("flex-1 h-12 rounded-lg text-sm font-bold transition-all duration-300 active:scale-95", scoreServiceLevel === 0 ? "bg-rose-500 shadow-md shadow-rose-500/20 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50")}>Fail (0)</button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Penyampaian Kalimat</Label>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Max 10 pts</span>
                    </div>
                    <div className="flex gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                      <button onClick={() => setScoreKalimat(10)} className={cn("flex-1 h-12 rounded-lg text-sm font-bold transition-all duration-300 active:scale-95", scoreKalimat === 10 ? "bg-emerald-500 shadow-md shadow-emerald-500/20 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50")}>Pass (10)</button>
                      <button onClick={() => setScoreKalimat(0)} className={cn("flex-1 h-12 rounded-lg text-sm font-bold transition-all duration-300 active:scale-95", scoreKalimat === 0 ? "bg-rose-500 shadow-md shadow-rose-500/20 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50")}>Fail (0)</button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Respon Time</Label>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Max 15 pts</span>
                    </div>
                    <div className="flex gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                      <button onClick={() => setScoreResponTime(15)} className={cn("flex-1 h-12 rounded-lg text-sm font-bold transition-all duration-300 active:scale-95", scoreResponTime === 15 ? "bg-emerald-500 shadow-md shadow-emerald-500/20 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50")}>Pass (15)</button>
                      <button onClick={() => setScoreResponTime(0)} className={cn("flex-1 h-12 rounded-lg text-sm font-bold transition-all duration-300 active:scale-95", scoreResponTime === 0 ? "bg-rose-500 shadow-md shadow-rose-500/20 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50")}>Fail (0)</button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Dokumentasi</Label>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Max 15 pts</span>
                    </div>
                    <div className="flex gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                      <button onClick={() => setScoreDokumentasi(15)} className={cn("flex-1 h-12 rounded-lg text-sm font-bold transition-all duration-300 active:scale-95", scoreDokumentasi === 15 ? "bg-emerald-500 shadow-md shadow-emerald-500/20 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50")}>Pass (15)</button>
                      <button onClick={() => setScoreDokumentasi(0)} className={cn("flex-1 h-12 rounded-lg text-sm font-bold transition-all duration-300 active:scale-95", scoreDokumentasi === 0 ? "bg-rose-500 shadow-md shadow-rose-500/20 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50")}>Fail (0)</button>
                    </div>
                  </div>

                </div>
              </section>

              <section className="pt-8 border-t border-slate-100 dark:border-slate-800/60 space-y-8">
                <div className="space-y-8">
                  <div className="flex flex-col gap-3">
                    <Label className="font-bold text-slate-700 dark:text-slate-300">Parameter Penilaian *</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {["OK", "Proses & Sikap", "Kualitas Solusi Layanan"].map((opt) => (
                        <div key={opt} 
                          className={cn("cursor-pointer px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 select-none flex items-center gap-2 active:scale-95", parameterPenilaian.includes(opt) ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:border-slate-700 shadow-sm hover:shadow-md")}
                          onClick={() => {
                            if (parameterPenilaian.includes(opt)) setParameterPenilaian(parameterPenilaian.filter(x => x !== opt));
                            else setParameterPenilaian([...parameterPenilaian, opt]);
                          }}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Label className="font-bold text-slate-700 dark:text-slate-300">Sub Parameter Penilaian *</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {["OK", "Validitas Closing Case", "Service Level Closing", "Penyampaian Kalimat", "Respon Time", "Dokumentasi"].map((opt) => (
                        <div key={opt} 
                          className={cn("cursor-pointer px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 select-none flex items-center gap-2 active:scale-95", subParameterPenilaian.includes(opt) ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:border-slate-700 shadow-sm hover:shadow-md")}
                          onClick={() => {
                            if (subParameterPenilaian.includes(opt)) setSubParameterPenilaian(subParameterPenilaian.filter(x => x !== opt));
                            else setSubParameterPenilaian([...subParameterPenilaian, opt]);
                          }}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Label className="font-bold text-slate-700 dark:text-slate-300">Solusi *</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "OK",
                        "Kesalahan Identifikasi",
                        "Missed Request",
                        "Kesalahan Solusi",
                        "Kesalahan Eskalasi & Routing",
                        "Kesalahan Penanganan Ticket",
                        "Kesalahan Lampiran",
                        "Kesalahan Validasi"
                      ].map((opt) => (
                        <div key={opt} 
                          className={cn(
                            "cursor-pointer px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 select-none flex items-center justify-center text-center active:scale-95", 
                            solusi.includes(opt) ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:border-slate-700 shadow-sm hover:shadow-md"
                          )}
                          onClick={() => {
                            if (solusi.includes(opt)) setSolusi(solusi.filter(x => x !== opt));
                            else setSolusi([...solusi, opt]);
                          }}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Final Status *</Label>
                      <div className="bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl flex gap-1 border border-slate-200/50 dark:border-slate-700/50 shadow-inner overflow-x-auto">
                        <button onClick={() => setStatus("Sample")} className={cn("flex-1 h-12 px-4 rounded-lg text-sm font-bold transition-all duration-300", status === "Sample" ? "bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-900")}>Sample</button>
                        <button onClick={() => setStatus("Cancel")} className={cn("flex-1 h-12 px-4 rounded-lg text-sm font-bold transition-all duration-300", status === "Cancel" ? "bg-white dark:bg-slate-700 shadow-md text-red-600" : "text-slate-500 hover:text-red-600")}>Cancel</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Peak *</Label>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setPeak(Math.max(1, peak - 1))} className="h-[56px] w-[56px] rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 shrink-0 hover:bg-slate-100 hover:scale-105 transition-transform duration-200 shadow-sm">
                          <Minus className="w-5 h-5" />
                        </Button>
                        <div className="h-[56px] flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center font-black text-2xl text-slate-800 dark:text-slate-200 shadow-inner">
                          {peak}
                        </div>
                        <Button variant="outline" size="icon" onClick={() => setPeak(Math.min(3, peak + 1))} className="h-[56px] w-[56px] rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 shrink-0 hover:bg-slate-100 hover:scale-105 transition-transform duration-200 shadow-sm">
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Tagging Lanjutan *</Label>
                      <div className="bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl flex gap-1 border border-slate-200/50 dark:border-slate-700/50 shadow-inner overflow-x-auto">
                        {["none", "fatal", "lainnya"].map(opt => (
                          <button key={opt} onClick={() => setTagging(opt)} className={cn("flex-1 h-12 px-3 rounded-lg text-sm font-bold transition-all duration-300 uppercase", tagging === opt ? "bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-900")}>{opt}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {tagging === "lainnya" && (
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Detail Tagging Custom *</Label>
                      <Input value={taggingCustom} onChange={(e) => setTaggingCustom(e.target.value)} placeholder="Tuliskan tagging spesifik..." className="h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-sm" />
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-2">
                    <Label className="font-bold text-slate-700 dark:text-slate-300">Notes QC</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Provide additional feedback for the agent..." className="min-h-[120px] rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 resize-none focus-visible:ring-slate-400 p-4 leading-relaxed" />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 sm:px-8 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.05)] z-30 relative">
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 shadow-inner">
                <User className="w-6 h-6" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Reviewer</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200 leading-none">{user?.name || "QC Staff"}</span>
              </div>
            </div>
            <div className="hidden sm:block h-12 w-px bg-slate-200/60 dark:bg-slate-800/60"></div>
            <span className="text-xs font-semibold text-slate-500 hidden sm:flex items-center gap-2 max-w-[200px] leading-relaxed"><ListChecks className="w-4 h-4 shrink-0 text-indigo-500" /> Pastikan semua nilai sudah benar sebelum submit.</span>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none h-14 px-8 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm" onClick={() => router.push("/quality-assurance/form-tapping")}>
              Batal
            </Button>
            <Button className="flex-1 sm:flex-none h-14 px-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2" onClick={handleSubmitReview} disabled={submitMutation.isPending || !isTapping}>
              {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {submitMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </div>

      {/* Pause Reason Dialog */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <StopCircle className="w-5 h-5 text-amber-500" />
              Alasan Pause
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-slate-500">Tuliskan alasan Anda melakukan pause sesi tapping (opsional):</p>
            <Textarea
              value={pauseReasonInput}
              onChange={(e) => setPauseReasonInput(e.target.value)}
              placeholder="Contoh: Ada keperluan mendadak, keluar makan siang, dll..."
              className="min-h-[100px] resize-none rounded-xl border-slate-200 dark:border-slate-800"
              autoFocus
            />
            {pauseReasons.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pause sebelumnya:</p>
                {pauseReasons.map((pr, i) => (
                  <div key={i} className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-500">{i + 1}.</span> {pr.reason}
                    <span className="ml-2 text-slate-400">{new Date(pr.pausedAt).toLocaleTimeString("id-ID")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleSkipPauseReason} className="rounded-xl flex-1">
              Lewati
            </Button>
            <Button onClick={handleConfirmPause} className="rounded-xl flex-1 bg-slate-900 hover:bg-slate-800 text-white">
              Simpan Alasan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
