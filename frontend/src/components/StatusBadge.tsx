import { cn } from "@/utils/cn";
import { statusLabel } from "@/utils/status";

interface StatusBadgeProps {
  status: string;
}

const statusColor: Record<string, string> = {
  RECEBIDO: "bg-blue-500/20 text-blue-200 border-blue-400/30",
  EM_ANALISE: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  AGUARDANDO_APROVACAO: "bg-violet-500/20 text-violet-200 border-violet-400/30",
  EM_EXECUCAO: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  FINALIZADO: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  SIMULADA: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30",
  EMITIDA: "bg-lime-500/20 text-lime-200 border-lime-400/30",
  CANCELADA: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  PENDENTE: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  APROVADO: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  RECUSADO: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  PAGO: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  ESTORNADO: "bg-red-500/20 text-red-200 border-red-400/30",
  AGENDADO: "bg-blue-500/20 text-blue-200 border-blue-400/30",
  CONCLUIDO: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  CADASTRADO: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30",
  CONVERTIDO_EM_OS: "bg-blue-500/20 text-blue-200 border-blue-400/30",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        statusColor[status] ?? "bg-slate-500/20 text-slate-200 border-slate-400/30",
      )}
    >
      {statusLabel[status] ?? status}
    </span>
  );
}
