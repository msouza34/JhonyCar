import type { Agendamento } from "./agendamento";
import type { Cliente } from "./cliente";
import type { Financeiro } from "./financeiro";
import type { NotaFiscal } from "./nota-fiscal";
import type { Orcamento } from "./orcamento";
import type { OrdemServico } from "./ordem-servico";
import type { Veiculo } from "./veiculo";

export interface ClienteCentral {
  cliente: Cliente;
  veiculos: Veiculo[];
  ordensServico: OrdemServico[];
  orcamentos: Orcamento[];
  financeiro: Financeiro[];
  notasFiscais: NotaFiscal[];
  agendamentos: Agendamento[];
}
