import { Suspense, lazy } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute";

const DashboardPage = lazy(() => import("@/pages/dashboard"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ClientesPage = lazy(() => import("@/pages/clientes"));
const ClienteCentralPage = lazy(() => import("@/pages/ClienteCentralPage"));
const VeiculosPage = lazy(() => import("@/pages/veiculos"));
const OrdensServicoPage = lazy(() => import("@/pages/ordens"));
const FinanceiroPage = lazy(() => import("@/pages/financeiro"));
const AgendaPage = lazy(() => import("@/pages/agenda"));
const NotasPage = lazy(() => import("@/pages/NotasPage"));
const EstoquePage = lazy(() => import("@/pages/EstoquePage"));
const OrcamentosPage = lazy(() => import("@/pages/orcamentos"));
const ModulePlaceholderPage = lazy(() => import("@/pages/ModulePlaceholderPage"));

function Loader() {
  return (
    <div className="grid min-h-screen place-items-center bg-slatebase-950 text-slate-300">
      Carregando...
    </div>
  );
}

const withSuspense = (component: React.ReactNode) => <Suspense fallback={<Loader />}>{component}</Suspense>;

export const router = createBrowserRouter([
  {
    path: "/login",
    element: withSuspense(<LoginPage />),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: withSuspense(<DashboardPage />) },
          { path: "/clientes", element: withSuspense(<ClientesPage />) },
          { path: "/clientes/:id", element: withSuspense(<ClienteCentralPage />) },
          { path: "/veiculos", element: withSuspense(<VeiculosPage />) },
          { path: "/ordens", element: withSuspense(<OrdensServicoPage />) },
          { path: "/ordens-servico", element: withSuspense(<OrdensServicoPage />) },
          { path: "/financeiro", element: withSuspense(<FinanceiroPage />) },
          { path: "/agenda", element: withSuspense(<AgendaPage />) },
          { path: "/notas", element: withSuspense(<NotasPage />) },
          { path: "/orcamentos", element: withSuspense(<OrcamentosPage />) },
          { path: "/estoque", element: withSuspense(<EstoquePage />) },
          { path: "/configuracoes", element: withSuspense(<ModulePlaceholderPage />) },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
