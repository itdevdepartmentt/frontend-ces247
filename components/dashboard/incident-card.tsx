"use client";

import { useState } from "react";
import {
  Plus,
  HardHat,
  AlertTriangle,
  Check,
  Archive,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { IncidentReport, useIncidents } from "@/hooks/use-incident";

// --- Types ---
interface IncidentProps {
  id: string;
  title: string;
  description: string;
  isActive: boolean; // Added status field
}

// --- 1. The Individual Incident Card ---
const IncidentCard = ({
  data,
  onResolve,
  isSolving,
}: {
  data: IncidentReport;
  onResolve: (id: number) => void;
  isSolving?: boolean;
}) => {
  const { user, isLoading } = useAuth(true);

  return (
    <div
      className={`min-w-[300px] max-w-[350px] flex-shrink-0 flex flex-col gap-2 border-r border-slate-300 dark:border-slate-700 last:border-r-0 px-4 first:pl-0 group relative ${!data.isActive ? "opacity-50 grayscale" : ""}`}
    >
      {/* Title & Action Row */}
      <div className="flex justify-between items-start mb-2">
        {/* Title "Pill" */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-md py-1 px-3 w-fit max-w-[80%] cursor-default">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                  {data.title}
                </h3>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm break-words">
              {data.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Resolve Button (Only show if active) */}
        {data.isActive && (user?.role === "ADMIN" || user?.role === "QC") && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full border-slate-300 hover:bg-green-50 hover:text-green-600 hover:border-green-400 transition-colors"
                  onClick={() => onResolve(data.id)}
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mark as Solved</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Description */}
      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans max-h-[120px] overflow-y-auto">
        {data.description}
      </div>

      {/* Solved Watermark */}
      {!data.isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-green-100/80 border-2 border-green-500 text-green-700 font-bold px-4 py-1 rounded rotate-[-15deg] shadow-lg">
            SOLVED
          </div>
        </div>
      )}
    </div>
  );
};

// --- 2. The Main Widget ---
export default function IncidentWidget() {
  const { user } = useAuth(true);

  const [showSolved, setShowSolved] = useState(false);
  //   const [incidents, setIncidents] = useState<IncidentProps[]>([
  //     {
  //       id: "1",
  //       title: "IoT CMP – APN Issue",
  //       isActive: true,
  //       description: `- APN: M2MUP2DBTN (Scada PLN Banten) degrade KPI
  // - Start Time: 24 Nov 2025 10:00 WIB
  // - Degradation KPI:
  //     - Subs: 750 out of 2.000 down
  //     - Event & session activations spike
  //     - Success Rate drop to 50%`,
  //     },
  //     {
  //       id: "2",
  //       title: "IAAS – Site Issue",
  //       isActive: true,
  //       description: `R01 B2B :
  // - Major / IAAS / IM-20251126-00004500
  //   117 hours 31 minutes
  //   PLN power outage at Aceh Area due to Banjir & Longsor (Force Majeure)`,
  //     },
  //   ]);

  const { incidents, isLoading, createIncident, solveIncident, isSolving } =
    useIncidents("active");

  const { incidents: historyIncidents, isLoading: isLoadingHistory } =
    useIncidents("inactive");

  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    if (!newTitle || !newDesc) return;
    e.preventDefault();
    await createIncident({ title: newTitle, description: newDesc });
    setNewTitle("");
    setNewDesc("");
    setIsOpen(false);
  };

  const handleResolve = (id: number) => {
    solveIncident(id);
  };

  // Filter Logic
  const visibleIncidents = incidents.filter((inc) =>
    showSolved ? true : inc.isActive,
  );

  const incidentToShow = showSolved
    ? [...visibleIncidents, ...historyIncidents]
    : visibleIncidents;
  const activeCount = incidents.filter((i) => i.isActive).length;

  return (
    <div className="w-full mx-auto space-y-4 font-sans mt-8">
      {/* --- Header Section --- */}
      <div className="relative -ml-2">
        {/* Icon */}
        <div className="absolute -top-2 left-2 z-10">
          <div className="bg-sky-400 p-1.5 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <HardHat className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Red Bar */}
        <div className="bg-[#cc0000] text-white py-2 pl-12 pr-4 ml-4 rounded-sm shadow-sm flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg tracking-tight">
              Incident Information
            </h2>
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
              {activeCount} Active
            </span>
          </div>

          {(user?.role === "ADMIN" || user?.role === "QC") && (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center">
                {/* Toggle Show Solved */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSolved(!showSolved)}
                  className="text-white/70 hover:text-white hover:bg-white/10 h-7 text-xs"
                >
                  {showSolved ? (
                    <EyeOff className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 mr-1" />
                  )}
                  {showSolved ? "Hide Solved" : "Show History"}
                </Button>

                <div className="h-4 w-px bg-white/30 mx-1" />
              </div>
              {/* Add Button */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 hover:text-white h-7 px-2 font-medium"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Incident
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Incident</DialogTitle>
                    <DialogDescription>
                      Formatting (spaces/tabs) in the description will be
                      preserved.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Issue Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g. SVC Issue - Error 407"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="desc">Description</Label>
                      <Textarea
                        id="desc"
                        placeholder="Type details here..."
                        className="font-mono text-sm min-h-[150px]"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleAdd}>
                      Save Incident
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      {/* --- Content Area --- */}
      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm p-4 relative ml-2 min-h-[200px]">
        {incidentToShow.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-500">
            {showSolved ? (
              <p className="text-sm">No incidents found in history.</p>
            ) : (
              <>
                <Check className="w-8 h-8 mb-2 text-green-500 opacity-50" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  All systems operational.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">No active incidents.</p>
              </>
            )}
          </div>
        ) : (
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex w-max space-x-4">
              {incidentToShow.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  data={incident}
                  onResolve={handleResolve}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
