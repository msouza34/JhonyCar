import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CarFront,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import VeiculoModeloSelector from "@/components/veiculos/VeiculoModeloSelector";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/services/api";
import { listClientes } from "@/services/clientes.service";
import { listOrdensServico } from "@/services/ordens.service";
import { createVeiculo, deleteVeiculo, listVeiculos, updateVeiculo } from "@/services/veiculos.service";
import { useAuthStore } from "@/store/auth.store";
import type { Cliente } from "@/types/cliente";
import type { OrdemServico } from "@/types/ordem-servico";
import type { Veiculo, VeiculoPayload } from "@/types/veiculo";
import { cn } from "@/utils/cn";

const schema = z.object({
  placa: z.string().min(6, "Placa invalida"),
  modelo: z.string().min(2, "Modelo obrigatorio"),
  marca: z.string().min(2, "Marca obrigatoria"),
  ano: z.coerce.number().min(1900).max(2100),
  clienteId: z.coerce.number().min(1, "Cliente obrigatorio"),
});

type FormData = z.infer<typeof schema>;

type VehicleResumoStatus = "SEM_OS" | "EM_SERVICO" | "AGUARDANDO_ORCAMENTO" | "EM_ORCAMENTO" | "FINALIZADO";
type VehicleStatusFilter = "TODOS" | VehicleResumoStatus;

interface VehicleTableRow {
  veiculo: Veiculo;
  ultimaOrdem: OrdemServico | null;
  resumoStatus: VehicleResumoStatus;
  telefone: string;
  entrada: Date | null;
  cor: string;
}

const PAGE_SIZE = 5;

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

const statusMeta: Record<
  VehicleResumoStatus,
  {
    label: string;
    badge: string;
  }
> = {
  SEM_OS: {
    label: "Sem OS",
    badge: "border-slate-400/30 bg-slate-500/18 text-slate-200",
  },
  EM_SERVICO: {
    label: "Em Servico",
    badge: "border-blue-300/35 bg-blue-500/18 text-blue-200",
  },
  AGUARDANDO_ORCAMENTO: {
    label: "Aguardando Orcamento",
    badge: "border-orange-300/35 bg-orange-500/18 text-orange-200",
  },
  EM_ORCAMENTO: {
    label: "Em Orcamento",
    badge: "border-amber-300/35 bg-amber-500/18 text-amber-200",
  },
  FINALIZADO: {
    label: "Finalizado",
    badge: "border-emerald-300/35 bg-emerald-500/18 text-emerald-200",
  },
};

const brandSlugMap: Record<string, string> = {
  HONDA: "honda",
  VOLKSWAGEN: "volkswagen",
  VW: "volkswagen",
  CHEVROLET: "chevrolet",
  FORD: "ford",
  TOYOTA: "toyota",
  FIAT: "fiat",
  HYUNDAI: "hyundai",
  RENAULT: "renault",
  NISSAN: "nissan",
  BMW: "bmw",
  AUDI: "audi",
  PEUGEOT: "peugeot",
  CITROEN: "citroen",
  JEEP: "jeep",
  KIA: "kia",
  MITSUBISHI: "mitsubishi",
  VOLVO: "volvo",
  BYD: "byd",
  CHERY: "chery",
};

const vehicleColors = ["Preto", "Branco", "Prata", "Azul", "Cinza", "Vermelho"];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function statusFromOrdem(status?: OrdemServico["status"]): VehicleResumoStatus {
  if (!status) return "SEM_OS";
  if (status === "FINALIZADO") return "FINALIZADO";
  if (status === "EM_EXECUCAO") return "EM_SERVICO";
  if (status === "AGUARDANDO_APROVACAO") return "EM_ORCAMENTO";
  if (status === "RECEBIDO" || status === "EM_ANALISE") return "AGUARDANDO_ORCAMENTO";
  return "SEM_OS";
}

function statusPriority(status: VehicleResumoStatus) {
  if (status === "EM_SERVICO") return 1;
  if (status === "AGUARDANDO_ORCAMENTO") return 2;
  if (status === "EM_ORCAMENTO") return 3;
  if (status === "FINALIZADO") return 4;
  return 5;
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

function brandInitials(marca: string) {
  const clean = normalizeText(marca);
  if (!clean) return "--";
  if (clean.length <= 2) return clean;
  return clean.slice(0, 2);
}

function brandLogoUrl(marca: string) {
  const slug = brandSlugMap[normalizeText(marca)];
  if (!slug) return null;
  return `https://cdn.simpleicons.org/${slug}/e2e8f0`;
}

function BrandLogo({ marca }: { marca: string }) {
  const [hasError, setHasError] = useState(false);
  const logoUrl = brandLogoUrl(marca);

  if (logoUrl && !hasError) {
    return (
      <img
        src={logoUrl}
        alt={`Logo ${marca}`}
        className="h-8 w-8 object-contain"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    );
  }

  return <span className="text-[11px] font-semibold tracking-wide text-slate-200">{brandInitials(marca)}</span>;
}

export default function VeiculosPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const isAdmin = role === "ADMIN";

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatusFilter>("TODOS");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Veiculo | null>(null);
  const [viewOnlyModal, setViewOnlyModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 250);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedMarca = watch("marca");
  const selectedModelo = watch("modelo");

  useEffect(() => {
    void Promise.all([loadVeiculos(), loadClientes(), loadOrdens()]);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const rows = useMemo<VehicleTableRow[]>(() => {
    const clientesById = new Map<number, Cliente>();
    for (const cliente of clientes) {
      clientesById.set(cliente.id, cliente);
    }

    const ordensByVeiculo = new Map<number, OrdemServico[]>();
    for (const ordem of ordens) {
      const current = ordensByVeiculo.get(ordem.veiculoId) ?? [];
      current.push(ordem);
      ordensByVeiculo.set(ordem.veiculoId, current);
    }

    return veiculos.map((veiculo, index) => {
      const osDoVeiculo = ordensByVeiculo.get(veiculo.id) ?? [];
      const ultimaOrdem = osDoVeiculo.reduce<OrdemServico | null>((latest, current) => {
        if (!latest) return current;
        const currentDate = parseDate(current.dataEntrada)?.getTime() ?? 0;
        const latestDate = parseDate(latest.dataEntrada)?.getTime() ?? 0;
        return currentDate > latestDate ? current : latest;
      }, null);

      const cliente = clientesById.get(veiculo.clienteId);

      return {
        veiculo,
        ultimaOrdem,
        resumoStatus: statusFromOrdem(ultimaOrdem?.status),
        telefone: cliente?.telefone ?? "--",
        entrada: parseDate(ultimaOrdem?.dataEntrada),
        cor: vehicleColors[(veiculo.id + index + veiculo.ano) % vehicleColors.length],
      };
    });
  }, [veiculos, ordens, clientes]);

  const filteredRows = useMemo(() => {
    const query = normalizeText(debouncedSearch);

    return rows
      .filter((item) => {
        const hitQuery =
          !query ||
          normalizeText(item.veiculo.placa).includes(query) ||
          normalizeText(item.veiculo.modelo).includes(query) ||
          normalizeText(item.veiculo.marca).includes(query) ||
          normalizeText(item.veiculo.clienteNome).includes(query) ||
          normalizeText(item.ultimaOrdem?.problemaRelatado ?? "").includes(query);

        const hitStatus = statusFilter === "TODOS" ? true : item.resumoStatus === statusFilter;

        return hitQuery && hitStatus;
      })
      .sort((a, b) => {
        const aPriority = statusPriority(a.resumoStatus);
        const bPriority = statusPriority(b.resumoStatus);
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.veiculo.placa.localeCompare(b.veiculo.placa, "pt-BR");
      });
  }, [rows, debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pagedRows = filteredRows.slice(start, end);
  const firstItem = filteredRows.length === 0 ? 0 : start + 1;
  const lastItem = filteredRows.length === 0 ? 0 : Math.min(end, filteredRows.length);
  const visiblePages = buildVisiblePages(currentPage, totalPages);

  const summary = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    const total = rows.length;
    const emServico = rows.filter((item) => item.resumoStatus === "EM_SERVICO").length;
    const aguardando = rows.filter(
      (item) => item.resumoStatus === "AGUARDANDO_ORCAMENTO" || item.resumoStatus === "EM_ORCAMENTO",
    ).length;
    const finalizados = rows.filter((item) => item.resumoStatus === "FINALIZADO").length;

    const totalMes = rows.filter((item) => {
      if (!item.entrada) return false;
      return item.entrada.getMonth() === today.getMonth() && item.entrada.getFullYear() === today.getFullYear();
    }).length;

    const emServicoHoje = rows.filter(
      (item) => item.resumoStatus === "EM_SERVICO" && item.entrada && isSameDay(item.entrada, today),
    ).length;

    const aguardandoHoje = rows.filter(
      (item) =>
        (item.resumoStatus === "AGUARDANDO_ORCAMENTO" || item.resumoStatus === "EM_ORCAMENTO") &&
        item.entrada &&
        isSameDay(item.entrada, today),
    ).length;

    const aguardandoOntem = rows.filter(
      (item) =>
        (item.resumoStatus === "AGUARDANDO_ORCAMENTO" || item.resumoStatus === "EM_ORCAMENTO") &&
        item.entrada &&
        isSameDay(item.entrada, yesterday),
    ).length;

    const finalizadosMes = rows.filter(
      (item) =>
        item.resumoStatus === "FINALIZADO" &&
        item.entrada &&
        item.entrada.getMonth() === today.getMonth() &&
        item.entrada.getFullYear() === today.getFullYear(),
    ).length;

    return {
      total,
      emServico,
      aguardando,
      finalizados,
      totalMes,
      emServicoHoje,
      aguardandoDelta: aguardandoHoje - aguardandoOntem,
      finalizadosMes,
    };
  }, [rows]);

  const loadVeiculos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listVeiculos(0, 500);
      setVeiculos(response.content);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadOrdens = async () => {
    try {
      const response = await listOrdensServico(0, 1000);
      setOrdens(response.content);
    } catch {
      setOrdens([]);
    }
  };

  const loadClientes = async () => {
    try {
      const response = await listClientes(0, 500);
      setClientes(response.content);
    } catch {
      setClientes([]);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setViewOnlyModal(false);
    reset({ placa: "", modelo: "", marca: "", ano: new Date().getFullYear(), clienteId: 0 });
    setIsModalOpen(true);
    setMenuOpenId(null);
  };

  const openEdit = (veiculo: Veiculo, options?: { viewOnly?: boolean }) => {
    setEditing(veiculo);
    setViewOnlyModal(options?.viewOnly ?? !isAdmin);
    reset({
      placa: veiculo.placa,
      modelo: veiculo.modelo,
      marca: veiculo.marca,
      ano: veiculo.ano,
      clienteId: veiculo.clienteId,
    });
    setMenuOpenId(null);
    setIsModalOpen(true);
  };

  const onSubmit = async (values: FormData) => {
    if (!isAdmin || viewOnlyModal) {
      setIsModalOpen(false);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const payload: VeiculoPayload = values;
      if (editing) {
        await updateVeiculo(editing.id, payload);
      } else {
        await createVeiculo(payload);
      }
      setIsModalOpen(false);
      await loadVeiculos();
      await loadOrdens();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Veiculo) => {
    if (!isAdmin) return;
    const confirm = window.confirm(`Excluir veiculo ${item.placa}?`);
    if (!confirm) return;

    setSaving(true);
    setError(null);
    try {
      await deleteVeiculo(item.id);
      setMenuOpenId(null);
      await loadVeiculos();
      await loadOrdens();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openNovaOs = (item: Veiculo) => {
    if (!isAdmin) return;
    navigate(`/ordens?clienteId=${item.clienteId}&veiculoId=${item.id}`);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-title text-[2.25rem] font-bold text-white">Veiculos</h1>
          <p className="text-slate-300">Gerencie os veiculos cadastrados</p>
        </div>
        <p className="text-lg text-slate-300">
          Home <span className="mx-1 text-slate-500">/</span> Veiculos
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
      ) : null}

      <div className="jc-stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,22,45,0.98),rgba(7,14,30,0.96))] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/15 ring-1 ring-blue-300/25 text-blue-200">
              <CarFront size={20} />
            </div>
            <div>
              <p className="text-sm text-blue-300">Total de Veiculos</p>
              <p className="font-title text-4xl font-bold leading-none text-white">{summary.total}</p>
              <p className="mt-1 text-sm text-slate-400">+{summary.totalMes} este mes</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,22,45,0.98),rgba(7,14,30,0.96))] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/15 ring-1 ring-blue-300/25 text-blue-200">
              <Wrench size={20} />
            </div>
            <div>
              <p className="text-sm text-blue-300">Em Servico</p>
              <p className="font-title text-4xl font-bold leading-none text-white">{summary.emServico}</p>
              <p className="mt-1 text-sm text-slate-400">+{summary.emServicoHoje} hoje</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,22,45,0.98),rgba(7,14,30,0.96))] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500/15 ring-1 ring-orange-300/25 text-orange-200">
              <Clock3 size={20} />
            </div>
            <div>
              <p className="text-sm text-orange-300">Aguardando Orcamento</p>
              <p className="font-title text-4xl font-bold leading-none text-white">{summary.aguardando}</p>
              <p className={cn("mt-1 text-sm", summary.aguardandoDelta >= 0 ? "text-emerald-300" : "text-rose-300")}>
                {summary.aguardandoDelta >= 0 ? "+" : ""}
                {summary.aguardandoDelta} hoje
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,22,45,0.98),rgba(7,14,30,0.96))] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-300/25 text-emerald-200">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm text-emerald-300">Finalizados</p>
              <p className="font-title text-4xl font-bold leading-none text-white">{summary.finalizados}</p>
              <p className="mt-1 text-sm text-slate-400">+{summary.finalizadosMes} este mes</p>
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(11,23,46,0.98),rgba(7,15,33,0.96))] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c1933]/75 px-3 py-2.5 text-slate-200">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por placa, modelo, cliente..."
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </label>

            <Button variant="secondary" className="h-11" onClick={() => setShowFilters((prev) => !prev)}>
              <span className="inline-flex items-center gap-2">
                <Filter size={15} />
                Filtros
              </span>
            </Button>
          </div>

          {isAdmin ? (
            <Button className="h-11 px-5" onClick={openCreate}>
              <span className="inline-flex items-center gap-2">
                <Plus size={16} />
                Novo Veiculo
              </span>
            </Button>
          ) : null}
        </div>

        {showFilters ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm text-slate-300">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as VehicleStatusFilter)}
                className="h-[46px] rounded-xl border border-white/10 bg-[#0c1933]/75 px-3 text-slate-100 outline-none focus:border-blue-400"
              >
                <option value="TODOS">Todos</option>
                <option value="EM_SERVICO">Em Servico</option>
                <option value="AGUARDANDO_ORCAMENTO">Aguardando Orcamento</option>
                <option value="EM_ORCAMENTO">Em Orcamento</option>
                <option value="FINALIZADO">Finalizado</option>
                <option value="SEM_OS">Sem OS</option>
              </select>
            </label>

            <div className="flex items-end">
              <Button variant="ghost" className="h-11 w-full" onClick={() => setStatusFilter("TODOS")}>
                Limpar filtros
              </Button>
            </div>

            <div className="flex items-end">
              <Button
                variant="secondary"
                className="h-11 w-full"
                onClick={() => void Promise.all([loadVeiculos(), loadOrdens(), loadClientes()])}
                loading={loading}
              >
                Atualizar dados
              </Button>
            </div>
          </div>
        ) : null}
      </article>

      <article className="rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(10,22,45,0.98),rgba(6,14,30,0.96))] p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-white/[0.02]">
              <tr className="border-b border-white/10 text-left text-sm text-slate-400">
                <th className="px-5 py-3 font-medium">Veiculo</th>
                <th className="px-4 py-3 font-medium">Proprietario</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data entrada</th>
                <th className="px-4 py-3 font-medium">Servico</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Acoes</th>
              </tr>
            </thead>

            <tbody>
              {pagedRows.length > 0 ? (
                pagedRows.map((item) => {
                  const status = statusMeta[item.resumoStatus];
                  return (
                    <tr key={item.veiculo.id} className="border-b border-white/5 text-sm text-slate-100 last:border-0 hover:bg-blue-500/[0.06]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-[#0e1d3c]">
                            <BrandLogo marca={item.veiculo.marca} />
                          </div>
                          <div>
                            <p className="font-title text-[1.85rem] font-semibold leading-none text-slate-100">{item.veiculo.placa}</p>
                            <p className="mt-1 text-slate-200">
                              {item.veiculo.marca} {item.veiculo.modelo}
                            </p>
                            <p className="text-slate-500">
                              {item.veiculo.ano} • {item.cor}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-slate-100">{item.veiculo.clienteNome}</p>
                        <p className="text-slate-400">{item.telefone}</p>
                      </td>

                      <td className="px-4 py-3">
                        <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", status.badge)}>
                          {status.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-200">
                        {item.entrada ? (
                          <>
                            <p>{dateFormatter.format(item.entrada)}</p>
                            <p className="text-slate-400">{timeFormatter.format(item.entrada)}</p>
                          </>
                        ) : (
                          <p className="text-slate-500">--</p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-200">{item.ultimaOrdem?.problemaRelatado ?? "Sem servico vinculado"}</td>

                      <td className="px-4 py-3 font-medium text-slate-100">{money.format(Number(item.ultimaOrdem?.valorTotal ?? 0))}</td>

                      <td className="relative px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item.veiculo, { viewOnly: true })}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition hover:border-blue-300/30 hover:text-blue-100"
                            aria-label={`Ver ${item.veiculo.placa}`}
                          >
                            <Eye size={15} />
                          </button>

                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => openEdit(item.veiculo, { viewOnly: false })}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-blue-300/25 bg-blue-500/12 text-blue-200 transition hover:bg-blue-500/22"
                              aria-label={`Editar ${item.veiculo.placa}`}
                            >
                              <Pencil size={15} />
                            </button>
                          ) : null}

                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => setMenuOpenId((prev) => (prev === item.veiculo.id ? null : item.veiculo.id))}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition hover:border-blue-300/30 hover:text-blue-100"
                              aria-label={`Mais opcoes ${item.veiculo.placa}`}
                            >
                              <MoreVertical size={15} />
                            </button>
                          ) : null}
                        </div>

                        {isAdmin && menuOpenId === item.veiculo.id ? (
                          <div className="absolute right-4 top-12 z-20 w-44 rounded-xl border border-white/10 bg-[#08152f] p-1.5 shadow-[0_15px_32px_rgba(2,8,22,0.5)]">
                            <button
                              type="button"
                              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
                              onClick={() => openNovaOs(item.veiculo)}
                            >
                              Nova OS
                            </button>
                            <button
                              type="button"
                              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
                              onClick={() => openEdit(item.veiculo, { viewOnly: false })}
                            >
                              Editar veiculo
                            </button>
                            <button
                              type="button"
                              className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-200 transition hover:bg-rose-500/10"
                              onClick={() => void handleDelete(item.veiculo)}
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
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                    Nenhum veiculo encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 px-5 py-4 md:flex-row md:items-center">
          <p className="text-sm text-slate-300">
            Mostrando {firstItem} a {lastItem} de {filteredRows.length.toLocaleString("pt-BR")} veiculos
          </p>

          <div className="flex flex-wrap items-center gap-2">
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

      <Modal
        isOpen={isModalOpen}
        title={viewOnlyModal ? "Detalhes do veiculo" : editing ? "Editar veiculo" : "Novo veiculo"}
        onClose={() => {
          setIsModalOpen(false);
          setViewOnlyModal(false);
        }}
      >
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Placa" {...register("placa")} error={errors.placa?.message} disabled={viewOnlyModal} />

          <input type="hidden" {...register("marca")} />
          <input type="hidden" {...register("modelo")} />
          <VeiculoModeloSelector
            marca={selectedMarca ?? ""}
            modelo={selectedModelo ?? ""}
            disabled={viewOnlyModal}
            errorMarca={errors.marca?.message}
            errorModelo={errors.modelo?.message}
            onChangeMarca={(marca) => {
              setValue("marca", marca, { shouldDirty: true, shouldValidate: true });
            }}
            onChangeModelo={(modelo) => {
              setValue("modelo", modelo, { shouldDirty: true, shouldValidate: true });
            }}
          />

          <Input type="number" label="Ano" {...register("ano")} error={errors.ano?.message} disabled={viewOnlyModal} />

          <label className="md:col-span-2 flex flex-col gap-1.5 text-sm text-slate-200">
            <span className="font-medium tracking-wide text-slate-300">Cliente</span>
            <select
              {...register("clienteId")}
              disabled={viewOnlyModal}
              className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            >
              <option value={0}>Selecione um cliente</option>
              {clientes.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
            {errors.clienteId?.message ? <span className="text-xs text-red-300">{errors.clienteId.message}</span> : null}
          </label>

          <div className="md:col-span-2 mt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setViewOnlyModal(false);
              }}
            >
              {viewOnlyModal ? "Fechar" : "Cancelar"}
            </Button>
            {!viewOnlyModal && isAdmin ? (
              <Button type="submit" loading={isSubmitting || saving}>
                {editing ? "Salvar alteracoes" : "Criar veiculo"}
              </Button>
            ) : null}
          </div>
        </form>
      </Modal>

      {isAdmin ? (
        <div className="flex justify-end xl:hidden">
          <Button onClick={openCreate} className="fixed bottom-6 right-6 z-20 h-12 rounded-full px-5 shadow-[0_14px_28px_rgba(37,99,235,0.45)]">
            <span className="inline-flex items-center gap-2">
              <Plus size={16} />
              Novo veiculo
            </span>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
