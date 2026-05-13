import type { Orcamento, OrcamentoPayload, OrcamentoStatus } from "@/types/orcamento";
import { createCliente, listAllClientes } from "./clientes.service";
import { api } from "./api";

interface OrcamentoItemApi {
  id: number;
  descricao: string;
  codigo?: string;
  quantidade: number;
  valorUnitario: number;
  garantia?: string;
}

interface OrcamentoApi {
  id: number;
  numero: string;
  clienteId: number;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail: string;
  veiculoId?: number;
  veiculoModelo: string;
  veiculoAno: number;
  veiculoPlaca: string;
  veiculoChassi?: string;
  status: OrcamentoStatus;
  criadoEm: string;
  validadeEm: string;
  vendedor: string;
  formaPagamento: string;
  desconto: number;
  valorTotal: number;
  servicos: OrcamentoItemApi[];
  pecas: OrcamentoItemApi[];
  convertidoEmOs: boolean;
  osNumero?: string;
  atualizadoEm: string;
}

interface OrcamentoRequestApi {
  clienteId: number;
  veiculoId?: number;
  veiculoModelo: string;
  veiculoAno: number;
  veiculoPlaca: string;
  status: OrcamentoStatus;
  validadeEm: string;
  vendedor: string;
  formaPagamento: string;
  desconto: number;
  servicos: OrcamentoItemApi[];
  pecas: OrcamentoItemApi[];
}

function toDateOnly(value: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return value.slice(0, 10);
}

function normalizeText(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function stripDigits(value?: string) {
  return (value ?? "").replace(/\D/g, "");
}

function buildCpfCnpjFallback(seed: string) {
  const digits = stripDigits(seed + Date.now().toString() + Math.floor(Math.random() * 1000).toString());
  return digits.padEnd(11, "0").slice(0, 11);
}

function buildValidEmail(nome: string, email?: string) {
  const raw = (email ?? "").trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return raw;
  }
  const base = normalizeText(nome)
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "cliente";
  return `${base}.${Date.now()}@jhonycar.local`;
}

function mapApiToDomain(item: OrcamentoApi): Orcamento {
  return {
    id: item.id,
    numero: item.numero,
    clienteId: item.clienteId,
    clienteNome: item.clienteNome,
    clienteTelefone: item.clienteTelefone,
    clienteEmail: item.clienteEmail,
    veiculoId: item.veiculoId,
    veiculoModelo: item.veiculoModelo,
    veiculoAno: item.veiculoAno,
    veiculoPlaca: item.veiculoPlaca,
    status: item.status,
    criadoEm: item.criadoEm,
    validadeEm: item.validadeEm,
    vendedor: item.vendedor,
    formaPagamento: item.formaPagamento,
    desconto: Number(item.desconto) || 0,
    valorTotal: Number(item.valorTotal) || 0,
    servicos: (item.servicos ?? []).map((servico) => ({
      id: servico.id,
      descricao: servico.descricao,
      quantidade: Number(servico.quantidade) || 0,
      valorUnitario: Number(servico.valorUnitario) || 0,
    })),
    pecas: (item.pecas ?? []).map((peca) => ({
      id: peca.id,
      descricao: peca.descricao,
      codigo: peca.codigo ?? "",
      quantidade: Number(peca.quantidade) || 0,
      valorUnitario: Number(peca.valorUnitario) || 0,
      garantia: peca.garantia,
    })),
    convertidoEmOs: Boolean(item.convertidoEmOs),
    osNumero: item.osNumero,
    atualizadoEm: item.atualizadoEm,
  };
}

async function resolveClienteId(payload: OrcamentoPayload) {
  if (payload.clienteId && payload.clienteId > 0) {
    return payload.clienteId;
  }

  const nome = payload.clienteNome?.trim() ?? "";
  const telefone = stripDigits(payload.clienteTelefone);
  const email = normalizeText(payload.clienteEmail);
  const clientes = await listAllClientes(200);

  const existente =
    clientes.find((item) => normalizeText(item.nome) === normalizeText(nome)) ??
    clientes.find((item) => normalizeText(item.email) === email) ??
    clientes.find((item) => stripDigits(item.telefone) === telefone);

  if (existente) {
    return existente.id;
  }

  if (!nome) {
    throw new Error("Nao foi possivel identificar o cliente do orcamento. Informe o cliente na central.");
  }

  const criado = await createCliente({
    nome,
    cpfCnpj: buildCpfCnpjFallback(`${payload.veiculoPlaca}${telefone}`),
    telefone: telefone || "11999999999",
    email: buildValidEmail(nome, payload.clienteEmail),
  });

  return criado.id;
}

function mapPayloadToApi(payload: OrcamentoPayload, clienteId: number): OrcamentoRequestApi {
  return {
    clienteId,
    veiculoId: payload.veiculoId,
    veiculoModelo: payload.veiculoModelo.trim(),
    veiculoAno: Number(payload.veiculoAno),
    veiculoPlaca: payload.veiculoPlaca.trim().toUpperCase(),
    status: payload.status,
    validadeEm: toDateOnly(payload.validadeEm),
    vendedor: (payload.vendedor ?? "admin").trim() || "admin",
    formaPagamento: payload.formaPagamento.trim(),
    desconto: Number(payload.desconto) || 0,
    servicos: (payload.servicos ?? []).map((item) => ({
      id: item.id,
      descricao: item.descricao.trim(),
      quantidade: Number(item.quantidade) || 0,
      valorUnitario: Number(item.valorUnitario) || 0,
      codigo: undefined,
      garantia: undefined,
    })),
    pecas: (payload.pecas ?? []).map((item) => ({
      id: item.id,
      descricao: item.descricao.trim(),
      codigo: item.codigo.trim().toUpperCase(),
      quantidade: Number(item.quantidade) || 0,
      valorUnitario: Number(item.valorUnitario) || 0,
      garantia: item.garantia?.trim() || undefined,
    })),
  };
}

export async function listOrcamentos(clienteId?: number) {
  const { data } = await api.get<OrcamentoApi[]>("/orcamentos", {
    params: clienteId ? { clienteId } : undefined,
  });
  return data.map(mapApiToDomain);
}

export async function createOrcamento(payload: OrcamentoPayload) {
  const clienteId = await resolveClienteId(payload);
  const request = mapPayloadToApi(payload, clienteId);
  const { data } = await api.post<OrcamentoApi>("/orcamentos", request);
  return mapApiToDomain(data);
}

export async function updateOrcamento(id: number, payload: OrcamentoPayload) {
  const clienteId = await resolveClienteId(payload);
  const request = mapPayloadToApi(payload, clienteId);
  const { data } = await api.put<OrcamentoApi>(`/orcamentos/${id}`, request);
  return mapApiToDomain(data);
}

export async function deleteOrcamento(id: number) {
  await api.delete(`/orcamentos/${id}`);
}

export async function duplicateOrcamento(id: number) {
  const { data } = await api.post<OrcamentoApi>(`/orcamentos/${id}/duplicar`);
  return mapApiToDomain(data);
}

export async function updateOrcamentoStatus(id: number, status: OrcamentoStatus) {
  const { data } = await api.patch<OrcamentoApi>(`/orcamentos/${id}/status`, null, {
    params: { status },
  });
  return mapApiToDomain(data);
}

export async function converterOrcamentoEmOs(id: number, osNumero?: string) {
  const { data } = await api.post<OrcamentoApi>(`/orcamentos/${id}/converter`, {
    osNumero,
  });
  return mapApiToDomain(data);
}
