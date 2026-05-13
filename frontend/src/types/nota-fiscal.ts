export type NotaFiscalStatus = "SIMULADA" | "EMITIDA" | "CANCELADA";

export interface NotaFiscal {
  id: number;
  numero: string;
  clienteNome: string;
  cpfCnpj: string;
  descricaoServico: string;
  valor: number;
  status: NotaFiscalStatus;
  dataEmissao: string;
  motivoCancelamento?: string;
  dataCancelamento?: string;
  ordemServicoId: number;
  linkPdf: string;
  linkWhatsapp: string;
}

export interface CancelarNotaPayload {
  motivoCancelamento: string;
}
