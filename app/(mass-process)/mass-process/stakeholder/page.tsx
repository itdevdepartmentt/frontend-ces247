"use client";

import { Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

/**
 * Tampilan ringkas untuk pihak luar, menggantikan mode ?view=stakeholder pada
 * Apps Script.
 *
 * Sengaja tanpa tautan ke halaman detail, tanpa tombol unggah, dan tanpa nama
 * agent — yang ditampilkan hanya posisi pekerjaan secara keseluruhan.
 */
export default function StakeholderPage() {
  const dashboard = useMassDashboard();
  const tickets = useMassTickets({ limit: 100 });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-start gap-3">
        <Eye className="mt-1 size-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Mass Process — Ringkasan</h1>
          <p className="text-sm text-muted-foreground">
            Tampilan pantau. Tidak ada tombol ubah di halaman ini.
          </p>
        </div>
      </header>

      {dashboard.isLoading ? (
        <Skeleton className="h-28 w-full" />
      ) : (
        dashboard.data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Total tiket" value={dashboard.data.total} />
              <Stat
                label="Open"
                value={dashboard.data.lastStatusSummary.open}
                tone="text-amber-600"
              />
              <Stat
                label="Closed"
                value={dashboard.data.lastStatusSummary.closed}
                tone="text-emerald-600"
              />
              <Stat label="Selesai hari ini" value={dashboard.data.completedToday} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <BucketCard
                title="Status tiket (dari OCA)"
                items={dashboard.data.lastStatusSummary.statuses}
              />
              <BucketCard title="Umur tiket" items={dashboard.data.byAgeing} />
            </div>

            {dashboard.data.byBottleneck.length > 0 && (
              <BucketCard
                title="Bottleneck"
                items={dashboard.data.byBottleneck}
                tone="destructive"
              />
            )}
          </>
        )
      )}

      {tickets.isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiket</TableHead>
                <TableHead>Perusahaan</TableHead>
                <TableHead>Proses saat ini</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progres</TableHead>
                <TableHead>Umur</TableHead>
                <TableHead>Bottleneck</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.data?.data.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">
                    {ticket.ticketNumber}
                  </TableCell>
                  <TableCell className="text-sm">
                    {ticket.namaPerusahaan ?? "—"}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold tabular-nums ${tone ?? ""}`}>
          {value.toLocaleString("id-ID")}
        </p>
      </CardContent>
    </Card>
  );
}

function BucketCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: { label: string; count: number }[];
  tone?: "destructive";
}) {
  const total = items.reduce((sum, i) => sum + i.count, 0) || 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Tidak ada data.</p>
        )}
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {item.count}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${
                  tone === "destructive" ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${Math.round((item.count / total) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
