import type { FormDefinition, FormField } from "@/types/forms";

export interface FieldGroup {
  id: string;
  label: string | null;
  fields: FormField[];
}

/** Penanda kelompok untuk field yang tidak punya section. */
export const TANPA_KELOMPOK = "__loose";

/**
 * Tata letak satu baris kartu: dua kolom di layar lebar, satu di layar sempit.
 */
export const GRID_KELOMPOK = "grid gap-x-6 gap-y-5 md:grid-cols-2";

/**
 * Urutan tampil form: field tanpa kelompok lebih dulu, lalu tiap section
 * sesuai urutannya, dan di dalam kelompok sesuai `order`.
 *
 * Dipakai bersama oleh form pengisian dan layar pengaturan field. Selama
 * keduanya memanggil fungsi ini, apa yang dilihat admin saat menyunting sama
 * persis dengan apa yang dilihat pengisi.
 */
export function groupFields(form: FormDefinition): FieldGroup[] {
  const groups: FieldGroup[] = [];

  const loose = form.fields.filter((f) => !f.sectionId);
  if (loose.length) {
    groups.push({ id: TANPA_KELOMPOK, label: null, fields: loose });
  }

  for (const section of form.sections) {
    const owned = form.fields.filter((f) => f.sectionId === section.id);
    if (owned.length) {
      groups.push({ id: section.id, label: section.label, fields: owned });
    }
  }
  return groups;
}

/** Field lebar memakan dua kolom; sisanya satu kolom. */
export function fieldSpanClass(field: FormField): string {
  return field.type === "TABLE" || field.type === "TEXTAREA"
    ? "min-w-0 md:col-span-2"
    : "min-w-0";
}

/** Seluruh field dalam urutan tampil, rata tanpa kelompok. */
export function flattenGroups(groups: FieldGroup[]): FormField[] {
  return groups.flatMap((group) => group.fields);
}

/** sectionId yang mewakili sebuah kelompok, null untuk kelompok tanpa section. */
export function sectionIdOf(group: FieldGroup): string | null {
  return group.id === TANPA_KELOMPOK ? null : group.id;
}
