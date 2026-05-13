import type { Cliente, ClientePayload } from "@/types/cliente";
import type { ClienteCentral } from "@/types/central";
import type { PagedResponse } from "@/types/api";
import { api } from "./api";

export async function listClientes(page = 0, size = 100) {
  const { data } = await api.get<PagedResponse<Cliente>>(`/clientes?page=${page}&size=${size}`);
  return data;
}

export async function listAllClientes(size = 100) {
  let page = 0;
  let totalPages = 1;
  const items: Cliente[] = [];

  while (page < totalPages) {
    const response = await listClientes(page, size);
    items.push(...response.content);
    totalPages = Math.max(response.totalPages || 1, 1);
    page += 1;
  }

  return items;
}

export async function getCliente(id: number) {
  const { data } = await api.get<Cliente>(`/clientes/${id}`);
  return data;
}

export async function getClienteCentral(id: number) {
  const { data } = await api.get<ClienteCentral>(`/clientes/${id}/central`);
  return data;
}

export async function getClienteDetalhes(id: number) {
  const { data } = await api.get<Pick<ClienteCentral, "cliente" | "veiculos" | "ordensServico" | "orcamentos" | "financeiro">>(
    `/clientes/${id}/detalhes`,
  );
  return data;
}

export async function createCliente(payload: ClientePayload) {
  const { data } = await api.post<Cliente>("/clientes", payload);
  return data;
}

export async function updateCliente(id: number, payload: ClientePayload) {
  const { data } = await api.put<Cliente>(`/clientes/${id}`, payload);
  return data;
}

export async function deleteCliente(id: number) {
  await api.delete(`/clientes/${id}`);
}
