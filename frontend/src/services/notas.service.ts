import type { PagedResponse } from "@/types/api";
import type { CancelarNotaPayload, NotaFiscal } from "@/types/nota-fiscal";
import { api } from "./api";

export async function listNotas(page = 0, size = 200) {
  const { data } = await api.get<PagedResponse<NotaFiscal>>(`/notas?page=${page}&size=${size}`);
  return data;
}

export async function simularNota(osId: number) {
  const { data } = await api.post<NotaFiscal>(`/notas/simular/${osId}`);
  return data;
}

export async function cancelarNota(id: number, payload: CancelarNotaPayload) {
  const { data } = await api.put<NotaFiscal>(`/notas/${id}/cancelar`, payload);
  return data;
}

export async function getNotaPdfBlob(id: number) {
  const { data } = await api.get<Blob>(`/notas/${id}/pdf`, { responseType: "blob" });
  return data;
}
