"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicField } from "@/components/forms/dynamic-field";
import type { FormDefinition, FormField, FormValues } from "@/types/forms";

interface Props {
  form: FormDefinition;
  initialValues?: FormValues;
  submitting?: boolean;
  submitLabel?: string;
  disabled?: boolean;
  onSubmit: (values: FormValues) => void;
}

export function DynamicForm({
  form,
  initialValues,
  submitting,
  submitLabel = "Simpan",
  disabled,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<FormValues>(
    () => initialValues ?? defaultsFor(form.fields),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const groups = useMemo(() => groupFields(form), [form]);

  const setValue = (key: string, next: unknown) => {
    setValues((prev) => ({ ...prev, [key]: next }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Pemeriksaan di sini hanya untuk umpan balik cepat; backend tetap
    // memvalidasi ulang karena definisi field bisa berubah kapan saja.
    const found = validateRequired(form.fields, values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = document.getElementById(`field-${Object.keys(found)[0]}`);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {groups.map((group) => (
        <Card key={group.id}>
          {group.label && (
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{group.label}</CardTitle>
            </CardHeader>
          )}
          <CardContent className="grid gap-4 md:grid-cols-2">
            {group.fields.map((field) => (
              <div
                key={field.id}
                className={
                  field.type === "TABLE" || field.type === "TEXTAREA"
                    ? "md:col-span-2"
                    : undefined
                }
              >
                <DynamicField
                  field={field}
                  value={values[field.key]}
                  error={errors[field.key]}
                  disabled={disabled || submitting}
                  onChange={(next) => setValue(field.key, next)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {form.fields.length === 0 && (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Form ini belum punya field. Tambahkan lewat halaman pengaturan field.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={disabled || submitting || !form.fields.length}>
          {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function groupFields(form: FormDefinition) {
  const groups: { id: string; label: string | null; fields: FormField[] }[] = [];

  const loose = form.fields.filter((f) => !f.sectionId);
  if (loose.length) groups.push({ id: "__loose", label: null, fields: loose });

  for (const section of form.sections) {
    const owned = form.fields.filter((f) => f.sectionId === section.id);
    if (owned.length) {
      groups.push({ id: section.id, label: section.label, fields: owned });
    }
  }
  return groups;
}

function defaultsFor(fields: FormField[]): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    if (field.type === "TABLE") values[field.key] = [];
    else if (field.type === "MULTISELECT" || field.type === "FILE") values[field.key] = [];
    else if (field.type === "BOOLEAN") values[field.key] = false;
    else if (field.defaultValue != null) values[field.key] = field.defaultValue;
  }
  return values;
}

function validateRequired(
  fields: FormField[],
  values: FormValues,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    if (!field.required) continue;
    const value = values[field.key];
    const empty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0);

    if (empty) errors[field.key] = `${field.label} wajib diisi.`;
  }
  return errors;
}
