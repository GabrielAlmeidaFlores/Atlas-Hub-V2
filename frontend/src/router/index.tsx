import React, { type ReactNode } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

const LandingPage          = React.lazy(() => import("@/features/landing/page"));
const LoginPage            = React.lazy(() => import("@/features/auth/login/page"));
const CadastroPage         = React.lazy(() => import("@/features/auth/cadastro/page"));
const ConfirmarEmailPage   = React.lazy(() => import("@/features/auth/confirmar-email/page"));
const EsqueciSenhaPage     = React.lazy(() => import("@/features/auth/esqueci-senha/page"));
const RedefinirSenhaPage   = React.lazy(() => import("@/features/auth/redefinir-senha/page"));

const IncorporadoraLayout          = React.lazy(() => import("@/app/layouts/incorporadora-layout"));
const IncorporadoraDashboardPage   = React.lazy(() => import("@/features/incorporadora/dashboard/page"));
const IncorporadoraProjetoNovoPage = React.lazy(() => import("@/features/incorporadora/projetos/novo/page"));
const IncorporadoraProjetoDetalhePage = React.lazy(() => import("@/features/incorporadora/projetos/detalhe/page"));
const IncorporadoraPerfilPage      = React.lazy(() => import("@/features/incorporadora/perfil/page"));
const IncorporadoraNotificacoesPage = React.lazy(() => import("@/features/incorporadora/notificacoes/page"));

const AdminLayout                  = React.lazy(() => import("@/app/layouts/admin-layout"));
const AdminDashboardPage           = React.lazy(() => import("@/features/admin/dashboard/page"));
const AdminCuradoriaFilaPage       = React.lazy(() => import("@/features/admin/curadoria/fila/page"));
const AdminCuradoriaDetalhePage    = React.lazy(() => import("@/features/admin/curadoria/detalhe/page"));
const AdminHistoricoPage           = React.lazy(() => import("@/features/admin/historico/page"));
const AdminIncorporadorasListaPage = React.lazy(() => import("@/features/admin/incorporadoras/lista/page"));
const AdminIncorporadoraDetalhePage = React.lazy(() => import("@/features/admin/incorporadoras/detalhe/page"));

function Spinner(): ReactNode {
  return (
    <div className="flex h-screen items-center justify-center bg-[#F4F6FA]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy/20 border-t-navy" />
    </div>
  );
}

function withSuspense(component: ReactNode): ReactNode {
  return <React.Suspense fallback={<Spinner />}>{component}</React.Suspense>;
}

function RequireIncorporadora({ children }: { readonly children: ReactNode }): ReactNode {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.perfil !== "INCORPORADORA") return <Navigate to="/admin" replace />;
  return children;
}

function RequireAdmin({ children }: { readonly children: ReactNode }): ReactNode {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.perfil === "INCORPORADORA") return <Navigate to="/dashboard" replace />;
  return children;
}

const router = createBrowserRouter([
  /* ── Pública ─────────────────────────────────────────── */
  { path: "/",                  element: withSuspense(<LandingPage />) },
  { path: "/login",             element: withSuspense(<LoginPage />) },
  { path: "/cadastro",          element: withSuspense(<CadastroPage />) },
  { path: "/confirmar-email",   element: withSuspense(<ConfirmarEmailPage />) },
  { path: "/esqueci-senha",     element: withSuspense(<EsqueciSenhaPage />) },
  { path: "/redefinir-senha",   element: withSuspense(<RedefinirSenhaPage />) },

  /* ── Portal Incorporadora ────────────────────────────── */
  {
    element: withSuspense(
      <RequireIncorporadora>
        {withSuspense(<IncorporadoraLayout />)}
      </RequireIncorporadora>,
    ),
    children: [
      { path: "/dashboard",        element: withSuspense(<IncorporadoraDashboardPage />) },
      { path: "/projetos/novo",    element: withSuspense(<IncorporadoraProjetoNovoPage />) },
      { path: "/projetos/:id",     element: withSuspense(<IncorporadoraProjetoDetalhePage />) },
      { path: "/perfil",           element: withSuspense(<IncorporadoraPerfilPage />) },
      { path: "/notificacoes",     element: withSuspense(<IncorporadoraNotificacoesPage />) },
    ],
  },

  /* ── Painel Admin ────────────────────────────────────── */
  {
    path: "/admin",
    element: withSuspense(
      <RequireAdmin>
        {withSuspense(<AdminLayout />)}
      </RequireAdmin>,
    ),
    children: [
      { index: true,                 element: withSuspense(<AdminDashboardPage />) },
      { path: "curadoria",           element: withSuspense(<AdminCuradoriaFilaPage />) },
      { path: "curadoria/:id",       element: withSuspense(<AdminCuradoriaDetalhePage />) },
      { path: "historico",           element: withSuspense(<AdminHistoricoPage />) },
      { path: "incorporadoras",      element: withSuspense(<AdminIncorporadorasListaPage />) },
      { path: "incorporadoras/:id",  element: withSuspense(<AdminIncorporadoraDetalhePage />) },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);

export function AppRouter(): ReactNode {
  return <RouterProvider router={router} />;
}
