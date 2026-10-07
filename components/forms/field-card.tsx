"use client";

import { Copy, Eye, EyeOff, GripVertical, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DynamicField } from "@/components/forms/dynamic-field";
import { cn } from "@/lib/utils";
import {
  FIELD_TYPES,
  FIELD_TYPE_LABEL,
  type FieldOption,
  type FormField,
  type FormFieldType,
  type FormSection,
  type TableColumn,
} from "@/types/forms";

/** Perubahan yang belum disimpan, dipegang induknya agar bisa dibatalkan. */
export interface Draft {
  label: string;
  type: FormFieldType;
  helpText: string;
  required: boolean;
  sectionId: string | null;
  options: FieldOption[];
  columns: TableColumn[];
}

interface Props {
  field: FormField;
  draft: Draft;
  aktif: boolean;
  menyimpan: boolean;
  sections: FormSection[];
  bisaNaik: boolean;
  bisaTurun: boolean;
  onAktifkan: () => void;
  onUbah: (patch: Partial<Draft>) => void;
  onSimpan: () => void;
  onBatal: () => void;
  onGandakan: () => void;
  onHapus: () => void;
  onToggleAktif: () => void;
  onPindah: (arah: -1 | 1) => void;
}

const TANPA_SECTION = "__none";

export function FieldCard({
  field,
  draft,
  aktif,
  menyimpan,
  sections,
  bisaNaik,
  bisaTurun,
  onAktifkan,
  onUbah,
  onSimpan,
  onBatal,
  onGandakan,
  onHapus,
  onToggleAktif,
  onPindah,
}: Props) {
  const perluOpsi = draft.type === "SELECT" || draft.type === "MULTISELECT";
  const perluKolom = draft.type === "TABLE";

  return (
    <div
      onClick={() => !aktif && onAktifkan()}
      className={cn(
        "rounded-lg border bg-card transition-shadow",
        aktif ? "border-l-4 border-l-primary shadow-md" : "cursor-pointer hover:shadow-sm",
        !field.isActive && "opacity-60",
      )}
    >
      <div className="flex items-center justify-center py-1 text-muted-foreground">
        <GripVertical className="size-4 rotate-90 opacity-40" />
      </div>

      <div className="space-y-4 px-5 pb-4">
        {aktif ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                autoFocus
                className="flex-1 border-0 border-b border-input bg-transparent px-0 text-base shadow-none focus-visible:border-primary focus-visible:ring-0"
                placeholder="Pertanyaan tanpa judul"
                value={draft.label}
                onChange={(e) => onUbah({ label: e.target.value })}
              />
              <Select
                value={draft.type}
                onValueChange={(v) => onUbah({ type: v as FormFieldType })}
              >
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {FIELD_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              className="border-0 border-b border-input bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0"
              placeholder="Teks bantuan (opsional)"
              value={draft.helpText}
              onChange={(e) => onUbah({ helpText: e.target.value })}
            />

            {perluOpsi && (
              <BarisEditor
                rows={draft.options.map((o) => ({ a: o.value, b: o.label }))}
                labelTambah="Tambah pilihan"
                placeholderA="Nilai pilihan"
                placeholderB="Label tampil (opsional)"
                bulat
                onChange={(rows) =>
                  onUbah({ options: rows.map((r) => ({ value: r.a, label: r.b })) })
                }
              />
            )}

            {perluKolom && (
              <BarisEditor
                rows={draft.columns.map((c) => ({ a: c.key, b: c.label }))}
                labelTambah="Tambah kolom"
                placeholderA="Key kolom"
                placeholderB="Judul kolom"
                onChange={(rows) =>
                  onUbah({ columns: rows.map((r) => ({ key: r.a, label: r.b })) })
                }
              />
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-xs text-muted-foreground">Kelompok</Label>
              <Select
                value={draft.sectionId ?? TANPA_SECTION}
                onValueChange={(v) =>
                  onUbah({ sectionId: v === TANPA_SECTION ? null : v })
                }
              >
                <SelectTrigger className="h-8 w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TANPA_SECTION}>Tanpa kelompok</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                {field.key}
              </code>
            </div>

            <Separator />

            <div className="flex flex-wrap items-center justify-end gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label="Pindah ke atas"
                disabled={!bisaNaik}
                onClick={(e) => {
                  e.stopPropagation();
                  onPindah(-1);
                }}
              >
                <span aria-hidden>↑</span>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label="Pindah ke bawah"
                disabled={!bisaTurun}
                onClick={(e) => {
                  e.stopPropagation();
                  onPindah(1);
                }}
              >
                <span aria-hidden>↓</span>
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label="Gandakan field"
                onClick={(e) => {
                  e.stopPropagation();
                  onGandakan();
                }}
              >
                <Copy className="size-4" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label={field.isActive ? "Sembunyikan field" : "Tampilkan field"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAktif();
                }}
              >
                {field.isActive ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-muted-foreground hover:text-destructive"
                aria-label="Hapus field"
                onClick={(e) => {
                  e.stopPropagation();
                  onHapus();
                }}
              >
                <Trash2 className="size-4" />
              </Button>

              <Separator orientation="vertical" className="mx-1 h-6" />

              <div className="flex items-center gap-2">
                <Checkbox
                  id={`wajib-${field.id}`}
                  checked={draft.required}
                  onCheckedChange={(c) => onUbah({ required: c === true })}
                />
                <Label htmlFor={`wajib-${field.id}`} className="text-sm font-normal">
                  Wajib
                </Label>
              </div>

              <Separator orientation="vertical" className="mx-1 h-6" />

              <Button variant="ghost" size="sm" disabled={menyimpan} onClick={onBatal}>
                Batal
              </Button>
              <Button size="sm" disabled={menyimpan} onClick={onSimpan}>
                {menyimpan ? "Menyimpan…" : "Simpan"}
              </Button>
            </div>
          </>
        ) : (
          // Pratinjau memakai perender yang sama dengan form aslinya, jadi
          // yang terlihat di sini benar-benar yang akan dilihat pengisi.
          <div className="pointer-events-none">
            <DynamicField field={field} value={undefined} disabled onChange={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
}

function BarisEditor({
  rows,
  labelTambah,
  placeholderA,
  placeholderB,
  bulat,
  onChange,
}: {
  rows: { a: string; b: string }[];
  labelTambah: string;
  placeholderA: string;
  placeholderB: string;
  bulat?: boolean;
  onChange: (rows: { a: string; b: string }[]) => void;
}) {
  const ubah = (i: number, bagian: "a" | "b", nilai: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [bagian]: nilai } : r)));

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          {bulat && (
            <span className="size-3.5 shrink-0 rounded-full border border-muted-foreground/50" />
          )}
          <Input
            className="h-8 border-0 border-b border-input bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0"
            placeholder={placeholderA}
            value={row.a}
            onChange={(e) => ubah(i, "a", e.target.value)}
          />
          <Input
            className="h-8 border-0 border-b border-input bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0"
            placeholder={placeholderB}
            value={row.b}
            onChange={(e) => ubah(i, "b", e.target.value)}
          />
          <button
            type="button"
            aria-label={`Hapus baris ${i + 1}`}
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => onChange([...rows, { a: "", b: "" }])}
      >
        <Plus className="mr-1 size-4" />
        {labelTambah}
      </Button>
    </div>
  );
}
