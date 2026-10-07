"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FormField, TableColumn } from "@/types/forms";

/** Lampiran disimpan sebagai data URL di dalam record, jadi perlu dibatasi. */
const MAX_FILE_BYTES = 2 * 1024 * 1024;

interface Props {
  field: FormField;
  value: unknown;
  error?: string;
  disabled?: boolean;
  onChange: (value: unknown) => void;
}

export function DynamicField({ field, value, error, disabled, onChange }: Props) {
  const inputId = `field-${field.key}`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId} className="flex items-start gap-1">
        <span>{field.label}</span>
        {field.required && (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        )}
        {!field.isActive && (
          <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            nonaktif
          </span>
        )}
      </Label>

      <FieldControl
        field={field}
        inputId={inputId}
        value={value}
        disabled={disabled}
        invalid={Boolean(error)}
        onChange={onChange}
      />

      {field.helpText && !error && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FieldControl({
  field,
  inputId,
  value,
  disabled,
  invalid,
  onChange,
}: {
  field: FormField;
  inputId: string;
  value: unknown;
  disabled?: boolean;
  invalid: boolean;
  onChange: (value: unknown) => void;
}) {
  const ring = invalid ? "border-destructive focus-visible:ring-destructive" : "";

  switch (field.type) {
    case "TEXTAREA":
      return (
        <Textarea
          id={inputId}
          className={cn("min-h-24", ring)}
          disabled={disabled}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "NUMBER":
      return (
        <Input
          id={inputId}
          type="number"
          className={ring}
          disabled={disabled}
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      );

    case "DATE":
    case "DATETIME":
      return (
        <Input
          id={inputId}
          type={field.type === "DATE" ? "date" : "datetime-local"}
          className={ring}
          disabled={disabled}
          value={toInputDate(value, field.type)}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "BOOLEAN":
      return (
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id={inputId}
            disabled={disabled}
            checked={value === true}
            onCheckedChange={(checked) => onChange(checked === true)}
          />
          <Label htmlFor={inputId} className="font-normal text-muted-foreground">
            Ya
          </Label>
        </div>
      );

    case "SELECT":
      return (
        <Select
          disabled={disabled}
          value={String(value ?? "")}
          onValueChange={(next) => onChange(next)}
        >
          <SelectTrigger id={inputId} className={cn("w-full", ring)}>
            <SelectValue placeholder="Pilih…" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "MULTISELECT":
      return (
        <MultiSelectControl
          field={field}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      );

    case "FILE":
      return (
        <FileControl value={value} disabled={disabled} onChange={onChange} />
      );

    case "TABLE":
      return (
        <TableControl
          columns={field.columns ?? []}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      );

    default:
      return (
        <Input
          id={inputId}
          className={ring}
          disabled={disabled}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function MultiSelectControl({
  field,
  value,
  disabled,
  onChange,
}: {
  field: FormField;
  value: unknown;
  disabled?: boolean;
  onChange: (value: unknown) => void;
}) {
  const selected = Array.isArray(value) ? value.map(String) : [];

  const toggle = (optValue: string) => {
    onChange(
      selected.includes(optValue)
        ? selected.filter((v) => v !== optValue)
        : [...selected, optValue],
    );
  };

  return (
    <div className="flex flex-wrap gap-2 rounded-md border p-2">
      {(field.options ?? []).map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => toggle(opt.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-accent",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function FileControl({
  value,
  disabled,
  onChange,
}: {
  value: unknown;
  disabled?: boolean;
  onChange: (value: unknown) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const files = Array.isArray(value) ? value.map(String) : [];

  /** Satu jalur untuk tiga cara menambah: pilih berkas, tempel, dan seret. */
  const tambah = async (daftar: File[]) => {
    if (disabled || daftar.length === 0) return;

    const diterima: string[] = [];
    const ditolak: string[] = [];

    for (const file of daftar) {
      if (file.size > MAX_FILE_BYTES) {
        ditolak.push(file.name || "gambar tempel");
        continue;
      }
      diterima.push(await readAsDataUrl(file));
    }

    if (diterima.length) onChange([...files, ...diterima]);

    setPesan(
      ditolak.length
        ? `${ditolak.join(", ")} lebih dari 2 MB dan tidak dilampirkan.`
        : null,
    );
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const gambar = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((f): f is File => Boolean(f));

    if (!gambar.length) return;
    // Baru dicegah setelah ada gambar, supaya menempel teks di tempat lain
    // tidak ikut tertahan.
    event.preventDefault();
    void tambah(gambar);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void tambah(Array.from(event.dataTransfer.files));
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          void tambah(Array.from(e.target.files ?? []));
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      {/* Area ini perlu bisa difokuskan agar event tempel sampai ke sini. */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Tempel, seret, atau klik untuk menambah lampiran"
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "flex flex-col items-center gap-1 rounded-md border border-dashed px-4 py-5 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-input hover:border-primary/60 hover:bg-accent/40",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <Upload className="size-5 text-muted-foreground" />
        <p className="text-sm font-medium">
          Tempel tangkapan layar, seret berkas, atau klik di sini
        </p>
        <p className="text-xs text-muted-foreground">
          Klik area ini lalu tekan Ctrl+V · maksimal 2 MB per berkas
        </p>
      </div>

      {pesan && <p className="text-xs text-destructive">{pesan}</p>}

      {files.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {files.map((file, index) => {
            const gambar = file.startsWith("data:image/");
            return (
              <li
                key={index}
                className="group relative overflow-hidden rounded border bg-muted/40"
              >
                {gambar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file}
                    alt={`Lampiran ${index + 1}`}
                    className="h-24 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
                    Berkas {index + 1}
                  </div>
                )}

                <div className="flex items-center justify-between px-2 py-1 text-xs">
                  <a
                    href={file}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    lihat
                  </a>
                  {!disabled && (
                    <button
                      type="button"
                      aria-label={`Hapus lampiran ${index + 1}`}
                      onClick={() => onChange(files.filter((_, i) => i !== index))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TableControl({
  columns,
  value,
  disabled,
  onChange,
}: {
  columns: TableColumn[];
  value: unknown;
  disabled?: boolean;
  onChange: (value: unknown) => void;
}) {
  const rows: Record<string, unknown>[] = Array.isArray(value)
    ? (value as Record<string, unknown>[])
    : [];

  const update = (rowIndex: number, key: string, next: string) => {
    const copy = rows.map((row, i) =>
      i === rowIndex ? { ...row, [key]: next } : row,
    );
    onChange(copy);
  };

  const addRow = () => {
    const blank: Record<string, string> = {};
    columns.forEach((col) => (blank[col.key] = ""));
    onChange([...rows, blank]);
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-2 py-1.5 text-left font-medium"
                >
                  {col.label}
                </th>
              ))}
              {!disabled && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-2 py-3 text-center text-xs text-muted-foreground"
                >
                  Belum ada baris.
                </td>
              </tr>
            )}
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t">
                {columns.map((col) => (
                  <td key={col.key} className="px-1 py-1">
                    <Input
                      className="h-8"
                      disabled={disabled}
                      value={String(row[col.key] ?? "")}
                      onChange={(e) => update(rowIndex, col.key, e.target.value)}
                    />
                  </td>
                ))}
                {!disabled && (
                  <td className="px-1">
                    <button
                      type="button"
                      aria-label={`Hapus baris ${rowIndex + 1}`}
                      onClick={() =>
                        onChange(rows.filter((_, i) => i !== rowIndex))
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-2 size-4" />
          Tambah baris
        </Button>
      )}
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Input tanggal HTML butuh format tertentu, bukan ISO penuh. */
function toInputDate(value: unknown, type: "DATE" | "DATETIME"): string {
  if (!value) return "";
  const text = String(value);
  if (type === "DATE") return text.slice(0, 10);
  return text.slice(0, 16);
}
