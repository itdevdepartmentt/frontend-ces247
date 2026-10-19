"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Search, Inbox, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { UploadTicketsDialog } from "@/components/mass-process/upload-tickets-dialog";
import { useMassDashboard, useMassTickets } from "@/hooks/use-mass-process";
import { useAuth } from "@/hooks/use-auth";

const ALL = "__all";

export default function MassProcessPage() {
  const { user } = useAuth();
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
    <div className="operations-page">
      <header className="operations-heading">
        <div>
          <h1>Mass Process</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === "ADMIN" && (
            <Button asChild variant="outline">
              <Link href="/mass-process/settings">Pengaturan field</Link>
            </Button>
          )}
          <UploadTicketsDialog />
        </div>
      </header>

      {dashboard.isLoading ? (
        <div className="operations-stats">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        dashboard.data && (
          <div className="operations-stats">
            <StatCard label="Total tiket" value={dashboard.data.total} />
            <StatCard
              label="Sedang berjalan"
              value={dashboard.data.inProgress}
            />
            <StatCard label="Selesai" value={dashboard.data.completed} />
            <StatCard
              label="Selesai hari ini"
              value={dashboard.data.completedToday}
            />
          </div>
        )
      )}

      {dashboard.isError && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          Ringkasan tiket gagal dimuat. Coba muat ulang halaman.
        </p>
      )}

      {dashboard.data && dashboard.data.byBottleneck.length > 0 && (
        <section
          aria-label="Bottleneck tiket"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 border-l-2 border-amber-600 py-2 pl-3 text-sm"
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle
              className="size-4 text-amber-700 dark:text-amber-300"
              aria-hidden="true"
            />
            Perlu perhatian
          </h2>
          <div className="flex flex-wrap gap-2">
            {dashboard.data.byBottleneck.map((b) => (
              <span key={b.label} className="text-sm text-muted-foreground">
                {b.label} · {b.count}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="operations-table" aria-label="Daftar tiket">
        <div className="operations-toolbar">
          <h2>Tiket</h2>
          <span className="text-xs tabular-nums text-muted-foreground">
            {tickets.data?.meta.total.toLocaleString("id-ID") ?? "—"} hasil
          </span>
        </div>
        <div
          className="operations-filters"
          role="search"
          aria-label="Filter tiket"
        >
          <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="mass-search">Pencarian</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="mass-search"
                  placeholder="Nomor tiket, perusahaan, atau project ID"
                  className="pl-10"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mass-status">Status pengerjaan</Label>
              <Select value={status} onValueChange={resetTo(setStatus)}>
                <SelectTrigger id="mass-status" className="w-full">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Semua status</SelectItem>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mass-ageing">Umur tiket</Label>
              <Select value={ageing} onValueChange={resetTo(setAgeing)}>
                <SelectTrigger id="mass-ageing" className="w-full">
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
            <Button
              variant="outline"
              disabled={!search && status === ALL && ageing === ALL}
              onClick={() => {
                setSearch("");
                setStatus(ALL);
                setAgeing(ALL);
                setPage(1);
              }}
            >
              <RotateCcw className="size-4" aria-hidden="true" /> Reset
            </Button>
          </div>
        </div>

        {tickets.isLoading ? (
          <Skeleton className="m-4 h-80" />
        ) : tickets.isError ? (
          <div role="alert" className="operations-empty">
            <AlertTriangle aria-hidden="true" />
            <strong>Daftar tiket gagal dimuat</strong>
            <Button variant="outline" onClick={() => void tickets.refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : (
          <>
            <div className="min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-32">Tiket</TableHead>
                    <TableHead className="min-w-48">Perusahaan</TableHead>
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
                        className="text-center text-muted-foreground"
                      >
                        <div className="operations-empty">
                          <Inbox aria-hidden="true" />
                          <strong>Tidak ada tiket yang cocok</strong>
                          <span className="text-sm">
                            Coba ubah pencarian atau filter yang dipilih.
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {tickets.data?.data.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <Link
                          href={`/mass-process/${encodeURIComponent(ticket.ticketNumber)}`}
                          className="operations-ticket-link inline-flex min-h-8 items-center underline-offset-4 hover:underline"
                        >
                          {ticket.ticketNumber}
                        </Link>
                        {ticket.jumlahMsisdn != null && (
                          <p className="text-xs text-muted-foreground">
                            {ticket.jumlahMsisdn.toLocaleString("id-ID")} MSISDN
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="operations-company text-sm">
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
                          <span className="text-muted-foreground">
                            belum ada
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {tickets.data && (
              <div className="operations-pagination">
                <span>
                  Halaman {tickets.data.meta.page} dari{" "}
                  {Math.max(1, tickets.data.meta.lastPage)} ·{" "}
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
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="operations-stat">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {value.toLocaleString("id-ID")}
      </p>
    </div>
  );
}
