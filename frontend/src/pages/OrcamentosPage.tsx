import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Eye,
  Filter,
  MessageCircle,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Printer,
  Search,
  ThumbsDown,
  Trash2,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import { getErrorMessage } from "@/services/api";
import { createCliente, listAllClientes } from "@/services/clientes.service";
import {
  converterOrcamentoEmOs,
  createOrcamento,
  deleteOrcamento,
  duplicateOrcamento,
  listOrcamentos,
  updateOrcamento,
  updateOrcamentoStatus,
} from "@/services/orcamentos.service";
import { createOrdemServico, listAllOrdensServico } from "@/services/ordens.service";
import { listEstoqueItems } from "@/services/estoque.service";
import { createVeiculo, listAllVeiculos } from "@/services/veiculos.service";
import type { Cliente } from "@/types/cliente";
import type { Orcamento, OrcamentoPayload, OrcamentoStatus } from "@/types/orcamento";
import type { Veiculo } from "@/types/veiculo";
import { cn } from "@/utils/cn";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateShort = new Intl.DateTimeFormat("pt-BR");
const dateWithTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type StatusFilter = "TODOS" | OrcamentoStatus;
type PeriodFilter = "TODOS" | "7_DIAS" | "15_DIAS" | "30_DIAS";

interface OrcamentoFormState {
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail: string;
  veiculoModelo: string;
  veiculoAno: string;
  veiculoPlaca: string;
  status: OrcamentoStatus;
  validadeEm: string;
  vendedor: string;
  formaPagamento: string;
  desconto: string;
  servicoDescricao: string;
  servicoValor: string;
  pecaDescricao: string;
  pecaCodigo: string;
  pecaValor: string;
}

const defaultForm: OrcamentoFormState = {
  clienteNome: "",
  clienteTelefone: "",
  clienteEmail: "",
  veiculoModelo: "",
  veiculoAno: String(new Date().getFullYear()),
  veiculoPlaca: "",
  status: "PENDENTE",
  validadeEm: toInputDate(addDays(new Date().toISOString(), 7)),
  vendedor: "admin",
  formaPagamento: "PIX / Cartao",
  desconto: "0",
  servicoDescricao: "Diagnostico eletrico",
  servicoValor: "120",
  pecaDescricao: "Bateria Moura 60Ah",
  pecaCodigo: "BAT-001",
  pecaValor: "450",
};

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

function stripDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizePlaca(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function buildValidEmail(nome: string, email?: string) {
  const raw = (email ?? "").trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return raw;
  }
  const base = normalizeText(nome)
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "cliente";
  return `${base}.${Date.now()}@jhonycar.local`;
}

function buildCpfCnpjFallback(seed: string) {
  const digits = stripDigits(seed + Date.now().toString() + Math.floor(Math.random() * 1000).toString());
  return digits.padEnd(11, "0").slice(0, 11);
}

function inferCatalogoVeiculo(modeloOriginal: string) {
  const modelo = normalizeText(modeloOriginal);

  if (modelo.includes("onix")) return { marca: "Chevrolet", modelo: "Onix" };
  if (modelo.includes("tracker")) return { marca: "Chevrolet", modelo: "Tracker" };
  if (modelo.includes("gol")) return { marca: "Volkswagen", modelo: "Gol" };
  if (modelo.includes("t-cross") || modelo.includes("tcross")) return { marca: "Volkswagen", modelo: "T-Cross" };
  if (modelo.includes("corolla")) return { marca: "Toyota", modelo: "Corolla" };
  if (modelo.includes("yaris")) return { marca: "Toyota", modelo: "Yaris" };
  if (modelo.includes("civic")) return { marca: "Honda", modelo: "Civic" };
  if (modelo.includes("hr-v") || modelo.includes("hrv")) return { marca: "Honda", modelo: "HR-V" };
  if (modelo.includes("hb20")) return { marca: "Hyundai", modelo: "HB20" };
  if (modelo.includes("kwid")) return { marca: "Renault", modelo: "Kwid" };
  if (modelo.includes("mobi")) return { marca: "Fiat", modelo: "Mobi" };
  if (modelo.includes("argo") || modelo.includes("palio") || modelo.includes("toro")) return { marca: "Fiat", modelo: "Argo" };

  return { marca: "Chevrolet", modelo: "Onix" };
}

function parseOsId(osNumero?: string) {
  if (!osNumero) return null;
  const match = /^OS-(\d+)$/i.exec(osNumero.trim());
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

function statusClass(status: OrcamentoStatus) {
  if (status === "APROVADO") return "border-emerald-300/30 bg-emerald-500/20 text-emerald-200";
  if (status === "RECUSADO") return "border-rose-300/30 bg-rose-500/20 text-rose-200";
  return "border-amber-300/30 bg-amber-500/20 text-amber-200";
}

function statusLabel(status: OrcamentoStatus) {
  if (status === "APROVADO") return "Aprovado";
  if (status === "RECUSADO") return "Recusado";
  return "Pendente";
}

function buildVisiblePages(currentPage: number, totalPages: number) {
  const pages: number[] = [];
  const from = Math.max(1, currentPage - 1);
  const to = Math.min(totalPages, currentPage + 2);
  for (let p = from; p <= to; p += 1) pages.push(p);
  if (!pages.includes(1)) pages.unshift(1);
  if (!pages.includes(totalPages)) pages.push(totalPages);
  return [...new Set(pages)];
}

function calcServicosTotal(item: Orcamento) {
  return item.servicos.reduce((acc, current) => acc + Number(current.quantidade) * Number(current.valorUnitario), 0);
}

function calcPecasTotal(item: Orcamento) {
  return item.pecas.reduce((acc, current) => acc + Number(current.quantidade) * Number(current.valorUnitario), 0);
}

function calcSubtotal(item: Orcamento) {
  return calcServicosTotal(item) + calcPecasTotal(item);
}

function calcTotal(item: Orcamento) {
  return calcSubtotal(item) - Number(item.desconto || 0);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function periodDays(period: PeriodFilter) {
  if (period === "7_DIAS") return 7;
  if (period === "15_DIAS") return 15;
  if (period === "30_DIAS") return 30;
  return null;
}

function buildWhatsappLink(item: Orcamento) {
  const rawPhone = stripDigits(item.clienteTelefone);
  const basePhone = rawPhone.length >= 10 ? rawPhone : "11999999999";
  const phone = basePhone.startsWith("55") ? basePhone : `55${basePhone}`;
  const message = [
    `Ola, ${item.clienteNome}!`,
    `Seu orcamento ${item.numero} esta ${statusLabel(item.status).toLowerCase()}.`,
    `Veiculo: ${item.veiculoModelo} ${item.veiculoAno} - ${item.veiculoPlaca}.`,
    `Total: ${money.format(calcTotal(item))}.`,
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function OrcamentosPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODOS");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("TODOS");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [sellerFilter, setSellerFilter] = useState("TODOS");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const [orcamentoModalOpen, setOrcamentoModalOpen] = useState(false);
  const [editingOrcamento, setEditingOrcamento] = useState<Orcamento | null>(null);
  const [form, setForm] = useState<OrcamentoFormState>(defaultForm);

  const [pecaImageMap, setPecaImageMap] = useState<Record<string, string>>({});

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "novo-orcamento") {
      openCreate();
      const next = new URLSearchParams(searchParams);
      next.delete("action");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [searchText, statusFilter, periodFilter, minTotal, maxTotal, sellerFilter, pageSize]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orcamentos, estoque] = await Promise.all([listOrcamentos(), listEstoqueItems().catch(() => [])]);
      const nextMap: Record<string, string> = {};
      for (const peca of estoque) {
        if (peca.imagemUrl && peca.codigo) {
          nextMap[peca.codigo.toUpperCase()] = peca.imagemUrl;
        }
      }
      setPecaImageMap(nextMap);
      setItems(orcamentos);
      if (orcamentos.length > 0) {
        setSelectedId((prev) => (prev && orcamentos.some((item) => item.id === prev) ? prev : orcamentos[0].id));
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const vendedores = useMemo(
    () => [...new Set(items.map((item) => item.vendedor))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [items],
  );

  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const days = periodDays(periodFilter);
    const now = new Date();

    return items.filter((item) => {
      if (
        query &&
        !item.numero.toLowerCase().includes(query) &&
        !item.clienteNome.toLowerCase().includes(query) &&
        !item.veiculoModelo.toLowerCase().includes(query) &&
        !item.veiculoPlaca.toLowerCase().includes(query)
      ) {
        return false;
      }

      if (statusFilter !== "TODOS" && item.status !== statusFilter) {
        return false;
      }

      if (sellerFilter !== "TODOS" && item.vendedor !== sellerFilter) {
        return false;
      }

      if (days !== null) {
        const createdAt = new Date(item.criadoEm);
        const diffMs = now.getTime() - createdAt.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays > days) return false;
      }

      const total = calcTotal(item);
      if (minTotal && total < Number(minTotal)) return false;
      if (maxTotal && total > Number(maxTotal)) return false;

      return true;
    });
  }, [items, searchText, statusFilter, periodFilter, sellerFilter, minTotal, maxTotal]);

  const totalRows = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const pagedItems = filteredItems.slice(pageStart, pageEnd);
  const firstItem = totalRows === 0 ? 0 : pageStart + 1;
  const lastItem = totalRows === 0 ? 0 : Math.min(pageEnd, totalRows);
  const visiblePages = buildVisiblePages(currentPage, totalPages);

  useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !filteredItems.some((item) => item.id === selectedId)) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, selectedId]);

  const selectedOrcamento = useMemo(
    () => filteredItems.find((item) => item.id === selectedId) ?? null,
    [filteredItems, selectedId],
  );

  const monthlyNew = useMemo(() => {
    const now = new Date();
    return items.filter((item) => {
      const created = new Date(item.criadoEm);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
  }, [items]);

  const resumo = useMemo(() => {
    const total = items.length;
    const pendentes = items.filter((item) => item.status === "PENDENTE").length;
    const aprovados = items.filter((item) => item.status === "APROVADO" && !item.convertidoEmOs).length;
    const recusados = items.filter((item) => item.status === "RECUSADO").length;
    const convertidos = items.filter((item) => item.convertidoEmOs).length;
    return { total, pendentes, aprovados, recusados, convertidos };
  }, [items]);

  const percent = (value: number) => {
    if (resumo.total === 0) return "0%";
    return `${Math.round((value / resumo.total) * 100)}%`;
  };

  const openCreate = () => {
    setEditingOrcamento(null);
    setForm({
      ...defaultForm,
      validadeEm: toInputDate(addDays(new Date().toISOString(), 7)),
    });
    setOrcamentoModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const openEdit = (item: Orcamento) => {
    setEditingOrcamento(item);
    setForm({
      clienteNome: item.clienteNome,
      clienteTelefone: item.clienteTelefone,
      clienteEmail: item.clienteEmail,
      veiculoModelo: item.veiculoModelo,
      veiculoAno: String(item.veiculoAno),
      veiculoPlaca: item.veiculoPlaca,
      status: item.status,
      validadeEm: toInputDate(item.validadeEm),
      vendedor: item.vendedor,
      formaPagamento: item.formaPagamento,
      desconto: String(item.desconto),
      servicoDescricao: item.servicos[0]?.descricao ?? "Diagnostico eletrico",
      servicoValor: String(item.servicos[0]?.valorUnitario ?? 0),
      pecaDescricao: item.pecas[0]?.descricao ?? "Bateria Moura 60Ah",
      pecaCodigo: item.pecas[0]?.codigo ?? "BAT-001",
      pecaValor: String(item.pecas[0]?.valorUnitario ?? 0),
    });
    setOrcamentoModalOpen(true);
    setMenuOpenId(null);
    setError(null);
    setSuccess(null);
  };

  const buildPayload = (): OrcamentoPayload => {
    return {
      clienteNome: form.clienteNome.trim(),
      clienteTelefone: form.clienteTelefone.trim(),
      clienteEmail: form.clienteEmail.trim(),
      veiculoModelo: form.veiculoModelo.trim(),
      veiculoAno: Number(form.veiculoAno),
      veiculoPlaca: form.veiculoPlaca.trim().toUpperCase(),
      status: form.status,
      validadeEm: toIsoFromInputDate(form.validadeEm),
      vendedor: form.vendedor.trim(),
      formaPagamento: form.formaPagamento.trim(),
      desconto: Number(form.desconto),
      servicos: [
        {
          id: 1,
          descricao: form.servicoDescricao.trim(),
          quantidade: 1,
          valorUnitario: Number(form.servicoValor),
        },
        {
          id: 2,
          descricao: "Mao de obra",
          quantidade: 1,
          valorUnitario: 100,
        },
      ],
      pecas: [
        {
          id: 1,
          descricao: form.pecaDescricao.trim(),
          codigo: form.pecaCodigo.trim().toUpperCase(),
          quantidade: 1,
          valorUnitario: Number(form.pecaValor),
          garantia: "Garantia 6 meses",
        },
      ],
    };
  };

  const validatePayload = (payload: OrcamentoPayload) => {
    if (!payload.clienteNome || !payload.clienteTelefone || !payload.veiculoModelo || !payload.veiculoPlaca) {
      return "Preencha cliente, telefone, veiculo e placa.";
    }
    if (!Number.isFinite(payload.veiculoAno) || payload.veiculoAno < 1900) {
      return "Ano do veiculo invalido.";
    }
    if (!Number.isFinite(payload.desconto) || payload.desconto < 0) {
      return "Desconto invalido.";
    }
    if (!payload.servicos[0]?.descricao || !Number.isFinite(payload.servicos[0].valorUnitario) || payload.servicos[0].valorUnitario < 0) {
      return "Servico invalido.";
    }
    if (!payload.pecas[0]?.descricao || !payload.pecas[0]?.codigo || !Number.isFinite(payload.pecas[0].valorUnitario) || payload.pecas[0].valorUnitario < 0) {
      return "Peca invalida.";
    }
    return null;
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload();
    const validationError = validatePayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (editingOrcamento) {
        await updateOrcamento(editingOrcamento.id, payload);
        setSuccess("Orcamento atualizado com sucesso.");
      } else {
        await createOrcamento(payload);
        setSuccess("Orcamento criado com sucesso.");
      }
      setOrcamentoModalOpen(false);
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Orcamento) => {
    const confirm = window.confirm(`Excluir o orcamento ${item.numero}?`);
    if (!confirm) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteOrcamento(item.id);
      setSuccess("Orcamento excluido com sucesso.");
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (item: Orcamento) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await duplicateOrcamento(item.id);
      setSuccess("Orcamento duplicado com sucesso.");
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (item: Orcamento, status: OrcamentoStatus) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateOrcamentoStatus(item.id, status);
      setSuccess(`Status alterado para ${statusLabel(status)}.`);
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
      setMenuOpenId(null);
    }
  };

  const handleConvertSelected = async () => {
    if (!selectedOrcamento) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const osIdExistente = parseOsId(selectedOrcamento.osNumero);
      if (selectedOrcamento.convertidoEmOs && osIdExistente) {
        const ordens = await listAllOrdensServico(200, "id,desc");
        const osExistente = ordens.find((ordem) => ordem.id === osIdExistente);
        if (osExistente) {
          setSuccess(`Este orcamento ja possui OS criada (OS-${osExistente.id}).`);
          return;
        }
      }

      const placaNormalizada = normalizePlaca(selectedOrcamento.veiculoPlaca);
      const clienteNormalizado = normalizeText(selectedOrcamento.clienteNome);
      const modeloNormalizado = normalizeText(selectedOrcamento.veiculoModelo);

      let veiculos = await listAllVeiculos(100);
      let veiculo =
        veiculos.find((item: Veiculo) => normalizePlaca(item.placa) === placaNormalizada) ??
        veiculos.find((item: Veiculo) => {
          const clienteIgual = normalizeText(item.clienteNome) === clienteNormalizado;
          const modeloItem = normalizeText(item.modelo);
          const modeloParecido = modeloItem.includes(modeloNormalizado) || modeloNormalizado.includes(modeloItem);
          return clienteIgual && modeloParecido;
        });

      if (!veiculo) {
        const clientes = await listAllClientes(100);
        const telefoneNormalizado = stripDigits(selectedOrcamento.clienteTelefone);
        const emailNormalizado = normalizeText(selectedOrcamento.clienteEmail);

        let cliente =
          clientes.find((item: Cliente) => normalizeText(item.nome) === clienteNormalizado) ??
          clientes.find((item: Cliente) => normalizeText(item.email) === emailNormalizado) ??
          clientes.find((item: Cliente) => stripDigits(item.telefone) === telefoneNormalizado);

        if (!cliente) {
          cliente = await createCliente({
            nome: selectedOrcamento.clienteNome.trim(),
            cpfCnpj: buildCpfCnpjFallback(`${selectedOrcamento.veiculoPlaca}${selectedOrcamento.clienteTelefone}`),
            telefone: telefoneNormalizado || "11999999999",
            email: buildValidEmail(selectedOrcamento.clienteNome, selectedOrcamento.clienteEmail),
          });
        }

        const modeloCatalogo = inferCatalogoVeiculo(selectedOrcamento.veiculoModelo);
        try {
          veiculo = await createVeiculo({
            placa: placaNormalizada,
            modelo: modeloCatalogo.modelo,
            marca: modeloCatalogo.marca,
            ano: selectedOrcamento.veiculoAno,
            clienteId: cliente.id,
          });
        } catch {
          veiculos = await listAllVeiculos(100);
          veiculo = veiculos.find((item: Veiculo) => normalizePlaca(item.placa) === placaNormalizada);
        }
      }

      if (!veiculo) {
        throw new Error("Nao foi possivel localizar ou criar o veiculo para converter este orcamento em OS.");
      }

      const servicosConvertidos = selectedOrcamento.servicos
        .map((item) => `${item.descricao} (x${item.quantidade})`)
        .join("; ");

      const problemaRelatado = servicosConvertidos || `Conversao do orcamento ${selectedOrcamento.numero}`;

      const ordemCriada = await createOrdemServico({
        clienteId: veiculo.clienteId,
        veiculoId: veiculo.id,
        problemaRelatado,
        diagnostico: `OS criada a partir do orcamento ${selectedOrcamento.numero}`,
        valorTotal: calcTotal(selectedOrcamento),
        status: "RECEBIDO",
      });

      const ordensAtualizadas = await listAllOrdensServico(200, "id,desc");
      const osCriadaNaLista = ordensAtualizadas.some((ordem) => ordem.id === ordemCriada.id);
      if (!osCriadaNaLista) {
        throw new Error(`A OS-${ordemCriada.id} foi criada, mas nao apareceu na listagem de ordens.`);
      }

      await converterOrcamentoEmOs(selectedOrcamento.id, `OS-${ordemCriada.id}`);
      setSuccess(`Orcamento convertido em OS com sucesso (OS-${ordemCriada.id}).`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePrintSelected = async () => {
    if (!selectedOrcamento) return;

    const popup = window.open("", "_blank", "width=920,height=760");
    if (!popup) {
      setError("Nao foi possivel abrir janela de impressao.");
      return;
    }

    const safeNumero = escapeHtml(selectedOrcamento.numero);
    const safeCliente = escapeHtml(selectedOrcamento.clienteNome);
    const safeTelefone = escapeHtml(selectedOrcamento.clienteTelefone);
    const safeEmail = escapeHtml(selectedOrcamento.clienteEmail);
    const safeVeiculo = escapeHtml(selectedOrcamento.veiculoModelo);
    const safePlaca = escapeHtml(selectedOrcamento.veiculoPlaca);
    const safeAno = escapeHtml(selectedOrcamento.veiculoAno);
    const dataEmissao = dateShort.format(new Date(selectedOrcamento.criadoEm));
    const validade = dateShort.format(new Date(selectedOrcamento.validadeEm));
    const totalServicos = calcServicosTotal(selectedOrcamento);
    const totalPecas = calcPecasTotal(selectedOrcamento);
    const subtotal = calcSubtotal(selectedOrcamento);
    const desconto = Number(selectedOrcamento.desconto) || 0;
    const total = calcTotal(selectedOrcamento);
    const absoluteLogoUrl = `${window.location.origin}/logo-jhonycar.png`;
    let logoSrc = absoluteLogoUrl;
    try {
      const response = await fetch(absoluteLogoUrl, { cache: "force-cache" });
      if (response.ok) {
        const logoBlob = await response.blob();
        logoSrc = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve(typeof reader.result === "string" ? reader.result : absoluteLogoUrl);
          reader.onerror = () => resolve(absoluteLogoUrl);
          reader.readAsDataURL(logoBlob);
        });
      }
    } catch {
      logoSrc = absoluteLogoUrl;
    }

    const servicosHtml =
      selectedOrcamento.servicos.length > 0
        ? selectedOrcamento.servicos
            .map(
              (item) =>
                `<tr><td class="description">${escapeHtml(item.descricao)}</td><td class="center">${escapeHtml(item.quantidade)}</td><td class="right">${escapeHtml(money.format(item.valorUnitario))}</td><td class="right">${escapeHtml(money.format(item.quantidade * item.valorUnitario))}</td></tr>`,
            )
            .join("")
        : `<tr><td colspan="4" class="empty">Nenhum servico informado.</td></tr>`;

    const pecasHtml =
      selectedOrcamento.pecas.length > 0
        ? selectedOrcamento.pecas
            .map(
              (item) =>
                `<tr><td class="description">${escapeHtml(item.descricao)}${item.codigo ? ` (${escapeHtml(item.codigo)})` : ""}</td><td class="center">${escapeHtml(item.quantidade)}</td><td class="right">${escapeHtml(money.format(item.valorUnitario))}</td><td class="right">${escapeHtml(money.format(item.quantidade * item.valorUnitario))}</td></tr>`,
            )
            .join("")
        : `<tr><td colspan="4" class="empty">Nenhuma peca informada.</td></tr>`;

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <title>${safeNumero}</title>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            :root {
              --jc-blue-950: #031739;
              --jc-blue-900: #072a5f;
              --jc-blue-800: #0b3f91;
              --jc-blue-700: #145dd0;
              --jc-blue-600: #1c7af3;
              --jc-line: #d4dcea;
              --jc-surface: #ffffff;
              --jc-soft: #f5f7fb;
              --jc-soft-2: #ebf0f8;
              --jc-text: #0f172a;
              --jc-muted: #475569;
              --jc-danger: #dc2626;
            }
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            html,
            body {
              margin: 0;
              padding: 0;
              max-width: 794px;
              overflow: visible;
              box-sizing: border-box;
            }
            body {
              background: #f3f4f6;
              font-family: "Inter", sans-serif;
              margin: 0 auto;
              color: var(--jc-text);
            }
            .page {
              width: 794px;
              max-width: 794px;
              margin: 0 auto;
              overflow: visible;
              box-sizing: border-box;
              background: var(--jc-surface);
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .header {
              position: relative;
              overflow: visible;
              color: #ffffff;
              background: radial-gradient(145% 170% at 0% 0%, #10418e 0%, #072a65 45%, #031533 100%);
              border-bottom: 1px solid #082a62;
              padding: 14px 30px;
            }
            .header-grid {
              position: relative;
              z-index: 2;
              display: grid;
              grid-template-columns: 190px minmax(0, 1fr);
              gap: 20px;
              align-items: center;
            }
            .brand-side {
              min-width: 0;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: flex-start;
            }
            .logo-panel {
              display: block;
              width: 160px;
              height: 122px;
              max-width: 160px;
              border-radius: 10px;
              overflow: hidden;
              border: 1px solid rgba(255, 255, 255, 0.2);
              box-shadow: 0 10px 24px rgba(1, 11, 31, 0.36);
              flex: 0 0 auto;
            }
            .logo-photo {
              width: 100%;
              height: 100%;
              max-width: 100%;
              display: block;
              object-fit: cover;
              object-position: center;
            }
            .doc-side {
              min-width: 0;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: flex-start;
              gap: 8px;
            }
            .doc-title {
              margin: 0;
              font-size: 58px;
              line-height: 1;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.01em;
              white-space: nowrap;
            }
            .doc-badge {
              display: inline-block;
              border-radius: 12px;
              background: linear-gradient(90deg, #1472ec, #2f91ff);
              color: #ffffff;
              font-size: 24px;
              line-height: 1;
              font-weight: 900;
              letter-spacing: 0.02em;
              padding: 12px 18px;
            }
            .meta-list {
              margin-top: 2px;
              display: grid;
              gap: 8px;
              color: rgba(255, 255, 255, 0.96);
              font-size: 18px;
              line-height: 1.26;
            }
            .meta-item {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .meta-item strong {
              font-weight: 800;
            }
            .meta-icon {
              width: 24px;
              height: 24px;
              flex-shrink: 0;
            }
            .meta-icon path,
            .meta-icon rect,
            .meta-icon line,
            .meta-icon circle {
              stroke: #ffffff;
              stroke-width: 2;
              fill: none;
              stroke-linecap: round;
              stroke-linejoin: round;
            }

            .section {
              height: auto;
              min-height: unset;
              page-break-inside: avoid;
              break-inside: avoid;
              overflow: visible;
            }
            .content {
              padding: 0 34px;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
            }
            .info-card {
              background: var(--jc-surface);
              border: 2px solid var(--jc-line);
              border-radius: 14px;
              padding: 14px 16px;
              overflow: visible;
              box-shadow: 0 5px 14px rgba(8, 33, 74, 0.06);
              height: auto;
              min-height: unset;
            }
            .card-head {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 8px;
            }
            .icon-dot {
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: linear-gradient(180deg, #0d4aa5, #0b3f91);
              color: #ffffff;
              display: grid;
              place-items: center;
              flex-shrink: 0;
            }
            .icon-dot svg {
              width: 20px;
              height: 20px;
            }
            .icon-dot svg path,
            .icon-dot svg rect,
            .icon-dot svg circle,
            .icon-dot svg polyline,
            .icon-dot svg line {
              stroke: #ffffff;
              stroke-width: 2;
              fill: none;
              stroke-linecap: round;
              stroke-linejoin: round;
            }
            .icon-dot svg.fill path,
            .icon-dot svg.fill circle,
            .icon-dot svg.fill rect {
              fill: #ffffff;
              stroke: none;
            }
            .card-title {
              margin: 0;
              color: #0d469f;
              font-size: 24px;
              line-height: 1;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.01em;
            }
            .card-main {
              margin: 0 0 8px;
              font-size: 20px;
              line-height: 1.2;
              font-weight: 800;
              color: #0f172a;
            }
            .card-sub {
              margin: 0;
              font-size: 14px;
              line-height: 1.4;
              color: var(--jc-muted);
            }

            .work-card {
              background: var(--jc-surface);
              border: 2px solid var(--jc-line);
              border-radius: 14px;
              padding: 12px;
              overflow: visible;
              box-shadow: 0 5px 14px rgba(8, 33, 74, 0.06);
            }
            .section-head {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 6px;
            }
            .section-title {
              margin: 0;
              color: #0d469f;
              font-size: 21px;
              line-height: 1;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.01em;
            }
            .items-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              table-layout: fixed;
              border: 1px solid #d1d9e6;
              border-radius: 6px;
              overflow: visible;
            }
            .items-table col:nth-child(1) {
              width: 48%;
            }
            .items-table col:nth-child(2) {
              width: 12%;
            }
            .items-table col:nth-child(3) {
              width: 20%;
            }
            .items-table col:nth-child(4) {
              width: 20%;
            }
            .items-table thead th {
              background: linear-gradient(90deg, #062b6f, #0c3f92);
              color: #ffffff;
              font-size: 13px;
              line-height: 1.2;
              font-weight: 800;
              text-transform: uppercase;
              padding: 8px 10px;
              border-right: 1px solid rgba(255, 255, 255, 0.28);
              text-align: left;
            }
            .items-table thead th:last-child {
              border-right: none;
            }
            .items-table tbody tr:nth-child(even) td {
              background: #f8fbff;
            }
            .items-table tbody td {
              background: #ffffff;
              color: #111827;
              font-size: 13px;
              line-height: 1.25;
              padding: 8px 10px;
              border-top: 1px solid #e8eef7;
              vertical-align: middle;
            }
            .items-table td.description {
              line-height: 1.32;
            }
            .items-table td.empty {
              text-align: center;
              color: #64748b;
            }
            .items-table .center {
              text-align: center;
            }
            .items-table .right {
              text-align: right;
            }
            .line-total {
              margin-top: 7px;
              border-radius: 6px;
              padding: 8px 14px;
              background: linear-gradient(90deg, #edf2f8, #e6edf7);
              color: #0c439d;
              display: flex;
              justify-content: flex-end;
              gap: 20px;
              font-size: 16px;
              line-height: 1.2;
              font-weight: 800;
            }

            .bottom-grid {
              display: grid;
              grid-template-columns: minmax(0, 1fr) 356px;
              gap: 12px;
              align-items: end;
            }
            .notes-card {
              border: 2px solid var(--jc-line);
              border-radius: 12px;
              background: var(--jc-surface);
              padding: 12px;
              height: auto;
              min-height: unset;
            }
            .notes-head {
              margin: 0 0 6px;
              display: flex;
              align-items: center;
              gap: 8px;
              color: #0d469f;
              font-size: 21px;
              line-height: 1;
              font-weight: 900;
              text-transform: uppercase;
            }
            .notes-list {
              margin: 0;
              padding-left: 22px;
              color: var(--jc-text);
              font-size: 14px;
              line-height: 1.38;
              display: grid;
              gap: 5px;
            }
            .summary {
              border-radius: 12px;
              border: 2px solid #d2dae8;
              overflow: visible;
              background: var(--jc-surface);
            }
            .sum-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid #dde4ef;
              padding: 10px 14px;
              font-size: 17px;
              line-height: 1.2;
              font-weight: 800;
            }
            .sum-row.discount {
              color: var(--jc-danger);
            }
            .sum-total {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 11px 14px;
              background: linear-gradient(90deg, #08327f, #0f4fa9);
              color: #ffffff;
              font-size: 30px;
              line-height: 1;
              font-weight: 900;
              text-transform: uppercase;
            }

            .contact-band {
              margin: 0 34px;
              background: var(--jc-surface);
              border: 2px solid var(--jc-line);
              border-radius: 14px;
              padding: 10px 12px;
              overflow: visible;
              box-shadow: 0 5px 14px rgba(8, 33, 74, 0.06);
            }
            .contact-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
            }
            .contact-item {
              display: grid;
              grid-template-columns: 44px 1fr;
              gap: 10px;
              align-items: start;
              position: relative;
              padding-right: 8px;
            }
            .contact-item::after {
              content: "";
              position: absolute;
              top: 4px;
              right: -8px;
              width: 1px;
              height: calc(100% - 8px);
              background: #dbe2ee;
            }
            .contact-item:last-child::after {
              display: none;
            }
            .contact-icon {
              width: 42px;
              height: 42px;
              border-radius: 50%;
              background: linear-gradient(180deg, #0d4aa5, #0b3f91);
              color: #ffffff;
              display: grid;
              place-items: center;
            }
            .contact-icon svg {
              width: 20px;
              height: 20px;
            }
            .contact-icon svg path,
            .contact-icon svg rect,
            .contact-icon svg circle,
            .contact-icon svg line {
              stroke: #ffffff;
              stroke-width: 2;
              fill: none;
              stroke-linecap: round;
              stroke-linejoin: round;
            }
            .contact-label {
              margin: 0 0 4px;
              color: #0d469f;
              font-size: 14px;
              line-height: 1.1;
              font-weight: 900;
              text-transform: uppercase;
            }
            .contact-line {
              margin: 0;
              color: #111827;
              font-size: 13px;
              line-height: 1.34;
            }

            .avoid-break {
              height: auto;
              min-height: unset;
              break-inside: avoid;
              page-break-inside: avoid;
              overflow: visible;
            }

            @media screen and (max-width: 680px) {
              html,
              body {
                width: 100%;
                max-width: 100%;
              }
              body {
                margin: 0;
              }
              .page {
                width: 100%;
                min-height: unset;
              }
              .header {
                height: auto;
                min-height: unset;
                padding: 18px 16px;
              }
              .header-grid {
                grid-template-columns: 1fr;
                gap: 14px;
                padding: 0;
              }
              .logo-panel {
                width: 144px;
                height: 112px;
                max-width: 144px;
              }
              .doc-side {
                align-items: flex-start;
              }
              .content {
                padding: 0 16px;
              }
              .info-grid,
              .bottom-grid,
              .contact-grid {
                grid-template-columns: 1fr;
              }
              .contact-band {
                margin: 0 16px 10px;
              }
              .contact-item::after {
                display: none;
              }
            }

            @media print {
              .section {
                break-inside: avoid;
                page-break-inside: avoid;
              }
              html,
              body {
                background: #ffffff !important;
                width: 794px;
                max-width: 794px;
                margin: 0;
                padding: 0;
              }
              .page {
                width: 794px;
                height: auto;
                min-height: unset;
                overflow: visible;
                gap: 12px;
              }
              .header-grid {
                grid-template-columns: 190px minmax(0, 1fr);
                align-items: center;
              }
              .info-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
              .bottom-grid {
                grid-template-columns: minmax(0, 1fr) 356px;
              }
              .contact-grid {
                grid-template-columns: repeat(3, 1fr);
              }
              table {
                page-break-inside: auto;
              }
              thead {
                display: table-header-group;
              }
            }
          </style>
        </head>
        <body>
          <article class="page">
            <header class="header avoid-break">
              <div class="header-grid">
                    <div class="brand-side">
                      <div class="logo-panel">
                        <img class="logo-photo" src="${escapeHtml(logoSrc)}" alt="Logo JhonyCar" />
                      </div>
                    </div>
                    <div class="doc-side">
                      <h2 class="doc-title">OR&Ccedil;AMENTO</h2>
                      <div class="doc-badge">${safeNumero}</div>
                      <div class="meta-list">
                        <div class="meta-item">
                          <svg class="meta-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="3" y="4.5" width="18" height="16.5" rx="2.5"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="8" y1="3" x2="8" y2="7"></line>
                            <line x1="16" y1="3" x2="16" y2="7"></line>
                            <line x1="8" y1="13" x2="8" y2="13"></line>
                            <line x1="12" y1="13" x2="12" y2="13"></line>
                          </svg>
                          <span><strong>Data de emiss&atilde;o:</strong> ${escapeHtml(dataEmissao)}</span>
                        </div>
                        <div class="meta-item">
                          <svg class="meta-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="12" r="9"></circle>
                            <line x1="12" y1="7" x2="12" y2="12"></line>
                            <line x1="12" y1="12" x2="15.5" y2="14"></line>
                          </svg>
                          <span><strong>Validade:</strong> ${escapeHtml(validade)}</span>
                        </div>
                      </div>
                    </div>
              </div>
            </header>

            <main class="content">
              <section class="info-grid section">
                    <article class="info-card">
                      <div class="card-head">
                        <span class="icon-dot">
                          <svg viewBox="0 0 24 24" class="fill" aria-hidden="true">
                            <circle cx="12" cy="8.2" r="3.4"></circle>
                            <path d="M5.8 18.4C6.8 14.9 9 13.4 12 13.4C15 13.4 17.2 14.9 18.2 18.4"></path>
                          </svg>
                        </span>
                        <h3 class="card-title">Cliente</h3>
                      </div>
                      <p class="card-main">${safeCliente}</p>
                      <p class="card-sub">${safeTelefone || "-"}</p>
                      <p class="card-sub">${safeEmail || "-"}</p>
                    </article>

                    <article class="info-card">
                      <div class="card-head">
                        <span class="icon-dot">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4.6 14.2L6.4 9.8C6.9 8.6 7.7 8 9 8H15C16.3 8 17.1 8.6 17.6 9.8L19.4 14.2"></path>
                            <rect x="3.8" y="14.2" width="16.4" height="4.8" rx="1.3"></rect>
                            <circle cx="7.3" cy="16.6" r="1"></circle>
                            <circle cx="16.7" cy="16.6" r="1"></circle>
                          </svg>
                        </span>
                        <h3 class="card-title">Ve&iacute;culo</h3>
                      </div>
                      <p class="card-main">${safeVeiculo} ${safeAno} - ${safePlaca}</p>
                      <p class="card-sub">Marca/Modelo: ${safeVeiculo}</p>
                      <p class="card-sub">Ano: ${safeAno} &nbsp;|&nbsp; Placa: ${safePlaca}</p>
                    </article>
              </section>

              <section class="work-card section">
                <div class="section-head">
                  <span class="icon-dot">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M21 6.8L17.2 10.6"></path>
                      <path d="M14.6 8L16.9 10.3L8.9 18.3L6.6 16Z"></path>
                      <path d="M4.6 19.4L6.6 16"></path>
                    </svg>
                  </span>
                  <p class="section-title">Servi&ccedil;os</p>
                </div>
                <table class="items-table">
                  <colgroup>
                    <col />
                    <col />
                    <col />
                    <col />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Descri&ccedil;&atilde;o</th>
                      <th class="center">Qtd.</th>
                      <th class="right">Valor unit.</th>
                      <th class="right">Valor total</th>
                    </tr>
                  </thead>
                  <tbody>${servicosHtml}</tbody>
                </table>
                <div class="line-total">
                  <span>Total de servi&ccedil;os</span>
                  <span>${escapeHtml(money.format(totalServicos))}</span>
                </div>
              </section>

              <section class="work-card section">
                <div class="section-head">
                  <span class="icon-dot">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="5" y="6.2" width="14" height="12.8"></rect>
                      <path d="M5 10.6L12 14.6L19 10.6"></path>
                      <path d="M12 14.6V19"></path>
                    </svg>
                  </span>
                  <p class="section-title">Pe&ccedil;as</p>
                </div>
                <table class="items-table">
                  <colgroup>
                    <col />
                    <col />
                    <col />
                    <col />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Descri&ccedil;&atilde;o</th>
                      <th class="center">Qtd.</th>
                      <th class="right">Valor unit.</th>
                      <th class="right">Valor total</th>
                    </tr>
                  </thead>
                  <tbody>${pecasHtml}</tbody>
                </table>
                <div class="line-total">
                  <span>Total de pe&ccedil;as</span>
                  <span>${escapeHtml(money.format(totalPecas))}</span>
                </div>
              </section>

              <section class="bottom-grid section">
                <article class="notes-card">
                  <p class="notes-head">
                    <span class="icon-dot">
                      <svg viewBox="0 0 24 24" class="fill" aria-hidden="true">
                        <circle cx="12" cy="6.6" r="1.6"></circle>
                        <rect x="10.8" y="10" width="2.4" height="7.4" rx="1.2"></rect>
                      </svg>
                    </span>
                    Observa&ccedil;&otilde;es
                  </p>
                  <ul class="notes-list">
                    <li>Or&ccedil;amento v&aacute;lido por 15 dias.</li>
                    <li>Valores sujeitos a altera&ccedil;&atilde;o sem aviso pr&eacute;vio.</li>
                    <li>Pe&ccedil;as e servi&ccedil;os possuem garantia conforme legisla&ccedil;&atilde;o vigente.</li>
                  </ul>
                </article>

                <aside class="summary">
                  <div class="sum-row"><span>Subtotal</span><span>${escapeHtml(money.format(subtotal))}</span></div>
                  <div class="sum-row discount"><span>Desconto</span><span>- ${escapeHtml(money.format(desconto))}</span></div>
                  <div class="sum-total"><span>Total</span><span>${escapeHtml(money.format(total))}</span></div>
                </aside>
              </section>
            </main>

            <section class="contact-band section">
              <div class="contact-grid">
                <article class="contact-item">
                  <span class="contact-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 21C12 21 5 14.8 5 10.2A7 7 0 0 1 19 10.2C19 14.8 12 21 12 21Z"></path>
                      <circle cx="12" cy="10.2" r="2.4"></circle>
                    </svg>
                  </span>
                  <div>
                    <p class="contact-label">Endere&ccedil;o</p>
                    <p class="contact-line">Rua Ver&ocirc;nica, 180 - Imirim</p>
                    <p class="contact-line">S&atilde;o Paulo - SP, Brasil</p>
                    <p class="contact-line">CEP 02610-080</p>
                  </div>
                </article>

                <article class="contact-item">
                  <span class="contact-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="4"></rect>
                      <circle cx="12" cy="12" r="3.4"></circle>
                      <circle cx="17.1" cy="6.9" r="0.6" fill="#ffffff" stroke="none"></circle>
                    </svg>
                  </span>
                  <div>
                    <p class="contact-label">Instagram</p>
                    <p class="contact-line">@jhonycar_</p>
                  </div>
                </article>

                <article class="contact-item">
                  <span class="contact-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20 11.4C20 15.7 16.4 19.2 12 19.2C11 19.2 10 19 9 18.6L4.5 19.8L5.8 15.5C5.3 14.5 5 13.5 5 12.4C5 8.1 8.6 4.6 13 4.6C17.4 4.6 21 8.1 21 12.4Z"></path>
                      <path d="M9.3 9.8C9.6 11 10.2 11.9 11.2 12.9C12.2 13.9 13.2 14.5 14.3 14.7L15 13.3C15.1 13.2 15.3 13.1 15.5 13.2C15.9 13.4 16.3 13.6 16.7 13.7C16.9 13.8 17 13.9 17 14.1C16.9 15.2 16.2 15.9 15.1 15.8C13.9 15.7 12.5 14.9 11 13.5C9.6 12 8.8 10.6 8.7 9.4C8.6 8.3 9.3 7.6 10.4 7.5C10.6 7.5 10.7 7.6 10.8 7.8C10.9 8.2 11.1 8.6 11.3 9C11.4 9.1 11.3 9.3 11.2 9.4L9.8 10C9.6 10.1 9.4 10 9.3 9.8Z"></path>
                    </svg>
                  </span>
                  <div>
                    <p class="contact-label">WhatsApp</p>
                    <p class="contact-line">(11) 94512-8020</p>
                  </div>
                </article>
              </div>
            </section>

          </article>
        </body>
      </html>
    `;

    popup.document.write(html);
    popup.document.close();
    const triggerPrint = () => {
      popup.focus();
      popup.print();
    };

    const images = Array.from(popup.document.images);
    if (images.length === 0) {
      setTimeout(triggerPrint, 120);
      return;
    }

    const waitImages = Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          }),
      ),
    );

    Promise.race([waitImages, new Promise<void>((resolve) => setTimeout(resolve, 1400))]).then(() => {
      setTimeout(triggerPrint, 120);
    });
  };

  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-title text-[2.25rem] font-bold text-white">Orcamentos</h1>
        <p className="text-slate-300">Gerencie e acompanhe todos os orcamentos</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{success}</div>
      ) : null}

      <div className="jc-stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,22,45,0.98),rgba(7,14,30,0.96))] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/15 ring-1 ring-blue-300/25 text-blue-200">
              <CircleDollarSign size={20} />
            </div>
            <div>
              <p className="text-sm text-blue-300">Total de orcamentos</p>
              <p className="font-title text-4xl font-bold leading-none text-white">{resumo.total}</p>
              <p className="mt-1 text-sm text-slate-400">+{monthlyNew} este mes</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,22,45,0.98),rgba(7,14,30,0.96))] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/15 ring-1 ring-amber-300/25 text-amber-200">
              <Clock3 size={20} />
            </div>
            <div>
              <p className="text-sm text-amber-300">Pendentes</p>
              <p className="font-title text-4xl font-bold leading-none text-white">{resumo.pendentes}</p>
              <p className="mt-1 text-sm text-slate-400">{percent(resumo.pendentes)} do total</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,22,45,0.98),rgba(7,14,30,0.96))] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-300/25 text-emerald-200">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm text-emerald-300">Aprovados</p>
              <p className="font-title text-4xl font-bold leading-none text-white">{resumo.aprovados}</p>
              <p className="mt-1 text-sm text-slate-400">{percent(resumo.aprovados)} do total</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,22,45,0.98),rgba(7,14,30,0.96))] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-rose-500/15 ring-1 ring-rose-300/25 text-rose-200">
              <ThumbsDown size={20} />
            </div>
            <div>
              <p className="text-sm text-rose-300">Recusados</p>
              <p className="font-title text-4xl font-bold leading-none text-white">{resumo.recusados}</p>
              <p className="mt-1 text-sm text-slate-400">{percent(resumo.recusados)} do total</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,22,45,0.98),rgba(7,14,30,0.96))] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-500/15 ring-1 ring-violet-300/25 text-violet-200">
              <Package size={20} />
            </div>
            <div>
              <p className="text-sm text-violet-300">Convertidos em OS</p>
              <p className="font-title text-4xl font-bold leading-none text-white">{resumo.convertidos}</p>
              <p className="mt-1 text-sm text-slate-400">{percent(resumo.convertidos)} do total</p>
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(11,23,46,0.98),rgba(7,15,33,0.96))] p-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.6fr_0.8fr_0.8fr_auto] xl:items-end">
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c1933]/75 px-3 py-2.5 text-slate-200">
            <Search size={16} className="text-slate-400" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Buscar por cliente, veiculo, placa..."
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-300">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="rounded-xl border border-white/10 bg-[#0c1933]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value="TODOS">Todos</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="APROVADO">Aprovados</option>
              <option value="RECUSADO">Recusados</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-300">
            <span>Periodo</span>
            <select
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value as PeriodFilter)}
              className="rounded-xl border border-white/10 bg-[#0c1933]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value="TODOS">Todos</option>
              <option value="7_DIAS">Ultimos 7 dias</option>
              <option value="15_DIAS">Ultimos 15 dias</option>
              <option value="30_DIAS">Ultimos 30 dias</option>
            </select>
          </label>

          <Button variant="secondary" className="h-11" onClick={() => setShowMoreFilters((prev) => !prev)}>
            <span className="inline-flex items-center gap-2">
              <Filter size={15} />
              Mais filtros
            </span>
          </Button>
        </div>

        {showMoreFilters ? (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Input
              label="Total minimo"
              type="number"
              min={0}
              step="0.01"
              value={minTotal}
              onChange={(event) => setMinTotal(event.target.value)}
            />
            <Input
              label="Total maximo"
              type="number"
              min={0}
              step="0.01"
              value={maxTotal}
              onChange={(event) => setMaxTotal(event.target.value)}
            />
            <label className="flex flex-col gap-1 text-sm text-slate-300">
              <span>Vendedor</span>
              <select
                value={sellerFilter}
                onChange={(event) => setSellerFilter(event.target.value)}
                className="h-[46px] rounded-xl border border-white/10 bg-[#0c1933]/75 px-3 text-slate-100 outline-none focus:border-blue-400"
              >
                <option value="TODOS">Todos</option>
                {vendedores.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Button
                variant="ghost"
                className="h-11 w-full"
                onClick={() => {
                  setSearchText("");
                  setStatusFilter("TODOS");
                  setPeriodFilter("TODOS");
                  setMinTotal("");
                  setMaxTotal("");
                  setSellerFilter("TODOS");
                }}
              >
                Limpar filtros
              </Button>
            </div>
            <div className="flex items-end">
              <Button className="h-11 w-full" onClick={openCreate}>
                <span className="inline-flex items-center gap-2">
                  <Plus size={16} />
                  Novo orcamento
                </span>
              </Button>
            </div>
          </div>
        ) : null}
      </article>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(10,22,45,0.98),rgba(6,14,30,0.96))] p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-white/[0.02]">
                <tr className="border-b border-white/10 text-left text-sm text-slate-400">
                  <th className="px-4 py-3 font-medium">Numero</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Veiculo</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Valor total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Acoes</th>
                </tr>
              </thead>

              <tbody>
                {pagedItems.length > 0 ? (
                  pagedItems.map((item) => {
                    const isSelected = selectedId === item.id;
                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          "border-b border-white/5 text-sm text-slate-100 last:border-0 hover:bg-blue-500/[0.06]",
                          isSelected ? "bg-blue-500/[0.08]" : "",
                        )}
                      >
                        <td className="px-4 py-2 text-slate-100">{item.numero}</td>
                        <td className="px-4 py-2">{item.clienteNome}</td>
                        <td className="px-4 py-2 text-slate-200">
                          <div>{item.veiculoModelo} {item.veiculoAno}</div>
                          <div className="text-xs text-slate-500">{item.veiculoPlaca}</div>
                        </td>
                        <td className="px-4 py-2 text-slate-200">{dateShort.format(new Date(item.criadoEm))}</td>
                        <td className="px-4 py-2 font-medium text-slate-100">{money.format(calcTotal(item))}</td>
                        <td className="px-4 py-2">
                          <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs", statusClass(item.status))}>
                            {statusLabel(item.status)}
                          </span>
                        </td>
                        <td className="relative px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedId(item.id)}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition hover:border-blue-300/30 hover:text-blue-100"
                              aria-label={`Ver ${item.numero}`}
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-blue-300/25 bg-blue-500/12 text-blue-200 transition hover:bg-blue-500/22"
                              aria-label={`Editar ${item.numero}`}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setMenuOpenId((prev) => (prev === item.id ? null : item.id))}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition hover:border-blue-300/30 hover:text-blue-100"
                              aria-label={`Mais opcoes ${item.numero}`}
                            >
                              <MoreHorizontal size={15} />
                            </button>
                          </div>

                          {menuOpenId === item.id ? (
                            <div className="absolute right-4 top-12 z-20 w-44 rounded-xl border border-white/10 bg-[#08152f] p-1.5 shadow-[0_15px_32px_rgba(2,8,22,0.5)]">
                              <button
                                type="button"
                                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
                                onClick={() => void handleStatusChange(item, "APROVADO")}
                              >
                                Marcar aprovado
                              </button>
                              <button
                                type="button"
                                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
                                onClick={() => void handleStatusChange(item, "PENDENTE")}
                              >
                                Marcar pendente
                              </button>
                              <button
                                type="button"
                                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
                                onClick={() => void handleStatusChange(item, "RECUSADO")}
                              >
                                Marcar recusado
                              </button>
                              <button
                                type="button"
                                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
                                onClick={() => void handleDuplicate(item)}
                              >
                                Duplicar
                              </button>
                              <button
                                type="button"
                                className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-200 transition hover:bg-rose-500/10"
                                onClick={() => void handleDelete(item)}
                              >
                                Excluir
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      Nenhum orcamento encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 px-5 py-4 md:flex-row md:items-center">
            <p className="text-sm text-slate-300">
              Mostrando {firstItem} a {lastItem} de {totalRows.toLocaleString("pt-BR")} orcamentos
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-10 rounded-xl border border-white/10 bg-[#0c1933]/75 px-3 text-sm text-slate-100 outline-none focus:border-blue-400"
              >
                <option value={10}>10 por pagina</option>
                <option value={20}>20 por pagina</option>
                <option value={50}>50 por pagina</option>
              </select>

              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#0c1933]/75 text-slate-200 transition hover:border-blue-300/35 disabled:opacity-50"
                disabled={currentPage <= 1}
                aria-label="Pagina anterior"
              >
                <ChevronLeft size={16} />
              </button>

              {visiblePages.map((p, index) => {
                const prev = visiblePages[index - 1];
                const hasGap = prev && p - prev > 1;
                return (
                  <div key={p} className="flex items-center gap-2">
                    {hasGap ? <span className="text-slate-500">...</span> : null}
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      className={cn(
                        "h-10 min-w-10 rounded-xl border px-3 text-sm transition",
                        p === currentPage
                          ? "border-blue-300/35 bg-blue-600/75 text-white"
                          : "border-white/10 bg-[#0c1933]/75 text-slate-300 hover:border-blue-300/35",
                      )}
                    >
                      {p}
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#0c1933]/75 text-slate-200 transition hover:border-blue-300/35 disabled:opacity-50"
                disabled={currentPage >= totalPages}
                aria-label="Proxima pagina"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(10,22,45,0.98),rgba(6,14,30,0.96))] p-4">
          {selectedOrcamento ? (
            <>
              <header className="mb-4 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                <h2 className="font-title text-2xl font-semibold text-white">
                  Orcamento <span className="text-brand-300">{selectedOrcamento.numero}</span>
                </h2>
                <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs", statusClass(selectedOrcamento.status))}>
                  {selectedOrcamento.convertidoEmOs ? "Convertido em OS" : statusLabel(selectedOrcamento.status)}
                </span>
              </header>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="space-y-1 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-sm font-semibold text-slate-100">{selectedOrcamento.clienteNome}</p>
                  <p className="text-xs text-slate-400">{selectedOrcamento.clienteTelefone}</p>
                  <p className="text-xs text-slate-400">{selectedOrcamento.clienteEmail}</p>
                </div>
                <div className="space-y-1 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-sm font-semibold text-slate-100">
                    {selectedOrcamento.veiculoModelo} {selectedOrcamento.veiculoAno}
                  </p>
                  <p className="text-xs text-slate-400">Placa: {selectedOrcamento.veiculoPlaca}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">Data de criacao</p>
                  <p className="text-slate-200">{dateWithTime.format(new Date(selectedOrcamento.criadoEm))}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Validade</p>
                  <p className="text-slate-200">{dateShort.format(new Date(selectedOrcamento.validadeEm))}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Forma de pagamento</p>
                  <p className="text-slate-200">{selectedOrcamento.formaPagamento}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Vendedor</p>
                  <p className="text-slate-200">{selectedOrcamento.vendedor}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <h3 className="font-title text-lg text-slate-100">Itens do orcamento</h3>

                <div className="mt-3">
                  <p className="mb-2 text-sm font-semibold text-slate-200">Servicos</p>
                  <div className="space-y-1">
                    {selectedOrcamento.servicos.map((item) => (
                      <div key={`servico-${item.id}`} className="grid grid-cols-[1fr_56px_110px_110px] gap-2 rounded-lg border border-white/5 bg-[#091734]/45 px-2.5 py-2 text-sm">
                        <p className="text-slate-100">{item.descricao}</p>
                        <p className="text-center text-slate-300">{item.quantidade}</p>
                        <p className="text-right text-slate-300">{money.format(item.valorUnitario)}</p>
                        <p className="text-right font-medium text-slate-100">{money.format(item.quantidade * item.valorUnitario)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-slate-200">Pecas</p>
                  <div className="space-y-1">
                    {selectedOrcamento.pecas.map((item) => {
                      const imageUrl = pecaImageMap[item.codigo.toUpperCase()];
                      return (
                        <div key={`peca-${item.id}`} className="rounded-lg border border-white/5 bg-[#091734]/45 px-2.5 py-2">
                          <div className="grid grid-cols-[46px_1fr_56px_110px_110px] items-center gap-2 text-sm">
                            <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg border border-white/15 bg-blue-500/15 text-blue-200">
                              {imageUrl ? (
                                <img src={imageUrl} alt={item.descricao} className="h-10 w-10 object-cover" />
                              ) : (
                                <Package size={16} />
                              )}
                            </div>
                            <div>
                              <p className="text-slate-100">{item.descricao}</p>
                              <p className="text-xs text-slate-500">{item.codigo}</p>
                            </div>
                            <p className="text-center text-slate-300">{item.quantidade}</p>
                            <p className="text-right text-slate-300">{money.format(item.valorUnitario)}</p>
                            <p className="text-right font-medium text-slate-100">{money.format(item.quantidade * item.valorUnitario)}</p>
                          </div>
                          {item.garantia ? <p className="mt-1 text-xs text-violet-300">{item.garantia}</p> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Subtotal</span>
                  <span>{money.format(calcSubtotal(selectedOrcamento))}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm text-slate-300">
                  <span>Desconto</span>
                  <span>{money.format(Number(selectedOrcamento.desconto))}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-title text-[1.65rem] font-semibold text-white">Total</span>
                  <span className="font-title text-[1.9rem] font-bold text-emerald-300">{money.format(calcTotal(selectedOrcamento))}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                <Button variant="secondary" onClick={handlePrintSelected} className="h-11">
                  <span className="inline-flex items-center gap-2">
                    <Printer size={15} />
                    Imprimir
                  </span>
                </Button>
                <Button
                  variant="secondary"
                  className="h-11 border-emerald-300/30 bg-emerald-600/20 text-emerald-100 hover:bg-emerald-500/30"
                  onClick={() => window.open(buildWhatsappLink(selectedOrcamento), "_blank", "noopener,noreferrer")}
                >
                  <span className="inline-flex items-center gap-2">
                    <MessageCircle size={15} />
                    Enviar por WhatsApp
                  </span>
                </Button>
                <Button onClick={() => void handleConvertSelected()} className="h-11" loading={saving} disabled={selectedOrcamento.status !== "APROVADO"}>
                  {selectedOrcamento.convertidoEmOs
                    ? `Convertido (${selectedOrcamento.osNumero ?? "OS"})`
                    : "Converter em OS"}
                </Button>
              </div>
            </>
          ) : (
            <div className="grid min-h-[360px] place-items-center rounded-xl border border-white/10 bg-white/[0.02] text-slate-400">
              Selecione um orcamento para visualizar os detalhes.
            </div>
          )}
        </article>
      </div>

      <Modal
        isOpen={orcamentoModalOpen}
        title={editingOrcamento ? "Editar orcamento" : "Novo orcamento"}
        description={editingOrcamento ? "Atualize os dados do orcamento." : "Cadastre um novo orcamento."}
        onClose={() => setOrcamentoModalOpen(false)}
      >
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSave}>
          <Input
            label="Cliente"
            value={form.clienteNome}
            onChange={(event) => setForm((prev) => ({ ...prev, clienteNome: event.target.value }))}
            required
          />
          <Input
            label="Telefone"
            value={form.clienteTelefone}
            onChange={(event) => setForm((prev) => ({ ...prev, clienteTelefone: event.target.value }))}
            required
          />
          <Input
            label="E-mail"
            value={form.clienteEmail}
            onChange={(event) => setForm((prev) => ({ ...prev, clienteEmail: event.target.value }))}
          />
          <Input
            label="Veiculo"
            value={form.veiculoModelo}
            onChange={(event) => setForm((prev) => ({ ...prev, veiculoModelo: event.target.value }))}
            required
          />
          <Input
            label="Ano"
            type="number"
            min={1900}
            max={2099}
            value={form.veiculoAno}
            onChange={(event) => setForm((prev) => ({ ...prev, veiculoAno: event.target.value }))}
            required
          />
          <Input
            label="Placa"
            value={form.veiculoPlaca}
            onChange={(event) => setForm((prev) => ({ ...prev, veiculoPlaca: event.target.value.toUpperCase() }))}
            required
          />
          <Input
            label="Validade"
            type="date"
            value={form.validadeEm}
            onChange={(event) => setForm((prev) => ({ ...prev, validadeEm: event.target.value }))}
            required
          />

          <label className="flex flex-col gap-1.5 text-sm text-slate-200">
            <span className="font-medium tracking-wide text-slate-300">Status</span>
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as OrcamentoStatus }))}
              className="rounded-xl border border-white/10 bg-[#0c1933]/80 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value="PENDENTE">Pendente</option>
              <option value="APROVADO">Aprovado</option>
              <option value="RECUSADO">Recusado</option>
            </select>
          </label>

          <Input
            label="Vendedor"
            value={form.vendedor}
            onChange={(event) => setForm((prev) => ({ ...prev, vendedor: event.target.value }))}
            required
          />

          <Input
            label="Forma de pagamento"
            value={form.formaPagamento}
            onChange={(event) => setForm((prev) => ({ ...prev, formaPagamento: event.target.value }))}
            required
          />

          <Input
            label="Desconto"
            type="number"
            min={0}
            step="0.01"
            value={form.desconto}
            onChange={(event) => setForm((prev) => ({ ...prev, desconto: event.target.value }))}
          />

          <div className="md:col-span-2 mt-2 rounded-xl border border-white/10 bg-[#0b1933]/55 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-200">Servico principal</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="Descricao do servico"
                value={form.servicoDescricao}
                onChange={(event) => setForm((prev) => ({ ...prev, servicoDescricao: event.target.value }))}
                required
              />
              <Input
                label="Valor do servico"
                type="number"
                min={0}
                step="0.01"
                value={form.servicoValor}
                onChange={(event) => setForm((prev) => ({ ...prev, servicoValor: event.target.value }))}
                required
              />
            </div>
          </div>

          <div className="md:col-span-2 rounded-xl border border-white/10 bg-[#0b1933]/55 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-200">Peca principal</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input
                label="Descricao da peca"
                value={form.pecaDescricao}
                onChange={(event) => setForm((prev) => ({ ...prev, pecaDescricao: event.target.value }))}
                required
              />
              <Input
                label="Codigo da peca"
                value={form.pecaCodigo}
                onChange={(event) => setForm((prev) => ({ ...prev, pecaCodigo: event.target.value.toUpperCase() }))}
                required
              />
              <Input
                label="Valor da peca"
                type="number"
                min={0}
                step="0.01"
                value={form.pecaValor}
                onChange={(event) => setForm((prev) => ({ ...prev, pecaValor: event.target.value }))}
                required
              />
            </div>
          </div>

          <div className="md:col-span-2 mt-2 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setOrcamentoModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingOrcamento ? "Salvar alteracoes" : "Criar orcamento"}
            </Button>
          </div>
        </form>
      </Modal>

      <div className="flex justify-end">
        <Button
          onClick={openCreate}
          className="fixed bottom-6 right-6 z-20 h-12 rounded-full px-5 shadow-[0_14px_28px_rgba(37,99,235,0.45)] xl:hidden"
        >
          <span className="inline-flex items-center gap-2">
            <Plus size={16} />
            Novo orcamento
          </span>
        </Button>
      </div>

      {loading ? <p className="text-sm text-slate-400">Carregando orcamentos...</p> : null}
      {saving ? <p className="text-sm text-slate-400">Processando alteracoes...</p> : null}
    </section>
  );
}
