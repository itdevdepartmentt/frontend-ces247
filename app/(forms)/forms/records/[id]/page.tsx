"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DynamicForm } from "@/components/forms/dynamic-form";
import {
  downloadRecordXlsx,
  useRecord,
  useUpdateRecord,
} from "@/hooks/use-forms";
import { useAuth } from "@/hooks/use-auth";
import type { FormValues } from "@/types/forms";

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const { user } = useAuth(true);
  const record = useRecord(id);
  const update = useUpdateRecord(id);
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canEdit = Boolean(
    user && ["ADMIN", "QC", "TL_QC", "TL", "USER"].includes(user.role),
  );
  const source = searchParams.get("source");
  const savedValues = record.data?.values ?? {};
  const back =
    source && source !== "all" && source === record.data?.form.key
      ? `/forms/${encodeURIComponent(source)}?tab=rekap`
      : "/forms/rekap";

  const save = (values: FormValues) => {
    update.mutate(values, {
      onSuccess: () => {
        setEditing(false);
        toast.success("Perubahan tersimpan");
      },
      onError: (error) => {
        const message = (
          error as { response?: { data?: { message?: unknown } } }
        ).response?.data?.message;
        toast.error(
          Array.isArray(message)
            ? message.join(" ")
            : typeof message === "string"
              ? message
              : "Gagal menyimpan perubahan. Coba lagi.",
        );
      },
    });
  };

  const download = async () => {
    setDownloading(true);
    try {
      await downloadRecordXlsx(id, record.data?.refNumber ?? "form");
      await record.refetch();
    } catch {
      toast.error("Gagal mengunduh file. Coba lagi.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="operations-page operations-detail submission-detail">
      <Link
        href={back}
        className="inline-flex items-center gap-2 text-sm hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Kembali ke rekap
      </Link>
      {record.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : record.isError || !record.data ? (
        <div role="alert" className="space-y-3">
          <p>Detail submission gagal dimuat.</p>
          <Button variant="outline" onClick={() => void record.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <>
          <header className="operations-heading">
            <div>
              <h1>{record.data.refNumber ?? "Detail submission"}</h1>
              <p className="text-sm text-muted-foreground">
                {record.data.form.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(record.data.createdAt).toLocaleString("id-ID", {
                  timeZone: "Asia/Jakarta",
                })}{" "}
                ·{" "}
                {record.data.status === "generated"
                  ? "Generated"
                  : record.data.status === "submitted"
                    ? "Submitted"
                    : record.data.status}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {record.data.lastEditedAt ? (
                  <>
                    Terakhir diedit oleh{" "}
                    {record.data.lastEditedByName ||
                      record.data.lastEditedByEmail ||
                      "Pengguna"}
                    {record.data.lastEditedByName &&
                      record.data.lastEditedByEmail &&
                      ` (${record.data.lastEditedByEmail})`}
                    {" · "}
                    {new Date(record.data.lastEditedAt).toLocaleString(
                      "id-ID",
                      { timeZone: "Asia/Jakarta" },
                    )}{" "}
                    WIB
                  </>
                ) : (
                  "Informasi editor belum tercatat."
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {editing ? (
                <Button
                  variant="outline"
                  disabled={update.isPending}
                  onClick={() => setEditing(false)}
                >
                  Batal edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    disabled={downloading}
                    onClick={() => void download()}
                  >
                    {downloading ? "Menyiapkan…" : "Download Excel"}
                  </Button>
                  {canEdit && (
                    <Button onClick={() => setEditing(true)}>Edit isian</Button>
                  )}
                </>
              )}
            </div>
          </header>
          <DynamicForm
            key={`${id}-${record.data.updatedAt}-${editing}`}
            form={{
              ...record.data.form,
              fields: record.data.form.fields.filter(
                (field) =>
                  field.isActive || Object.hasOwn(savedValues, field.key),
              ),
            }}
            initialValues={record.data.values}
            disabled={!editing}
            hideSubmit={!editing}
            submitting={update.isPending}
            submitLabel="Simpan perubahan"
            onSubmit={save}
          />
        </>
      )}
    </div>
  );
}
