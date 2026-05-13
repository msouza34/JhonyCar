import type { PagedResponse } from "@/types/api";
import type {
  Veiculo,
  VeiculoImagemUploadResponse,
  VeiculoModeloOption,
  VeiculoModeloPayload,
  VeiculoPayload,
} from "@/types/veiculo";
import { api } from "./api";

const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;

let marcasCache: { data: string[]; expiresAt: number } | null = null;
const modelosCache = new Map<string, { data: VeiculoModeloOption[]; expiresAt: number }>();

export interface FipeImportStatus {
  tenantId: string;
  status: string;
  mensagem: string;
  iniciadoEm: string | null;
  atualizadoEm: string | null;
  finalizadoEm: string | null;
  totalMarcas: number;
  marcasProcessadas: number;
  marcasSucesso: number;
  marcasComErro: number;
  modelosInseridos: number;
  modelosIgnorados: number;
}

export async function listVeiculos(page = 0, size = 100) {
  const { data } = await api.get<PagedResponse<Veiculo>>(`/veiculos?page=${page}&size=${size}`);
  return data;
}

export async function listAllVeiculos(size = 100) {
  let page = 0;
  let totalPages = 1;
  const items: Veiculo[] = [];

  while (page < totalPages) {
    const response = await listVeiculos(page, size);
    items.push(...response.content);
    totalPages = Math.max(response.totalPages || 1, 1);
    page += 1;
  }

  return items;
}

export async function createVeiculo(payload: VeiculoPayload) {
  const { data } = await api.post<Veiculo>("/veiculos", payload);
  return data;
}

export async function updateVeiculo(id: number, payload: VeiculoPayload) {
  const { data } = await api.put<Veiculo>(`/veiculos/${id}`, payload);
  return data;
}

export async function deleteVeiculo(id: number) {
  await api.delete(`/veiculos/${id}`);
}

export async function importarFipeCatalogo() {
  const { data } = await api.post<{ status: string; mensagem: string; iniciadoEm: string }>("/admin/importar-fipe");
  return data;
}

export async function consultarStatusImportacaoFipe() {
  const { data } = await api.get<FipeImportStatus>("/admin/importar-fipe/status");
  return data;
}

export async function listMarcasVeiculo(forceRefresh = false) {
  if (!forceRefresh && marcasCache && marcasCache.expiresAt > Date.now()) {
    return marcasCache.data;
  }

  const { data } = await api.get<string[]>("/veiculos/marcas");
  const marcas = [...new Set(data.map((item) => item.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));

  marcasCache = {
    data: marcas,
    expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
  };

  return marcas;
}

export async function listModelosPorMarca(marca: string, forceRefresh = false) {
  const marcaNormalizada = marca.trim();
  if (!marcaNormalizada) {
    return [] as VeiculoModeloOption[];
  }

  const cacheKey = marcaNormalizada.toLowerCase();
  const cached = modelosCache.get(cacheKey);

  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const { data } = await api.get<VeiculoModeloOption[]>("/veiculos/modelos", { params: { marca: marcaNormalizada } });

  const uniqueByModelo = new Map<string, VeiculoModeloOption>();
  for (const item of data) {
    const modeloKey = item.modelo.trim().toLowerCase();
    if (!modeloKey || uniqueByModelo.has(modeloKey)) {
      continue;
    }
    uniqueByModelo.set(modeloKey, item);
  }

  const modelos = [...uniqueByModelo.values()].sort((a, b) => a.modelo.localeCompare(b.modelo, "pt-BR"));

  modelosCache.set(cacheKey, {
    data: modelos,
    expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
  });

  return modelos;
}

export async function createOrUpdateVeiculoModelo(payload: VeiculoModeloPayload) {
  const { data } = await api.post<VeiculoModeloOption>("/veiculos/modelos", payload);
  clearVeiculoCatalogCache();
  return data;
}

export async function uploadVeiculoModeloImagem(modeloId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<VeiculoImagemUploadResponse>(`/veiculos/modelos/${modeloId}/imagem-upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  clearVeiculoCatalogCache();
  return data;
}

export function clearVeiculoCatalogCache(marca?: string) {
  if (!marca) {
    marcasCache = null;
    modelosCache.clear();
    return;
  }

  modelosCache.delete(marca.trim().toLowerCase());
}
