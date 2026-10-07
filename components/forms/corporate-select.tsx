"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCorporateHistory } from "@/hooks/use-forms";
import type { FormField, FormRecordDetail, FormValues } from "@/types/forms";

/** Form pendaftaran awal; dari sinilah daftar korporat berasal. */
export const SUMBER_KORPORAT = "ebo-psb";

interface Props {
  field: FormField;
  value: unknown;
  disabled?: boolean;
  error?: string;
  /** Field-field pada form yang sedang diisi; penentu apa yang bisa disalin. */
  targetFields: FormField[];
  /** Pesan saat tidak ada korporat yang cocok; beda antara PSB dan Aktivasi. */
  pesanKosong: string;
  onChange: (next: unknown) => void;
  onPatch: (patch: FormValues) => void;
}

/**
 * Pemilih korporat yang sumbernya pengajuan PSB.
 *
 * Nama perusahaan tidak diketik bebas di form Aktivasi: korporat didaftarkan
 * lewat PSB, jadi di sini tinggal dipilih. Memilih salah satu juga menyalin
 * data yang sama-sama ada di kedua form, supaya tidak diketik ulang.
 */
export function CorporateSelect({
  field,
  value,
  disabled,
  error,
  targetFields,
  pesanKosong,
  onChange,
  onPatch,
}: Props) {
  const [keyword, setKeyword] = useState(typeof value === "string" ? value : "");
  const [terbuka, setTerbuka] = useState(false);
  const [memuat, setMemuat] = useState<string | null>(null);
  const [terpilih, setTerpilih] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useCorporateHistory(
    SUMBER_KORPORAT,
    keyword,
    SUMBER_KORPORAT,
  );

  // Daftar menutup saat klik di luar; tanpa ini ia menggantung menutupi field
  // berikutnya.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setTerbuka(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const pilih = async (recordId: string, nama: string) => {
    setMemuat(recordId);
    try {
      const { data: record } = await api.get<FormRecordDetail>(
        `/form-records/${recordId}`,
      );

      const sumber = (record.values ?? {}) as FormValues;
      const patch: FormValues = {};

      // Semua field yang ada di kedua form disalin, lampiran termasuk. Tabel
      // dilewati karena barisnya khas tiap pengajuan — daftar MSISDN aktivasi
      // tidak ada padanannya di PSB.
      for (const target of targetFields) {
        if (target.type === "TABLE") continue;
        const nilai = sumber[target.key];
        if (nilai === undefined || nilai === null || nilai === "") continue;
        patch[target.key] = nilai;
      }

      patch[field.key] = nama;
      onPatch(patch);

      setKeyword(nama);
      setTerpilih(recordId);
      setTerbuka(false);

      const jumlah = Object.keys(patch).length - 1;
      toast.success(
        jumlah > 0
          ? `${jumlah} field terisi dari ${record.refNumber ?? "pengajuan PSB"}`
          : `Korporat dipilih: ${nama}`,
      );
    } catch {
      toast.error("Gagal mengambil data PSB perusahaan ini.");
    } finally {
      setMemuat(null);
    }
  };

  const cukup = keyword.trim().length >= 3;

  return (
    <div className="space-y-1.5" ref={wrapRef}>
      <Label htmlFor={`field-${field.key}`} className="flex items-start gap-1">
        <span>{field.label}</span>
        {field.required && (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>

      <div className="relative">
        <Input
          id={`field-${field.key}`}
          autoComplete="off"
          disabled={disabled}
          placeholder="Ketik minimal 3 huruf untuk mencari korporat…"
          className={cn("pr-8", error && "border-destructive")}
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setTerpilih(null);
            setTerbuka(true);
            // Nilai tetap ikut diperbarui supaya validasi wajib-isi tidak
            // menahan pengguna yang mengetik nama persis.
            onChange(e.target.value);
          }}
          onFocus={() => setTerbuka(true)}
        />
        <ChevronsUpDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        {terbuka && cukup && (
          <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
            {isFetching && (
              <p className="flex items-center gap-1.5 px-2 py-2 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Mencari…
              </p>
            )}

            {!isFetching && data?.length === 0 && (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                {pesanKosong}
              </p>
            )}

            {!isFetching &&
              data?.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={Boolean(memuat)}
                  onClick={() => void pilih(m.id, m.corporateName ?? "")}
                  className="flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <span>
                    <span className="font-medium">{m.corporateName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {m.refNumber ?? "tanpa nomor"}
                      {m.projectId && ` · ${m.projectId}`} ·{" "}
                      {new Date(m.createdAt).toLocaleDateString("id-ID")}
                    </span>
                  </span>
                  {memuat === m.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin" />
                  ) : terpilih === m.id ? (
                    <Check className="size-4 shrink-0 text-primary" />
                  ) : null}
                </button>
              ))}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Pilih dari pengajuan PSB untuk mengisi otomatis field yang sama.
        </p>
      )}
    </div>
  );
}
