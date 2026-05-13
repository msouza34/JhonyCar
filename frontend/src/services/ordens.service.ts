import type { PagedResponse } from "@/types/api";
import type { OrdemServico, OrdemServicoPayload } from "@/types/ordem-servico";
import { api } from "./api";

export async function listOrdensServico(page = 0, size = 200, sort = "id,desc", archived?: boolean) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  if (archived !== undefined) {
    params.set("archived", String(archived));
  }
  const { data } = await api.get<PagedResponse<OrdemServico>>(`/ordens-servico?${params.toString()}`);
  return data;
}

export async function listAllOrdensServico(size = 200, sort = "id,desc", archived?: boolean) {
  let page = 0;
  let totalPages = 1;
  const items: OrdemServico[] = [];

  while (page < totalPages) {
    const response = await listOrdensServico(page, size, sort, archived);
    items.push(...response.content);
    totalPages = Math.max(response.totalPages || 1, 1);
    page += 1;
  }

  return items;
}

export async function createOrdemServico(payload: OrdemServicoPayload) {
  const { data } = await api.post<OrdemServico>("/ordens-servico", payload);
  return data;
}

export async function updateOrdemServico(id: number, payload: OrdemServicoPayload) {
  const { data } = await api.put<OrdemServico>(`/ordens-servico/${id}`, payload);
  return data;
}

export async function deleteOrdemServico(id: number) {
  await api.delete(`/ordens-servico/${id}`);
}
