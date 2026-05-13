import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileCheck2, FileClock, FileMinus2, ScrollText } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Table from "@/components/Table";
import { getErrorMessage } from "@/services/api";
import { cancelarNota, getNotaPdfBlob, listNotas, simularNota } from "@/services/notas.service";
import { listOrdensServico } from "@/services/ordens.service";
import type { NotaFiscal } from "@/types/nota-fiscal";
import type { OrdemServico } from "@/types/ordem-servico";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  ordemServicoId: z.coerce.number().min(1, "Selecione uma OS"),
});

type EmitirFormData = z.infer<typeof schema>;

const cancelSchema = z.object({
  motivoCancelamento: z.string().min(3, "Informe o motivo"),
});

type CancelFormData = z.infer<typeof cancelSchema>;

export default function NotasPage() {
  const { role } = useAuthStore();
  const isAdmin = role === "ADMIN";
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [ordensFinalizadas, setOrdensFinalizadas] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<NotaFiscal | null>(null);
  const [openingPdfId, setOpeningPdfId] = useState<number | null>(null);

  const emitirForm = useForm<EmitirFormData>({ resolver: zodResolver(schema) });
  const cancelarForm = useForm<CancelFormData>({ resolver: zodResolver(cancelSchema) });

  useEffect(() => {
    void Promise.all([loadNotas(), loadOrdensFinalizadas()]);
  }, []);

  const notasAtivas = useMemo(() => notas.filter((item) => item.status !== "CANCELADA"), [notas]);

  const resumo = useMemo(() => {
    const emitidas = notas.filter((item) => item.status === "EMITIDA").length;
    const simuladas = notas.filter((item) => item.status === "SIMULADA").length;
    const canceladas = notas.filter((item) => item.status === "CANCELADA").length;
    const valorTotal = notas.reduce((acc, item) => acc + Number(item.valor), 0);
    return { emitidas, simuladas, canceladas, valorTotal, total: notas.length };
  }, [notas]);

  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  const loadNotas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listNotas(0, 500);
      setNotas(response.content);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadOrdensFinalizadas = async () => {
    try {
      const response = await listOrdensServico(0, 500);
      setOrdensFinalizadas(response.content.filter((item) => item.status === "FINALIZADO"));
    } catch {
      setOrdensFinalizadas([]);
    }
  };

  const onEmitir = async (values: EmitirFormData) => {
    setError(null);
    try {
      await simularNota(values.ordemServicoId);
      emitirForm.reset({ ordemServicoId: 0 });
      await loadNotas();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const onCancelar = async (values: CancelFormData) => {
    if (!cancelando) return;

    try {
      await cancelarNota(cancelando.id, values);
      setCancelando(null);
      cancelarForm.reset({ motivoCancelamento: "" });
      await loadNotas();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openPdf = async (item: NotaFiscal) => {
    setOpeningPdfId(item.id);
    try {
      const pdfBlob = await getNotaPdfBlob(item.id);
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setOpeningPdfId(null);
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Notas fiscais"
        subtitle={isAdmin ? "Emissao, consulta e cancelamento de notas" : "Consulta e compartilhamento de notas"}
        action={
          <Button variant="secondary" onClick={() => void loadNotas()} loading={loading}>
            Atualizar
          </Button>
        }
      />

      {isAdmin ? (
        <div className="jc-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total de notas", value: resumo.total.toLocaleString("pt-BR"), icon: ScrollText, tone: "text-blue-200" },
            { label: "Emitidas", value: resumo.emitidas.toLocaleString("pt-BR"), icon: FileCheck2, tone: "text-emerald-200" },
            { label: "Simuladas", value: resumo.simuladas.toLocaleString("pt-BR"), icon: FileClock, tone: "text-cyan-200" },
            { label: "Canceladas", value: resumo.canceladas.toLocaleString("pt-BR"), icon: FileMinus2, tone: "text-rose-200" },
          ].map((item) => (
            <article key={item.label} className="rounded-2xl border border-white/10 bg-[#081631]/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">{item.label}</p>
                <div className={`rounded-xl bg-[#0f2142] p-2 ${item.tone}`}>
                  <item.icon size={16} />
                </div>
              </div>
              <p className="mt-3 font-title text-3xl font-bold text-white">{item.value}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#081631]/70 p-4 text-sm text-slate-300">
          Total em notas: <span className="font-semibold text-slate-100">{money.format(resumo.valorTotal)}</span>
        </div>
      )}

      {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}

      {isAdmin ? (
        <div className="rounded-2xl border border-white/10 bg-[#081631]/70 p-4">
          <h3 className="mb-3 font-title text-lg text-slate-100">Emitir nota por OS finalizada</h3>
          <p className="mb-3 text-sm text-slate-300">Valor movimentado em notas: {money.format(resumo.valorTotal)}</p>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={emitirForm.handleSubmit(onEmitir)}>
            <label className="md:col-span-3 flex flex-col gap-1.5 text-sm">
              <span className="text-slate-300">Ordem de servico</span>
              <select
                {...emitirForm.register("ordemServicoId")}
                className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
              >
                <option value={0}>Selecione uma OS finalizada</option>
                {ordensFinalizadas.map((os) => (
                  <option key={os.id} value={os.id}>
                    OS #{os.id} - {os.clienteNome} - {os.veiculoPlaca}
                  </option>
                ))}
              </select>
              {emitirForm.formState.errors.ordemServicoId?.message ? (
                <span className="text-xs text-red-300">{emitirForm.formState.errors.ordemServicoId.message}</span>
              ) : null}
            </label>

            <div className="md:self-end">
              <Button type="submit" className="w-full" loading={emitirForm.formState.isSubmitting}>
                Emitir nota
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-[#081631]/65 p-3">
        <Table
          data={notas}
          keyExtractor={(item) => item.id}
          columns={[
            { header: "Numero", render: (item) => item.numero },
            { header: "Cliente", render: (item) => item.clienteNome },
            { header: "Valor", render: (item) => money.format(Number(item.valor)) },
            { header: "Status", render: (item) => <StatusBadge status={item.status} /> },
            {
              header: "Acoes",
              render: (item) => (
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => void openPdf(item)} loading={openingPdfId === item.id}>
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
                  {isAdmin && item.status !== "CANCELADA" ? (
                    <Button
                      variant="danger"
                      onClick={() => {
                        setCancelando(item);
                        cancelarForm.reset({ motivoCancelamento: "" });
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

      <Modal
        isOpen={Boolean(cancelando)}
        title="Cancelar nota"
        description="Informe o motivo do cancelamento para manter o historico completo."
        onClose={() => setCancelando(null)}
      >
        <form className="space-y-3" onSubmit={cancelarForm.handleSubmit(onCancelar)}>
          <Input
            label="Motivo"
            {...cancelarForm.register("motivoCancelamento")}
            error={cancelarForm.formState.errors.motivoCancelamento?.message}
          />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setCancelando(null)}>
              Fechar
            </Button>
            <Button variant="danger" type="submit" loading={cancelarForm.formState.isSubmitting}>
              Confirmar cancelamento
            </Button>
          </div>
        </form>
      </Modal>

      {notasAtivas.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">Ainda nao ha notas ativas. Emita a primeira pela OS finalizada.</p>
      ) : null}
    </section>
  );
}
