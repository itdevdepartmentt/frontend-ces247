"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldCard, type Draft } from "@/components/forms/field-card";
import {
  useCreateField,
  useDeleteField,
  useReorderFields,
  useUpdateField,
} from "@/hooks/use-forms";
import type { FormDefinition, FormField } from "@/types/forms";

interface Props {
  form: FormDefinition;
}

const LABEL_BARU = "Pertanyaan tanpa judul";

export function FieldEditor({ form }: Props) {
  const [aktif, setAktif] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const createField = useCreateField(form.key);
  const updateField = useUpdateField(form.key);
  const deleteField = useDeleteField(form.key);
  const reorder = useReorderFields(form.key);

  const fields = [...form.fields].sort((a, b) => a.order - b.order);
  const keyTerpakai = new Set(fields.map((f) => f.key));

  const bukaKartu = (field: FormField) => {
    setAktif(field.id);
    setDraft(draftDari(field));
  };

  const tutupKartu = () => {
    setAktif(null);
    setDraft(null);
  };

  const simpan = (field: FormField) => {
    if (!draft) return;

    if (!draft.label.trim()) {
      return toast.error("Nama pertanyaan belum diisi.");
    }

    updateField.mutate(
      {
        fieldId: field.id,
        label: draft.label.trim(),
        type: draft.type,
        helpText: draft.helpText.trim() || undefined,
        required: draft.required,
        sectionId: draft.sectionId ?? undefined,
        options:
          draft.type === "SELECT" || draft.type === "MULTISELECT"
            ? draft.options
                .filter((o) => o.value.trim())
                .map((o) => ({
                  value: o.value.trim(),
                  label: o.label.trim() || o.value.trim(),
                }))
            : undefined,
        columns:
          draft.type === "TABLE"
            ? draft.columns
                .filter((c) => c.key.trim())
                .map((c) => ({
                  key: c.key.trim(),
                  label: c.label.trim() || c.key.trim(),
                }))
            : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Tersimpan");
          tutupKartu();
        },
        onError: (e) => toast.error(jelaskan(e)),
      },
    );
  };

  /** Pertanyaan baru langsung dibuat lalu dibuka, seperti Google Form. */
  const tambah = () => {
    createField.mutate(
      {
        key: buatKey(LABEL_BARU, keyTerpakai),
        label: LABEL_BARU,
        type: "TEXT",
      },
      {
        onSuccess: (baru: FormField) => bukaKartu(baru),
        onError: (e) => toast.error(jelaskan(e)),
      },
    );
  };

  const gandakan = (field: FormField) => {
    createField.mutate(
      {
        key: buatKey(field.label, keyTerpakai),
        label: `${field.label} (salinan)`,
        type: field.type,
        helpText: field.helpText ?? undefined,
        required: field.required,
        sectionId: field.sectionId ?? undefined,
        options: field.options ?? undefined,
        columns: field.columns ?? undefined,
      },
      {
        onSuccess: (baru: FormField) => {
          toast.success("Field digandakan");
          bukaKartu(baru);
        },
        onError: (e) => toast.error(jelaskan(e)),
      },
    );
  };

  const hapus = (field: FormField) => {
    const ya = window.confirm(
      `Hapus "${field.label}"?\n\nField disembunyikan dari form, tapi data yang sudah tersimpan tidak ikut terhapus dan field ini bisa ditampilkan lagi kapan saja.`,
    );
    if (!ya) return;

    deleteField.mutate(
      { fieldId: field.id },
      {
        onSuccess: () => {
          toast.success("Field disembunyikan");
          tutupKartu();
        },
        onError: (e) => toast.error(jelaskan(e)),
      },
    );
  };

  const toggleAktif = (field: FormField) =>
    updateField.mutate(
      { fieldId: field.id, isActive: !field.isActive },
      { onError: (e) => toast.error(jelaskan(e)) },
    );

  const pindah = (index: number, arah: -1 | 1) => {
    const tujuan = index + arah;
    if (tujuan < 0 || tujuan >= fields.length) return;

    const urut = [...fields];
    [urut[index], urut[tujuan]] = [urut[tujuan], urut[index]];

    reorder.mutate(
      urut.map((f, i) => ({ id: f.id, order: i })),
      { onError: (e) => toast.error(jelaskan(e)) },
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {fields.filter((f) => f.isActive).length} pertanyaan aktif dari{" "}
          {fields.length}. Klik kartu untuk menyuntingnya.
        </p>
        <Button onClick={tambah} disabled={createField.isPending}>
          <Plus className="mr-2 size-4" />
          Tambah pertanyaan
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Belum ada pertanyaan. Mulai dengan menambahkan satu.
        </p>
      )}

      {fields.map((field, index) => (
        <FieldCard
          key={field.id}
          field={field}
          draft={aktif === field.id && draft ? draft : draftDari(field)}
          aktif={aktif === field.id}
          menyimpan={updateField.isPending}
          sections={form.sections}
          bisaNaik={index > 0}
          bisaTurun={index < fields.length - 1}
          onAktifkan={() => bukaKartu(field)}
          onUbah={(patch) => setDraft((d) => (d ? { ...d, ...patch } : d))}
          onSimpan={() => simpan(field)}
          onBatal={tutupKartu}
          onGandakan={() => gandakan(field)}
          onHapus={() => hapus(field)}
          onToggleAktif={() => toggleAktif(field)}
          onPindah={(arah) => pindah(index, arah)}
        />
      ))}

      {fields.length > 0 && (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={tambah}
          disabled={createField.isPending}
        >
          <Plus className="mr-2 size-4" />
          Tambah pertanyaan
        </Button>
      )}
    </div>
  );
}

function draftDari(field: FormField): Draft {
  return {
    label: field.label,
    type: field.type,
    helpText: field.helpText ?? "",
    required: field.required,
    sectionId: field.sectionId,
    options: field.options ?? [],
    columns: field.columns ?? [],
  };
}

/**
 * Key dibuat otomatis dari label supaya penyunting tidak perlu memikirkannya —
 * itu bagian paling tidak mirip Google Form kalau diminta mengisi sendiri.
 * Key tetap ditampilkan kecil di kartu, karena ia penanda data yang tersimpan.
 */
function buatKey(label: string, dipakai: Set<string>): string {
  const dasar =
    label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((kata, i) => (i === 0 ? kata : kata[0].toUpperCase() + kata.slice(1)))
      .join("")
      .replace(/^[0-9]+/, "") || "field";

  let kandidat = dasar;
  let n = 2;
  while (dipakai.has(kandidat)) kandidat = `${dasar}${n++}`;
  return kandidat;
}

function jelaskan(error: unknown): string {
  const pesan = (error as { response?: { data?: { message?: unknown } } })?.response
    ?.data?.message;
  if (Array.isArray(pesan)) return pesan.join(" ");
  if (typeof pesan === "string") return pesan;
  return "Terjadi kesalahan. Coba lagi.";
}
