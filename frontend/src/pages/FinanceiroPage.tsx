import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, Landmark, ReceiptText, Wallet } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Table from "@/components/Table";
import { getErrorMessage } from "@/services/api";
import { listFinanceiro, updateFinanceiro } from "@/services/financeiro.service";
import type { Financeiro, FinanceiroStatus } from "@/types/financeiro";
import { useAuthStore } from "@/store/auth.store";

export default function FinanceiroPage() {
  const { role } = useAuthStore();
  const isAdmin = role === "ADMIN";
  const [items, setItems] = useState<Financeiro[]>([]);
  const [filter, setFilter] = useState<FinanceiroStatus | "TODOS">("TODOS");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [selectedFinanceiro, setSelectedFinanceiro] = useState<Financeiro | null>(null);
  const [financeiroForm, setFinanceiroForm] = useState({
    ordemServicoId: "",
    valor: "",
    formaPagamento: "",
    status: "PENDENTE" as FinanceiroStatus,
    data: "",
  });

  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "TODOS") return items;
    return items.filter((item) => item.status === filter);
  }, [items, filter]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listFinanceiro(0, 500);
      setItems(response.content);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resumo = useMemo(() => {
    const total = items.reduce((acc, item) => acc + Number(item.valor), 0);
    const pendente = items
      .filter((item) => item.status === "PENDENTE")
      .reduce((acc, item) => acc + Number(item.valor), 0);
    const pago = items.filter((item) => item.status === "PAGO").reduce((acc, item) => acc + Number(item.valor), 0);
    const estornado = items
      .filter((item) => item.status === "ESTORNADO")
      .reduce((acc, item) => acc + Number(item.valor), 0);

    return { total, pendente, pago, estornado };
  }, [items]);

  const marcarComoPago = async (item: Financeiro) => {
    try {
      await updateFinanceiro(item.id, {
        clienteId: item.clienteId ?? 0,
        ordemServicoId: item.ordemServicoId,
        valor: Number(item.valor),
        tipo: item.tipo,
        formaPagamento: item.formaPagamento,
        status: "PAGO",
        data: item.data,
      });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const closeFinanceiroModal = () => {
    setIsModalOpen(false);
    setViewOnly(false);
    setSelectedFinanceiro(null);
  };

  const openViewFinanceiro = (item: Financeiro) => {
    setSelectedFinanceiro(item);
    setViewOnly(true);
    setFinanceiroForm({
      ordemServicoId: item.ordemServicoId ? String(item.ordemServicoId) : "",
      valor: String(Number(item.valor)),
      formaPagamento: item.formaPagamento,
      status: item.status,
      data: item.data,
    });
    setIsModalOpen(true);
  };

  const openEditFinanceiro = (item: Financeiro) => {
    if (!isAdmin) return;
    setSelectedFinanceiro(item);
    setViewOnly(false);
    setFinanceiroForm({
      ordemServicoId: item.ordemServicoId ? String(item.ordemServicoId) : "",
      valor: String(Number(item.valor)),
      formaPagamento: item.formaPagamento,
      status: item.status,
      data: item.data,
    });
    setIsModalOpen(true);
  };

  const salvarFinanceiro = async () => {
    if (!isAdmin || !selectedFinanceiro || viewOnly) return;

    const ordemServicoIdRaw = financeiroForm.ordemServicoId.trim();
    const valor = Number(financeiroForm.valor);
    const ordemServicoIdParsed = ordemServicoIdRaw.length > 0 ? Number(ordemServicoIdRaw) : null;
    const ordemServicoId = ordemServicoIdParsed === null ? undefined : ordemServicoIdParsed;

    if (!Number.isFinite(valor) || valor < 0) {
      setError("Informe um valor valido para o financeiro.");
      return;
    }

    if (ordemServicoIdParsed !== null && (!Number.isFinite(ordemServicoIdParsed) || ordemServicoIdParsed < 0)) {
      setError("Informe uma OS valida.");
      return;
    }

    if (!financeiroForm.formaPagamento.trim()) {
      setError("Informe a forma de pagamento.");
      return;
    }

    if (!financeiroForm.data) {
      setError("Informe a data do financeiro.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateFinanceiro(selectedFinanceiro.id, {
        clienteId: selectedFinanceiro.clienteId ?? 0,
        ordemServicoId,
        valor,
        tipo: selectedFinanceiro.tipo,
        formaPagamento: financeiroForm.formaPagamento.trim(),
        status: financeiroForm.status,
        data: financeiroForm.data,
      });
      closeFinanceiroModal();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Financeiro"
        subtitle={isAdmin ? "Pagamentos, recebimentos e estornos" : "Historico de pagamentos"}
        action={
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as FinanceiroStatus | "TODOS")}
              className="rounded-xl border border-white/10 bg-[#0f2142] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-400"
            >
              <option value="TODOS">Todos</option>
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
              <option value="ESTORNADO">Estornado</option>
            </select>
            <Button variant="secondary" onClick={() => void load()} loading={loading}>
              Atualizar
            </Button>
          </div>
        }
      />

      {isAdmin ? (
        <div className="jc-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Movimentado", value: money.format(resumo.total), icon: CircleDollarSign, tone: "text-blue-200" },
            { label: "Em aberto", value: money.format(resumo.pendente), icon: Wallet, tone: "text-amber-200" },
            { label: "Recebido", value: money.format(resumo.pago), icon: Landmark, tone: "text-emerald-200" },
            { label: "Estornado", value: money.format(resumo.estornado), icon: ReceiptText, tone: "text-rose-200" },
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

      {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}

      <div className="rounded-2xl border border-white/10 bg-[#081631]/65 p-3">
        <Table
          data={filtered}
          keyExtractor={(item) => item.id}
          columns={[
            { header: "ID", render: (item) => item.id },
            { header: "OS", render: (item) => item.ordemServicoId },
            { header: "Nota", render: (item) => item.notaFiscalId ?? "-" },
            { header: "Valor", render: (item) => money.format(Number(item.valor)) },
            { header: "Pagamento", render: (item) => item.formaPagamento },
            { header: "Status", render: (item) => <StatusBadge status={item.status} /> },
            { header: "Data", render: (item) => item.data },
            {
              header: "Acoes",
              render: (item) => (
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => openViewFinanceiro(item)}>
                    Visualizar
                  </Button>
                  {isAdmin ? (
                    <Button variant="ghost" onClick={() => openEditFinanceiro(item)}>
                      Editar
                    </Button>
                  ) : null}
                  {isAdmin && item.status !== "PAGO" ? (
                    <Button variant="primary" onClick={() => void marcarComoPago(item)}>
                      Marcar como pago
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

      <Modal
        isOpen={isModalOpen}
        title={viewOnly ? "Visualizar financeiro" : "Editar financeiro"}
        onClose={closeFinanceiroModal}
        onConfirm={!viewOnly && isAdmin ? () => void salvarFinanceiro() : undefined}
        confirmLabel="Salvar alteracoes"
        loading={saving}
      >
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            type="number"
            label="OS"
            value={financeiroForm.ordemServicoId}
            onChange={(event) =>
              setFinanceiroForm((prev) => ({
                ...prev,
                ordemServicoId: event.target.value,
              }))
            }
            disabled={viewOnly || !isAdmin}
          />
          <Input
            type="number"
            step="0.01"
            label="Valor"
            value={financeiroForm.valor}
            onChange={(event) =>
              setFinanceiroForm((prev) => ({
                ...prev,
                valor: event.target.value,
              }))
            }
            disabled={viewOnly || !isAdmin}
          />
          <Input
            label="Forma de pagamento"
            value={financeiroForm.formaPagamento}
            onChange={(event) =>
              setFinanceiroForm((prev) => ({
                ...prev,
                formaPagamento: event.target.value,
              }))
            }
            disabled={viewOnly || !isAdmin}
          />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-slate-300">Status</span>
            <select
              value={financeiroForm.status}
              onChange={(event) =>
                setFinanceiroForm((prev) => ({
                  ...prev,
                  status: event.target.value as FinanceiroStatus,
                }))
              }
              disabled={viewOnly || !isAdmin}
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
            value={financeiroForm.data}
            onChange={(event) =>
              setFinanceiroForm((prev) => ({
                ...prev,
                data: event.target.value,
              }))
            }
            disabled={viewOnly || !isAdmin}
          />
          <div className="md:col-span-2">
            <p className="text-sm text-slate-300">ID: {selectedFinanceiro?.id ?? "-"}</p>
            <p className="text-sm text-slate-300">Nota fiscal: {selectedFinanceiro?.notaFiscalId ?? "-"}</p>
          </div>
        </form>
      </Modal>
    </section>
  );
}
