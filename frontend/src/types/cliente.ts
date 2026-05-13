export interface Cliente {
  id: number;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  ativo?: boolean;
  dataCadastro?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  complemento?: string;
  observacoes?: string;
}

export interface ClientePayload {
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  ativo?: boolean;
  dataCadastro?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  complemento?: string;
  observacoes?: string;
}
