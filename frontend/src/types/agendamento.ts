export type AgendamentoStatus = "AGENDADO" | "CONCLUIDO" | "CANCELADO";

export interface Agendamento {
  id: number;
  clienteId: number;
  clienteNome: string;
  veiculoId: number;
  veiculoPlaca: string;
  dataHora: string;
  descricao: string;
  status: AgendamentoStatus;
}

export interface AgendamentoPayload {
  clienteId: number;
  veiculoId: number;
  dataHora: string;
  descricao: string;
  status: AgendamentoStatus;
}
