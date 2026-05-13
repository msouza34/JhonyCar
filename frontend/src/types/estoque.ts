export type EstoqueCategoria = "Eletrica" | "Ignicao" | "Injecao";

export type EstoqueVisual = "bateria" | "alternador" | "motor" | "vela" | "cabo" | "fusivel" | "rele" | "sensor" | "bobina" | "interruptor";

export interface EstoqueItem {
  id: number;
  codigo: string;
  peca: string;
  categoria: EstoqueCategoria;
  fornecedor: string;
  estoque: number;
  minimo: number;
  precoUnitario: number;
  visual: EstoqueVisual;
  imagemUrl?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export type EstoqueFiltroStatus = "TODOS" | "EM_ESTOQUE" | "ESTOQUE_BAIXO" | "SEM_ESTOQUE";

export interface EstoqueItemPayload {
  codigo: string;
  peca: string;
  categoria: EstoqueCategoria;
  fornecedor: string;
  estoque: number;
  minimo: number;
  precoUnitario: number;
  visual: EstoqueVisual;
  imagemUrl?: string;
}
