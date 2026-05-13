import type { PagedResponse } from "@/types/api";
import type { Financeiro, FinanceiroPayload } from "@/types/financeiro";
import { api } from "./api";

export async function listFinanceiro(page = 0, size = 200) {
  const { data } = await api.get<PagedResponse<Financeiro>>(`/financeiro?page=${page}&size=${size}`);
  return data;
}

export async function createFinanceiro(payload: FinanceiroPayload) {
  const { data } = await api.post<Financeiro>("/financeiro", payload);
  return data;
}

export async function updateFinanceiro(id: number, payload: FinanceiroPayload) {
  const { data } = await api.put<Financeiro>(`/financeiro/${id}`, payload);
  return data;
}

export async function deleteFinanceiro(id: number) {
  await api.delete(`/financeiro/${id}`);
}
