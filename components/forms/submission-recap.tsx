"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadRecordXlsx, useSubmissionList } from "@/hooks/use-forms";
import { RekapTransfer } from "@/components/forms/rekap-transfer";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function SubmissionRecap({ formKey }: { formKey?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const records = useSubmissionList({
    formKey,
    search: keyword || undefined,
    page,
    limit: 20,
  });

  const download = async (id: string, ticketId: string | null) => {
    setDownloading(id);
    try {
      await downloadRecordXlsx(id, ticketId ?? "form");
      await records.refetch();
    } catch {
      toast.error("Gagal mengunduh file. Coba lagi.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <section className="operations-table" aria-label="Rekap Submission">
      <div className="operations-toolbar">
        <h2>Rekap Submission</h2>
        <Input
          type="search"
          aria-label="Cari tiket, perusahaan, atau project"
          placeholder="Search ticket / corporate / project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm"
        />
      </div>
      {formKey && (
        <div className="border-b px-4 pb-4">
          <RekapTransfer formKey={formKey} />
        </div>
      )}
      {records.isLoading ? (
        <Skeleton className="m-4 h-64" />
      ) : records.isError ? (
        <div role="alert" className="operations-empty">
          <strong>Rekap gagal dimuat</strong>
          <Button variant="outline" onClick={() => void records.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Form</TableHead>
                <TableHead>ID Ticket</TableHead>
                <TableHead>Corporate Name</TableHead>
                <TableHead>Project ID</TableHead>
                <TableHead>Quantity / MSISDN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>File</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.data?.data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {keyword
                      ? "Tidak ada submission yang cocok."
                      : "Belum ada submission."}
                  </TableCell>
                </TableRow>
              )}
              {records.data?.data.map((record) => {
                const timestamp = new Date(record.createdAt);
                const formType =
                  record.formKey === "ebo-psb"
                    ? "PSB"
                    : record.formKey === "ebo-aktivasi"
                      ? "Aktivasi PSB"
                      : record.formName;
                return (
                  <TableRow
                    key={record.id}
                    className="cursor-pointer"
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest("a, button"))
                        return;
                      router.push(
                        `/forms/records/${record.id}?source=${formKey ?? "all"}`,
                      );
                    }}
                  >
                    <TableCell className="tabular-nums">
                      <time dateTime={record.createdAt}>
                        {dateFormat.format(timestamp)}
                        <br />
                        {timeFormat.format(timestamp)}
                      </time>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          record.formKey === "ebo-psb"
                            ? "submission-form-type submission-form-psb"
                            : "submission-form-type"
                        }
                      >
                        {formType}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        className="underline-offset-4 hover:underline focus-visible:underline"
                        href={`/forms/records/${record.id}?source=${formKey ?? "all"}`}
                        aria-label={`Detail ${record.ticketId ?? formType}`}
                      >
                        {record.ticketId ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="operations-company min-w-48">
                      {record.corporateName ?? "—"}
                    </TableCell>
                    <TableCell>{record.projectId ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">
                      {record.quantity ?? "—"}
                    </TableCell>
                    <TableCell>
                      {record.status === "submitted"
                        ? "Submitted"
                        : record.status === "generated"
                          ? "Generated"
                          : record.status}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="submission-download"
                        disabled={downloading !== null}
                        onClick={() =>
                          void download(record.id, record.ticketId)
                        }
                        aria-label={`Download ${record.ticketId ?? formType}`}
                      >
                        {downloading === record.id ? "Menyiapkan…" : "Download"}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {records.data && (
            <div className="operations-pagination">
              <span>
                Halaman {records.data.meta.page} dari{" "}
                {records.data.meta.lastPage} · {records.data.meta.total}{" "}
                submission
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= records.data.meta.lastPage}
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
  );
}
