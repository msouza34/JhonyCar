export const statusLabel: Record<string, string> = {
  RECEBIDO: "Recebido",
  EM_ANALISE: "Em analise",
  AGUARDANDO_APROVACAO: "Aguardando aprovacao",
  EM_EXECUCAO: "Em execucao",
  FINALIZADO: "Finalizado",
  SIMULADA: "Simulada",
  EMITIDA: "Emitida",
  CANCELADA: "Cancelada",
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  PAGO: "Pago",
  ESTORNADO: "Estornado",
  AGENDADO: "Agendado",
  CONCLUIDO: "Concluido",
  CADASTRADO: "Cadastrado",
  CONVERTIDO_EM_OS: "Convertido em OS",
};

export const ordemServicoColumns = [
  "RECEBIDO",
  "EM_ANALISE",
  "AGUARDANDO_APROVACAO",
  "EM_EXECUCAO",
  "FINALIZADO",
] as const;
