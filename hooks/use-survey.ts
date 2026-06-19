"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ─── Types ───
export interface SurveyField {
  id: number;
  label: string;
  type: "RATING" | "NPS" | "TEXT" | "SELECT";
  options: any | null;
  isRequired: boolean;
  order: number;
  isActive: boolean;
  dependsOnFieldId: number | null;
  dependsOnValue: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  id: number;
  respondentName: string | null;
  respondentEmail: string | null;
  respondentPhone: string | null;
  ticketId: string | null;
  agentName: string | null;
  generatedAt: string | null;
  answers: Record<string, any>;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; lastPage: number };
}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

// ─── Public Hooks ───
export function useSurveyFields() {
  return useQuery<SurveyField[]>({
    queryKey: ["survey-fields-public"],
    queryFn: async () => {
      const { data } = await api.get<SurveyField[]>("/survey/fields");
      return data;
    },
  });
}

export function useCheckSurveySubmission(ticketId: string | null) {
  return useQuery<{ hasSubmitted: boolean; isExpired?: boolean }>({
    queryKey: ["survey-check", ticketId],
    queryFn: async () => {
      const { data } = await api.get<{ hasSubmitted: boolean; isExpired?: boolean }>(`/survey/check/${ticketId}`);
      return data;
    },
    enabled: !!ticketId,
  });
}

export function useSubmitSurvey() {
  return useMutation({
    mutationFn: async (body: {
      ticketId?: string;
      agentName?: string;
      generatedAt?: string;
      answers: Record<string, any>;
    }) => {
      const { data } = await api.post("/survey/responses", body);
      return data;
    },
  });
}

// ─── Admin Hooks ───
export function useAdminSurveyFields(params: QueryParams = {}) {
  return useQuery<PaginatedResponse<SurveyField>>({
    queryKey: ["admin-survey-fields", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<SurveyField>>("/survey/admin/fields", { params });
      return data;
    },
  });
}

export function useCreateSurveyField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<SurveyField>) => {
      const { data } = await api.post("/survey/admin/fields", body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-survey-fields"] }),
  });
}

export function useUpdateSurveyField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<SurveyField> & { id: number }) => {
      const { data } = await api.patch(`/survey/admin/fields/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-survey-fields"] }),
  });
}

export function useDeleteSurveyField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/survey/admin/fields/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-survey-fields"] }),
  });
}

export function useAdminSurveyResponses(params: QueryParams = {}) {
  return useQuery<PaginatedResponse<SurveyResponse>>({
    queryKey: ["admin-survey-responses", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<SurveyResponse>>("/survey/admin/responses", { params });
      return data;
    },
    refetchInterval: 5000, // Real-time polling every 5 seconds
  });
}
