import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Menu, Plus, Search } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import { listClientes } from "@/services/clientes.service";
import { listEstoqueItems } from "@/services/estoque.service";
import { listOrcamentos } from "@/services/orcamentos.service";
import { listOrdensServico } from "@/services/ordens.service";
import { listVeiculos } from "@/services/veiculos.service";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  tag: "Cliente" | "Veiculo" | "OS" | "Peca" | "Orcamento";
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const debouncedSearch = useDebounce(search, 260);
  const isDashboardPage = location.pathname.startsWith("/dashboard");
  const isEstoquePage = location.pathname.startsWith("/estoque");
  const isOrcamentosPage = location.pathname.startsWith("/orcamentos");
  const searchPlaceholder = isEstoquePage
    ? "Buscar peca, codigo, categoria..."
    : isOrcamentosPage
      ? "Buscar orcamento, cliente, veiculo..."
      : "Buscar cliente, veiculo, OS...";
  const quickCreateLabel = isEstoquePage ? "Nova peca" : isOrcamentosPage ? "Novo orcamento" : "Nova OS";
  const quickCreateRoute = isEstoquePage
    ? "/estoque?action=nova-peca"
    : isOrcamentosPage
      ? "/orcamentos?action=novo-orcamento"
      : "/ordens-servico";

  useEffect(() => {
    setSearch("");
    setSearchResults([]);
  }, [location.pathname]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };

    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    void refreshAlerts();
  }, []);

  useEffect(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;

    const runSearch = async () => {
      setSearching(true);

      if (isEstoquePage) {
        const estoqueRes = await Promise.allSettled([listEstoqueItems()]);
        if (cancelled) return;

        const results: SearchResult[] = [];
        if (estoqueRes[0].status === "fulfilled") {
          results.push(
            ...estoqueRes[0].value
              .filter(
                (item) =>
                  item.codigo.toLowerCase().includes(query) ||
                  item.peca.toLowerCase().includes(query) ||
                  item.categoria.toLowerCase().includes(query) ||
                  item.fornecedor.toLowerCase().includes(query),
              )
              .slice(0, 8)
              .map((item) => ({
                id: `peca-${item.id}`,
                title: `${item.codigo} - ${item.peca}`,
                subtitle: `${item.categoria} / ${item.fornecedor}`,
                route: "/estoque",
                tag: "Peca" as const,
              })),
          );
        }

        setSearchResults(results);
        setSearching(false);
        return;
      }

      if (isOrcamentosPage) {
        const [orcamentosRes] = await Promise.allSettled([listOrcamentos()]);
        if (cancelled) return;

        const results: SearchResult[] = [];
        if (orcamentosRes.status === "fulfilled") {
          results.push(
            ...orcamentosRes.value
              .filter(
                (item) =>
                  item.numero.toLowerCase().includes(query) ||
                  item.clienteNome.toLowerCase().includes(query) ||
                  item.veiculoModelo.toLowerCase().includes(query) ||
                  item.veiculoPlaca.toLowerCase().includes(query),
              )
              .slice(0, 9)
              .map((item) => ({
                id: `orcamento-${item.id}`,
                title: `${item.numero} - ${item.clienteNome}`,
                subtitle: `${item.veiculoModelo} ${item.veiculoAno} / ${item.veiculoPlaca}`,
                route: "/orcamentos",
                tag: "Orcamento" as const,
              })),
          );
        }

        setSearchResults(results);
        setSearching(false);
        return;
      }

      const [clientesRes, veiculosRes, ordensRes] = await Promise.allSettled([listClientes(0, 160), listVeiculos(0, 160), listOrdensServico(0, 160)]);

      if (cancelled) return;

      const results: SearchResult[] = [];

      if (clientesRes.status === "fulfilled") {
        results.push(
          ...clientesRes.value.content
            .filter(
              (item) =>
                item.nome.toLowerCase().includes(query) ||
                item.cpfCnpj.toLowerCase().includes(query) ||
                item.telefone.toLowerCase().includes(query),
            )
            .slice(0, 4)
            .map((item) => ({
              id: `cliente-${item.id}`,
              title: item.nome,
              subtitle: `${item.cpfCnpj} - ${item.telefone}`,
              route: `/clientes/${item.id}`,
              tag: "Cliente" as const,
            })),
        );
      }

      if (veiculosRes.status === "fulfilled") {
        results.push(
          ...veiculosRes.value.content
            .filter(
              (item) =>
                item.placa.toLowerCase().includes(query) ||
                item.modelo.toLowerCase().includes(query) ||
                item.marca.toLowerCase().includes(query) ||
                item.clienteNome.toLowerCase().includes(query),
            )
            .slice(0, 4)
            .map((item) => ({
              id: `veiculo-${item.id}`,
              title: `${item.placa} - ${item.modelo}`,
              subtitle: `${item.marca} / ${item.clienteNome}`,
              route: "/veiculos",
              tag: "Veiculo" as const,
            })),
        );
      }

      if (ordensRes.status === "fulfilled") {
        results.push(
          ...ordensRes.value.content
            .filter(
              (item) =>
                String(item.id).includes(query) ||
                item.problemaRelatado.toLowerCase().includes(query) ||
                item.clienteNome.toLowerCase().includes(query) ||
                item.veiculoPlaca.toLowerCase().includes(query),
            )
            .slice(0, 4)
            .map((item) => ({
              id: `os-${item.id}`,
              title: `OS-${item.id} - ${item.veiculoPlaca}`,
              subtitle: `${item.clienteNome} - ${item.problemaRelatado}`,
              route: "/ordens-servico",
              tag: "OS" as const,
            })),
        );
      }

      setSearchResults(results.slice(0, 9));
      setSearching(false);
    };

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, isEstoquePage, isOrcamentosPage]);

  const alertLabel = useMemo(() => {
    if (alertCount <= 0) return "0";
    if (alertCount > 99) return "99+";
    return String(alertCount);
  }, [alertCount]);

  const refreshAlerts = async () => {
    try {
      const response = await listOrdensServico(0, 400);
      const pendentes = response.content.filter(
        (item) => item.status === "AGUARDANDO_APROVACAO" || item.status === "EM_ANALISE",
      );
      setAlertCount(pendentes.length);
    } catch {
      setAlertCount(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#040b1d] text-slate-100">
      <div className="relative flex min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(37,99,235,0.28),transparent_42%),radial-gradient(circle_at_84%_2%,rgba(14,165,233,0.17),transparent_32%),linear-gradient(180deg,#020918_0%,#060f23_46%,#07142b_100%)]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {!isDashboardPage ? (
            <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050d1e]/85 px-3 py-2.5 backdrop-blur-xl md:px-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="rounded-xl border border-white/10 p-2 text-slate-200 transition hover:border-blue-300/45 hover:text-blue-100 lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Abrir menu lateral"
                  >
                    <Menu size={19} />
                  </button>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <div ref={searchRef} className="relative hidden md:block">
                    <label className="flex min-w-[360px] items-center gap-2 rounded-lg border border-white/10 bg-[#0c1933]/75 px-3 py-2">
                      <Search size={15} className="text-slate-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full bg-transparent text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
                      />
                    </label>

                    {(search.length >= 2 || searchResults.length > 0) && (
                      <div className="absolute right-0 top-[44px] z-30 w-[360px] rounded-lg border border-white/10 bg-[#061129] p-2 shadow-[0_20px_45px_rgba(3,8,28,0.55)]">
                        {searching ? (
                          <p className="px-2 py-3 text-sm text-slate-400">Buscando...</p>
                        ) : searchResults.length > 0 ? (
                          <div className="space-y-1">
                            {searchResults.map((result) => (
                              <button
                                type="button"
                                key={result.id}
                                className="w-full rounded-lg border border-transparent bg-white/0 px-2 py-2 text-left transition hover:border-blue-300/20 hover:bg-blue-500/10"
                                onClick={() => {
                                  navigate(result.route);
                                  setSearchResults([]);
                                  setSearch("");
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate text-sm font-medium text-slate-100">{result.title}</p>
                                  <span className="rounded-full border border-blue-300/20 bg-blue-500/15 px-2 py-0.5 text-[11px] text-blue-100">
                                    {result.tag}
                                  </span>
                                </div>
                                <p className="truncate text-xs text-slate-400">{result.subtitle}</p>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="px-2 py-3 text-sm text-slate-400">Nenhum resultado.</p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#0c1933]/75 text-slate-200 transition hover:border-blue-300/45 hover:text-blue-100"
                    onClick={() => navigate("/dashboard")}
                    aria-label="Abrir alertas"
                  >
                    <Bell size={16} />
                    {alertCount > 0 ? (
                      <span className="absolute right-1 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {alertLabel}
                      </span>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(quickCreateRoute)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-blue-300/30 bg-blue-600/75 px-3.5 py-2 text-[13px] font-semibold text-blue-50 transition hover:bg-blue-500"
                  >
                    <Plus size={15} />
                    {quickCreateLabel}
                  </button>
                </div>
              </div>
            </header>
          ) : null}

          {isDashboardPage ? (
            <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050d1e]/85 px-3 py-2.5 backdrop-blur-xl md:px-4 lg:hidden">
              <div className="flex items-center">
                <button
                  type="button"
                  className="rounded-xl border border-white/10 p-2 text-slate-200 transition hover:border-blue-300/45 hover:text-blue-100"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir menu lateral"
                >
                  <Menu size={19} />
                </button>
              </div>
            </header>
          ) : null}

          <main className="flex-1 overflow-x-hidden p-3 md:p-4 xl:p-5">
            <div key={location.pathname} className="jc-page-enter">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
