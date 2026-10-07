"use client";

import { History, Loader2 } from "lucide-react";
import { useCorporateHistory } from "@/hooks/use-forms";

/** Form pendaftaran awal; dari sinilah daftar korporat berasal. */
export const SUMBER_KORPORAT = "ebo-psb";

interface Props {
  /** Form yang sedang diisi — dipakai hanya untuk menentukan hak akses. */
  formKey: string;
  name: unknown;
}

/**
 * Riwayat pengajuan PSB untuk sebuah perusahaan, ditampilkan sambil mengetik
 * Corporate Name.
 *
 * Sumbernya selalu form PSB, bukan form yang sedang diisi — itu yang membuat
 * PSB dan Aktivasi terhubung: korporat didaftarkan lewat PSB, lalu riwayatnya
 * ikut terlihat saat mengajukan aktivasi.
 */
export function CorporateHistory({ formKey, name }: Props) {
  const keyword = typeof name === "string" ? name : "";
  const { data, isFetching } = useCorporateHistory(
    formKey,
    keyword,
    SUMBER_KORPORAT,
  );

  const cukup = keyword.trim().length >= 3;
  if (!cukup) return null;

  return (
    <div className="mt-2 rounded-md border bg-muted/30 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <History className="size-3.5" />
        Riwayat PSB perusahaan ini
      </p>

      {isFetching && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Mencari…
        </p>
      )}

      {!isFetching && data?.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Belum pernah mengajukan PSB dengan nama ini.
        </p>
      )}

      {!isFetching && data && data.length > 0 && (
        <ul className="mt-2 space-y-1">
          {data.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded bg-background px-2 py-1 text-xs"
            >
              <span className="font-medium">{m.corporateName}</span>
              <span className="text-muted-foreground">
                {m.refNumber ?? "tanpa nomor"}
                {m.projectId && ` · ${m.projectId}`} ·{" "}
                {new Date(m.createdAt).toLocaleDateString("id-ID")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
