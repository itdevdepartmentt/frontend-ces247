"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AgeingBadge,
  BottleneckBadge,
  ProgressBar,
  StatusBadge,
} from "@/components/mass-process/ticket-badges";
import { WorkflowEditor } from "@/components/mass-process/workflow-editor";
import { useMassTicket, useUpdateAgent } from "@/hooks/use-mass-process";
import type { MassTicketDetail } from "@/types/mass-process";

export default function MassTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketNumber: string }>;
}) {
  const { ticketNumber } = use(params);
  const decoded = decodeURIComponent(ticketNumber);
  const { data: ticket, isLoading } = useMassTicket(decoded);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Tiket tidak ditemukan.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/mass-process">
            <ArrowLeft className="mr-2 size-4" />
            Semua tiket
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{ticket.ticketNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {ticket.ticketSubject ?? "Tanpa judul"}
              {ticket.namaPerusahaan && ` · ${ticket.namaPerusahaan}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={ticket.overallStatus} />
            <AgeingBadge bucket={ticket.ageingBucket} />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Proses saat ini" value={ticket.currentProcess ?? "—"} />
          <div>
            <p className="text-xs text-muted-foreground">Progres</p>
            <div className="mt-1">
              <ProgressBar value={ticket.processProgress} />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Bottleneck</p>
            <div className="mt-1">
              <BottleneckBadge value={ticket.bottleneck} />
            </div>
          </div>
          <Fact
            label="Umur"
            value={`${ticket.daysOpen} hari`}
            hint={ticket.lastStatus ? `Status tiket: ${ticket.lastStatus}` : undefined}
          />
          <Fact label="Project ID" value={ticket.projectId ?? "—"} />
          <Fact
            label="Jumlah MSISDN"
            value={ticket.jumlahMsisdn?.toLocaleString("id-ID") ?? "—"}
          />
          <Fact label="Kategori" value={ticket.detailCategory ?? ticket.category ?? "—"} />
          <Fact
            label="Terakhir diperbarui"
            value={new Date(ticket.updatedAt).toLocaleString("id-ID")}
          />
        </CardContent>
      </Card>

      <AgentCard ticket={ticket} />

      <Tabs defaultValue="workflow">
        <TabsList>
          <TabsTrigger value="workflow">Alur Kerja</TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="mt-4">
          {/* Remount saat tiket berubah supaya draft tidak membawa nilai lama. */}
          <WorkflowEditor key={ticket.updatedAt} ticket={ticket} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryPanel ticket={ticket} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Fact({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AgentCard({ ticket }: { ticket: MassTicketDetail }) {
  const [agent, setAgent] = useState("");
  const [teamLeader, setTeamLeader] = useState(ticket.teamLeader ?? "");
  const [reason, setReason] = useState("");
  const update = useUpdateAgent(ticket.ticketNumber);

  const handleAssign = () => {
    const trimmed = agent.trim();
    if (!trimmed) return toast.error("Nama agent belum diisi.");

    update.mutate(
      { newAgent: trimmed, newTeamLeader: teamLeader.trim() || undefined, reason: reason.trim() || undefined },
      {
        onSuccess: (updated) => {
          toast.success(`Tiket ditugaskan ke ${updated.agent}`);
          setAgent("");
          setReason("");
        },
        onError: () => toast.error("Gagal mengubah penugasan."),
      },
    );
  };

  const current = ticket.agent?.trim();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCog className="size-4" />
          Penugasan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">
          {current ? (
            <>
              Saat ini: <strong>{current}</strong>
              {ticket.teamLeader?.trim() && ` · TL ${ticket.teamLeader}`}
              {ticket.agentChangeCount > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {ticket.agentChangeCount}× berganti
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">Belum ada agent.</span>
          )}
        </p>

        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="agent-new">Agent baru</Label>
            <Input
              id="agent-new"
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agent-tl">Team Leader</Label>
            <Input
              id="agent-tl"
              value={teamLeader}
              onChange={(e) => setTeamLeader(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agent-reason">Alasan</Label>
            <Input
              id="agent-reason"
              placeholder="Opsional"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button onClick={handleAssign} disabled={update.isPending}>
            {current ? "Pindahkan" : "Tugaskan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryPanel({ ticket }: { ticket: MassTicketDetail }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Perubahan Status</CardTitle>
        </CardHeader>
        <CardContent>
          {ticket.histories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada perubahan.</p>
          ) : (
            <ul className="space-y-2">
              {ticket.histories.map((h) => (
                <li key={h.id} className="border-l-2 border-muted pl-3 text-sm">
                  <p>
                    <strong>{h.process}</strong>:{" "}
                    <span className="text-muted-foreground">
                      {h.previousStatus || "(kosong)"}
                    </span>{" "}
                    → {h.newStatus || "(kosong)"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.createdAt).toLocaleString("id-ID")}
                    {h.actionBy && ` · ${h.actionBy}`}
                  </p>
                  {h.notes && <p className="text-xs italic">{h.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Perpindahan Agent</CardTitle>
        </CardHeader>
        <CardContent>
          {ticket.assignmentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada perpindahan.</p>
          ) : (
            <ul className="space-y-2">
              {ticket.assignmentLogs.map((a) => (
                <li key={a.id} className="border-l-2 border-muted pl-3 text-sm">
                  <p>
                    {a.previousAgent?.trim() || "(belum ada)"} → {a.newAgent}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString("id-ID")}
                    {a.changedBy && ` · oleh ${a.changedBy}`}
                    {a.reason && ` · ${a.reason}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
