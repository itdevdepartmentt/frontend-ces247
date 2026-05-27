"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, string | boolean | string[] | null>;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; lastPage: number };
}

// ─── Generic hook factory ───

function createLookupHooks<T extends { id: number }>(endpoint: string, qKey: string) {
  const useList = (params: QueryParams = {}) =>
    useQuery<PaginatedResponse<T>>({
      queryKey: [qKey, params],
      queryFn: async () => {
        const queryParams = { ...params };
        if (params.filters) {
          (queryParams as any).filters = JSON.stringify(params.filters);
        }
        const { data } = await api.get<PaginatedResponse<T>>(endpoint, { params: queryParams });
        return data;
      },
    });

  const useCreate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (body: Partial<T>) => {
        const { data } = await api.post(endpoint, body);
        return data;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [qKey] }),
    });
  };

  const useUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, ...body }: Partial<T> & { id: number }) => {
        const { data } = await api.patch(`${endpoint}/${id}`, body);
        return data;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [qKey] }),
    });
  };

  const useDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: number) => {
        const { data } = await api.delete(`${endpoint}/${id}`);
        return data;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [qKey] }),
    });
  };

  const useDeleteAll = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async () => {
        const { data } = await api.delete(endpoint);
        return data;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [qKey] }),
    });
  }

  return { useList, useCreate, useUpdate, useDelete, useDeleteAll };
}

// ─── Concrete hooks ───

export interface AccountMappingRow {
  id: number;
  b2b_account_id: string;
  corporateName: string | null;
  kategoriAccount: string | null;
  group: string | null;
  divisi: string | null;
  department: string | null;
  mppCodeNew: string | null;
  namaAM: string | null;
}

export interface LookupKIPRow {
  id: number;
  category: string | null;
  subCategory: string | null;
  detailCategoryFull: string | null;
  detailCategory: string | null;
  detailCategory2: string | null;
  compositeKeyOmnix: string | null;
  compositeKey: string | null;
  fcrNonSatuan: string | null;
  escToSatuan: string | null;
  fcrNonMassal: string | null;
  escToMassal: string | null;
  isFcr: boolean | null;
  product: string | null;
}

export interface LookupAgentRow {
  id: number;
  namaAgent: string | null;
  group: string | null;
}

export const accountMappingHooks = createLookupHooks<AccountMappingRow>(
  "/lookup-management/account-mapping",
  "account-mapping"
);

export const lookupKIPHooks = createLookupHooks<LookupKIPRow>(
  "/lookup-management/lookup-kip",
  "lookup-kip"
);

export const lookupAgentHooks = createLookupHooks<LookupAgentRow>(
  "/lookup-management/lookup-agent",
  "lookup-agent"
);
