export interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  clienteId: number;
  clienteNome: string;
}

export interface VeiculoPayload {
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  clienteId: number;
}

export interface VeiculoModeloOption {
  id: number;
  marca: string;
  modelo: string;
  imagemUrl: string;
}

export interface VeiculoModeloPayload {
  marca: string;
  modelo: string;
  imagemUrl?: string;
  ativo?: boolean;
}

export interface VeiculoImagemUploadResponse {
  modeloId: number;
  imagemUrl: string;
}
