"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AgeingBadge,
  BottleneckBadge,
  ProgressBar,
  StatusBadge,
} from "@/components/mass-process/ticket-badges";
import { useMassDashboard, useMassTickets } from "@/hooks/use-mass-process";

const ALL = "__all";

export default function MassProcessPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [ageing, setAgeing] = useState(ALL);
  const [page, setPage] = useState(1);

  const dashboard = useMassDashboard();
  const tickets = useMassTickets({
    search: search.trim() || undefined,
    overallStatus: status === ALL ? undefined : status,
    ageingBucket: ageing === ALL ? undefined : ageing,
    page,
    limit: 25,
  });

  const resetTo = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Mass Process</h1>
        <p className="text-sm text-muted-foreground">
          Pelacakan tiket massal: validasi, profiling, dan langkah proses.
        </p>
      </header>

      {dashboard.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        dashboard.data && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total tiket"
              value={dashboard.data.total}
              icon={<Layers className="size-4" />}
            />
            <StatCard
              label="Sedang berjalan"
              value={dashboard.data.inProgress}
              icon={<Clock className="size-4" />}
            />
            <StatCard
              label="Selesai"
              value={dashboard.data.completed}
              icon={<CheckCircle2 className="size-4" />}
            />
            <StatCard
              label="Selesai hari ini"
              value={dashboard.data.completedToday}
              icon={<CheckCircle2 className="size-4" />}
            />
          </div>
        )
      )}

      {dashboard.data && dashboard.data.byBottleneck.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-destructive" />
              Bottleneck
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {dashboard.data.byBottleneck.map((b) => (
              <span
                key={b.label}
                className="rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive"
              >
                {b.label} · {b.count}
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Cari nomor tiket, perusahaan, atau project ID…"
          className="max-w-xs"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select value={status} onValueChange={resetTo(setStatus)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua status</SelectItem>
            <SelectItem value="Not Started">Not Started</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ageing} onValueChange={resetTo(setAgeing)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua umur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua umur</SelectItem>
            <SelectItem value="0-1 Day">0-1 Day</SelectItem>
            <SelectItem value="2-3 Days">2-3 Days</SelectItem>
            <SelectItem value="4-7 Days">4-7 Days</SelectItem>
            <SelectItem value="8-14 Days">8-14 Days</SelectItem>
            <SelectItem value=">14 Days">&gt;14 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tickets.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-32">Tiket</TableHead>
                  <TableHead className="min-w-40">Perusahaan</TableHead>
                  <TableHead className="min-w-36">Proses saat ini</TableHead>
                  <TableHead className="min-w-28">Status</TableHead>
                  <TableHead className="min-w-32">Progres</TableHead>
                  <TableHead className="min-w-24">Umur</TableHead>
                  <TableHead className="min-w-32">Bottleneck</TableHead>
                  <TableHead className="min-w-24">Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.data?.data.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Tidak ada tiket yang cocok.
                    </TableCell>
                  </TableRow>
                )}

                {tickets.data?.data.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Link
                        href={`/mass-process/${encodeURIComponent(ticket.ticketNumber)}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {ticket.ticketNumber}
                      </Link>
                      {ticket.jumlahMsisdn != null && (
                        <p className="text-xs text-muted-foreground">
                          {ticket.jumlahMsisdn.toLocaleString("id-ID")} MSISDN
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {ticket.namaPerusahaan ?? "—"}
                      {ticket.projectId && (
                        <p className="text-xs text-muted-foreground">
                          {ticket.projectId}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {ticket.currentProcess ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.overallStatus} />
                    </TableCell>
                    <TableCell>
                      <ProgressBar value={ticket.processProgress} />
                    </TableCell>
                    <TableCell>
                      <AgeingBadge bucket={ticket.ageingBucket} />
                    </TableCell>
                    <TableCell>
                      <BottleneckBadge value={ticket.bottleneck} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {ticket.agent?.trim() ? (
                        ticket.agent
                      ) : (
                        <span className="text-muted-foreground">belum ada</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {tickets.data && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Halaman {tickets.data.meta.page} dari {tickets.data.meta.lastPage} ·{" "}
                {tickets.data.meta.total} tiket
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= tickets.data.meta.lastPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-5">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tabular-nums">
            {value.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  );
}
