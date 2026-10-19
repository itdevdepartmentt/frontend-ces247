"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  CreateFieldInput,
  FormDefinition,
  FormRecord,
  FormRecordDetail,
  FormSummaryItem,
  FormSubmission,
  FormValues,
  Paginated,
  UpdateFieldInput,
} from "@/types/forms";

const FORMS_KEY = "forms";
const RECORDS_KEY = "form-records";

/* ────────────────────────────── definisi form ───────────────────────────── */

export function useFormList(includeInactive = false) {
  return useQuery<FormSummaryItem[]>({
    queryKey: [FORMS_KEY, "list", includeInactive],
    queryFn: async () => {
      const { data } = await api.get<FormSummaryItem[]>("/forms", {
        params: includeInactive ? { includeInactive: "true" } : undefined,
      });
      return data;
    },
  });
}

/**
 * `includeInactive` dipakai layar pengaturan agar field yang dinonaktifkan
 * tetap terlihat dan bisa diaktifkan kembali. Form yang diisi pengguna
 * memakai false supaya field nonaktif tidak ikut dirender.
 */
export function useForm(key: string | undefined, includeInactive = false) {
  return useQuery<FormDefinition>({
    queryKey: [FORMS_KEY, key, includeInactive],
    enabled: Boolean(key),
    queryFn: async () => {
      const { data } = await api.get<FormDefinition>(`/forms/${key}`, {
        params: includeInactive ? { includeInactive: "true" } : undefined,
      });
      return data;
    },
  });
}

/* ──────────────────────────── pengelolaan field ─────────────────────────── */

function useInvalidateForm(key: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: [FORMS_KEY, key] });
    void queryClient.invalidateQueries({ queryKey: [FORMS_KEY, "list"] });
  };
}

export function useCreateField(formKey: string) {
  const invalidate = useInvalidateForm(formKey);
  return useMutation({
    mutationFn: async (input: CreateFieldInput) => {
      const { data } = await api.post(`/forms/${formKey}/fields`, input);
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateField(formKey: string) {
  const invalidate = useInvalidateForm(formKey);
  return useMutation({
    mutationFn: async ({
      fieldId,
      ...input
    }: UpdateFieldInput & { fieldId: string }) => {
      const { data } = await api.patch(`/forms/fields/${fieldId}`, input);
      return data;
    },
    onSuccess: invalidate,
  });
}

/**
 * Default-nya menonaktifkan, bukan menghapus. `permanent` hanya dipakai bila
 * pengguna sudah menyatakan paham bahwa data lamanya kehilangan definisi.
 */
export function useDeleteField(formKey: string) {
  const invalidate = useInvalidateForm(formKey);
  return useMutation({
    mutationFn: async ({
      fieldId,
      permanent = false,
    }: {
      fieldId: string;
      permanent?: boolean;
    }) => {
      const { data } = await api.delete(`/forms/fields/${fieldId}`, {
        params: permanent ? { permanent: "true" } : undefined,
      });
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useReorderFields(formKey: string) {
  const invalidate = useInvalidateForm(formKey);
  return useMutation({
    mutationFn: async (items: { id: string; order: number }[]) => {
      const { data } = await api.patch(`/forms/${formKey}/fields/reorder`, {
        items,
      });
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useCreateSection(formKey: string) {
  const invalidate = useInvalidateForm(formKey);
  return useMutation({
    mutationFn: async (input: { key: string; label: string }) => {
      const { data } = await api.post(`/forms/${formKey}/sections`, input);
      return data;
    },
    onSuccess: invalidate,
  });
}

/* ────────────────────────────────── record ──────────────────────────────── */

export function useSubmitRecord(formKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: FormValues) => {
      const { data } = await api.post<FormRecord>(`/forms/${formKey}/records`, {
        values,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [RECORDS_KEY, formKey] });
      void queryClient.invalidateQueries({
        queryKey: [RECORDS_KEY, "submissions"],
      });
    },
  });
}

export function useRecordList(
  formKey: string,
  params: { page?: number; limit?: number; search?: string } = {},
) {
  return useQuery<Paginated<FormRecord>>({
    queryKey: [RECORDS_KEY, formKey, params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<FormRecord>>(
        `/forms/${formKey}/records`,
        { params },
      );
      return data;
    },
  });
}

export function useSubmissionList(params: {
  formKey?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery<Paginated<FormSubmission>>({
    queryKey: [RECORDS_KEY, "submissions", params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<FormSubmission>>(
        "/form-records",
        { params },
      );
      return data;
    },
  });
}

export interface CorporateMatch {
  id: string;
  refNumber: string | null;
  corporateName: string | null;
  projectId: string | null;
  createdAt: string;
}

/**
 * Riwayat pengajuan sebuah perusahaan. Dipakai sebelum membuat permintaan
 * baru, untuk memeriksa apakah sudah pernah diajukan.
 */
export function useCorporateHistory(
  formKey: string,
  name: string,
  source?: string,
) {
  const keyword = name.trim();
  return useQuery<CorporateMatch[]>({
    queryKey: [
      RECORDS_KEY,
      formKey,
      "by-corporate",
      source ?? formKey,
      keyword,
    ],
    enabled: keyword.length >= 3,
    queryFn: async () => {
      const { data } = await api.get<CorporateMatch[]>(
        `/forms/${formKey}/records/by-corporate`,
        { params: { name: keyword, ...(source ? { source } : {}) } },
      );
      return data;
    },
  });
}

export function useRecord(id: string | undefined) {
  return useQuery<FormRecordDetail>({
    queryKey: [RECORDS_KEY, "detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<FormRecordDetail>(`/form-records/${id}`);
      return data;
    },
  });
}

export function useUpdateRecord(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: FormValues) => {
      const { data } = await api.patch<FormRecord>(`/form-records/${id}`, {
        values,
      });
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [RECORDS_KEY] });
    },
  });
}

/**
 * Unduhan XLSX lewat blob, bukan membuka tab baru, supaya cookie auth ikut
 * terkirim dan nama file dari header tetap terpakai.
 */
export async function downloadRecordXlsx(id: string, fallbackName: string) {
  const response = await api.post(`/form-records/${id}/export`, undefined, {
    responseType: "blob",
  });

  const disposition = String(response.headers["content-disposition"] ?? "");
  const match = disposition.match(/filename="?([^"]+)"?/);
  const fileName = match
    ? decodeURIComponent(match[1])
    : `${fallbackName}.xlsx`;

  const url = URL.createObjectURL(
    new Blob([response.data as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/* ───────────────────────── rekap gabungan (format lama) ──────────────────── */

/** Form yang punya padanan sheet di berkas "Rekap Submit Form EBO.xlsx". */
export const FORM_REKAP_EBO: Record<string, string> = {
  "ebo-psb": "PSB",
  "ebo-aktivasi": "Aktivasi PSB",
};

export interface HasilImporRekap {
  sheet: string;
  totalBaris: number;
  dibuat: number;
  dilewati: { baris: number; pesan: string }[];
  peringatan: { baris: number; pesan: string }[];
  kolomTakDikenal: string[];
}

/** Mengunduh seluruh submission sebuah form dalam tata kolom rekap lama. */
export async function downloadRekapXlsx(formKey: string) {
  const response = await api.get(`/forms/${formKey}/records/rekap`, {
    responseType: "blob",
  });

  const disposition = String(response.headers["content-disposition"] ?? "");
  const match = disposition.match(/filename="?([^"]+)"?/);
  const fileName = match
    ? decodeURIComponent(match[1])
    : `Rekap ${FORM_REKAP_EBO[formKey] ?? formKey}.xlsx`;

  const url = URL.createObjectURL(
    new Blob([response.data as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Berkas dikirim apa adanya; backend yang memetakan kolom dan melaporkannya. */
export function useImportRekap(formKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("file", file);
      const { data } = await api.post<HasilImporRekap>(
        `/forms/${formKey}/records/rekap`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [RECORDS_KEY] });
      void queryClient.invalidateQueries({ queryKey: [FORMS_KEY] });
    },
  });
}
