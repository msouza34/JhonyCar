export type OrcamentoStatus = "PENDENTE" | "APROVADO" | "RECUSADO";

export interface OrcamentoServicoItem {
  id: number;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export interface OrcamentoPecaItem {
  id: number;
  descricao: string;
  codigo: string;
  quantidade: number;
  valorUnitario: number;
  garantia?: string;
}

export interface Orcamento {
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
  status: OrcamentoStatus;
  criadoEm: string;
  validadeEm: string;
  vendedor: string;
  formaPagamento: string;
  desconto: number;
  valorTotal?: number;
  servicos: OrcamentoServicoItem[];
  pecas: OrcamentoPecaItem[];
  convertidoEmOs: boolean;
  osNumero?: string;
  atualizadoEm: string;
}

export interface OrcamentoPayload {
  clienteId?: number;
  clienteNome?: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  veiculoId?: number;
  veiculoModelo: string;
  veiculoAno: number;
  veiculoPlaca: string;
  status: OrcamentoStatus;
  validadeEm: string;
  vendedor: string;
  formaPagamento: string;
  desconto: number;
  servicos: OrcamentoServicoItem[];
  pecas: OrcamentoPecaItem[];
}
