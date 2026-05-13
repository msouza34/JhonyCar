import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, CheckCircle2, Clock3, XCircle } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Table from "@/components/Table";
import { listAgendamentos, createAgendamento, updateAgendamento } from "@/services/agenda.service";
import { getErrorMessage } from "@/services/api";
import { listClientes } from "@/services/clientes.service";
import { listVeiculos } from "@/services/veiculos.service";
import type { Agendamento, AgendamentoPayload } from "@/types/agendamento";
import type { Cliente } from "@/types/cliente";
import type { Veiculo } from "@/types/veiculo";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  clienteId: z.coerce.number().min(1, "Cliente obrigatorio"),
  veiculoId: z.coerce.number().min(1, "Veiculo obrigatorio"),
  dataHora: z.string().min(1, "Data obrigatoria"),
  descricao: z.string().min(3, "Descricao obrigatoria"),
  status: z.enum(["AGENDADO", "CONCLUIDO", "CANCELADO"]),
});

type FormData = z.infer<typeof schema>;

export default function AgendaPage() {
  const { role } = useAuthStore();
  const isAdmin = role === "ADMIN";
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [editing, setEditing] = useState<Agendamento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "AGENDADO",
    },
  });

  const clienteId = watch("clienteId");
  const veiculosFiltrados = veiculos.filter((item) => !clienteId || item.clienteId === Number(clienteId));

  const resumo = {
    total: agendamentos.length,
    agendados: agendamentos.filter((item) => item.status === "AGENDADO").length,
    concluidos: agendamentos.filter((item) => item.status === "CONCLUIDO").length,
    cancelados: agendamentos.filter((item) => item.status === "CANCELADO").length,
  };

  useEffect(() => {
    void Promise.all([loadAgenda(), loadClientes(), loadVeiculos()]);
  }, []);

  const loadAgenda = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listAgendamentos(0, 500);
      setAgendamentos(response.content.sort((a, b) => a.dataHora.localeCompare(b.dataHora)));
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
      dataHora: "",
      descricao: "",
      status: "AGENDADO",
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: Agendamento) => {
    setEditing(item);
    reset({
      clienteId: item.clienteId,
      veiculoId: item.veiculoId,
      dataHora: item.dataHora.slice(0, 16),
      descricao: item.descricao,
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: FormData) => {
    try {
      const payload: AgendamentoPayload = {
        ...values,
        dataHora: values.dataHora,
      };

      if (editing) {
        await updateAgendamento(editing.id, payload);
      } else {
        await createAgendamento(payload);
      }

      setIsModalOpen(false);
      await loadAgenda();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Agenda"
        subtitle={isAdmin ? "Organize os agendamentos de atendimento" : "Confira os proximos agendamentos"}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void loadAgenda()} loading={loading}>
              Atualizar
            </Button>
            {isAdmin ? <Button onClick={openCreate}>Novo agendamento</Button> : null}
          </div>
        }
      />

      {isAdmin ? (
        <div className="jc-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total", value: resumo.total, icon: CalendarClock, tone: "text-blue-200" },
            { label: "Agendados", value: resumo.agendados, icon: Clock3, tone: "text-amber-200" },
            { label: "Concluidos", value: resumo.concluidos, icon: CheckCircle2, tone: "text-emerald-200" },
            { label: "Cancelados", value: resumo.cancelados, icon: XCircle, tone: "text-rose-200" },
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
      ) : null}

      {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}

      <div className="rounded-2xl border border-white/10 bg-[#081631]/65 p-3">
        <Table
          data={agendamentos}
          keyExtractor={(item) => item.id}
          columns={[
            { header: "Data", render: (item) => item.dataHora.replace("T", " ") },
            { header: "Cliente", render: (item) => item.clienteNome },
            { header: "Veiculo", render: (item) => item.veiculoPlaca },
            { header: "Descricao", render: (item) => item.descricao },
            { header: "Status", render: (item) => <StatusBadge status={item.status} /> },
            {
              header: "Acoes",
              render: (item) =>
                isAdmin ? (
                  <Button variant="secondary" onClick={() => openEdit(item)}>
                    Editar
                  </Button>
                ) : (
                  <span className="text-slate-500">Somente leitura</span>
                ),
            },
          ]}
        />
      </div>

      <Modal isOpen={isModalOpen} title={editing ? "Editar agendamento" : "Novo agendamento"} onClose={() => setIsModalOpen(false)}>
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
            <span className="text-slate-300">Cliente</span>
            <select
              {...register("clienteId")}
              className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
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
              className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value={0}>Selecione</option>
              {veiculosFiltrados.map((veiculo) => (
                <option key={veiculo.id} value={veiculo.id}>
                  {veiculo.placa} - {veiculo.modelo}
                </option>
              ))}
            </select>
            {errors.veiculoId?.message ? <span className="text-xs text-red-300">{errors.veiculoId.message}</span> : null}
          </label>

          <Input
            type="datetime-local"
            label="Data e hora"
            {...register("dataHora")}
            error={errors.dataHora?.message}
          />

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-slate-300">Status</span>
            <select
              {...register("status")}
              className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value="AGENDADO">Agendado</option>
              <option value="CONCLUIDO">Concluido</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </label>

          <div className="md:col-span-2">
            <Input label="Descricao" {...register("descricao")} error={errors.descricao?.message} />
          </div>

          <div className="md:col-span-2 mt-2 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
