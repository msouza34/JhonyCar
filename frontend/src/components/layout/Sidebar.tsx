import {
  Calendar,
  Car,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Users,
  X,
  Zap,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/utils/cn";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  aliases?: string[];
}

const mainMenu: MenuItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Ordens de Servico", path: "/ordens-servico", icon: ClipboardList, aliases: ["/ordens"] },
  { name: "Clientes", path: "/clientes", icon: Users },
  { name: "Veiculos", path: "/veiculos", icon: Car },
  { name: "Agenda", path: "/agenda", icon: Calendar },
  { name: "Orcamentos", path: "/orcamentos", icon: ClipboardList, aliases: ["/notas"] },
  { name: "Financeiro", path: "/financeiro", icon: DollarSign },
  { name: "Estoque", path: "/estoque", icon: Package },
  { name: "Configuracoes", path: "/configuracoes", icon: Settings },
];

function isItemActive(pathname: string, item: MenuItem) {
  if (pathname === item.path) return true;
  if (pathname.startsWith(`${item.path}/`)) return true;
  if (!item.aliases?.length) return false;
  return item.aliases.some((alias) => pathname === alias || pathname.startsWith(`${alias}/`));
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, role, logout } = useAuthStore();
  const isAdmin = role === "ADMIN";
  const initials = (username ?? "admin").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <button
        type="button"
        className={cn(
          "fixed inset-0 z-30 bg-[#020716]/80 backdrop-blur-sm lg:hidden",
          isOpen ? "block" : "pointer-events-none hidden",
        )}
        onClick={onClose}
        aria-label="Fechar menu lateral"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-white/10 bg-[linear-gradient(180deg,#020a19_0%,#031230_55%,#03173d_100%)] text-white shadow-[10px_0_32px_rgba(2,8,22,0.7)] transition-transform duration-300 lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4 pt-3">
          <div className="mb-3 flex items-start justify-between px-1.5">
            <div>
              <h1 className="font-title text-3xl font-bold leading-none tracking-tight">
                Jhony<span className="text-brand-400">Car</span>
              </h1>
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-blue-200/75">
                <Zap size={11} />
                Auto eletrica
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:border-blue-300/45 hover:text-blue-100 lg:hidden"
              aria-label="Fechar menu"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="space-y-1">
            {mainMenu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={() =>
                  cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] transition",
                    isItemActive(location.pathname, item)
                      ? "bg-gradient-to-r from-blue-600/40 to-blue-500/20 text-white ring-1 ring-blue-300/25"
                      : "text-slate-200 hover:bg-white/5 hover:text-white",
                  )
                }
              >
                <item.icon size={16} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-[#0a1328]/70 p-3">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1c2f55] text-xs font-bold text-slate-100">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{username ?? "admin"}</p>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  {isAdmin ? "Administrador" : "Equipe"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-300/25 bg-blue-600/20 px-3 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/30"
            >
              <LogOut size={15} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
