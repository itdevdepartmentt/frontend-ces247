"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useSurveyFields, useSubmitSurvey, useCheckSurveySubmission } from "@/hooks/use-survey";
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import api from "@/lib/api";


// Emoji map for rating
const RATING_EMOJIS = [
  { value: 1, emoji: "😡", label: "Very Dissatisfied" },
  { value: 2, emoji: "😟", label: "Dissatisfied" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "😊", label: "Satisfied" },
  { value: 5, emoji: "🤩", label: "Very Satisfied" },
];

export default function PublicSurveyPage() {
  const { data: fields, isLoading: fieldsLoading, error } = useSurveyFields();
  const submitMutation = useSubmitSurvey();
  

  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  
  // Form State
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const idParam = params.get("id");
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token));
          setTicketId(payload.t);
          setAgentName(payload.a);
          setGeneratedAt(payload.g);
          
          // Check 7-days expiration for old token format
          const generatedTime = new Date(payload.g).getTime();
          const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
          if (Date.now() - generatedTime > sevenDaysInMs) {
            setIsExpired(true);
          }
        } catch (e) {
          setIsInvalid(true);
        }
      } else if (idParam) {
        setTicketId(idParam);
        
        // Fetch agentName automatically using the same backend logic
        api.get(`/survey/check-agent/${idParam}`)
          .then(res => {
            if (res.data?.agentName) {
              setAgentName(res.data.agentName);
            }
            if (res.data?.generatedAt) {
              setGeneratedAt(res.data.generatedAt);
            }
          })
          .catch(err => {
            console.error("Agent not found for this ticket", err);
          });
      } else {
        // Fallback
        setTicketId(params.get("ticketId"));
        setAgentName(params.get("agentName"));
      }
    }
  }, []);

  const { data: checkData, isLoading: checkLoading } = useCheckSurveySubmission(ticketId);
  const alreadySubmitted = checkData?.hasSubmitted;
  
  useEffect(() => {
    if (checkData?.isExpired) {
      setIsExpired(true);
    }
  }, [checkData?.isExpired]);
  
  // Progress calculation
  const totalSteps = 2;
  const progress = isSubmitted ? 100 : ((step - 1) / totalSteps) * 100;

  if (fieldsLoading || checkLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 ">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
      </div>
    );
  }

  if (isInvalid || isExpired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50  p-4">
        <div className="w-full max-w-md bg-white/80  backdrop-blur-xl border border-white/40  shadow-2xl rounded-3xl p-10 text-center animate-in zoom-in duration-500">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100  rounded-full flex items-center justify-center shadow-lg ">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800  mb-2">Link Tidak Berlaku</h2>
          <p className="text-slate-500 ">
            {isExpired ? "Tautan survey ini sudah kedaluwarsa karena telah melewati batas waktu 1x24 jam." : "Tautan survey tidak valid atau rusak."}
          </p>
        </div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50  p-4">
        <div className="w-full max-w-md bg-white/80  backdrop-blur-xl border border-white/40  shadow-2xl rounded-3xl p-10 text-center animate-in zoom-in duration-500">
          <div className="w-20 h-20 mx-auto mb-6 bg-indigo-100  rounded-full flex items-center justify-center shadow-lg ">
            <CheckCircle2 className="w-10 h-10 text-indigo-600 " />
          </div>
          <h2 className="text-2xl font-bold text-slate-800  mb-2">Anda Sudah Submit</h2>
          <p className="text-slate-500 ">
            Survey untuk Ticket ID ini sudah pernah dikirimkan sebelumnya. Terima kasih atas partisipasi Anda!
          </p>
        </div>
      </div>
    );
  }

  if (error || !fields) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 ">
        <div className="text-center p-8 bg-white  rounded-2xl shadow-xl max-w-md w-full">
          <p className="text-red-500 font-medium mb-2">Oops! Something went wrong.</p>
          <p className="text-slate-500 text-sm">Failed to load survey questions.</p>
        </div>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50   ">
        <div className="text-center p-12 bg-white/60  backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl max-w-md w-full">
          <div className="w-20 h-20 bg-indigo-100  rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📝</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800  mb-2">Belum ada Survey</h2>
          <p className="text-slate-500 ">Tidak ada survey yang tersedia saat ini. Silakan kembali lagi nanti.</p>
        </div>
      </div>
    );
  }

  const isFieldVisible = (field: any): boolean => {
    if (!field.dependsOnFieldId) return true;

    // Check if the parent field is also visible
    const parentField = fields?.find(f => f.id === field.dependsOnFieldId);
    if (parentField && !isFieldVisible(parentField)) {
      return false;
    }

    const parentAnswer = answers[field.dependsOnFieldId];
    if (parentAnswer === undefined || parentAnswer === null) return false;

    if (!field.dependsOnValue) return true;

    const lowerParent = String(parentAnswer).trim().toLowerCase();
    const lowerDepends = String(field.dependsOnValue).trim().toLowerCase();

    if (lowerDepends === lowerParent) return true;

    const allowedValues = lowerDepends.split(',').map(s => s.trim());
    return allowedValues.includes(lowerParent);
  };

  const visibleFields = fields?.filter(isFieldVisible) || [];

  const validateStep1 = () => {
    for (const field of visibleFields) {
      if (field.isRequired && !answers[field.id]) {
        toast.error(`Pertanyaan "${field.label}" wajib diisi`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(s => Math.min(s + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep1()) return;
    try {
      await submitMutation.mutateAsync({
        ticketId: ticketId || undefined,
        agentName: agentName || undefined,
        generatedAt: generatedAt || undefined,
        answers
      });
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error("Gagal mengirim survey. Silakan coba lagi.");
    }
  };

  // ─── RENDERERS ───

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50  flex flex-col items-center justify-center py-12 px-4 sm:px-6">
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-500/20  blur-[120px] mix-blend-multiply  animate-blob" />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-500/20  blur-[120px] mix-blend-multiply  animate-blob animation-delay-2000" />
        <div className="absolute -bottom-[20%] left-[20%] w-[80%] h-[80%] rounded-full bg-pink-500/20  blur-[120px] mix-blend-multiply  animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-3xl relative z-10">
        
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <Image
              src="/telkomsel-enterprise.png"
              alt="Telkomsel Enterprise logo"
              width={300}
              height={80}
              className="h-12 w-auto object-contain transition-all"
              priority
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900  mb-4 tracking-tight">Survey Kepuasan</h1>
          <p className="text-slate-600  text-sm md:text-base max-w-2xl mx-auto">
            Telkomsel ingin mengetahui kepuasan Anda terhadap layanan kami, untuk menjaga pengalaman pelanggan dan meningkatkan kualitas layanan agar lebih optimal bagi Pelanggan Enterprise Telkomsel.
            <br/><br/>
            <span className="italic">Telkomsel wants to know your satisfaction with our service, to maintain customer experience and improve service quality to be more optimal for Telkomsel Enterprise Customers.</span>
          </p>
        </div>

        {/* Progress Bar */}
        {!isSubmitted && (
          <div className="mb-8 w-full max-w-md mx-auto">
            <div className="flex justify-between text-xs font-medium text-slate-500  mb-2 px-1">
              <span>Pertanyaan</span>
              <span>Selesai</span>
            </div>
            <div className="h-2 w-full bg-slate-200  rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className={cn(
          "bg-white/80  backdrop-blur-xl border border-white/40  shadow-2xl rounded-3xl overflow-hidden transition-all duration-500",
          isSubmitted ? "scale-100 opacity-100" : "scale-100 opacity-100"
        )}>
          
          {/* SUCCESS STATE */}
          {isSubmitted ? (
            <div className="p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent " />
              <div className="relative z-10">
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-500">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900  mb-4">Terima Kasih! 🎉</h2>
                <p className="text-lg text-slate-600  mb-8 max-w-md mx-auto leading-relaxed">
                  Survey Anda telah berhasil dikirim. Masukan Anda sangat berarti bagi kami untuk terus meningkatkan kualitas layanan.
                </p>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="rounded-full px-8 py-6 h-auto text-base font-medium border-slate-200 hover:bg-slate-50  "
                >
                  Kirim Survey Lain
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: QUESTIONS */}
              {step === 1 && (
                <div className="p-8 sm:p-10 animate-in fade-in slide-in-from-right-8 duration-500">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800  mb-2">Penilaian Layanan</h2>
                    <p className="text-slate-500 ">Silakan beri penilaian Anda dengan jujur.</p>
                  </div>
                  
                  <div className="space-y-10">
                    {visibleFields.map((field, idx) => (
                      <div key={field.id} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex gap-2">
                          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700   text-xs font-bold mt-0.5">{idx + 1}</span>
                          <label className="text-base sm:text-lg font-medium text-slate-800  flex flex-col w-full">
                            <span>
                              {field.label.split('\n')[0]}
                              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                            </span>
                            {field.label.split('\n').length > 1 && (
                              <span className="text-sm italic text-slate-500  mt-1 font-normal">
                                {field.label.split('\n').slice(1).join('\n')}
                              </span>
                            )}
                          </label>
                        </div>

                        {/* RATING (Emoji) */}
                        {field.type === "RATING" && (
                          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 pt-2">
                            {RATING_EMOJIS.map((r) => {
                              const isSelected = answers[field.id] === r.value;
                              return (
                                <button
                                  key={r.value}
                                  onClick={() => setAnswers({ ...answers, [field.id]: r.value })}
                                  className={cn(
                                    "flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl transition-all duration-200 border-2",
                                    isSelected 
                                      ? "border-indigo-500 bg-indigo-50  scale-110 shadow-lg " 
                                      : "border-transparent hover:bg-slate-100  hover:scale-105 opacity-70 hover:opacity-100"
                                  )}
                                >
                                  <span className="text-4xl sm:text-5xl drop-shadow-sm">{r.emoji}</span>
                                  <span className={cn(
                                    "text-xs sm:text-sm font-medium",
                                    isSelected ? "text-indigo-700 " : "text-slate-500"
                                  )}>{r.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* NPS (0-10) */}
                        {field.type === "NPS" && (
                          <div className="pt-2">
                            <div className="flex flex-wrap sm:flex-nowrap justify-between gap-1 sm:gap-2 mb-2 bg-slate-50  p-2 sm:p-3 rounded-2xl border border-slate-100 ">
                              {[0,1,2,3,4,5,6,7,8,9,10].map(score => {
                                const isSelected = answers[field.id] === score;
                                // Color logic: 0-6 Detractor (Red), 7-8 Passive (Yellow), 9-10 Promoter (Green)
                                const getColorClass = (s: number, selected: boolean) => {
                                  if (!selected) return "bg-white  border-slate-200  text-slate-600  hover:border-slate-400";
                                  if (s <= 6) return "bg-red-500 border-red-500 text-white shadow-lg scale-110 z-10";
                                  if (s <= 8) return "bg-amber-500 border-amber-500 text-white shadow-lg scale-110 z-10";
                                  return "bg-emerald-500 border-emerald-500 text-white shadow-lg scale-110 z-10";
                                };

                                return (
                                  <button
                                    key={score}
                                    onClick={() => setAnswers({ ...answers, [field.id]: score })}
                                    className={cn(
                                      "flex-1 min-w-[36px] aspect-square rounded-xl sm:rounded-lg border-2 flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-200",
                                      getColorClass(score, isSelected)
                                    )}
                                  >
                                    {score}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 px-2 font-medium">
                              <span>0 - Sangat Tidak Mungkin</span>
                              <span>10 - Sangat Mungkin</span>
                            </div>
                          </div>
                        )}

                        {/* TEXT */}
                        {field.type === "TEXT" && (
                          <div className="pl-8 pt-2">
                            <Textarea 
                              placeholder="Tuliskan masukan Anda di sini..."
                              value={answers[field.id] || ""}
                              onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                              maxLength={500}
                              className="min-h-[120px] bg-slate-50/50  rounded-xl resize-none focus-visible:ring-indigo-500 text-base break-words whitespace-pre-wrap"
                            />
                            <div className="text-xs text-right text-slate-400 mt-2">
                              {(answers[field.id] || "").length} / 500
                            </div>
                          </div>
                        )}

                        {/* SELECT */}
                        {field.type === "SELECT" && (
                          <div className="pl-8 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(field.options || []).map((opt: string) => {
                              const isSelected = answers[field.id] === opt;
                              
                              let primaryText = opt;
                              let secondaryText = "";
                              const match = opt.match(/^(.*?)\s*(\(.*?\))$/);
                              if (match) {
                                primaryText = match[1];
                                secondaryText = match[2];
                              }

                              return (
                                <button
                                  key={opt}
                                  onClick={() => setAnswers({ ...answers, [field.id]: opt })}
                                  className={cn(
                                    "text-left px-4 py-3 flex flex-col rounded-xl border-2 transition-all duration-200 font-medium",
                                    isSelected 
                                      ? "border-indigo-500 bg-indigo-50/50  text-indigo-700 "
                                      : "border-slate-200  hover:border-indigo-300 text-slate-700  bg-white "
                                  )}
                                >
                                  <span>{primaryText}</span>
                                  {secondaryText && (
                                    <span className="text-sm italic text-slate-500  font-normal mt-0.5">{secondaryText}</span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: REVIEW */}
              {step === 2 && (
                <div className="p-8 sm:p-10 animate-in fade-in slide-in-from-right-8 duration-500">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800  mb-2">Review & Kirim</h2>
                    <p className="text-slate-500 ">Pastikan jawaban Anda sudah sesuai sebelum dikirim.</p>
                  </div>
                  
                  <div className="space-y-6 bg-slate-50/50  p-6 rounded-2xl border border-slate-100 ">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-800  uppercase tracking-wider">Jawaban Anda</h3>
                      <div className="space-y-4">
                        {visibleFields.map(field => (
                          <div key={field.id} className="bg-white  p-4 rounded-xl shadow-sm border border-slate-100 ">
                            <div className="text-sm text-slate-500 mb-1">{field.label}</div>
                            <div className="font-medium text-slate-900 ">
                              {answers[field.id] !== undefined ? (
                                field.type === "RATING" ? (
                                  <span className="flex items-center gap-2">
                                    <span className="text-xl">{RATING_EMOJIS.find(r => r.value === answers[field.id])?.emoji}</span>
                                    <span>{RATING_EMOJIS.find(r => r.value === answers[field.id])?.label} ({answers[field.id]}/5)</span>
                                  </span>
                                ) : (
                                  String(answers[field.id])
                                )
                              ) : (
                                <span className="text-slate-400 italic">Tidak dijawab</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Footer */}
              <div className="p-6 sm:p-8 bg-slate-50/80  border-t border-slate-100  flex items-center justify-between rounded-b-3xl">
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className={cn("text-slate-500 hover:text-slate-800 ", step === 1 && "invisible")}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>
                
                {step < totalSteps ? (
                  <Button 
                    onClick={handleNext}
                    className="bg-slate-900 hover:bg-slate-800 text-white    rounded-full px-8 shadow-md"
                  >
                    Lanjut <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    className="bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white rounded-full px-8 shadow-lg border-0"
                  >
                    {submitMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Kirim Survey
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
