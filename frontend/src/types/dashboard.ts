export interface StatusCount {
  status: string;
  quantidade: number;
}

export interface DashboardResumo {
  totalClientes: number;
  totalVeiculos: number;
  totalOrdensServico: number;
  ordensEmAberto: number;
  faturamentoMensal: number;
  notasEmitidas: number;
  notasCanceladas: number;
  ordensPorStatus: StatusCount[];
}
