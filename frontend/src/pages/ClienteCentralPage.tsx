import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Car, FileText, Wallet, Wrench } from "lucide-react";
import Button from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Table from "@/components/Table";
import VeiculoModeloSelector from "@/components/veiculos/VeiculoModeloSelector";
import { getErrorMessage } from "@/services/api";
import { createAgendamento, deleteAgendamento, updateAgendamento } from "@/services/agenda.service";
import { deleteCliente, getClienteCentral, updateCliente } from "@/services/clientes.service";
import { deleteFinanceiro, updateFinanceiro } from "@/services/financeiro.service";
import { cancelarNota, getNotaPdfBlob, simularNota } from "@/services/notas.service";
import { createOrdemServico, deleteOrdemServico, updateOrdemServico } from "@/services/ordens.service";
import {
  converterOrcamentoEmOs,
  createOrcamento,
  deleteOrcamento,
  updateOrcamento,
  updateOrcamentoStatus,
} from "@/services/orcamentos.service";
import { createVeiculo, deleteVeiculo, updateVeiculo } from "@/services/veiculos.service";
import { useAuthStore } from "@/store/auth.store";
import type { Agendamento } from "@/types/agendamento";
import type { ClienteCentral } from "@/types/central";
import type { Financeiro } from "@/types/financeiro";
import type { NotaFiscal } from "@/types/nota-fiscal";
import type { Orcamento, OrcamentoPayload } from "@/types/orcamento";
import type { OrdemServico } from "@/types/ordem-servico";
import type { Veiculo } from "@/types/veiculo";
import { ordemServicoColumns, statusLabel } from "@/utils/status";

const tabs = ["dados", "veiculos", "ordens", "orcamentos", "financeiro", "notas", "agenda", "fluxo"] as const;
type Tab = (typeof tabs)[number];
const tabLabel: Record<Tab, string> = {
  dados: "Dados do cliente",
  veiculos: "Veiculos",
  ordens: "Ordens de servico",
  orcamentos: "Orcamentos",
  financeiro: "Financeiro",
  notas: "Notas fiscais",
  agenda: "Agenda",
  fluxo: "Fluxo integrado",
};

const clienteSchema = z.object({
  nome: z.string().min(2, "Nome obrigatorio"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ invalido"),
  telefone: z.string().min(8, "Telefone invalido"),
  email: z.string().email("Email invalido"),
  ativo: z.boolean(),
  dataCadastro: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  complemento: z.string().optional(),
  observacoes: z.string().optional(),
});

const veiculoSchema = z.object({
  placa: z.string().min(6, "Placa invalida"),
  modelo: z.string().min(2, "Modelo obrigatorio"),
  marca: z.string().min(2, "Marca obrigatoria"),
  ano: z.coerce.number().min(1900).max(2100),
});

const ordemSchema = z.object({
  veiculoId: z.coerce.number().min(1, "Veiculo obrigatorio"),
  problemaRelatado: z.string().min(3, "Descreva o problema"),
  diagnostico: z.string().optional(),
  valorTotal: z.coerce.number().min(0, "Valor invalido"),
  status: z.enum(ordemServicoColumns),
});

const agendaSchema = z.object({
  veiculoId: z.coerce.number().min(1, "Veiculo obrigatorio"),
  dataHora: z.string().min(1, "Data obrigatoria"),
  descricao: z.string().min(3, "Descricao obrigatoria"),
  status: z.enum(["AGENDADO", "CONCLUIDO", "CANCELADO"]),
});

const financeiroSchema = z.object({
  ordemServicoId: z.coerce.number().min(1, "OS obrigatoria"),
  valor: z.coerce.number().min(0, "Valor invalido"),
  formaPagamento: z.string().min(1, "Forma de pagamento obrigatoria"),
  status: z.enum(["PENDENTE", "PAGO", "ESTORNADO"]),
  data: z.string().min(1, "Data obrigatoria"),
});

const orcamentoSchema = z.object({
  veiculoModelo: z.string().min(2, "Modelo obrigatorio"),
  veiculoAno: z.coerce.number().min(1900).max(2100),
  veiculoPlaca: z.string().min(6, "Placa invalida"),
  status: z.enum(["PENDENTE", "APROVADO", "RECUSADO"]),
  validadeEm: z.string().min(1, "Validade obrigatoria"),
  formaPagamento: z.string().min(1, "Forma de pagamento obrigatoria"),
  desconto: z.coerce.number().min(0, "Desconto invalido"),
  servicoDescricao: z.string().min(3, "Servico obrigatorio"),
  servicoValor: z.coerce.number().min(0, "Valor do servico invalido"),
  pecaDescricao: z.string().min(2, "Peca obrigatoria"),
  pecaCodigo: z.string().min(2, "Codigo obrigatorio"),
  pecaValor: z.coerce.number().min(0, "Valor da peca invalido"),
});

const emitirNotaSchema = z.object({
  ordemServicoId: z.coerce.number().min(1, "Selecione uma OS finalizada"),
});

const cancelarNotaSchema = z.object({
  motivoCancelamento: z.string().min(3, "Informe o motivo"),
});

type ClienteFormData = z.infer<typeof clienteSchema>;
type VeiculoFormData = z.infer<typeof veiculoSchema>;
type OrdemFormData = z.infer<typeof ordemSchema>;
type AgendaFormData = z.infer<typeof agendaSchema>;
type FinanceiroFormData = z.infer<typeof financeiroSchema>;
type OrcamentoFormData = z.infer<typeof orcamentoSchema>;
type EmitirNotaFormData = z.infer<typeof emitirNotaSchema>;
type CancelarNotaFormData = z.infer<typeof cancelarNotaSchema>;

interface FluxoItem {
  id: string;
  data: string;
  modulo: "VEICULO" | "ORCAMENTO" | "OS" | "AGENDA" | "FINANCEIRO" | "NOTA";
  origem: "INTERNO" | "EXTERNO";
  titulo: string;
  descricao: string;
  status: string;
  linkExterno?: string;
  linkLabel?: string;
  notaFiscalId?: number;
  ordemId?: number;
  agendaId?: number;
  financeiroId?: number;
  orcamentoId?: number;
  veiculoId?: number;
}

function addDays(iso: string, days: number) {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function toInputDate(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toIsoFromInputDate(value: string) {
  if (!value) return new Date().toISOString();
  return new Date(`${value}T23:59:00`).toISOString();
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeText(value: string | undefined | null) {
  return (value ?? "").trim().toLowerCase();
}

function normalizePlaca(value: string | undefined | null) {
  return (value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function parseOsId(osNumero?: string) {
  if (!osNumero) return null;
  const match = /^OS-(\d+)$/i.exec(osNumero.trim());
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

function calcOrcamentoTotal(item: Orcamento) {
  const servicos = item.servicos.reduce((acc, current) => acc + Number(current.quantidade) * Number(current.valorUnitario), 0);
  const pecas = item.pecas.reduce((acc, current) => acc + Number(current.quantidade) * Number(current.valorUnitario), 0);
  return servicos + pecas - Number(item.desconto || 0);
}

function buildOrcamentoWhatsappLink(item: Orcamento) {
  const rawPhone = digitsOnly(item.clienteTelefone);
  const basePhone = rawPhone.length >= 10 ? rawPhone : "11999999999";
  const phone = basePhone.startsWith("55") ? basePhone : `55${basePhone}`;
  const message = [
    `Ola, ${item.clienteNome}!`,
    `Seu orcamento ${item.numero} esta ${(statusLabel[item.status] ?? item.status).toLowerCase()}.`,
    `Veiculo: ${item.veiculoModelo} ${item.veiculoAno} - ${item.veiculoPlaca}.`,
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function ClienteCentralPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>("dados");
  const [data, setData] = useState<ClienteCentral | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openingPdfId, setOpeningPdfId] = useState<number | null>(null);

  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [viewOnlyCliente, setViewOnlyCliente] = useState(false);
  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null);
  const [viewOnlyVeiculo, setViewOnlyVeiculo] = useState(false);
  const [isOrdemModalOpen, setIsOrdemModalOpen] = useState(false);
  const [editingOrdem, setEditingOrdem] = useState<OrdemServico | null>(null);
  const [viewOnlyOrdem, setViewOnlyOrdem] = useState(false);
  const [isFinanceiroModalOpen, setIsFinanceiroModalOpen] = useState(false);
  const [editingFinanceiro, setEditingFinanceiro] = useState<Financeiro | null>(null);
  const [viewOnlyFinanceiro, setViewOnlyFinanceiro] = useState(false);
  const [isOrcamentoModalOpen, setIsOrcamentoModalOpen] = useState(false);
  const [editingOrcamento, setEditingOrcamento] = useState<Orcamento | null>(null);
  const [viewOnlyOrcamento, setViewOnlyOrcamento] = useState(false);
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<Agendamento | null>(null);
  const [viewOnlyAgenda, setViewOnlyAgenda] = useState(false);
  const [cancelandoNota, setCancelandoNota] = useState<NotaFiscal | null>(null);

  const clienteId = useMemo(() => Number(id), [id]);
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const canManage = role === "ADMIN";
  const visibleTabs = useMemo(
    () => (canManage ? tabs : tabs.filter((tab): tab is Exclude<Tab, "financeiro"> => tab !== "financeiro")),
    [canManage],
  );

  const clienteForm = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      ativo: true,
      dataCadastro: new Date().toISOString().slice(0, 10),
      cep: "",
      endereco: "",
      numero: "",
      bairro: "",
      cidade: "",
      uf: "",
      complemento: "",
      observacoes: "",
    },
  });

  const veiculoForm = useForm<VeiculoFormData>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: { ano: new Date().getFullYear() },
  });

  const ordemForm = useForm<OrdemFormData>({
    resolver: zodResolver(ordemSchema),
    defaultValues: { status: "RECEBIDO", valorTotal: 0 },
  });

  const agendaForm = useForm<AgendaFormData>({
    resolver: zodResolver(agendaSchema),
    defaultValues: { status: "AGENDADO" },
  });

  const financeiroForm = useForm<FinanceiroFormData>({
    resolver: zodResolver(financeiroSchema),
    defaultValues: { ordemServicoId: 0, valor: 0, formaPagamento: "", status: "PENDENTE", data: "" },
  });

  const orcamentoForm = useForm<OrcamentoFormData>({
    resolver: zodResolver(orcamentoSchema),
    defaultValues: {
      veiculoModelo: "",
      veiculoAno: new Date().getFullYear(),
      veiculoPlaca: "",
      status: "PENDENTE",
      validadeEm: toInputDate(addDays(new Date().toISOString(), 7)),
      formaPagamento: "PIX / Cartao",
      desconto: 0,
      servicoDescricao: "Diagnostico eletrico",
      servicoValor: 120,
      pecaDescricao: "Bateria Moura 60Ah",
      pecaCodigo: "BAT-001",
      pecaValor: 450,
    },
  });

  const emitirNotaForm = useForm<EmitirNotaFormData>({
    resolver: zodResolver(emitirNotaSchema),
    defaultValues: { ordemServicoId: 0 },
  });

  const cancelarNotaForm = useForm<CancelarNotaFormData>({
    resolver: zodResolver(cancelarNotaSchema),
    defaultValues: { motivoCancelamento: "" },
  });

  useEffect(() => {
    if (!Number.isFinite(clienteId)) return;
    void loadCentral(clienteId);
  }, [clienteId]);

  const loadCentral = async (value: number) => {
    setLoading(true);
    setError(null);
    try {
      const centralPayload = await getClienteCentral(value);
      setData(centralPayload);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const clienteOrcamentos = useMemo(() => {
    return data?.orcamentos ?? [];
  }, [data]);

  const resumo = useMemo(() => {
    if (!data) return null;
    const totalFinanceiro = data.financeiro.reduce((acc, item) => acc + Number(item.valor), 0);
    const totalOrcamentos = clienteOrcamentos.reduce((acc, item) => acc + calcOrcamentoTotal(item), 0);
    return {
      veiculos: data.veiculos.length,
      ordens: data.ordensServico.length,
      orcamentos: clienteOrcamentos.length,
      notas: data.notasFiscais.length,
      agenda: data.agendamentos.length,
      totalFinanceiro,
      totalOrcamentos,
    };
  }, [data, clienteOrcamentos]);

  const ordensFinalizadas = useMemo(() => {
    if (!data) return [];
    return data.ordensServico.filter((item) => item.status === "FINALIZADO");
  }, [data]);

  const fluxoIntegrado = useMemo(() => {
    if (!data) return [];
    const items: FluxoItem[] = [];

    for (const veiculo of data.veiculos) {
      items.push({
        id: `veiculo-${veiculo.id}`,
        data: new Date().toISOString(),
        modulo: "VEICULO",
        origem: "INTERNO",
        titulo: `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo}`,
        descricao: `Cadastro de veiculo ${veiculo.ano}`,
        status: "CADASTRADO",
        veiculoId: veiculo.id,
      });
    }

    for (const item of data.ordensServico) {
      items.push({
        id: `os-${item.id}`,
        data: item.dataSaida ?? item.dataEntrada,
        modulo: "OS",
        origem: "INTERNO",
        titulo: `OS #${item.id} - ${item.veiculoPlaca}`,
        descricao: item.problemaRelatado,
        status: item.status,
        ordemId: item.id,
      });
    }

    for (const item of data.agendamentos) {
      items.push({
        id: `agenda-${item.id}`,
        data: item.dataHora,
        modulo: "AGENDA",
        origem: "INTERNO",
        titulo: `Agendamento #${item.id} - ${item.veiculoPlaca}`,
        descricao: item.descricao,
        status: item.status,
        agendaId: item.id,
      });
    }

    for (const item of clienteOrcamentos) {
      items.push({
        id: `orc-${item.id}`,
        data: item.atualizadoEm || item.criadoEm,
        modulo: "ORCAMENTO",
        origem: "EXTERNO",
        titulo: `${item.numero} - ${item.veiculoPlaca}`,
        descricao: `Total ${money.format(calcOrcamentoTotal(item))}`,
        status: item.convertidoEmOs ? "CONVERTIDO_EM_OS" : item.status,
        linkExterno: buildOrcamentoWhatsappLink(item),
        linkLabel: "WhatsApp",
        orcamentoId: item.id,
      });
    }

    for (const item of data.financeiro) {
      items.push({
        id: `fin-${item.id}`,
        data: item.data,
        modulo: "FINANCEIRO",
        origem: item.status === "PENDENTE" ? "EXTERNO" : "INTERNO",
        titulo: `Financeiro #${item.id} - OS #${item.ordemServicoId}`,
        descricao: `${item.formaPagamento} - ${money.format(Number(item.valor))}`,
        status: item.status,
        linkExterno: item.linkWhatsapp,
        linkLabel: "WhatsApp",
        financeiroId: item.id,
      });
    }

    for (const item of data.notasFiscais) {
      items.push({
        id: `nota-${item.id}`,
        data: item.dataEmissao,
        modulo: "NOTA",
        origem: "EXTERNO",
        titulo: `Nota ${item.numero} - OS #${item.ordemServicoId}`,
        descricao: `${item.descricaoServico} - ${money.format(Number(item.valor))}`,
        status: item.status,
        linkExterno: item.linkWhatsapp,
        linkLabel: "Enviar nota",
        notaFiscalId: item.id,
      });
    }

    return items.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [data, clienteOrcamentos, money]);

  const openPdf = async (notaId: number) => {
    setOpeningPdfId(notaId);
    try {
      const pdfBlob = await getNotaPdfBlob(notaId);
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setOpeningPdfId(null);
    }
  };

  const openEditCliente = () => {
    if (!data) return;
    setViewOnlyCliente(false);
    clienteForm.reset({
      nome: data.cliente.nome,
      cpfCnpj: data.cliente.cpfCnpj,
      telefone: data.cliente.telefone,
      email: data.cliente.email,
      ativo: data.cliente.ativo ?? true,
      dataCadastro: data.cliente.dataCadastro?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      cep: data.cliente.cep ?? "",
      endereco: data.cliente.endereco ?? "",
      numero: data.cliente.numero ?? "",
      bairro: data.cliente.bairro ?? "",
      cidade: data.cliente.cidade ?? "",
      uf: data.cliente.uf ?? "",
      complemento: data.cliente.complemento ?? "",
      observacoes: data.cliente.observacoes ?? "",
    });
    setIsClienteModalOpen(true);
  };

  const openViewCliente = () => {
    if (!data) return;
    setViewOnlyCliente(true);
    clienteForm.reset({
      nome: data.cliente.nome,
      cpfCnpj: data.cliente.cpfCnpj,
      telefone: data.cliente.telefone,
      email: data.cliente.email,
      ativo: data.cliente.ativo ?? true,
      dataCadastro: data.cliente.dataCadastro?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      cep: data.cliente.cep ?? "",
      endereco: data.cliente.endereco ?? "",
      numero: data.cliente.numero ?? "",
      bairro: data.cliente.bairro ?? "",
      cidade: data.cliente.cidade ?? "",
      uf: data.cliente.uf ?? "",
      complemento: data.cliente.complemento ?? "",
      observacoes: data.cliente.observacoes ?? "",
    });
    setIsClienteModalOpen(true);
  };

  const onSubmitCliente = async (values: ClienteFormData) => {
    if (!canManage || viewOnlyCliente) return;
    try {
      await updateCliente(clienteId, {
        ...values,
        dataCadastro: values.dataCadastro?.trim() ? values.dataCadastro : undefined,
        uf: values.uf?.trim().toUpperCase() || undefined,
        cep: values.cep?.trim() || undefined,
        endereco: values.endereco?.trim() || undefined,
        numero: values.numero?.trim() || undefined,
        bairro: values.bairro?.trim() || undefined,
        cidade: values.cidade?.trim() || undefined,
        complemento: values.complemento?.trim() || undefined,
        observacoes: values.observacoes?.trim() || undefined,
      });
      setIsClienteModalOpen(false);
      setViewOnlyCliente(false);
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteCliente = async () => {
    if (!canManage || !data) return;
    if (!window.confirm(`Excluir cliente ${data.cliente.nome}?`)) return;
    try {
      await deleteCliente(clienteId);
      navigate("/clientes");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openCreateVeiculo = () => {
    setEditingVeiculo(null);
    setViewOnlyVeiculo(false);
    veiculoForm.reset({
      placa: "",
      modelo: "",
      marca: "",
      ano: new Date().getFullYear(),
    });
    setIsVeiculoModalOpen(true);
  };

  const openEditVeiculo = (veiculo: Veiculo) => {
    setEditingVeiculo(veiculo);
    setViewOnlyVeiculo(false);
    veiculoForm.reset({
      placa: veiculo.placa,
      modelo: veiculo.modelo,
      marca: veiculo.marca,
      ano: veiculo.ano,
    });
    setIsVeiculoModalOpen(true);
  };

  const openViewVeiculo = (veiculo: Veiculo) => {
    setEditingVeiculo(veiculo);
    setViewOnlyVeiculo(true);
    veiculoForm.reset({
      placa: veiculo.placa,
      modelo: veiculo.modelo,
      marca: veiculo.marca,
      ano: veiculo.ano,
    });
    setIsVeiculoModalOpen(true);
  };

  const onSubmitVeiculo = async (values: VeiculoFormData) => {
    if (!canManage || viewOnlyVeiculo) return;
    try {
      const payload = { ...values, clienteId };
      if (editingVeiculo) {
        await updateVeiculo(editingVeiculo.id, payload);
      } else {
        await createVeiculo(payload);
      }
      setIsVeiculoModalOpen(false);
      setEditingVeiculo(null);
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteVeiculo = async (veiculo: Veiculo) => {
    if (!window.confirm(`Excluir veiculo ${veiculo.placa}?`)) return;
    try {
      await deleteVeiculo(veiculo.id);
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openCreateOrdem = (veiculoId?: number) => {
    setEditingOrdem(null);
    setViewOnlyOrdem(false);
    ordemForm.reset({
      veiculoId: veiculoId ?? 0,
      problemaRelatado: "",
      diagnostico: "",
      valorTotal: 0,
      status: "RECEBIDO",
    });
    setIsOrdemModalOpen(true);
  };

  const openEditOrdem = (ordem: OrdemServico) => {
    setEditingOrdem(ordem);
    setViewOnlyOrdem(false);
    ordemForm.reset({
      veiculoId: ordem.veiculoId,
      problemaRelatado: ordem.problemaRelatado,
      diagnostico: ordem.diagnostico ?? "",
      valorTotal: Number(ordem.valorTotal),
      status: ordem.status,
    });
    setIsOrdemModalOpen(true);
  };

  const openViewOrdem = (ordem: OrdemServico) => {
    setEditingOrdem(ordem);
    setViewOnlyOrdem(true);
    ordemForm.reset({
      veiculoId: ordem.veiculoId,
      problemaRelatado: ordem.problemaRelatado,
      diagnostico: ordem.diagnostico ?? "",
      valorTotal: Number(ordem.valorTotal),
      status: ordem.status,
    });
    setIsOrdemModalOpen(true);
  };

  const onSubmitOrdem = async (values: OrdemFormData) => {
    if (!canManage || viewOnlyOrdem) return;
    try {
      const payload = {
        clienteId,
        veiculoId: values.veiculoId,
        problemaRelatado: values.problemaRelatado,
        diagnostico: values.diagnostico,
        valorTotal: values.valorTotal,
        status: values.status,
      };
      if (editingOrdem) {
        await updateOrdemServico(editingOrdem.id, {
          ...payload,
          dataEntrada: editingOrdem.dataEntrada,
          dataSaida: editingOrdem.dataSaida,
        });
      } else {
        await createOrdemServico(payload);
      }
      setIsOrdemModalOpen(false);
      setEditingOrdem(null);
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteOrdem = async (ordem: OrdemServico) => {
    if (!canManage) return;
    if (!window.confirm(`Excluir OS #${ordem.id}?`)) return;
    try {
      await deleteOrdemServico(ordem.id);
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openEditFinanceiro = (item: Financeiro) => {
    setEditingFinanceiro(item);
    setViewOnlyFinanceiro(false);
    financeiroForm.reset({
      ordemServicoId: item.ordemServicoId ?? 0,
      valor: Number(item.valor),
      formaPagamento: item.formaPagamento,
      status: item.status,
      data: item.data,
    });
    setIsFinanceiroModalOpen(true);
  };

  const openViewFinanceiro = (item: Financeiro) => {
    setEditingFinanceiro(item);
    setViewOnlyFinanceiro(true);
    financeiroForm.reset({
      ordemServicoId: item.ordemServicoId ?? 0,
      valor: Number(item.valor),
      formaPagamento: item.formaPagamento,
      status: item.status,
      data: item.data,
    });
    setIsFinanceiroModalOpen(true);
  };

  const onSubmitFinanceiro = async (values: FinanceiroFormData) => {
    if (!canManage || viewOnlyFinanceiro || !editingFinanceiro) return;
    try {
      await updateFinanceiro(editingFinanceiro.id, {
        clienteId: data?.cliente.id ?? editingFinanceiro.clienteId ?? clienteId,
        ordemServicoId: values.ordemServicoId,
        valor: values.valor,
        formaPagamento: values.formaPagamento,
        status: values.status,
        data: values.data,
      });
      setIsFinanceiroModalOpen(false);
      setEditingFinanceiro(null);
      setViewOnlyFinanceiro(false);
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const marcarFinanceiroComoPago = async (item: Financeiro) => {
    if (!canManage) return;
    try {
      await updateFinanceiro(item.id, {
        clienteId: data?.cliente.id ?? item.clienteId ?? clienteId,
        ordemServicoId: item.ordemServicoId,
        valor: Number(item.valor),
        formaPagamento: item.formaPagamento,
        status: "PAGO",
        data: item.data,
      });
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteFinanceiro = async (item: Financeiro) => {
    if (!canManage) return;
    if (!window.confirm(`Excluir registro financeiro #${item.id}?`)) return;
    try {
      await deleteFinanceiro(item.id);
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openCreateOrcamento = () => {
    if (!data) return;
    const firstVehicle = data.veiculos[0];

    setEditingOrcamento(null);
    setViewOnlyOrcamento(false);
    orcamentoForm.reset({
      veiculoModelo: firstVehicle?.modelo ?? "",
      veiculoAno: firstVehicle?.ano ?? new Date().getFullYear(),
      veiculoPlaca: firstVehicle?.placa ?? "",
      status: "PENDENTE",
      validadeEm: toInputDate(addDays(new Date().toISOString(), 7)),
      formaPagamento: "PIX / Cartao",
      desconto: 0,
      servicoDescricao: "Diagnostico eletrico",
      servicoValor: 120,
      pecaDescricao: "Bateria Moura 60Ah",
      pecaCodigo: "BAT-001",
      pecaValor: 450,
    });
    setIsOrcamentoModalOpen(true);
  };

  const openEditOrcamento = (item: Orcamento) => {
    setEditingOrcamento(item);
    setViewOnlyOrcamento(false);
    orcamentoForm.reset({
      veiculoModelo: item.veiculoModelo,
      veiculoAno: item.veiculoAno,
      veiculoPlaca: item.veiculoPlaca,
      status: item.status,
      validadeEm: toInputDate(item.validadeEm),
      formaPagamento: item.formaPagamento,
      desconto: Number(item.desconto || 0),
      servicoDescricao: item.servicos[0]?.descricao ?? "",
      servicoValor: Number(item.servicos[0]?.valorUnitario ?? 0),
      pecaDescricao: item.pecas[0]?.descricao ?? "",
      pecaCodigo: item.pecas[0]?.codigo ?? "",
      pecaValor: Number(item.pecas[0]?.valorUnitario ?? 0),
    });
    setIsOrcamentoModalOpen(true);
  };

  const openViewOrcamento = (item: Orcamento) => {
    setEditingOrcamento(item);
    setViewOnlyOrcamento(true);
    orcamentoForm.reset({
      veiculoModelo: item.veiculoModelo,
      veiculoAno: item.veiculoAno,
      veiculoPlaca: item.veiculoPlaca,
      status: item.status,
      validadeEm: toInputDate(item.validadeEm),
      formaPagamento: item.formaPagamento,
      desconto: Number(item.desconto || 0),
      servicoDescricao: item.servicos[0]?.descricao ?? "",
      servicoValor: Number(item.servicos[0]?.valorUnitario ?? 0),
      pecaDescricao: item.pecas[0]?.descricao ?? "",
      pecaCodigo: item.pecas[0]?.codigo ?? "",
      pecaValor: Number(item.pecas[0]?.valorUnitario ?? 0),
    });
    setIsOrcamentoModalOpen(true);
  };

  const onSubmitOrcamento = async (values: OrcamentoFormData) => {
    if (!canManage || viewOnlyOrcamento || !data) return;
    const placaNormalizada = normalizePlaca(values.veiculoPlaca);
    const veiculoSelecionado =
      data.veiculos.find((entry) => normalizePlaca(entry.placa) === placaNormalizada) ??
      data.veiculos.find((entry) => normalizeText(entry.modelo) === normalizeText(values.veiculoModelo));

    const payload: OrcamentoPayload = {
      clienteId: data.cliente.id,
      veiculoId: veiculoSelecionado?.id,
      veiculoModelo: values.veiculoModelo,
      veiculoAno: values.veiculoAno,
      veiculoPlaca: values.veiculoPlaca,
      status: values.status,
      validadeEm: toIsoFromInputDate(values.validadeEm),
      vendedor: "admin",
      formaPagamento: values.formaPagamento,
      desconto: values.desconto,
      servicos: [
        { id: 1, descricao: values.servicoDescricao, quantidade: 1, valorUnitario: values.servicoValor },
        { id: 2, descricao: "Mao de obra", quantidade: 1, valorUnitario: 100 },
      ],
      pecas: [
        {
          id: 1,
          descricao: values.pecaDescricao,
          codigo: values.pecaCodigo.toUpperCase(),
          quantidade: 1,
          valorUnitario: values.pecaValor,
          garantia: "Garantia 6 meses",
        },
      ],
    };

    try {
      if (editingOrcamento) {
        await updateOrcamento(editingOrcamento.id, payload);
      } else {
        await createOrcamento(payload);
      }
      setIsOrcamentoModalOpen(false);
      setEditingOrcamento(null);
      setViewOnlyOrcamento(false);
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteOrcamento = async (item: Orcamento) => {
    if (!canManage) return;
    if (!window.confirm(`Excluir orcamento ${item.numero}?`)) return;
    try {
      await deleteOrcamento(item.id);
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleUpdateOrcamentoStatus = async (item: Orcamento, status: Orcamento["status"]) => {
    if (!canManage) return;
    try {
      await updateOrcamentoStatus(item.id, status);
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleConverterOrcamento = async (item: Orcamento) => {
    if (!canManage || !data) return;
    try {
      const osIdExistente = parseOsId(item.osNumero);
      if (item.convertidoEmOs && osIdExistente) {
        const osExistente = data.ordensServico.find((entry) => entry.id === osIdExistente);
        if (osExistente) {
          setActiveTab("ordens");
          openViewOrdem(osExistente);
          return;
        }
      }

      const placaNormalizada = normalizePlaca(item.veiculoPlaca);
      const modeloNormalizado = normalizeText(item.veiculoModelo);

      const veiculo =
        data.veiculos.find((entry) => normalizePlaca(entry.placa) === placaNormalizada) ??
        data.veiculos.find((entry) => {
          const modeloEntry = normalizeText(entry.modelo);
          return modeloEntry.includes(modeloNormalizado) || modeloNormalizado.includes(modeloEntry);
        });

      if (!veiculo) {
        throw new Error(`Nao foi encontrado veiculo com a placa ${item.veiculoPlaca} para gerar a OS.`);
      }

      const servicosConvertidos = item.servicos
        .map((servico) => `${servico.descricao} (x${servico.quantidade})`)
        .join("; ");
      const problemaRelatado = servicosConvertidos || `Conversao do orcamento ${item.numero}`;

      const ordemCriada = await createOrdemServico({
        clienteId: data.cliente.id,
        veiculoId: veiculo.id,
        problemaRelatado,
        diagnostico: `OS criada a partir do orcamento ${item.numero}`,
        valorTotal: calcOrcamentoTotal(item),
        status: "RECEBIDO",
      });

      await converterOrcamentoEmOs(item.id, `OS-${ordemCriada.id}`);
      await loadCentral(clienteId);
      setActiveTab("ordens");
    } catch (err) {
      setError(err instanceof Error ? err.message : getErrorMessage(err));
    }
  };

  const onEmitirNota = async (values: EmitirNotaFormData) => {
    if (!canManage) return;
    try {
      await simularNota(values.ordemServicoId);
      emitirNotaForm.reset({ ordemServicoId: 0 });
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const onCancelarNota = async (values: CancelarNotaFormData) => {
    if (!cancelandoNota) return;
    try {
      await cancelarNota(cancelandoNota.id, values);
      setCancelandoNota(null);
      cancelarNotaForm.reset({ motivoCancelamento: "" });
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openCreateAgenda = () => {
    setEditingAgenda(null);
    setViewOnlyAgenda(false);
    agendaForm.reset({
      veiculoId: 0,
      dataHora: "",
      descricao: "",
      status: "AGENDADO",
    });
    setIsAgendaModalOpen(true);
  };

  const openEditAgenda = (agenda: Agendamento) => {
    setEditingAgenda(agenda);
    setViewOnlyAgenda(false);
    agendaForm.reset({
      veiculoId: agenda.veiculoId,
      dataHora: agenda.dataHora.slice(0, 16),
      descricao: agenda.descricao,
      status: agenda.status,
    });
    setIsAgendaModalOpen(true);
  };

  const openViewAgenda = (agenda: Agendamento) => {
    setEditingAgenda(agenda);
    setViewOnlyAgenda(true);
    agendaForm.reset({
      veiculoId: agenda.veiculoId,
      dataHora: agenda.dataHora.slice(0, 16),
      descricao: agenda.descricao,
      status: agenda.status,
    });
    setIsAgendaModalOpen(true);
  };

  const onSubmitAgenda = async (values: AgendaFormData) => {
    if (!canManage || viewOnlyAgenda) return;
    try {
      const payload = {
        clienteId,
        veiculoId: values.veiculoId,
        dataHora: values.dataHora,
        descricao: values.descricao,
        status: values.status,
      };
      if (editingAgenda) {
        await updateAgendamento(editingAgenda.id, payload);
      } else {
        await createAgendamento(payload);
      }
      setIsAgendaModalOpen(false);
      setEditingAgenda(null);
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteAgenda = async (agenda: Agendamento) => {
    if (!canManage) return;
    if (!window.confirm(`Excluir agendamento #${agenda.id}?`)) return;
    try {
      await deleteAgendamento(agenda.id);
      await loadCentral(clienteId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!Number.isFinite(clienteId)) {
    return <EmptyState title="Cliente invalido" description="Verifique o ID informado na URL." />;
  }

  return (
    <section className="space-y-4">
      <PageHeader
        title="Resumo do cliente"
        subtitle={data ? `${data.cliente.nome} - ${data.cliente.cpfCnpj}` : "Informacoes do cliente"}
        action={
          <Button variant="secondary" onClick={() => void loadCentral(clienteId)} loading={loading}>
            Atualizar
          </Button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {data ? (
        <article className="rounded-2xl border border-white/10 bg-[#081631]/72 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/25 text-2xl font-bold text-blue-100">
                {data.cliente.nome.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-title text-2xl font-bold text-white">{data.cliente.nome}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      data.cliente.ativo !== false
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-rose-500/20 text-rose-200"
                    }`}
                  >
                    {data.cliente.ativo !== false ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <span>CPF/CNPJ: {data.cliente.cpfCnpj}</span>
                  <span>{data.cliente.telefone}</span>
                  <span>{data.cliente.email}</span>
                  <span>
                    Cliente desde:{" "}
                    {data.cliente.dataCadastro ? new Date(data.cliente.dataCadastro).toLocaleDateString("pt-BR") : "-"}
                  </span>
                </div>
                {data.cliente.endereco || data.cliente.cidade ? (
                  <p className="mt-1 text-sm text-slate-400">
                    {[data.cliente.endereco, data.cliente.numero, data.cliente.bairro, data.cliente.cidade, data.cliente.uf]
                      .filter(Boolean)
                      .join(" - ")}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={openViewCliente}>
                Visualizar cliente
              </Button>
              {canManage ? (
                <Button onClick={openEditCliente}>
                  Editar cliente
                </Button>
              ) : null}
              {canManage ? <Button variant="ghost" onClick={() => openCreateOrdem()}>Nova OS</Button> : null}
              {canManage ? <Button variant="ghost" onClick={openCreateOrcamento}>Novo orcamento</Button> : null}
            </div>
          </div>
        </article>
      ) : null}

      {resumo ? (
        <div className="jc-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "Veiculos", value: resumo.veiculos.toLocaleString("pt-BR"), icon: Car, tone: "text-cyan-200" },
            { label: "Ordens", value: resumo.ordens.toLocaleString("pt-BR"), icon: Wrench, tone: "text-blue-200" },
            { label: "Orcamentos", value: resumo.orcamentos.toLocaleString("pt-BR"), icon: FileText, tone: "text-orange-200" },
            { label: "Notas", value: resumo.notas.toLocaleString("pt-BR"), icon: FileText, tone: "text-violet-200" },
            { label: "Agenda", value: resumo.agenda.toLocaleString("pt-BR"), icon: Calendar, tone: "text-emerald-200" },
            ...(canManage
              ? [{ label: "Financeiro", value: money.format(resumo.totalFinanceiro), icon: Wallet, tone: "text-amber-200" }]
              : []),
          ].map((item) => (
            <article key={item.label} className="rounded-2xl border border-white/10 bg-[#081631]/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">{item.label}</p>
                <div className={`rounded-xl bg-[#0f2142] p-2 ${item.tone}`}>
                  <item.icon size={16} />
                </div>
              </div>
              <p className="mt-3 font-title text-2xl font-bold text-white">{item.value}</p>
            </article>
          ))}
        </div>
      ) : null}

      <div className="jc-soft-in flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#081631]/65 p-3">
        {visibleTabs.map((tab) => (
          <Button key={tab} variant={activeTab === tab ? "primary" : "ghost"} onClick={() => setActiveTab(tab)}>
            {tabLabel[tab]}
          </Button>
        ))}
      </div>

      {data ? (
        <div className="space-y-4">
          {activeTab === "dados" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-[#081631]/70 p-4">
                <h3 className="mb-2 font-title text-lg text-slate-100">Dados principais</h3>
                <p className="text-sm text-slate-300">Nome: {data.cliente.nome}</p>
                <p className="text-sm text-slate-300">CPF/CNPJ: {data.cliente.cpfCnpj}</p>
                <p className="text-sm text-slate-300">Telefone: {data.cliente.telefone}</p>
                <p className="text-sm text-slate-300">Email: {data.cliente.email}</p>
                <p className="text-sm text-slate-300">Status: {data.cliente.ativo !== false ? "Ativo" : "Inativo"}</p>
                <p className="text-sm text-slate-300">
                  Cadastro: {data.cliente.dataCadastro ? new Date(data.cliente.dataCadastro).toLocaleDateString("pt-BR") : "-"}
                </p>
                <p className="text-sm text-slate-300">
                  Endereco:{" "}
                  {[data.cliente.endereco, data.cliente.numero, data.cliente.bairro, data.cliente.cidade, data.cliente.uf]
                    .filter(Boolean)
                    .join(" - ") || "-"}
                </p>
                {data.cliente.complemento ? <p className="text-sm text-slate-300">Complemento: {data.cliente.complemento}</p> : null}
                {data.cliente.cep ? <p className="text-sm text-slate-300">CEP: {data.cliente.cep}</p> : null}
                {data.cliente.observacoes ? <p className="text-sm text-slate-300">Observacoes: {data.cliente.observacoes}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={openViewCliente}>
                    Visualizar
                  </Button>
                  {canManage ? (
                    <Button variant="ghost" onClick={openEditCliente}>
                      Editar
                    </Button>
                  ) : null}
                  {canManage ? (
                    <Button variant="danger" onClick={() => void handleDeleteCliente()}>
                      Excluir
                    </Button>
                  ) : null}
                </div>
              </article>
            </div>
          ) : null}

          {activeTab === "veiculos" ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-[#081631]/65 p-3">
              <div className="flex flex-wrap gap-2">
                {canManage ? (
                  <Button onClick={openCreateVeiculo}>Novo veiculo</Button>
                ) : (
                  <span className="text-sm text-slate-400">Somente leitura</span>
                )}
              </div>

              <Table
                data={data.veiculos}
                keyExtractor={(item) => item.id}
                columns={[
                  { header: "Placa", render: (item) => item.placa },
                  { header: "Modelo", render: (item) => item.modelo },
                  { header: "Marca", render: (item) => item.marca },
                  { header: "Ano", render: (item) => item.ano },
                  {
                    header: "Acoes",
                    render: (item) => (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => openViewVeiculo(item)}>
                          Visualizar
                        </Button>
                        {canManage ? (
                          <Button variant="ghost" onClick={() => openEditVeiculo(item)}>
                            Editar
                          </Button>
                        ) : null}
                        {canManage ? (
                          <Button variant="ghost" onClick={() => openCreateOrdem(item.id)}>
                            Nova OS
                          </Button>
                        ) : null}
                        {canManage ? (
                          <Button variant="danger" onClick={() => void handleDeleteVeiculo(item)}>
                            Excluir
                          </Button>
                        ) : null}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          ) : null}

          {activeTab === "ordens" ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-[#081631]/65 p-3">
              <div className="flex flex-wrap gap-2">
                {canManage ? (
                  <Button onClick={() => openCreateOrdem()}>Nova OS</Button>
                ) : (
                  <span className="text-sm text-slate-400">Somente leitura</span>
                )}
              </div>

              <Table
                data={data.ordensServico}
                keyExtractor={(item) => item.id}
                columns={[
                  { header: "ID", render: (item) => item.id },
                  { header: "Veiculo", render: (item) => item.veiculoPlaca },
                  { header: "Problema", render: (item) => item.problemaRelatado },
                  {
                    header: "Status",
                    render: (item) => <StatusBadge status={item.status} />,
                  },
                  { header: "Valor", render: (item) => money.format(Number(item.valorTotal)) },
                  {
                    header: "Acoes",
                    render: (item) => (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => openViewOrdem(item)}>
                          Visualizar
                        </Button>
                        {canManage ? (
                          <Button variant="ghost" onClick={() => openEditOrdem(item)}>
                            Editar
                          </Button>
                        ) : null}
                        {canManage ? (
                          <Button variant="danger" onClick={() => void handleDeleteOrdem(item)}>
                            Excluir
                          </Button>
                        ) : null}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          ) : null}

          {activeTab === "orcamentos" ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-[#081631]/65 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0b1a36]/65 px-3 py-2">
                <div>
                  <p className="text-sm text-slate-300">Total de orcamentos do cliente</p>
                  <p className="font-title text-xl font-semibold text-white">
                    {clienteOrcamentos.length.toLocaleString("pt-BR")} | {money.format(resumo?.totalOrcamentos ?? 0)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canManage ? <Button onClick={openCreateOrcamento}>Novo orcamento</Button> : null}
                  <Button variant="secondary" onClick={() => navigate("/orcamentos")}>
                    Ver modulo completo
                  </Button>
                </div>
              </div>

              <Table
                data={clienteOrcamentos}
                keyExtractor={(item) => item.id}
                columns={[
                  { header: "Numero", render: (item) => item.numero },
                  { header: "Veiculo", render: (item) => `${item.veiculoModelo} - ${item.veiculoPlaca}` },
                  { header: "Validade", render: (item) => new Date(item.validadeEm).toLocaleDateString("pt-BR") },
                  { header: "Total", render: (item) => money.format(calcOrcamentoTotal(item)) },
                  { header: "Status", render: (item) => <StatusBadge status={item.convertidoEmOs ? "CONVERTIDO_EM_OS" : item.status} /> },
                  {
                    header: "Acoes",
                    render: (item) => (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => openViewOrcamento(item)}>
                          Visualizar
                        </Button>
                        {canManage ? (
                          <Button variant="ghost" onClick={() => openEditOrcamento(item)}>
                            Editar
                          </Button>
                        ) : null}
                        {canManage && item.status !== "APROVADO" ? (
                          <Button variant="ghost" onClick={() => void handleUpdateOrcamentoStatus(item, "APROVADO")}>
                            Aprovar
                          </Button>
                        ) : null}
                        {canManage && item.status !== "RECUSADO" ? (
                          <Button variant="ghost" onClick={() => void handleUpdateOrcamentoStatus(item, "RECUSADO")}>
                            Recusar
                          </Button>
                        ) : null}
                        {canManage && item.status !== "PENDENTE" ? (
                          <Button variant="ghost" onClick={() => void handleUpdateOrcamentoStatus(item, "PENDENTE")}>
                            Pendente
                          </Button>
                        ) : null}
                        {canManage && item.status === "APROVADO" ? (
                          <Button variant="primary" onClick={() => void handleConverterOrcamento(item)}>
                            Converter em OS
                          </Button>
                        ) : null}
                        {canManage ? (
                          <Button variant="danger" onClick={() => void handleDeleteOrcamento(item)}>
                            Excluir
                          </Button>
                        ) : null}
                        <a
                          href={buildOrcamentoWhatsappLink(item)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-xl border border-white/10 bg-[#0f2142]/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-blue-300/35 hover:text-blue-100"
                        >
                          WhatsApp
                        </a>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          ) : null}

          {activeTab === "financeiro" ? (
            <div className="rounded-2xl border border-white/10 bg-[#081631]/65 p-3">
              <Table
                data={data.financeiro}
                keyExtractor={(item) => item.id}
                columns={[
                  { header: "ID", render: (item) => item.id },
                  { header: "OS", render: (item) => item.ordemServicoId },
                  { header: "Valor", render: (item) => money.format(Number(item.valor)) },
                  { header: "Pagamento", render: (item) => item.formaPagamento },
                  { header: "Status", render: (item) => <StatusBadge status={item.status} /> },
                  {
                    header: "Acoes",
                    render: (item) => (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => openViewFinanceiro(item)}>
                          Visualizar
                        </Button>
                        {canManage ? (
                          <Button variant="ghost" onClick={() => openEditFinanceiro(item)}>
                            Editar
                          </Button>
                        ) : null}
                        {canManage && item.status !== "PAGO" ? (
                          <Button variant="primary" onClick={() => void marcarFinanceiroComoPago(item)}>
                            Marcar como pago
                          </Button>
                        ) : null}
                        {canManage ? (
                          <Button variant="danger" onClick={() => void handleDeleteFinanceiro(item)}>
                            Excluir
                          </Button>
                        ) : null}
                        <a
                          href={item.linkWhatsapp}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-xl border border-white/10 bg-[#0f2142]/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-blue-300/35 hover:text-blue-100"
                        >
                          WhatsApp
                        </a>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          ) : null}

          {activeTab === "notas" ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-[#081631]/65 p-3">
              {canManage ? (
                <form className="grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={emitirNotaForm.handleSubmit(onEmitirNota)}>
                  <label className="md:col-span-3 flex flex-col gap-1.5 text-sm">
                    <span className="text-slate-300">Emitir nota por OS finalizada</span>
                    <select
                      {...emitirNotaForm.register("ordemServicoId")}
                      className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
                    >
                      <option value={0}>Selecione uma OS finalizada</option>
                      {ordensFinalizadas.map((ordem) => (
                        <option key={ordem.id} value={ordem.id}>
                          OS #{ordem.id} - {ordem.veiculoPlaca}
                        </option>
                      ))}
                    </select>
                    {emitirNotaForm.formState.errors.ordemServicoId?.message ? (
                      <span className="text-xs text-red-300">{emitirNotaForm.formState.errors.ordemServicoId.message}</span>
                    ) : null}
                  </label>

                  <div className="md:self-end">
                    <Button type="submit" className="w-full" loading={emitirNotaForm.formState.isSubmitting}>
                      Emitir nota
                    </Button>
                  </div>
                </form>
              ) : null}

              <Table
                data={data.notasFiscais}
                keyExtractor={(item) => item.id}
                columns={[
                  { header: "Numero", render: (item) => item.numero },
                  { header: "Servico", render: (item) => item.descricaoServico },
                  { header: "Valor", render: (item) => money.format(Number(item.valor)) },
                  { header: "Status", render: (item) => <StatusBadge status={item.status} /> },
                  {
                    header: "Acoes",
                    render: (item) => (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="px-2 py-1 text-xs"
                          onClick={() => void openPdf(item.id)}
                          loading={openingPdfId === item.id}
                        >
                          PDF
                        </Button>
                        <a
                          href={item.linkWhatsapp}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-xl border border-white/10 bg-[#0f2142]/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-blue-300/35 hover:text-blue-100"
                        >
                          Enviar nota
                        </a>
                        {canManage && item.status !== "CANCELADA" ? (
                          <Button
                            variant="danger"
                            onClick={() => {
                              setCancelandoNota(item);
                              cancelarNotaForm.reset({ motivoCancelamento: "" });
                            }}
                          >
                            Cancelar
                          </Button>
                        ) : null}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          ) : null}

          {activeTab === "agenda" ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-[#081631]/65 p-3">
              <div className="flex flex-wrap gap-2">
                {canManage ? (
                  <Button onClick={openCreateAgenda}>Novo agendamento</Button>
                ) : (
                  <span className="text-sm text-slate-400">Somente leitura</span>
                )}
              </div>

              <Table
                data={data.agendamentos}
                keyExtractor={(item) => item.id}
                columns={[
                  { header: "Data", render: (item) => item.dataHora.replace("T", " ") },
                  { header: "Veiculo", render: (item) => item.veiculoPlaca },
                  { header: "Descricao", render: (item) => item.descricao },
                  { header: "Status", render: (item) => <StatusBadge status={item.status} /> },
                  {
                    header: "Acoes",
                    render: (item) => (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => openViewAgenda(item)}>
                          Visualizar
                        </Button>
                        {canManage ? (
                          <Button variant="ghost" onClick={() => openEditAgenda(item)}>
                            Editar
                          </Button>
                        ) : null}
                        {canManage ? (
                          <Button variant="danger" onClick={() => void handleDeleteAgenda(item)}>
                            Excluir
                          </Button>
                        ) : null}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          ) : null}

          {activeTab === "fluxo" ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-[#081631]/65 p-3">
              <div className="rounded-xl border border-white/10 bg-[#0b1a36]/65 px-3 py-2 text-sm text-slate-300">
                Fluxo conectado do cliente unindo operacao interna e comunicacao externa.
              </div>

              <Table
                data={fluxoIntegrado}
                keyExtractor={(item) => item.id}
                columns={[
                  { header: "Data", render: (item) => new Date(item.data).toLocaleString("pt-BR") },
                  { header: "Modulo", render: (item) => item.modulo },
                  {
                    header: "Origem",
                    render: (item) => (
                      <span className={item.origem === "EXTERNO" ? "text-cyan-300" : "text-slate-200"}>
                        {item.origem === "EXTERNO" ? "Externo" : "Interno"}
                      </span>
                    ),
                  },
                  { header: "Descricao", render: (item) => `${item.titulo} - ${item.descricao}` },
                  { header: "Status", render: (item) => <StatusBadge status={item.status} /> },
                  {
                    header: "Acoes",
                    render: (item) => {
                      const notaFiscalId = item.notaFiscalId;

                      return (
                        <div className="flex flex-wrap gap-2">
                        {item.veiculoId ? (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const veiculo = data.veiculos.find((entry) => entry.id === item.veiculoId);
                              if (!veiculo) return;
                              setActiveTab("veiculos");
                              openViewVeiculo(veiculo);
                            }}
                          >
                            Ver veiculo
                          </Button>
                        ) : null}
                        {item.ordemId ? (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const ordem = data.ordensServico.find((entry) => entry.id === item.ordemId);
                              if (!ordem) return;
                              setActiveTab("ordens");
                              openViewOrdem(ordem);
                            }}
                          >
                            Ver OS
                          </Button>
                        ) : null}
                        {item.agendaId ? (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const agenda = data.agendamentos.find((entry) => entry.id === item.agendaId);
                              if (!agenda) return;
                              setActiveTab("agenda");
                              openViewAgenda(agenda);
                            }}
                          >
                            Ver agenda
                          </Button>
                        ) : null}
                        {item.financeiroId ? (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const financeiro = data.financeiro.find((entry) => entry.id === item.financeiroId);
                              if (!financeiro) return;
                              setActiveTab("financeiro");
                              openViewFinanceiro(financeiro);
                            }}
                          >
                            Ver financeiro
                          </Button>
                        ) : null}
                        {item.orcamentoId ? (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const orcamento = clienteOrcamentos.find((entry) => entry.id === item.orcamentoId);
                              if (!orcamento) return;
                              setActiveTab("orcamentos");
                              openViewOrcamento(orcamento);
                            }}
                          >
                            Ver orcamento
                          </Button>
                        ) : null}
                        {typeof notaFiscalId === "number" ? (
                          <Button variant="ghost" onClick={() => void openPdf(notaFiscalId)}>
                            PDF
                          </Button>
                        ) : null}
                        {item.linkExterno ? (
                          <a
                            href={item.linkExterno}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-xl border border-white/10 bg-[#0f2142]/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-blue-300/35 hover:text-blue-100"
                          >
                            {item.linkLabel ?? "Abrir"}
                          </a>
                        ) : null}
                        </div>
                      );
                    },
                  },
                ]}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState title="Carregando dados do cliente" />
      )}

      <Modal
        isOpen={isClienteModalOpen}
        title={viewOnlyCliente ? "Visualizar cliente" : "Editar cliente"}
        onClose={() => {
          setIsClienteModalOpen(false);
          setViewOnlyCliente(false);
        }}
      >
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={clienteForm.handleSubmit(onSubmitCliente)}>
          <label className="md:col-span-2 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0f2142]/45 px-3 py-2.5">
            <input type="checkbox" {...clienteForm.register("ativo")} disabled={viewOnlyCliente} className="h-4 w-4 accent-blue-500" />
            <span className="text-sm text-slate-200">Cliente ativo</span>
          </label>
          <div className="md:col-span-2">
            <Input label="Nome" {...clienteForm.register("nome")} error={clienteForm.formState.errors.nome?.message} disabled={viewOnlyCliente} />
          </div>
          <Input label="CPF/CNPJ" {...clienteForm.register("cpfCnpj")} error={clienteForm.formState.errors.cpfCnpj?.message} disabled={viewOnlyCliente} />
          <Input label="Telefone" {...clienteForm.register("telefone")} error={clienteForm.formState.errors.telefone?.message} disabled={viewOnlyCliente} />
          <div className="md:col-span-2">
            <Input label="Email" {...clienteForm.register("email")} error={clienteForm.formState.errors.email?.message} disabled={viewOnlyCliente} />
          </div>
          <Input type="date" label="Data de cadastro" {...clienteForm.register("dataCadastro")} error={clienteForm.formState.errors.dataCadastro?.message} disabled={viewOnlyCliente} />
          <Input label="CEP" {...clienteForm.register("cep")} error={clienteForm.formState.errors.cep?.message} disabled={viewOnlyCliente} />
          <div className="md:col-span-2">
            <Input label="Endereco" {...clienteForm.register("endereco")} error={clienteForm.formState.errors.endereco?.message} disabled={viewOnlyCliente} />
          </div>
          <Input label="Numero" {...clienteForm.register("numero")} error={clienteForm.formState.errors.numero?.message} disabled={viewOnlyCliente} />
          <Input label="Bairro" {...clienteForm.register("bairro")} error={clienteForm.formState.errors.bairro?.message} disabled={viewOnlyCliente} />
          <Input label="Cidade" {...clienteForm.register("cidade")} error={clienteForm.formState.errors.cidade?.message} disabled={viewOnlyCliente} />
          <Input
            label="UF"
            {...clienteForm.register("uf")}
            onBlur={(event) => {
              clienteForm.setValue("uf", event.target.value.toUpperCase());
            }}
            error={clienteForm.formState.errors.uf?.message}
            disabled={viewOnlyCliente}
            maxLength={2}
          />
          <div className="md:col-span-2">
            <Input label="Complemento" {...clienteForm.register("complemento")} error={clienteForm.formState.errors.complemento?.message} disabled={viewOnlyCliente} />
          </div>
          <label className="md:col-span-2 flex w-full flex-col gap-1.5 text-sm text-slate-200">
            <span className="font-medium tracking-wide text-slate-300">Observacoes</span>
            <textarea
              {...clienteForm.register("observacoes")}
              rows={3}
              disabled={viewOnlyCliente}
              className="w-full rounded-xl border border-white/15 bg-[#0c1933]/80 px-3 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Informacoes importantes sobre o cliente"
            />
            {clienteForm.formState.errors.observacoes?.message ? (
              <span className="text-xs text-red-300">{clienteForm.formState.errors.observacoes.message}</span>
            ) : null}
          </label>
          {!viewOnlyCliente && canManage ? (
            <div className="md:col-span-2 mt-2 flex justify-end">
              <Button type="submit" loading={clienteForm.formState.isSubmitting}>
                Salvar alteracoes
              </Button>
            </div>
          ) : null}
        </form>
      </Modal>

      <Modal
        isOpen={isVeiculoModalOpen}
        title={viewOnlyVeiculo ? "Visualizar veiculo" : editingVeiculo ? "Editar veiculo" : "Novo veiculo"}
        onClose={() => {
          setIsVeiculoModalOpen(false);
          setViewOnlyVeiculo(false);
        }}
      >
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={veiculoForm.handleSubmit(onSubmitVeiculo)}>
          <Input label="Placa" {...veiculoForm.register("placa")} error={veiculoForm.formState.errors.placa?.message} disabled={viewOnlyVeiculo} />

          <input type="hidden" {...veiculoForm.register("marca")} />
          <input type="hidden" {...veiculoForm.register("modelo")} />
          <VeiculoModeloSelector
            marca={veiculoForm.watch("marca") ?? ""}
            modelo={veiculoForm.watch("modelo") ?? ""}
            disabled={viewOnlyVeiculo}
            errorMarca={veiculoForm.formState.errors.marca?.message}
            errorModelo={veiculoForm.formState.errors.modelo?.message}
            onChangeMarca={(marca) => {
              veiculoForm.setValue("marca", marca, { shouldDirty: true, shouldValidate: true });
            }}
            onChangeModelo={(modelo) => {
              veiculoForm.setValue("modelo", modelo, { shouldDirty: true, shouldValidate: true });
            }}
          />

          <Input type="number" label="Ano" {...veiculoForm.register("ano")} error={veiculoForm.formState.errors.ano?.message} disabled={viewOnlyVeiculo} />
          {!viewOnlyVeiculo && canManage ? (
            <div className="md:col-span-2 mt-2 flex justify-end">
              <Button type="submit" loading={veiculoForm.formState.isSubmitting}>
                {editingVeiculo ? "Salvar alteracoes" : "Criar veiculo"}
              </Button>
            </div>
          ) : null}
        </form>
      </Modal>

      <Modal
        isOpen={isOrdemModalOpen}
        title={viewOnlyOrdem ? "Visualizar OS" : editingOrdem ? "Editar OS" : "Nova OS"}
        onClose={() => {
          setIsOrdemModalOpen(false);
          setViewOnlyOrdem(false);
        }}
      >
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={ordemForm.handleSubmit(onSubmitOrdem)}>
          <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
            <span className="text-slate-300">Veiculo</span>
            <select
              {...ordemForm.register("veiculoId")}
              disabled={viewOnlyOrdem}
              className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value={0}>Selecione</option>
              {data?.veiculos.map((veiculo) => (
                <option key={veiculo.id} value={veiculo.id}>
                  {veiculo.placa} - {veiculo.modelo}
                </option>
              ))}
            </select>
            {ordemForm.formState.errors.veiculoId?.message ? (
              <span className="text-xs text-red-300">{ordemForm.formState.errors.veiculoId.message}</span>
            ) : null}
          </label>

          <div className="md:col-span-2">
            <Input
              label="Problema relatado"
              {...ordemForm.register("problemaRelatado")}
              error={ordemForm.formState.errors.problemaRelatado?.message}
              disabled={viewOnlyOrdem}
            />
          </div>

          <div className="md:col-span-2">
            <Input label="Diagnostico" {...ordemForm.register("diagnostico")} error={ordemForm.formState.errors.diagnostico?.message} disabled={viewOnlyOrdem} />
          </div>

          <Input
            type="number"
            step="0.01"
            label="Valor total"
            {...ordemForm.register("valorTotal")}
            error={ordemForm.formState.errors.valorTotal?.message}
            disabled={viewOnlyOrdem}
          />

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-slate-300">Status</span>
            <select
              {...ordemForm.register("status")}
              disabled={viewOnlyOrdem}
              className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              {ordemServicoColumns.map((status) => (
                <option key={status} value={status}>
                  {statusLabel[status]}
                </option>
              ))}
            </select>
          </label>

          {!viewOnlyOrdem && canManage ? (
            <div className="md:col-span-2 mt-2 flex justify-end">
              <Button type="submit" loading={ordemForm.formState.isSubmitting}>
                {editingOrdem ? "Salvar alteracoes" : "Criar OS"}
              </Button>
            </div>
          ) : null}
        </form>
      </Modal>

      <Modal
        isOpen={isAgendaModalOpen}
        title={viewOnlyAgenda ? "Visualizar agendamento" : editingAgenda ? "Editar agendamento" : "Novo agendamento"}
        onClose={() => {
          setIsAgendaModalOpen(false);
          setViewOnlyAgenda(false);
        }}
      >
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={agendaForm.handleSubmit(onSubmitAgenda)}>
          <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
            <span className="text-slate-300">Veiculo</span>
            <select
              {...agendaForm.register("veiculoId")}
              disabled={viewOnlyAgenda}
              className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value={0}>Selecione</option>
              {data?.veiculos.map((veiculo) => (
                <option key={veiculo.id} value={veiculo.id}>
                  {veiculo.placa} - {veiculo.modelo}
                </option>
              ))}
            </select>
            {agendaForm.formState.errors.veiculoId?.message ? (
              <span className="text-xs text-red-300">{agendaForm.formState.errors.veiculoId.message}</span>
            ) : null}
          </label>

          <Input
            type="datetime-local"
            label="Data e hora"
            {...agendaForm.register("dataHora")}
            error={agendaForm.formState.errors.dataHora?.message}
            disabled={viewOnlyAgenda}
          />

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-slate-300">Status</span>
            <select
              {...agendaForm.register("status")}
              disabled={viewOnlyAgenda}
              className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value="AGENDADO">Agendado</option>
              <option value="CONCLUIDO">Concluido</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </label>

          <div className="md:col-span-2">
            <Input label="Descricao" {...agendaForm.register("descricao")} error={agendaForm.formState.errors.descricao?.message} disabled={viewOnlyAgenda} />
          </div>

          {!viewOnlyAgenda && canManage ? (
            <div className="md:col-span-2 mt-2 flex justify-end">
              <Button type="submit" loading={agendaForm.formState.isSubmitting}>
                Salvar
              </Button>
            </div>
          ) : null}
        </form>
      </Modal>

      <Modal
        isOpen={isFinanceiroModalOpen}
        title={viewOnlyFinanceiro ? "Visualizar financeiro" : "Editar financeiro"}
        onClose={() => {
          setIsFinanceiroModalOpen(false);
          setEditingFinanceiro(null);
          setViewOnlyFinanceiro(false);
        }}
      >
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={financeiroForm.handleSubmit(onSubmitFinanceiro)}>
          <Input
            type="number"
            label="OS"
            {...financeiroForm.register("ordemServicoId")}
            error={financeiroForm.formState.errors.ordemServicoId?.message}
            disabled={viewOnlyFinanceiro}
          />
          <Input
            type="number"
            step="0.01"
            label="Valor"
            {...financeiroForm.register("valor")}
            error={financeiroForm.formState.errors.valor?.message}
            disabled={viewOnlyFinanceiro}
          />
          <Input
            label="Forma de pagamento"
            {...financeiroForm.register("formaPagamento")}
            error={financeiroForm.formState.errors.formaPagamento?.message}
            disabled={viewOnlyFinanceiro}
          />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-slate-300">Status</span>
            <select
              {...financeiroForm.register("status")}
              disabled={viewOnlyFinanceiro}
              className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
              <option value="ESTORNADO">Estornado</option>
            </select>
          </label>
          <Input
            type="date"
            label="Data"
            {...financeiroForm.register("data")}
            error={financeiroForm.formState.errors.data?.message}
            disabled={viewOnlyFinanceiro}
          />
          <div className="md:col-span-2">
            <p className="text-sm text-slate-300">Nota fiscal: {editingFinanceiro?.notaFiscalId ?? "-"}</p>
          </div>
          {!viewOnlyFinanceiro && canManage ? (
            <div className="md:col-span-2 mt-2 flex justify-end">
              <Button type="submit" loading={financeiroForm.formState.isSubmitting}>
                Salvar alteracoes
              </Button>
            </div>
          ) : null}
        </form>
      </Modal>

      <Modal
        isOpen={isOrcamentoModalOpen}
        title={
          viewOnlyOrcamento ? "Visualizar orcamento" : editingOrcamento ? "Editar orcamento" : "Novo orcamento"
        }
        onClose={() => {
          setIsOrcamentoModalOpen(false);
          setEditingOrcamento(null);
          setViewOnlyOrcamento(false);
        }}
      >
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={orcamentoForm.handleSubmit(onSubmitOrcamento)}>
          <Input
            label="Modelo do veiculo"
            {...orcamentoForm.register("veiculoModelo")}
            error={orcamentoForm.formState.errors.veiculoModelo?.message}
            disabled={viewOnlyOrcamento}
          />
          <Input
            type="number"
            label="Ano do veiculo"
            {...orcamentoForm.register("veiculoAno")}
            error={orcamentoForm.formState.errors.veiculoAno?.message}
            disabled={viewOnlyOrcamento}
          />
          <Input
            label="Placa"
            {...orcamentoForm.register("veiculoPlaca")}
            error={orcamentoForm.formState.errors.veiculoPlaca?.message}
            disabled={viewOnlyOrcamento}
          />

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-slate-300">Status</span>
            <select
              {...orcamentoForm.register("status")}
              disabled={viewOnlyOrcamento}
              className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value="PENDENTE">Pendente</option>
              <option value="APROVADO">Aprovado</option>
              <option value="RECUSADO">Recusado</option>
            </select>
          </label>

          <Input
            type="date"
            label="Validade"
            {...orcamentoForm.register("validadeEm")}
            error={orcamentoForm.formState.errors.validadeEm?.message}
            disabled={viewOnlyOrcamento}
          />
          <Input
            label="Forma de pagamento"
            {...orcamentoForm.register("formaPagamento")}
            error={orcamentoForm.formState.errors.formaPagamento?.message}
            disabled={viewOnlyOrcamento}
          />
          <Input
            type="number"
            step="0.01"
            label="Desconto"
            {...orcamentoForm.register("desconto")}
            error={orcamentoForm.formState.errors.desconto?.message}
            disabled={viewOnlyOrcamento}
          />

          <div className="md:col-span-2 rounded-xl border border-white/10 bg-[#0b1933]/55 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-200">Servico principal</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="Descricao"
                {...orcamentoForm.register("servicoDescricao")}
                error={orcamentoForm.formState.errors.servicoDescricao?.message}
                disabled={viewOnlyOrcamento}
              />
              <Input
                type="number"
                step="0.01"
                label="Valor"
                {...orcamentoForm.register("servicoValor")}
                error={orcamentoForm.formState.errors.servicoValor?.message}
                disabled={viewOnlyOrcamento}
              />
            </div>
          </div>

          <div className="md:col-span-2 rounded-xl border border-white/10 bg-[#0b1933]/55 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-200">Peca principal</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input
                label="Descricao"
                {...orcamentoForm.register("pecaDescricao")}
                error={orcamentoForm.formState.errors.pecaDescricao?.message}
                disabled={viewOnlyOrcamento}
              />
              <Input
                label="Codigo"
                {...orcamentoForm.register("pecaCodigo")}
                error={orcamentoForm.formState.errors.pecaCodigo?.message}
                disabled={viewOnlyOrcamento}
              />
              <Input
                type="number"
                step="0.01"
                label="Valor"
                {...orcamentoForm.register("pecaValor")}
                error={orcamentoForm.formState.errors.pecaValor?.message}
                disabled={viewOnlyOrcamento}
              />
            </div>
          </div>

          {!viewOnlyOrcamento && canManage ? (
            <div className="md:col-span-2 mt-2 flex justify-end">
              <Button type="submit" loading={orcamentoForm.formState.isSubmitting}>
                {editingOrcamento ? "Salvar alteracoes" : "Criar orcamento"}
              </Button>
            </div>
          ) : null}
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(cancelandoNota)}
        title="Cancelar nota"
        description="Informe o motivo do cancelamento para manter o historico completo."
        onClose={() => setCancelandoNota(null)}
      >
        <form className="space-y-3" onSubmit={cancelarNotaForm.handleSubmit(onCancelarNota)}>
          <Input
            label="Motivo"
            {...cancelarNotaForm.register("motivoCancelamento")}
            error={cancelarNotaForm.formState.errors.motivoCancelamento?.message}
          />
          <div className="flex justify-end">
            <Button variant="danger" type="submit" loading={cancelarNotaForm.formState.isSubmitting}>
              Confirmar cancelamento
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
