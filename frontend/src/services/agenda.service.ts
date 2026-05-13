import type { PagedResponse } from "@/types/api";
import type { Agendamento, AgendamentoPayload } from "@/types/agendamento";
import { api } from "./api";

export async function listAgendamentos(page = 0, size = 200) {
  const { data } = await api.get<PagedResponse<Agendamento>>(`/agendamentos?page=${page}&size=${size}`);
  return data;
}

export async function createAgendamento(payload: AgendamentoPayload) {
  const { data } = await api.post<Agendamento>("/agendamentos", payload);
  return data;
}

export async function updateAgendamento(id: number, payload: AgendamentoPayload) {
  const { data } = await api.put<Agendamento>(`/agendamentos/${id}`, payload);
  return data;
}

export async function deleteAgendamento(id: number) {
  await api.delete(`/agendamentos/${id}`);
}
