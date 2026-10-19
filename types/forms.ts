export const FIELD_TYPES = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "DATE",
  "DATETIME",
  "SELECT",
  "MULTISELECT",
  "BOOLEAN",
  "FILE",
  "TABLE",
] as const;

export type FormFieldType = (typeof FIELD_TYPES)[number];

/** Label bahasa Indonesia untuk tiap tipe, dipakai di layar pengaturan field. */
export const FIELD_TYPE_LABEL: Record<FormFieldType, string> = {
  TEXT: "Teks singkat",
  TEXTAREA: "Teks panjang",
  NUMBER: "Angka",
  DATE: "Tanggal",
  DATETIME: "Tanggal & jam",
  SELECT: "Pilihan tunggal",
  MULTISELECT: "Pilihan ganda",
  BOOLEAN: "Ya / Tidak",
  FILE: "Lampiran",
  TABLE: "Tabel",
};

export interface FieldOption {
  value: string;
  label: string;
}

export interface TableColumn {
  key: string;
  label: string;
  type?: FormFieldType;
}

export interface FormField {
  id: string;
  formId: string;
  sectionId: string | null;
  key: string;
  label: string;
  helpText: string | null;
  type: FormFieldType;
  required: boolean;
  order: number;
  options: FieldOption[] | null;
  validation: Record<string, unknown> | null;
  columns: TableColumn[] | null;
  defaultValue: string | null;
  isActive: boolean;
}

export interface FormSection {
  id: string;
  formId: string;
  key: string;
  label: string;
  order: number;
}

export interface FormDefinition {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sections: FormSection[];
  fields: FormField[];
}

export interface FormSummaryItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count?: { fields: number; records: number };
}

export type FormValues = Record<string, unknown>;

export interface FormRecord {
  id: string;
  formId: string;
  values: FormValues;
  status: string;
  refNumber: string | null;
  createdBy: string | null;
  lastEditedById: string | null;
  lastEditedByName: string | null;
  lastEditedByEmail: string | null;
  lastEditedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FormRecordDetail extends FormRecord {
  form: FormDefinition;
}

export interface FormSubmission {
  id: string;
  formKey: string;
  formName: string;
  createdAt: string;
  status: string;
  ticketId: string | null;
  corporateName: string | null;
  projectId: string | null;
  quantity: string | null;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; lastPage: number };
}

export interface CreateFieldInput {
  key: string;
  label: string;
  type: FormFieldType;
  helpText?: string;
  sectionId?: string;
  required?: boolean;
  order?: number;
  options?: FieldOption[];
  validation?: Record<string, unknown>;
  columns?: TableColumn[];
  defaultValue?: string;
}

export type UpdateFieldInput = Partial<
  Omit<CreateFieldInput, "key" | "sectionId">
> & {
  /** null memindahkan field keluar dari kelompok mana pun. */
  sectionId?: string | null;
  isActive?: boolean;
};
