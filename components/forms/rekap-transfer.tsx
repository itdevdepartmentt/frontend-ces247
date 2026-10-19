"use client";

import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  downloadRekapXlsx,
  FORM_REKAP_EBO,
  useImportRekap,
  type HasilImporRekap,
} from "@/hooks/use-forms";

/** Jumlah catatan yang ditampilkan; sisanya diringkas agar panel tidak meledak. */
const BATAS_CATATAN = 8;

/**
 * Tukar rekap dengan berkas berformat sama seperti aplikasi lama
 * ("Rekap Submit Form EBO.xlsx"): satu sheet per form, satu baris per
 * submission.
 *
 * Hanya muncul untuk form yang memang punya padanan sheet di sana.
 */
export function RekapTransfer({ formKey }: { formKey: string }) {
  const { user } = useAuth();
  const sheet = FORM_REKAP_EBO[formKey];
  const pilihBerkas = useRef<HTMLInputElement>(null);
  const [mengunduh, setMengunduh] = useState(false);
  const [hasil, setHasil] = useState<HasilImporRekap | null>(null);
  const impor = useImportRekap(formKey);

  if (!sheet) return null;

  const unduh = async () => {
    setMengunduh(true);
    try {
      await downloadRekapXlsx(formKey);
    } catch {
      toast.error("Gagal mengunduh rekap. Coba lagi.");
    } finally {
      setMengunduh(false);
    }
  };

  const unggah = (file: File) => {
    // Satu berkas bisa menambah ratusan record dan tidak ada tombol batalnya.
    const lanjut = window.confirm(
      `Masukkan isi "${file.name}" ke sheet ${sheet}?\n\nBaris yang ID tiket dan timestamp-nya sudah ada akan dilewati, jadi berkas yang sama bisa diunggah ulang tanpa menggandakan data.`,
    );
    if (!lanjut) return;

    setHasil(null);
    impor.mutate(file, {
      onSuccess: (data) => {
        setHasil(data);
        toast.success(
          data.dibuat > 0
            ? `${data.dibuat} baris masuk ke ${data.sheet}.`
            : `Tidak ada baris baru; ${data.dilewati.length} sudah ada sebelumnya.`,
        );
      },
      onError: (error) => toast.error(jelaskan(error)),
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void unduh()}
          disabled={mengunduh}
        >
          {mengunduh ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="size-4" aria-hidden="true" />
          )}
          Unduh rekap
        </Button>

        {user?.role === "ADMIN" && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pilihBerkas.current?.click()}
              disabled={impor.isPending}
            >
              {impor.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="size-4" aria-hidden="true" />
              )}
              {impor.isPending ? "Memproses…" : "Unggah rekap"}
            </Button>
            <input
              ref={pilihBerkas}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                // Nilainya dikosongkan supaya berkas yang sama bisa dipilih
                // lagi setelah dibatalkan di dialog konfirmasi.
                e.target.value = "";
                if (file) unggah(file);
              }}
            />
          </>
        )}

        <span className="text-xs text-muted-foreground">
          Format sheet {sheet}, sama dengan rekap aplikasi lama.
        </span>
      </div>

      {hasil && <RingkasanImpor hasil={hasil} onTutup={() => setHasil(null)} />}
    </div>
  );
}

function RingkasanImpor({
  hasil,
  onTutup,
}: {
  hasil: HasilImporRekap;
  onTutup: () => void;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          Sheet <strong>{hasil.sheet}</strong>: {hasil.totalBaris} baris dibaca,{" "}
          <strong>{hasil.dibuat}</strong> masuk
          {hasil.dilewati.length > 0 && `, ${hasil.dilewati.length} dilewati`}
          {hasil.peringatan.length > 0 &&
            `, ${hasil.peringatan.length} dengan catatan`}
          .
        </p>
        <Button variant="ghost" size="sm" onClick={onTutup}>
          Tutup
        </Button>
      </div>

      {hasil.kolomTakDikenal.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Kolom yang tidak dikenali dan diabaikan:{" "}
          {hasil.kolomTakDikenal.join(", ")}.
        </p>
      )}

      <Catatan judul="Dilewati" daftar={hasil.dilewati} />
      <Catatan judul="Catatan" daftar={hasil.peringatan} />
    </div>
  );
}

function Catatan({
  judul,
  daftar,
}: {
  judul: string;
  daftar: { baris: number; pesan: string }[];
}) {
  if (daftar.length === 0) return null;

  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs text-muted-foreground">
        {judul} ({daftar.length})
      </summary>
      <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
        {daftar.slice(0, BATAS_CATATAN).map((c, i) => (
          <li key={i}>
            Baris {c.baris}: {c.pesan}
          </li>
        ))}
        {daftar.length > BATAS_CATATAN && (
          <li>… dan {daftar.length - BATAS_CATATAN} lainnya.</li>
        )}
      </ul>
    </details>
  );
}

function jelaskan(error: unknown): string {
  const pesan = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  if (Array.isArray(pesan)) return pesan.join(" ");
  if (typeof pesan === "string") return pesan;
  return "Gagal mengunggah rekap. Coba lagi.";
}
