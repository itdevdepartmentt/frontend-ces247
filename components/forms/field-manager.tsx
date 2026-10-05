"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldEditorDialog } from "@/components/forms/field-editor-dialog";
import {
  useCreateField,
  useDeleteField,
  useReorderFields,
  useUpdateField,
} from "@/hooks/use-forms";
import { FIELD_TYPE_LABEL, type FormDefinition, type FormField } from "@/types/forms";

interface Props {
  form: FormDefinition;
}

export function FieldManager({ form }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FormField | undefined>();

  const createField = useCreateField(form.key);
  const updateField = useUpdateField(form.key);
  const deleteField = useDeleteField(form.key);
  const reorder = useReorderFields(form.key);

  const fields = [...form.fields].sort((a, b) => a.order - b.order);
  const sectionLabel = (id: string | null) =>
    form.sections.find((s) => s.id === id)?.label ?? "—";

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (field: FormField) => {
    setEditing(field);
    setDialogOpen(true);
  };

  const handleSave = (payload: Parameters<typeof createField.mutate>[0] & { key: string }) => {
    const onError = (error: unknown) => toast.error(describeError(error));

    if (editing) {
      // key sengaja tidak ikut dikirim: tidak bisa diubah setelah field dibuat.
      updateField.mutate(
        {
          fieldId: editing.id,
          label: payload.label,
          type: payload.type,
          helpText: payload.helpText,
          required: payload.required,
          sectionId: payload.sectionId,
          options: payload.options,
          columns: payload.columns,
        },
        {
          onSuccess: () => {
            toast.success("Field diperbarui");
            setDialogOpen(false);
          },
          onError,
        },
      );
      return;
    }

    createField.mutate(payload, {
      onSuccess: () => {
        toast.success("Field ditambahkan");
        setDialogOpen(false);
      },
      onError,
    });
  };

  /** Tukar posisi dengan tetangganya, lalu kirim seluruh urutan sekaligus. */
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;

    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];

    reorder.mutate(
      next.map((f, i) => ({ id: f.id, order: i })),
      { onError: (error) => toast.error(describeError(error)) },
    );
  };

  const toggleActive = (field: FormField) => {
    updateField.mutate(
      { fieldId: field.id, isActive: !field.isActive },
      {
        onSuccess: () =>
          toast.success(field.isActive ? "Field dinonaktifkan" : "Field diaktifkan"),
        onError: (error) => toast.error(describeError(error)),
      },
    );
  };

  const toggleRequired = (field: FormField) => {
    updateField.mutate(
      { fieldId: field.id, required: !field.required },
      { onError: (error) => toast.error(describeError(error)) },
    );
  };

  const renameInline = (field: FormField, label: string) => {
    const trimmed = label.trim();
    if (!trimmed || trimmed === field.label) return;
    updateField.mutate(
      { fieldId: field.id, label: trimmed },
      { onError: (error) => toast.error(describeError(error)) },
    );
  };

  const remove = (field: FormField) => {
    const confirmed = window.confirm(
      `Nonaktifkan field "${field.label}"?\n\nData yang sudah tersimpan tidak ikut terhapus dan field ini bisa diaktifkan kembali kapan saja.`,
    );
    if (!confirmed) return;

    deleteField.mutate(
      { fieldId: field.id },
      {
        onSuccess: (result: { message?: string }) =>
          toast.success(result?.message ?? "Field dinonaktifkan"),
        onError: (error) => toast.error(describeError(error)),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Field</h2>
          <p className="text-sm text-muted-foreground">
            {fields.filter((f) => f.isActive).length} aktif dari {fields.length} field.
            Perubahan langsung berlaku pada form.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Tambah field
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Urutan</TableHead>
              <TableHead className="min-w-56">Nama field</TableHead>
              <TableHead className="min-w-40">Key</TableHead>
              <TableHead className="min-w-32">Tipe</TableHead>
              <TableHead className="min-w-32">Kelompok</TableHead>
              <TableHead className="w-20 text-center">Wajib</TableHead>
              <TableHead className="w-32 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Belum ada field. Tambahkan field pertama lewat tombol di atas.
                </TableCell>
              </TableRow>
            )}

            {fields.map((field, index) => (
              <TableRow key={field.id} className={field.isActive ? "" : "opacity-55"}>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label={`Naikkan ${field.label}`}
                      disabled={index === 0 || reorder.isPending}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label={`Turunkan ${field.label}`}
                      disabled={index === fields.length - 1 || reorder.isPending}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>

                <TableCell>
                  {/* Ganti nama langsung di tabel; disimpan saat fokus berpindah. */}
                  <Input
                    className="h-8 border-transparent bg-transparent px-1 hover:border-input focus:border-input"
                    defaultValue={field.label}
                    aria-label={`Nama field ${field.label}`}
                    onBlur={(e) => renameInline(field, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                  />
                  {field.helpText && (
                    <p className="px-1 text-xs text-muted-foreground">{field.helpText}</p>
                  )}
                </TableCell>

                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {field.key}
                  </code>
                </TableCell>

                <TableCell>
                  <Badge variant="secondary">{FIELD_TYPE_LABEL[field.type]}</Badge>
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {sectionLabel(field.sectionId)}
                </TableCell>

                <TableCell className="text-center">
                  <Checkbox
                    checked={field.required}
                    aria-label={`Wajib isi untuk ${field.label}`}
                    onCheckedChange={() => toggleRequired(field)}
                  />
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      aria-label={`Ubah ${field.label}`}
                      onClick={() => openEdit(field)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      aria-label={
                        field.isActive
                          ? `Nonaktifkan ${field.label}`
                          : `Aktifkan ${field.label}`
                      }
                      onClick={() => toggleActive(field)}
                    >
                      {field.isActive ? (
                        <Eye className="size-4" />
                      ) : (
                        <EyeOff className="size-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label={`Hapus ${field.label}`}
                      onClick={() => remove(field)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <FieldEditorDialog
        open={dialogOpen}
        field={editing}
        sections={form.sections}
        saving={createField.isPending || updateField.isPending}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

function describeError(error: unknown): string {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response
    ?.data?.message;
  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string") return message;
  return "Terjadi kesalahan. Coba lagi.";
}
