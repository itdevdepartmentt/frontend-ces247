"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUploadExcel, type ExcelUploadResult } from "@/hooks/use-mass-process";

export function UploadTicketsDialog() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ExcelUploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadExcel();

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setResult(null);

    upload.mutate(file, {
      onSuccess: (data) => {
        setResult(data);
        toast.success(
          `${data.created} tiket baru, ${data.updated} diperbarui.`,
        );
      },
      onError: (error) => toast.error(describeError(error)),
      onSettled: () => {
        if (inputRef.current) inputRef.current.value = "";
      },
    });
  };

  const close = () => {
    setOpen(false);
    setResult(null);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload className="mr-2 size-4" />
        Upload tiket
      </Button>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Tiket dari Excel</DialogTitle>
            <DialogDescription>
              Berkas .xlsx dengan kolom <strong>Ticket Number</strong> sebagai
              penanda. Tiket yang sudah ada akan diperbarui — penugasan agent dan
              progres pengerjaan tidak tersentuh.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            <Button
              variant="outline"
              className="w-full"
              disabled={upload.isPending}
              onClick={() => inputRef.current?.click()}
            >
              {upload.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memproses…
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Pilih berkas .xlsx
                </>
              )}
            </Button>

            {result && <UploadSummary result={result} />}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UploadSummary({ result }: { result: ExcelUploadResult }) {
  return (
    <div className="space-y-3 rounded-md border p-3 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <CheckCircle2 className="size-4 text-emerald-600" />
        {result.fileName}
      </p>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Baris terbaca" value={result.totalRows} />
        <Stat label="Tiket baru" value={result.created} />
        <Stat label="Diperbarui" value={result.updated} />
      </div>

      {result.unmappedColumns.length > 0 && (
        <Notice title="Kolom tidak dikenali — diabaikan">
          {result.unmappedColumns.join(", ")}
        </Notice>
      )}

      {result.skippedRows.length > 0 && (
        <Notice title={`${result.skippedRows.length} baris dilewati`}>
          <ul className="space-y-0.5">
            {result.skippedRows.slice(0, 5).map((s) => (
              <li key={s.row}>
                Baris {s.row}: {s.reason}
              </li>
            ))}
            {result.skippedRows.length > 5 && (
              <li>… dan {result.skippedRows.length - 5} lainnya</li>
            )}
          </ul>
        </Notice>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-muted/50 py-2">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Notice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs dark:border-amber-900 dark:bg-amber-950/40">
      <p className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
        <AlertTriangle className="size-3.5" />
        {title}
      </p>
      <div className="mt-1 text-amber-900 dark:text-amber-200">{children}</div>
    </div>
  );
}

function describeError(error: unknown): string {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response
    ?.data?.message;
  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string") return message;
  return "Gagal mengunggah berkas.";
}
