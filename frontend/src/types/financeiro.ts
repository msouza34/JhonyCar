export type FinanceiroStatus = "PENDENTE" | "PAGO" | "ESTORNADO";
export type FinanceiroTipo = "SERVICO" | "ORCAMENTO" | "OUTROS";

export interface Financeiro {
  id: number;
  clienteId?: number;
  ordemServicoId?: number;
  notaFiscalId?: number;
  valor: number;
  tipo: FinanceiroTipo;
  formaPagamento: string;
  status: FinanceiroStatus;
  data: string;
  linkWhatsapp: string;
}

export interface FinanceiroPayload {
  clienteId: number;
  ordemServicoId?: number;
  valor: number;
  tipo?: FinanceiroTipo;
  formaPagamento: string;
  status: FinanceiroStatus;
  data?: string;
}
