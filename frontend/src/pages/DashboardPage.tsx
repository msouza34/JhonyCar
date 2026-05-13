import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileBarChart2,
  Plus,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listAgendamentos } from "@/services/agenda.service";
import { getErrorMessage } from "@/services/api";
import { getDashboardResumo } from "@/services/dashboard.service";
import { listFinanceiro } from "@/services/financeiro.service";
import { listOrdensServico } from "@/services/ordens.service";
import type { Agendamento } from "@/types/agendamento";
import type { DashboardResumo } from "@/types/dashboard";
import type { Financeiro } from "@/types/financeiro";
import type { OrdemServico } from "@/types/ordem-servico";
import { statusLabel } from "@/utils/status";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const decimal1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
const hourFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const weekDayShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

interface TopCard {
  title: string;
  value: string;
  delta: string;
  icon: typeof ClipboardList;
  iconBg: string;
  iconTone: string;
  deltaTone: string;
}

interface TrendCard {
  title: string;
  value: string;
  delta: string;
  positive: boolean;
  stroke: string;
  fill: string;
  points: number[];
  labels: string[];
  yTopLabel: string;
  yMidLabel: string;
  yBottomLabel: string;
}

interface StatusSlice {
  key: OrdemServico["status"];
  label: string;
  color: string;
}

interface AlertItem {
  title: string;
  subtitle: string;
  tone: "warn" | "danger" | "info";
}

const statusSlices: StatusSlice[] = [
  { key: "RECEBIDO", label: "Entrada", color: "#2d8bff" },
  { key: "EM_ANALISE", label: "Diagnostico", color: "#8b5cf6" },
  { key: "AGUARDANDO_APROVACAO", label: "Aguardando aprovacao", color: "#f97316" },
  { key: "EM_EXECUCAO", label: "Em execucao", color: "#facc15" },
  { key: "FINALIZADO", label: "Finalizado", color: "#22c55e" },
];

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toDateKey(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildLastDays(days: number, offset = 0) {
  const now = startOfDay(new Date());
  const result: Date[] = [];
  for (let i = days - 1 + offset; i >= offset; i -= 1) {
    result.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
  }
  return result;
}

function differenceInDays(reference: Date, target: Date) {
  const diffMs = startOfDay(reference).getTime() - startOfDay(target).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function calcDelta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatDelta(value: number) {
  const signal = value >= 0 ? "+" : "";
  return `${signal}${value.toFixed(1)}%`;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0h 0m";
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return `${hours}h ${rest}m`;
}

function roundUp(value: number, step: number) {
  if (value <= 0) return step;
  return Math.ceil(value / step) * step;
}

function formatAxisCurrency(value: number) {
  if (value >= 1000) {
    return `R$ ${decimal1.format(value / 1000)}k`;
  }
  return `R$ ${Math.round(value)}`;
}

function formatAxisHours(valueInMinutes: number) {
  if (valueInMinutes <= 0) return "0h";
  const hours = valueInMinutes / 60;
  if (hours >= 10) return `${Math.round(hours)}h`;
  return `${decimal1.format(hours)}h`;
}

function getServiceDurationMinutes(item: OrdemServico) {
  const start = parseDate(item.dataEntrada);
  const end = parseDate(item.dataSaida);
  if (!start || !end) return null;
  const diff = (end.getTime() - start.getTime()) / (1000 * 60);
  return diff > 0 ? diff : null;
}

function formatEntryLabel(value?: string | null) {
  const date = parseDate(value);
  if (!date) return "--";

  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  if (isSameDay(date, now)) {
    return `Hoje ${hourFormatter.format(date)}`;
  }
  if (isSameDay(date, yesterday)) {
    return `Ontem ${hourFormatter.format(date)}`;
  }
  return `${dayFormatter.format(date)} ${hourFormatter.format(date)}`;
}

function getStatusPillClass(status: OrdemServico["status"]) {
  if (status === "EM_ANALISE") return "border-violet-400/35 bg-violet-500/15 text-violet-100";
  if (status === "AGUARDANDO_APROVACAO") return "border-orange-400/35 bg-orange-500/15 text-orange-100";
  if (status === "EM_EXECUCAO") return "border-amber-400/35 bg-amber-500/15 text-amber-100";
  if (status === "FINALIZADO") return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100";
  return "border-blue-400/35 bg-blue-500/15 text-blue-100";
}

function buildSparkPaths(points: number[], width = 270, height = 82) {
  if (points.length === 0) return { linePath: "", areaPath: "" };

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);

  const coords = points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * width;
    const y = height - ((point - min) / range) * height;
    return { x, y };
  });

  const linePath = coords
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");

  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  return { linePath, areaPath };
}

function SparkCard({ card, idx }: { card: TrendCard; idx: number }) {
  const { linePath, areaPath } = buildSparkPaths(card.points);
  const gradientId = `spark-gradient-${idx}`;

  return (
    <article className="jc-dash-surface min-h-[196px] rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(11,23,46,0.98),rgba(7,15,33,0.96))] p-4 shadow-[0_8px_24px_rgba(2,8,24,0.35)]">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-300">{card.title}</p>
          <p className="mt-1 font-title text-[1.95rem] font-bold leading-none text-white">{card.value}</p>
        </div>
      </div>
      <p className={`text-sm ${card.positive ? "text-emerald-300" : "text-rose-300"}`}>{card.delta}</p>

      <div className="jc-dash-subsurface mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#0a1733]/65 p-2">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 text-[10px] text-slate-500">
            <span className="absolute left-0 top-0">{card.yTopLabel}</span>
            <span className="absolute left-0 top-1/2 -translate-y-1/2">{card.yMidLabel}</span>
            <span className="absolute bottom-0 left-0">{card.yBottomLabel}</span>
          </div>

          <div className="ml-8">
            <svg viewBox="0 0 270 82" className="h-20 w-full">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={card.fill} stopOpacity="0.34" />
                  <stop offset="100%" stopColor={card.fill} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <line x1="0" y1="20.5" x2="270" y2="20.5" stroke="rgba(148,163,184,0.20)" strokeDasharray="3 4" />
              <line x1="0" y1="41" x2="270" y2="41" stroke="rgba(148,163,184,0.16)" strokeDasharray="3 4" />
              <line x1="0" y1="61.5" x2="270" y2="61.5" stroke="rgba(148,163,184,0.13)" strokeDasharray="3 4" />
              <path d={areaPath} fill={`url(#${gradientId})`} />
              <path d={linePath} fill="none" stroke={card.stroke} strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="mt-1 ml-8 grid grid-cols-7 text-center text-[11px] text-slate-500">
          {card.labels.map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardResumo | null>(null);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [financeiro, setFinanceiro] = useState<Financeiro[]>([]);
  const [agenda, setAgenda] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [resumoRes, ordensRes, financeiroRes, agendaRes] = await Promise.allSettled([
      getDashboardResumo(),
      listOrdensServico(0, 1200),
      listFinanceiro(0, 1200),
      listAgendamentos(0, 1200),
    ]);

    if (resumoRes.status === "fulfilled") {
      setSummary(resumoRes.value);
    } else {
      setSummary(null);
      setError(getErrorMessage(resumoRes.reason));
    }

    setOrdens(ordensRes.status === "fulfilled" ? ordensRes.value.content : []);
    setFinanceiro(financeiroRes.status === "fulfilled" ? financeiroRes.value.content : []);
    setAgenda(agendaRes.status === "fulfilled" ? agendaRes.value.content : []);
    setLoading(false);
  };

  const today = useMemo(() => startOfDay(new Date()), []);
  const yesterday = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
    [today],
  );
  const currentMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const previousMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth() - 1, 1), [today]);
  const currentMonthDaysElapsed = useMemo(() => Math.max(1, today.getDate()), [today]);
  const previousMonthDays = useMemo(
    () => new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0).getDate(),
    [previousMonth],
  );

  const last7Days = useMemo(() => buildLastDays(7), []);
  const previous7Days = useMemo(() => buildLastDays(7, 7), []);
  const last7Keys = useMemo(() => last7Days.map((day) => toDateKey(day)), [last7Days]);
  const previous7Keys = useMemo(() => previous7Days.map((day) => toDateKey(day)), [previous7Days]);
  const last7Labels = useMemo(() => last7Days.map((day) => weekDayShort[day.getDay()]), [last7Days]);

  const ordensByStatus = useMemo(() => {
    const base: Record<OrdemServico["status"], number> = {
      RECEBIDO: 0,
      EM_ANALISE: 0,
      AGUARDANDO_APROVACAO: 0,
      EM_EXECUCAO: 0,
      FINALIZADO: 0,
    };

    for (const item of ordens) {
      base[item.status] += 1;
    }
    return base;
  }, [ordens]);

  const financePaid = useMemo(() => financeiro.filter((item) => item.status === "PAGO"), [financeiro]);
  const financePending = useMemo(() => financeiro.filter((item) => item.status === "PENDENTE"), [financeiro]);

  const totalOrdens = summary?.totalOrdensServico ?? ordens.length;
  const ordensAbertas = summary?.ordensEmAberto ?? totalOrdens - ordensByStatus.FINALIZADO;

  const ordensHoje = useMemo(
    () =>
      ordens.filter((item) => {
        const entry = parseDate(item.dataEntrada);
        return entry ? isSameDay(entry, today) : false;
      }),
    [ordens, today],
  );

  const finalizadasHoje = useMemo(
    () =>
      ordens.filter((item) => {
        if (item.status !== "FINALIZADO") return false;
        const date = parseDate(item.dataSaida ?? item.dataEntrada);
        return date ? isSameDay(date, today) : false;
      }).length,
    [ordens, today],
  );

  const finalizadasOntem = useMemo(
    () =>
      ordens.filter((item) => {
        if (item.status !== "FINALIZADO") return false;
        const date = parseDate(item.dataSaida ?? item.dataEntrada);
        return date ? isSameDay(date, yesterday) : false;
      }).length,
    [ordens, yesterday],
  );

  const faturamentoHoje = useMemo(
    () =>
      financePaid.reduce((acc, item) => {
        const date = parseDate(item.data);
        if (!date || !isSameDay(date, today)) return acc;
        return acc + Number(item.valor);
      }, 0),
    [financePaid, today],
  );

  const faturamentoOntem = useMemo(
    () =>
      financePaid.reduce((acc, item) => {
        const date = parseDate(item.data);
        if (!date || !isSameDay(date, yesterday)) return acc;
        return acc + Number(item.valor);
      }, 0),
    [financePaid, yesterday],
  );

  const ticketMedio = useMemo(() => {
    const values: number[] = [];
    for (const item of ordens) {
      const date = parseDate(item.dataEntrada);
      if (!date) continue;
      if (!last7Keys.includes(toDateKey(date))) continue;
      values.push(Number(item.valorTotal));
    }
    return average(values);
  }, [last7Keys, ordens]);

  const ticketMedioAnterior = useMemo(() => {
    const values: number[] = [];
    for (const item of ordens) {
      const date = parseDate(item.dataEntrada);
      if (!date) continue;
      if (!previous7Keys.includes(toDateKey(date))) continue;
      values.push(Number(item.valorTotal));
    }
    return average(values);
  }, [ordens, previous7Keys]);

  const topCards: TopCard[] = useMemo(
    () => [
      {
        title: "Ordens em aberto",
        value: ordensAbertas.toLocaleString("pt-BR"),
        delta: `+${ordensHoje.filter((item) => item.status !== "FINALIZADO").length} hoje`,
        icon: ClipboardList,
        iconBg: "bg-blue-500/15 ring-1 ring-blue-300/25",
        iconTone: "text-blue-200",
        deltaTone: "text-blue-200",
      },
      {
        title: "Finalizadas hoje",
        value: finalizadasHoje.toLocaleString("pt-BR"),
        delta: `${formatDelta(calcDelta(finalizadasHoje, finalizadasOntem))} vs ontem`,
        icon: ClipboardCheck,
        iconTone: "text-emerald-200",
        iconBg: "bg-emerald-500/15 ring-1 ring-emerald-300/25",
        deltaTone: calcDelta(finalizadasHoje, finalizadasOntem) >= 0 ? "text-emerald-300" : "text-rose-300",
      },
      {
        title: "Faturamento do dia",
        value: money.format(faturamentoHoje),
        delta: `${formatDelta(calcDelta(faturamentoHoje, faturamentoOntem))} vs ontem`,
        icon: CircleDollarSign,
        iconTone: "text-green-200",
        iconBg: "bg-green-500/15 ring-1 ring-green-300/25",
        deltaTone: calcDelta(faturamentoHoje, faturamentoOntem) >= 0 ? "text-emerald-300" : "text-rose-300",
      },
      {
        title: "Ticket medio",
        value: money.format(ticketMedio),
        delta: `${formatDelta(calcDelta(ticketMedio, ticketMedioAnterior))} vs semana anterior`,
        icon: Clock3,
        iconTone: "text-violet-200",
        iconBg: "bg-violet-500/15 ring-1 ring-violet-300/25",
        deltaTone: calcDelta(ticketMedio, ticketMedioAnterior) >= 0 ? "text-emerald-300" : "text-rose-300",
      },
    ],
    [
      faturamentoHoje,
      faturamentoOntem,
      finalizadasHoje,
      finalizadasOntem,
      ordensAbertas,
      ordensHoje,
      ticketMedio,
      ticketMedioAnterior,
    ],
  );

  const ordensPorDiaSeries = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of ordens) {
      const date = parseDate(item.dataEntrada);
      if (!date) continue;
      const key = toDateKey(date);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return last7Keys.map((key) => map.get(key) ?? 0);
  }, [last7Keys, ordens]);

  const revenueByDaySeries = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of financePaid) {
      const date = parseDate(item.data);
      if (!date) continue;
      const key = toDateKey(date);
      map.set(key, (map.get(key) ?? 0) + Number(item.valor));
    }
    return last7Keys.map((key) => map.get(key) ?? 0);
  }, [financePaid, last7Keys]);

  const revenueByDayPreviousSeries = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of financePaid) {
      const date = parseDate(item.data);
      if (!date) continue;
      const key = toDateKey(date);
      map.set(key, (map.get(key) ?? 0) + Number(item.valor));
    }
    return previous7Keys.map((key) => map.get(key) ?? 0);
  }, [financePaid, previous7Keys]);

  const serviceByDaySeries = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const item of ordens) {
      const duration = getServiceDurationMinutes(item);
      if (duration == null) continue;
      const outputDate = parseDate(item.dataSaida);
      if (!outputDate) continue;
      const key = toDateKey(outputDate);
      const list = map.get(key) ?? [];
      list.push(duration);
      map.set(key, list);
    }
    return last7Keys.map((key) => average(map.get(key) ?? []));
  }, [last7Keys, ordens]);

  const serviceByDayPreviousSeries = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const item of ordens) {
      const duration = getServiceDurationMinutes(item);
      if (duration == null) continue;
      const outputDate = parseDate(item.dataSaida);
      if (!outputDate) continue;
      const key = toDateKey(outputDate);
      const list = map.get(key) ?? [];
      list.push(duration);
      map.set(key, list);
    }
    return previous7Keys.map((key) => average(map.get(key) ?? []));
  }, [ordens, previous7Keys]);

  const recebimentosPendentesSeries = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of financePending) {
      const date = parseDate(item.data);
      if (!date) continue;
      const key = toDateKey(date);
      map.set(key, (map.get(key) ?? 0) + Number(item.valor));
    }
    return last7Keys.map((key) => map.get(key) ?? 0);
  }, [financePending, last7Keys]);

  const faturamentoSemana = sum(revenueByDaySeries);
  const faturamentoSemanaAnterior = sum(revenueByDayPreviousSeries);
  const tempoMedio = average(serviceByDaySeries);
  const tempoMedioAnterior = average(serviceByDayPreviousSeries);
  const recebimentosPendentesTotal = financePending.reduce((acc, item) => acc + Number(item.valor), 0);
  const recebimentosPendentesHoje = financePending.reduce((acc, item) => {
    const date = parseDate(item.data);
    if (!date || !isSameDay(date, today)) return acc;
    return acc + Number(item.valor);
  }, 0);
  const recebimentosPendentesOntem = financePending.reduce((acc, item) => {
    const date = parseDate(item.data);
    if (!date || !isSameDay(date, yesterday)) return acc;
    return acc + Number(item.valor);
  }, 0);

  const ordensMesAtual = useMemo(
    () =>
      ordens.filter((item) => {
        const date = parseDate(item.dataEntrada);
        return date ? date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear() : false;
      }).length,
    [currentMonth, ordens],
  );

  const ordensMesAnterior = useMemo(
    () =>
      ordens.filter((item) => {
        const date = parseDate(item.dataEntrada);
        return date
          ? date.getMonth() === previousMonth.getMonth() && date.getFullYear() === previousMonth.getFullYear()
          : false;
      }).length,
    [ordens, previousMonth],
  );

  const osPorDiaAtual = ordensMesAtual / currentMonthDaysElapsed;
  const osPorDiaAnterior = ordensMesAnterior / Math.max(1, previousMonthDays);

  const revenueAxisTop = roundUp(Math.max(...revenueByDaySeries, 0), 500);
  const serviceAxisTop = roundUp(Math.max(...serviceByDaySeries, 0), 30);
  const osDiaAxisTop = roundUp(Math.max(...ordensPorDiaSeries, 0), 1);
  const pendentesAxisTop = roundUp(Math.max(...recebimentosPendentesSeries, 0), 500);

  const trendCards: TrendCard[] = useMemo(
    () => [
      {
        title: "Faturamento da semana",
        value: money.format(faturamentoSemana),
        delta: `${formatDelta(calcDelta(faturamentoSemana, faturamentoSemanaAnterior))} vs semana anterior`,
        positive: calcDelta(faturamentoSemana, faturamentoSemanaAnterior) >= 0,
        stroke: "#22c55e",
        fill: "#22c55e",
        points: revenueByDaySeries,
        labels: last7Labels,
        yTopLabel: formatAxisCurrency(revenueAxisTop),
        yMidLabel: formatAxisCurrency(revenueAxisTop / 2),
        yBottomLabel: "R$ 0",
      },
      {
        title: "Tempo medio de servico",
        value: formatDuration(tempoMedio),
        delta: `${formatDelta(calcDelta(tempoMedio, tempoMedioAnterior))} vs semana anterior`,
        positive: calcDelta(tempoMedio, tempoMedioAnterior) <= 0,
        stroke: "#a855f7",
        fill: "#a855f7",
        points: serviceByDaySeries,
        labels: last7Labels,
        yTopLabel: formatAxisHours(serviceAxisTop),
        yMidLabel: formatAxisHours(serviceAxisTop / 2),
        yBottomLabel: "0h",
      },
      {
        title: "OS por dia (media)",
        value: decimal1.format(osPorDiaAtual),
        delta: `${formatDelta(calcDelta(osPorDiaAtual, osPorDiaAnterior))} vs mes anterior`,
        positive: calcDelta(osPorDiaAtual, osPorDiaAnterior) >= 0,
        stroke: "#f59e0b",
        fill: "#f59e0b",
        points: ordensPorDiaSeries,
        labels: last7Labels,
        yTopLabel: decimal1.format(osDiaAxisTop),
        yMidLabel: decimal1.format(osDiaAxisTop / 2),
        yBottomLabel: "0",
      },
      {
        title: "Recebimentos pendentes",
        value: money.format(recebimentosPendentesTotal),
        delta: `${formatDelta(calcDelta(recebimentosPendentesHoje, recebimentosPendentesOntem))} vs ontem`,
        positive: calcDelta(recebimentosPendentesHoje, recebimentosPendentesOntem) >= 0,
        stroke: "#16a34a",
        fill: "#16a34a",
        points: recebimentosPendentesSeries,
        labels: last7Labels,
        yTopLabel: formatAxisCurrency(pendentesAxisTop),
        yMidLabel: formatAxisCurrency(pendentesAxisTop / 2),
        yBottomLabel: "R$ 0",
      },
    ],
    [
      faturamentoSemana,
      faturamentoSemanaAnterior,
      last7Labels,
      ordensPorDiaSeries,
      osPorDiaAnterior,
      osPorDiaAtual,
      osDiaAxisTop,
      pendentesAxisTop,
      recebimentosPendentesHoje,
      recebimentosPendentesOntem,
      recebimentosPendentesSeries,
      recebimentosPendentesTotal,
      revenueAxisTop,
      revenueByDaySeries,
      serviceAxisTop,
      serviceByDaySeries,
      tempoMedio,
      tempoMedioAnterior,
    ],
  );

  const donutData = useMemo(() => {
    const rows = statusSlices.map((slice) => ({
      ...slice,
      count: ordensByStatus[slice.key] ?? 0,
    }));
    const total = rows.reduce((acc, item) => acc + item.count, 0);

    if (total === 0) {
      return {
        total: 0,
        rows,
        gradient: "conic-gradient(#1f2a44 0% 100%)",
      };
    }

    let cursor = 0;
    const segments: string[] = [];
    for (const row of rows) {
      const pct = (row.count / total) * 100;
      const next = cursor + pct;
      segments.push(`${row.color} ${cursor}% ${next}%`);
      cursor = next;
    }

    return {
      total,
      rows,
      gradient: `conic-gradient(${segments.join(", ")})`,
    };
  }, [ordensByStatus]);

  const agendaHoje = useMemo(
    () =>
      agenda
        .filter((item) => {
          const date = parseDate(item.dataHora);
          return date ? isSameDay(date, today) : false;
        })
        .sort((a, b) => a.dataHora.localeCompare(b.dataHora))
        .slice(0, 6),
    [agenda, today],
  );

  const alertas = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = [];

    const aguardandoAprovacao = ordens.filter((item) => item.status === "AGUARDANDO_APROVACAO");
    const totalAguardando = aguardandoAprovacao.reduce((acc, item) => acc + Number(item.valorTotal), 0);
    if (aguardandoAprovacao.length > 0) {
      items.push({
        title: `${aguardandoAprovacao.length} OS aguardando aprovacao`,
        subtitle: `Total: ${money.format(totalAguardando)}`,
        tone: "danger",
      });
    }

    const osParadas = ordens.filter((item) => {
      if (item.status === "FINALIZADO") return false;
      const date = parseDate(item.dataEntrada);
      if (!date) return false;
      return differenceInDays(today, date) >= 2;
    });

    if (osParadas.length > 0) {
      items.push({
        title: `${osParadas.length} OS paradas ha mais de 2 dias`,
        subtitle: "Precisa de atencao",
        tone: "danger",
      });
    }

    const diagnosticosParados = ordens.filter((item) => {
      if (item.status !== "EM_ANALISE") return false;
      const date = parseDate(item.dataEntrada);
      if (!date) return false;
      return differenceInDays(today, date) >= 3;
    });

    if (diagnosticosParados.length > 0) {
      items.push({
        title: `${diagnosticosParados.length} peca em atraso`,
        subtitle: `OS-${diagnosticosParados[0].id} sem atualizacao`,
        tone: "warn",
      });
    }

    const limite = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
    const pendentesVencendo = financePending.filter((item) => {
      const date = parseDate(item.data);
      if (!date) return false;
      return date >= today && date <= limite;
    });

    if (pendentesVencendo.length > 0) {
      items.push({
        title: `${pendentesVencendo.length} orcamentos vencendo`,
        subtitle: "Nos proximos 3 dias",
        tone: "info",
      });
    }

    if (items.length === 0) {
      items.push({
        title: "Sem alertas criticos",
        subtitle: "Operacao dentro do esperado",
        tone: "info",
      });
    }

    return items.slice(0, 4);
  }, [financePending, ordens, today]);

  const ordensRecentes = useMemo(
    () =>
      [...ordens]
        .sort((a, b) => {
          const aDate = parseDate(a.dataEntrada)?.getTime() ?? 0;
          const bDate = parseDate(b.dataEntrada)?.getTime() ?? 0;
          return bDate - aDate;
        })
        .slice(0, 5),
    [ordens],
  );

  const resumoFinanceiro = useMemo(() => {
    return {
      faturamentoHoje,
      faturamentoSemana,
      ticketMedio,
      recebimentosPendentesTotal,
    };
  }, [faturamentoHoje, faturamentoSemana, recebimentosPendentesTotal, ticketMedio]);

  const alertCount = useMemo(() => {
    const aguardando = ordens.filter((item) => item.status === "AGUARDANDO_APROVACAO").length;
    const analise = ordens.filter((item) => item.status === "EM_ANALISE").length;
    return aguardando + analise;
  }, [ordens]);

  const quickActions = [
    {
      icon: ClipboardList,
      label: "Nova OS",
      subtitle: "Criar ordem",
      route: "/ordens-servico",
      tone: "text-violet-200",
      iconBg: "bg-violet-500/15 ring-1 ring-violet-300/25",
    },
    {
      icon: UserPlus,
      label: "Novo cliente",
      subtitle: "Cadastrar",
      route: "/clientes",
      tone: "text-emerald-200",
      iconBg: "bg-emerald-500/15 ring-1 ring-emerald-300/25",
    },
    {
      icon: CalendarClock,
      label: "Agenda",
      subtitle: "Ver compromissos",
      route: "/agenda",
      tone: "text-rose-200",
      iconBg: "bg-rose-500/15 ring-1 ring-rose-300/25",
    },
    {
      icon: FileBarChart2,
      label: "Relatorios",
      subtitle: "Ver analises",
      route: "/financeiro",
      tone: "text-amber-200",
      iconBg: "bg-amber-500/15 ring-1 ring-amber-300/25",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <h1 className="font-title text-[2.35rem] font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-slate-300">Visao geral da sua auto eletrica</p>
        </div>

        <div className="flex items-start justify-start gap-2 xl:justify-end">
          <button
            type="button"
            onClick={() => navigate("/ordens-servico")}
            className="jc-dash-btn-ghost jc-dash-top-control relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#091731]/85 text-slate-200 transition hover:border-blue-300/40 hover:text-blue-100"
            aria-label="Alertas"
          >
            <Bell size={16} />
            {alertCount > 0 ? (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            ) : null}
          </button>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate("/ordens-servico")}
              className="jc-dash-btn-primary inline-flex h-10 items-center gap-2 rounded-xl border border-violet-300/30 bg-violet-600/85 px-3.5 text-sm font-semibold text-violet-50 transition hover:bg-violet-500"
            >
              <Plus size={15} />
              Nova OS
            </button>
            <button
              type="button"
              onClick={() => void loadData()}
              className="jc-dash-btn-ghost jc-dash-top-control inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-[#091731]/85 px-3.5 text-sm text-slate-200 transition hover:border-blue-300/35 hover:text-blue-100"
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              {loading ? "Atualizando..." : "Atualizar dados"}
            </button>
          </div>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      <div className="jc-stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {topCards.map((card) => (
          <article
            key={card.title}
            className="jc-dash-surface min-h-[122px] rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,22,45,0.98),rgba(7,14,30,0.96))] p-4 shadow-[0_8px_22px_rgba(3,8,24,0.36)]"
          >
            <div className="flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${card.iconBg} ${card.iconTone}`}>
                <card.icon size={20} />
              </div>
              <div>
                <p className="text-[13px] text-slate-300">{card.title}</p>
                <p className="mt-1 font-title text-[2.05rem] font-bold leading-none text-white">{card.value}</p>
              </div>
            </div>
            <p className={`mt-2 text-[13px] ${card.deltaTone}`}>{card.delta}</p>
          </article>
        ))}
      </div>

      <div className="jc-stagger grid grid-cols-1 gap-3 xl:grid-cols-4">
        {trendCards.map((card, idx) => (
          <SparkCard key={card.title} card={card} idx={idx} />
        ))}
      </div>

      <div className="jc-stagger grid grid-cols-1 gap-3 xl:grid-cols-12">
        <article className="jc-dash-surface rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(10,22,45,0.98),rgba(6,14,30,0.96))] p-4 xl:col-span-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-title text-[1.8rem] font-semibold text-white">Ordens de Servico <span className="text-slate-300">(Resumo)</span></h3>
            <button
              type="button"
              onClick={() => navigate("/ordens-servico")}
              className="text-sm text-blue-300 transition hover:text-blue-200"
            >
              Ver todas OS
            </button>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative mx-auto h-56 w-56 rounded-full" style={{ backgroundImage: donutData.gradient }}>
              <div className="absolute inset-9 grid place-items-center rounded-full bg-[#09142d] text-center">
                <p className="text-sm text-slate-400">Total</p>
                <p className="font-title text-5xl font-bold text-white">{donutData.total}</p>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              {donutData.rows.map((item) => {
                const pct = donutData.total > 0 ? (item.count / donutData.total) * 100 : 0;
                return (
                  <div key={item.key} className="jc-dash-subsurface flex items-center justify-between rounded-xl border border-white/10 bg-[#0a1632]/70 px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-slate-200">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="text-slate-300">
                      {item.count} ({decimal1.format(pct)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <article className="jc-dash-surface rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(11,23,46,0.98),rgba(7,15,33,0.96))] p-4 xl:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-title text-[1.8rem] font-semibold text-white">Agenda de Hoje</h3>
            <button
              type="button"
              onClick={() => navigate("/agenda")}
              className="jc-dash-btn-ghost rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-sm text-slate-300 transition hover:border-blue-300/35"
            >
              Ver agenda
            </button>
          </div>
          <div className="space-y-2">
            {agendaHoje.length > 0 ? (
              agendaHoje.map((item) => (
                <div key={item.id} className="jc-dash-subsurface rounded-xl border border-white/10 bg-[#0a1734]/75 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-100">{hourFormatter.format(new Date(item.dataHora))}</p>
                    <span className="rounded-full border border-blue-300/25 bg-blue-500/15 px-2 py-0.5 text-xs text-blue-100">
                      {statusLabel[item.status] ?? item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-200">{item.veiculoPlaca}</p>
                  <p className="text-sm text-slate-400">{item.descricao}</p>
                </div>
              ))
            ) : (
              <div className="jc-dash-subsurface grid min-h-[238px] place-items-center rounded-xl border border-white/10 bg-[#0a1734]/75 px-3 py-5 text-center">
                <div>
                  <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl border border-blue-300/20 bg-blue-500/10 text-blue-200">
                    <CalendarClock size={30} />
                  </div>
                  <p className="text-sm text-slate-300">Nenhum compromisso para hoje.</p>
                  <p className="mt-1 text-sm text-slate-400">Aproveite para focar nas OS!</p>
                </div>
              </div>
            )}
          </div>
        </article>

        <article className="jc-dash-surface rounded-2xl border border-white/10 bg-[linear-gradient(160deg,rgba(12,23,45,0.98),rgba(8,16,34,0.96))] p-4 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-title text-[1.8rem] font-semibold text-white">Alertas importantes</h3>
            <button
              type="button"
              onClick={() => navigate("/ordens-servico")}
              className="text-sm text-blue-300 transition hover:text-blue-200"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-2">
            {alertas.map((item) => {
              const toneClass =
                item.tone === "danger"
                  ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                  : item.tone === "warn"
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                    : "border-blue-400/30 bg-blue-500/10 text-blue-200";

              return (
                <div key={item.title} className={`rounded-xl border px-3 py-2 ${toneClass}`}>
                  <div className="flex items-start justify-between gap-2">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-sm opacity-85">{item.subtitle}</p>
                    </div>
                    <ChevronRight size={16} className="mt-1 shrink-0 opacity-80" />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      <div className="jc-stagger grid grid-cols-1 gap-3 xl:grid-cols-12">
        <article className="jc-dash-surface rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(9,20,41,0.98),rgba(6,14,30,0.96))] p-4 xl:col-span-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-title text-[1.8rem] font-semibold text-white">Ordens de Servico recentes</h3>
            <button
              type="button"
              onClick={() => navigate("/ordens-servico")}
              className="text-sm text-blue-300 transition hover:text-blue-200"
            >
              Ver todas OS
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-sm text-slate-400">
                  <th className="pb-2 font-medium">OS</th>
                  <th className="pb-2 font-medium">Veiculo</th>
                  <th className="pb-2 font-medium">Cliente</th>
                  <th className="pb-2 font-medium">Problema</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Entrada</th>
                </tr>
              </thead>
              <tbody>
                {ordensRecentes.length > 0 ? (
                  ordensRecentes.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 text-sm text-slate-200 last:border-0">
                      <td className="py-3">OS-{item.id}</td>
                      <td className="py-3">{item.veiculoPlaca}</td>
                      <td className="py-3">{item.clienteNome}</td>
                      <td className="max-w-[210px] truncate py-3">{item.problemaRelatado}</td>
                      <td className="py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${getStatusPillClass(item.status)}`}>
                          {statusLabel[item.status] ?? item.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{formatEntryLabel(item.dataEntrada)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
                      Nenhuma OS encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="jc-dash-surface rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(10,22,45,0.98),rgba(7,15,32,0.96))] p-4 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-title text-[1.8rem] font-semibold text-white">Resumo financeiro</h3>
            <button
              type="button"
              onClick={() => navigate("/financeiro")}
              className="jc-dash-btn-ghost rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-sm text-slate-300 transition hover:border-blue-300/35"
            >
              Ver financeiro
            </button>
          </div>

          <div className="jc-dash-subsurface rounded-xl border border-white/10 bg-[#0a1734]/75">
            <div className="border-b border-white/10 px-3 py-2.5">
              <p className="text-xs uppercase tracking-[0.08em] text-emerald-300/80">Faturamento hoje</p>
              <p className="font-title text-3xl font-bold text-emerald-300">{money.format(resumoFinanceiro.faturamentoHoje)}</p>
            </div>
            <div className="border-b border-white/10 px-3 py-2.5">
              <p className="text-xs uppercase tracking-[0.08em] text-cyan-300/80">Faturamento semana</p>
              <p className="font-title text-3xl font-bold text-cyan-300">{money.format(resumoFinanceiro.faturamentoSemana)}</p>
            </div>
            <div className="border-b border-white/10 px-3 py-2.5">
              <p className="text-xs uppercase tracking-[0.08em] text-violet-300/80">Ticket medio</p>
              <p className="font-title text-3xl font-bold text-violet-300">{money.format(resumoFinanceiro.ticketMedio)}</p>
            </div>
            <div className="px-3 py-2.5">
              <p className="text-xs uppercase tracking-[0.08em] text-amber-300/80">Recebimentos pendentes</p>
              <p className="font-title text-3xl font-bold text-amber-300">{money.format(resumoFinanceiro.recebimentosPendentesTotal)}</p>
            </div>
          </div>
        </article>

        <article className="jc-dash-surface rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(9,21,42,0.98),rgba(6,14,31,0.96))] p-4 xl:col-span-3">
          <h3 className="mb-3 font-title text-[1.8rem] font-semibold text-white">Acoes rapidas</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.route)}
                className="jc-dash-subsurface flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a1733]/75 p-3 text-left transition hover:border-blue-300/35 hover:bg-[#0d1f40]"
              >
                <div className={`grid h-9 w-9 place-items-center rounded-lg ${action.iconBg}`}>
                  <action.icon size={19} className={action.tone} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{action.label}</p>
                  <p className="text-xs text-slate-400">{action.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </article>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1 text-xs text-slate-500">
        <p>&copy; 2024 Nova OS - Sistema de Gestao para Auto Eletrica</p>
        <p>Versao 2.0.0</p>
      </div>
    </section>
  );
}
