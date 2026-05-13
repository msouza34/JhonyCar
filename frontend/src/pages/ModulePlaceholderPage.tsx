import { ClipboardList, Cog, Package } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";

interface ModuleInfo {
  title: string;
  subtitle: string;
  icon: typeof ClipboardList;
  links: Array<{ label: string; route: string }>;
}

const modules: Record<string, ModuleInfo> = {
  "/orcamentos": {
    title: "Orcamentos",
    subtitle: "Painel de orcamentos e notas ligado ao financeiro.",
    icon: ClipboardList,
    links: [
      { label: "Abrir Notas Fiscais", route: "/notas" },
      { label: "Abrir Financeiro", route: "/financeiro" },
    ],
  },
  "/estoque": {
    title: "Estoque",
    subtitle: "Gestao de pecas integrada com veiculos e ordens.",
    icon: Package,
    links: [
      { label: "Abrir Veiculos", route: "/veiculos" },
      { label: "Abrir Ordens de Servico", route: "/ordens-servico" },
    ],
  },
  "/configuracoes": {
    title: "Configuracoes",
    subtitle: "Ajustes gerais da operacao e preferencias de uso.",
    icon: Cog,
    links: [
      { label: "Abrir Dashboard", route: "/dashboard" },
      { label: "Abrir Clientes", route: "/clientes" },
    ],
  },
};

export default function ModulePlaceholderPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const moduleInfo = modules[location.pathname] ?? {
    title: "Modulo",
    subtitle: "Tela auxiliar do sistema.",
    icon: ClipboardList,
    links: [{ label: "Voltar ao Dashboard", route: "/dashboard" }],
  };

  return (
    <section className="space-y-4">
      <PageHeader title={moduleInfo.title} subtitle={moduleInfo.subtitle} />

      <article className="rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(10,22,44,0.95),rgba(6,14,30,0.98))] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/15 bg-[#102548] text-blue-200">
            <moduleInfo.icon size={21} />
          </div>
          <div>
            <h2 className="font-title text-2xl font-semibold text-white">{moduleInfo.title}</h2>
            <p className="text-slate-300">{moduleInfo.subtitle}</p>
          </div>
        </div>

        <p className="rounded-xl border border-blue-300/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          Este modulo esta ativo no menu e integrado com as telas principais do sistema.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {moduleInfo.links.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              className="rounded-xl border border-white/10 bg-[#0a1733]/75 px-3 py-2 text-sm text-slate-200 transition hover:border-blue-300/35 hover:text-blue-100"
            >
              {item.label}
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}
