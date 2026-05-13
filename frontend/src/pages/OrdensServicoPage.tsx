import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckBig, CircleDashed, LoaderCircle, PackageSearch, Wrench } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Table from "@/components/Table";
import { listClientes } from "@/services/clientes.service";
import { getErrorMessage } from "@/services/api";
import { createOrdemServico, listAllOrdensServico, updateOrdemServico } from "@/services/ordens.service";
import { listVeiculos } from "@/services/veiculos.service";
import type { Cliente } from "@/types/cliente";
import type { OrdemServico, OrdemServicoPayload, OrdemServicoStatus } from "@/types/ordem-servico";
import type { Veiculo } from "@/types/veiculo";
import { useAuthStore } from "@/store/auth.store";
import { ordemServicoColumns, statusLabel } from "@/utils/status";

const schema = z.object({
  clienteId: z.coerce.number().min(1, "Cliente obrigatorio"),
  veiculoId: z.coerce.number().min(1, "Veiculo obrigatorio"),
  problemaRelatado: z.string().min(3, "Descreva o problema"),
  diagnostico: z.string().optional(),
  valorTotal: z.coerce.number().min(0, "Valor invalido"),
  status: z.enum(ordemServicoColumns),
});

type FormData = z.infer<typeof schema>;
type ArchiveFilter = "ATIVAS" | "ARQUIVADAS" | "TODAS";

export default function OrdensServicoPage() {
  const { role } = useAuthStore();
  const isAdmin = role === "ADMIN";
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<OrdemServico | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>("ATIVAS");

  const {
    register,
    watch,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "RECEBIDO",
      valorTotal: 0,
    },
  });

  const selectedClienteId = watch("clienteId");

  const archivedParam = useMemo<boolean | undefined>(() => {
    if (archiveFilter === "ATIVAS") return false;
    if (archiveFilter === "ARQUIVADAS") return true;
    return undefined;
  }, [archiveFilter]);

  useEffect(() => {
    void Promise.all([loadClientes(), loadVeiculos()]);
  }, []);

  useEffect(() => {
    void loadOrdens();
  }, [archiveFilter]);

  const filteredVeiculos = useMemo(() => {
    if (!selectedClienteId) return veiculos;
    return veiculos.filter((item) => item.clienteId === Number(selectedClienteId));
  }, [veiculos, selectedClienteId]);

  const ordensByStatus = useMemo(() => {
    return ordemServicoColumns.reduce<Record<OrdemServicoStatus, OrdemServico[]>>((acc, status) => {
      acc[status] = ordens.filter((ordem) => ordem.status === status);
      return acc;
    }, {} as Record<OrdemServicoStatus, OrdemServico[]>);
  }, [ordens]);

  const resumo = useMemo(() => {
    const recebido = ordensByStatus.RECEBIDO?.length ?? 0;
    const analise = ordensByStatus.EM_ANALISE?.length ?? 0;
    const execucao = ordensByStatus.EM_EXECUCAO?.length ?? 0;
    const finalizado = ordensByStatus.FINALIZADO?.length ?? 0;
    return { total: ordens.length, recebido, analise, execucao, finalizado };
  }, [ordens, ordensByStatus]);

  const loadOrdens = async () => {
    setLoading(true);
    setError(null);
    try {
      const allOrdens = await listAllOrdensServico(200, "id,desc", archivedParam);
      setOrdens(allOrdens);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
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

  const loadVeiculos = async () => {
    try {
      const response = await listVeiculos(0, 500);
      setVeiculos(response.content);
    } catch {
      setVeiculos([]);
    }
  };

  const openCreate = () => {
    setEditing(null);
    reset({
      clienteId: 0,
      veiculoId: 0,
      problemaRelatado: "",
      diagnostico: "",
      valorTotal: 0,
      status: "RECEBIDO",
    });
    setIsModalOpen(true);
  };

  const openEdit = (ordem: OrdemServico) => {
    setEditing(ordem);
    reset({
      clienteId: ordem.clienteId,
      veiculoId: ordem.veiculoId,
      problemaRelatado: ordem.problemaRelatado,
      diagnostico: ordem.diagnostico ?? "",
      valorTotal: Number(ordem.valorTotal),
      status: ordem.status,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: FormData) => {
    setError(null);
    try {
      const payload: OrdemServicoPayload = {
        clienteId: values.clienteId,
        veiculoId: values.veiculoId,
        problemaRelatado: values.problemaRelatado,
        diagnostico: values.diagnostico,
        valorTotal: values.valorTotal,
        status: values.status,
      };

      if (editing) {
        await updateOrdemServico(editing.id, payload);
      } else {
        await createOrdemServico(payload);
      }

      setIsModalOpen(false);
      await loadOrdens();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const moveStatus = async (ordem: OrdemServico, status: OrdemServicoStatus) => {
    if (ordem.status === status) return;

    const payload: OrdemServicoPayload = {
      clienteId: ordem.clienteId,
      veiculoId: ordem.veiculoId,
      problemaRelatado: ordem.problemaRelatado,
      diagnostico: ordem.diagnostico,
      valorTotal: Number(ordem.valorTotal),
      status,
      dataEntrada: ordem.dataEntrada,
      dataSaida: ordem.dataSaida,
    };

    try {
      await updateOrdemServico(ordem.id, payload);
      const nowIso = new Date().toISOString();
      setOrdens((prev) =>
        prev.map((item) =>
          item.id === ordem.id
            ? {
                ...item,
                status,
                archived: false,
                updatedAt: nowIso,
                dataSaida: status === "FINALIZADO" ? nowIso : item.dataSaida,
              }
            : item,
        ),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Ordens de Servico"
        subtitle={isAdmin ? "Organize e acompanhe as ordens de servico" : "Acompanhe o andamento das ordens"}
        action={
          <div className="flex gap-2">
            <select
              value={archiveFilter}
              onChange={(event) => setArchiveFilter(event.target.value as ArchiveFilter)}
              className="rounded-xl border border-white/10 bg-[#0f2142] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-400"
            >
              <option value="ATIVAS">Ativas</option>
              <option value="ARQUIVADAS">Arquivadas</option>
              <option value="TODAS">Todas</option>
            </select>
            <Button variant="secondary" onClick={() => void loadOrdens()} loading={loading}>
              Atualizar
            </Button>
            {isAdmin ? <Button onClick={openCreate}>Nova OS</Button> : null}
          </div>
        }
      />

      {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}

      {isAdmin ? (
        <>
          <div className="jc-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Total de OS", value: resumo.total, icon: Wrench, tone: "text-blue-200" },
              { label: "Recebido", value: resumo.recebido, icon: CircleDashed, tone: "text-cyan-200" },
              { label: "Em analise", value: resumo.analise, icon: PackageSearch, tone: "text-amber-200" },
              { label: "Em execucao", value: resumo.execucao, icon: LoaderCircle, tone: "text-emerald-200" },
              { label: "Finalizado", value: resumo.finalizado, icon: CircleCheckBig, tone: "text-violet-200" },
            ].map((item) => (
              <article key={item.label} className="rounded-2xl border border-white/10 bg-[#081631]/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-300">{item.label}</p>
                  <div className={`rounded-xl bg-[#0f2142] p-2 ${item.tone}`}>
                    <item.icon size={16} />
                  </div>
                </div>
                <p className="mt-3 font-title text-3xl font-bold text-white">{item.value.toLocaleString("pt-BR")}</p>
              </article>
            ))}
          </div>

          <div className="jc-stagger grid gap-4 xl:grid-cols-5">
            {ordemServicoColumns.map((status) => (
              <div
                key={status}
                className="min-h-[420px] rounded-2xl border border-white/10 bg-[#081631]/75 p-3"
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const id = Number(event.dataTransfer.getData("text/plain") || draggingId);
                  const ordem = ordens.find((item) => item.id === id);
                  if (ordem) {
                    void moveStatus(ordem, status);
                  }
                  setDraggingId(null);
                }}
              >
                <header className="mb-3 flex items-center justify-between">
                  <h3 className="font-title text-sm font-semibold text-slate-100">{statusLabel[status]}</h3>
                  <span className="rounded-full bg-slatebase-700 px-2 py-1 text-xs text-slate-300">
                    {ordensByStatus[status]?.length ?? 0}
                  </span>
                </header>

                <div className="space-y-2">
                  {(ordensByStatus[status] ?? []).map((ordem) => (
                    <article
                      key={ordem.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", String(ordem.id));
                        setDraggingId(ordem.id);
                      }}
                      className={`cursor-grab rounded-xl border border-white/10 bg-[#0b1834]/80 p-3 transition-all duration-300 active:cursor-grabbing ${
                        ordem.status === "FINALIZADO" && !ordem.archived
                          ? "opacity-75 border-emerald-400/35 shadow-[0_0_0_1px_rgba(52,211,153,0.15)]"
                          : ""
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-100">OS #{ordem.id}</p>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={ordem.status} />
                          {ordem.archived ? (
                            <span className="inline-flex rounded-full border border-slate-400/30 bg-slate-500/20 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                              Arquivada
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">{ordem.clienteNome}</p>
                      <p className="mt-2 text-sm text-slate-200">{ordem.problemaRelatado}</p>
                      <p className="mt-2 text-xs text-slate-400">Veiculo: {ordem.veiculoPlaca}</p>
                      <p className="text-xs font-semibold text-brand-300">R$ {Number(ordem.valorTotal).toFixed(2)}</p>

                      <div className="mt-3">
                        <Button variant="secondary" className="w-full" onClick={() => openEdit(ordem)}>
                          Editar
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#081631]/65 p-3">
          <Table
            data={ordens}
            keyExtractor={(item) => item.id}
            columns={[
              { header: "OS", render: (item) => `#${item.id}` },
              { header: "Cliente", render: (item) => item.clienteNome },
              { header: "Veiculo", render: (item) => item.veiculoPlaca },
              { header: "Servico", render: (item) => item.problemaRelatado },
              { header: "Status", render: (item) => <StatusBadge status={item.status} /> },
              {
                header: "Arquivo",
                render: (item) => (item.archived ? "Arquivada" : "Ativa"),
              },
              { header: "Entrada", render: (item) => item.dataEntrada },
            ]}
          />
        </div>
      )}

      <Modal isOpen={isModalOpen} title={editing ? "Editar OS" : "Nova OS"} onClose={() => setIsModalOpen(false)}>
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
            <span className="text-slate-300">Cliente</span>
            <select
              {...register("clienteId")}
              onChange={(event) => {
                register("clienteId").onChange(event);
                setValue("veiculoId", 0);
              }}
              className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            >
              <option value={0}>Selecione</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
            {errors.clienteId?.message ? <span className="text-xs text-red-300">{errors.clienteId.message}</span> : null}
          </label>

          <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
            <span className="text-slate-300">Veiculo</span>
            <select
              {...register("veiculoId")}
              className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            >
              <option value={0}>Selecione</option>
              {filteredVeiculos.map((veiculo) => (
                <option key={veiculo.id} value={veiculo.id}>
                  {veiculo.placa} - {veiculo.modelo}
                </option>
              ))}
            </select>
            {errors.veiculoId?.message ? <span className="text-xs text-red-300">{errors.veiculoId.message}</span> : null}
          </label>

          <div className="md:col-span-2">
            <Input
              label="Problema relatado"
              {...register("problemaRelatado")}
              error={errors.problemaRelatado?.message}
            />
          </div>

          <div className="md:col-span-2">
            <Input label="Diagnostico" {...register("diagnostico")} error={errors.diagnostico?.message} />
          </div>

          <Input type="number" step="0.01" label="Valor total" {...register("valorTotal")} error={errors.valorTotal?.message} />

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-slate-300">Status</span>
            <select
              {...register("status")}
              className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            >
              {ordemServicoColumns.map((status) => (
                <option key={status} value={status}>
                  {statusLabel[status]}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2 mt-2 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Salvar alteracoes" : "Criar OS"}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
