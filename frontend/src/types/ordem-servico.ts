export type OrdemServicoStatus =
  | "RECEBIDO"
  | "EM_ANALISE"
  | "AGUARDANDO_APROVACAO"
  | "EM_EXECUCAO"
  | "FINALIZADO";

export interface OrdemServico {
  id: number;
  clienteId: number;
  clienteNome: string;
  veiculoId: number;
  veiculoPlaca: string;
  problemaRelatado: string;
  diagnostico?: string;
  valorTotal: number;
  status: OrdemServicoStatus;
  dataEntrada: string;
  dataSaida?: string;
  archived: boolean;
  updatedAt: string;
}

export interface OrdemServicoPayload {
  clienteId: number;
  veiculoId: number;
  problemaRelatado: string;
  diagnostico?: string;
  valorTotal: number;
  status: OrdemServicoStatus;
  dataEntrada?: string;
  dataSaida?: string;
}
