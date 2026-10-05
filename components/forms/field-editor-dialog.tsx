"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  FIELD_TYPES,
  FIELD_TYPE_LABEL,
  type FieldOption,
  type FormField,
  type FormFieldType,
  type FormSection,
  type TableColumn,
} from "@/types/forms";

interface Props {
  open: boolean;
  field?: FormField;
  sections: FormSection[];
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: {
    key: string;
    label: string;
    type: FormFieldType;
    helpText?: string;
    required: boolean;
    sectionId?: string;
    options?: FieldOption[];
    columns?: TableColumn[];
  }) => void;
}

const NO_SECTION = "__none";

export function FieldEditorDialog({ open, field, sections, saving, onClose, onSave }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {/* Di-remount setiap dialog dibuka atau field berganti, sehingga nilai
            awalnya cukup diambil dari props tanpa perlu useEffect penyetel state. */}
        {open && (
          <FieldEditorForm
            key={field?.id ?? "baru"}
            field={field}
            sections={sections}
            saving={saving}
            onClose={onClose}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldEditorForm({
  field,
  sections,
  saving,
  onClose,
  onSave,
}: Omit<Props, "open">) {
  const editing = Boolean(field);

  const [key, setKey] = useState(field?.key ?? "");
  const [label, setLabel] = useState(field?.label ?? "");
  const [type, setType] = useState<FormFieldType>(field?.type ?? "TEXT");
  const [helpText, setHelpText] = useState(field?.helpText ?? "");
  const [required, setRequired] = useState(field?.required ?? false);
  const [sectionId, setSectionId] = useState<string>(field?.sectionId ?? NO_SECTION);
  const [options, setOptions] = useState<FieldOption[]>(field?.options ?? []);
  const [columns, setColumns] = useState<TableColumn[]>(field?.columns ?? []);
  const [error, setError] = useState<string | null>(null);

  const needsOptions = type === "SELECT" || type === "MULTISELECT";
  const needsColumns = type === "TABLE";

  const handleSave = () => {
    const trimmedKey = key.trim();
    const trimmedLabel = label.trim();

    if (!trimmedLabel) return setError("Nama field wajib diisi.");
    if (!editing) {
      if (!trimmedKey) return setError("Key wajib diisi.");
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmedKey)) {
        return setError(
          "Key harus diawali huruf dan hanya boleh berisi huruf, angka, atau garis bawah.",
        );
      }
    }
    if (needsOptions && options.filter((o) => o.value.trim()).length === 0) {
      return setError("Tipe pilihan wajib punya minimal satu opsi.");
    }
    if (needsColumns && columns.filter((c) => c.key.trim()).length === 0) {
      return setError("Tipe tabel wajib punya minimal satu kolom.");
    }

    onSave({
      key: trimmedKey,
      label: trimmedLabel,
      type,
      helpText: helpText.trim() || undefined,
      required,
      sectionId: sectionId === NO_SECTION ? undefined : sectionId,
      options: needsOptions
        ? options
            .filter((o) => o.value.trim())
            .map((o) => ({ value: o.value.trim(), label: o.label.trim() || o.value.trim() }))
        : undefined,
      columns: needsColumns
        ? columns
            .filter((c) => c.key.trim())
            .map((c) => ({ key: c.key.trim(), label: c.label.trim() || c.key.trim() }))
        : undefined,
    });
  };

  return (
    <>
      <DialogHeader>
          <DialogTitle>{editing ? "Ubah Field" : "Tambah Field"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Key tidak bisa diubah karena dipakai sebagai penanda data yang sudah tersimpan."
              : "Key dipakai sebagai penanda data dan tidak bisa diubah setelah dibuat."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="field-label">Nama field</Label>
            <Input
              id="field-label"
              value={label}
              placeholder="mis. Corporate Name"
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="field-key">Key</Label>
            <Input
              id="field-key"
              value={key}
              disabled={editing}
              placeholder="mis. corporateName"
              onChange={(e) => setKey(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="field-type">Tipe</Label>
              <Select value={type} onValueChange={(v) => setType(v as FormFieldType)}>
                <SelectTrigger id="field-type" className="w-full">
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

            <div className="space-y-1.5">
              <Label htmlFor="field-section">Kelompok</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger id="field-section" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SECTION}>Tanpa kelompok</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="field-help">Keterangan bantuan</Label>
            <Input
              id="field-help"
              value={helpText}
              placeholder="mis. Copy paste dari corp id"
              onChange={(e) => setHelpText(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="field-required"
              checked={required}
              onCheckedChange={(c) => setRequired(c === true)}
            />
            <Label htmlFor="field-required" className="font-normal">
              Wajib diisi
            </Label>
          </div>

          {needsOptions && (
            <PairEditor
              title="Pilihan"
              addLabel="Tambah pilihan"
              firstPlaceholder="Nilai"
              secondPlaceholder="Label (opsional)"
              rows={options.map((o) => ({ first: o.value, second: o.label }))}
              onChange={(rows) =>
                setOptions(rows.map((r) => ({ value: r.first, label: r.second })))
              }
            />
          )}

          {needsColumns && (
            <PairEditor
              title="Kolom tabel"
              addLabel="Tambah kolom"
              firstPlaceholder="Key kolom"
              secondPlaceholder="Judul kolom"
              rows={columns.map((c) => ({ first: c.key, second: c.label }))}
              onChange={(rows) =>
                setColumns(rows.map((r) => ({ key: r.first, label: r.second })))
              }
            />
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Batal
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </DialogFooter>
    </>
  );
}

function PairEditor({
  title,
  addLabel,
  firstPlaceholder,
  secondPlaceholder,
  rows,
  onChange,
}: {
  title: string;
  addLabel: string;
  firstPlaceholder: string;
  secondPlaceholder: string;
  rows: { first: string; second: string }[];
  onChange: (rows: { first: string; second: string }[]) => void;
}) {
  const update = (index: number, part: "first" | "second", value: string) =>
    onChange(rows.map((r, i) => (i === index ? { ...r, [part]: value } : r)));

  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label>{title}</Label>
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            className="h-8"
            placeholder={firstPlaceholder}
            value={row.first}
            onChange={(e) => update(index, "first", e.target.value)}
          />
          <Input
            className="h-8"
            placeholder={secondPlaceholder}
            value={row.second}
            onChange={(e) => update(index, "second", e.target.value)}
          />
          <button
            type="button"
            aria-label={`Hapus ${title.toLowerCase()} ${index + 1}`}
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...rows, { first: "", second: "" }])}
      >
        <Plus className="mr-2 size-4" />
        {addLabel}
      </Button>
    </div>
  );
}
