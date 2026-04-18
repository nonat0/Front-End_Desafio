/*
  Router — configuração central de rotas da aplicação.
  ────────────────────────────────────────────────────

  Usa createBrowserRouter do React Router v6 e aplica DOIS padrões
  importantes de performance e robustez:

  1. CODE SPLITTING via React.lazy()
     ─────────────────────────────────
     Cada página é carregada em um chunk JS separado, sob demanda.
     Antes: o bundle inicial carregava TODAS as páginas (Home,
     Detalhe, Watchlist, Admin, Black Friday) mesmo que o usuário
     só visitasse a Home — desperdício de banda e tempo até o
     primeiro paint.
     Agora: o usuário baixa apenas o JS da rota que abriu, e o
     navegador busca o restante "preguiçosamente" quando ele
     navegar. <Suspense> exibe um Spinner durante a transição.

  2. ERROR BOUNDARY no nível do layout
     ──────────────────────────────────
     Envolvemos <Outlet /> com <ErrorBoundary>, então qualquer
     exceção de render dentro de uma página é capturada e mostra
     um fallback amigável — sem derrubar a aplicação inteira (tela
     branca). Navbar/Footer continuam visíveis, e o usuário pode
     se recuperar com "Tentar novamente" ou voltar à Home.
 */

import { Suspense, lazy } from 'react'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary/ErrorBoundary'
import { Spinner } from '@/components/ui/Spinner/Spinner'

/*
  React.lazy aceita uma função que devolve a Promise do import.
  Como nossas pages exportam funções NOMEADAS (export function Home),
  precisamos mapear o named export para o `default` esperado pelo lazy:
    .then(m => ({ default: m.Home }))
  Isso evita renomear todos os arquivos só para usar export default
  (manteria os imports estáticos atuais quebrados).
 */
const Home         = lazy(() => import('@/pages/Home/Home').then((m) => ({ default: m.Home })))
const ProductDetail= lazy(() => import('@/pages/ProductDetail/ProductDetail').then((m) => ({ default: m.ProductDetail })))
const Watchlist    = lazy(() => import('@/pages/Watchlist/Watchlist').then((m) => ({ default: m.Watchlist })))
const Promotions   = lazy(() => import('@/pages/Promotions/Promotions').then((m) => ({ default: m.Promotions })))
const BlackFriday  = lazy(() => import('@/pages/BlackFriday/BlackFriday').then((m) => ({ default: m.BlackFriday })))

/*
  Wrapper de rota: aplica ErrorBoundary + Suspense em volta do Outlet.
  Mantemos o AppLayout como nó externo para que Navbar/Footer/Toasts
  continuem visíveis mesmo se a rota interna falhar ou estiver
  carregando — uma tela "vazia com layout" é muito menos assustadora
  que uma tela 100% em branco.
 */
function RouteShell() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ padding: '4rem 0', display: 'flex', justifyContent: 'center' }}><Spinner size="lg" /></div>}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  )
}

const router = createBrowserRouter([
  {
    /* Layout raiz — todas as páginas herdam Navbar + ToastContainer */
    path: '/',
    element: <AppLayout />,
    children: [
      {
        element: <RouteShell />,
        children: [
          { index: true, element: <Home /> },
          { path: 'product/:id', element: <ProductDetail /> },
          { path: 'watchlist', element: <Watchlist /> },
          { path: 'admin', element: <Promotions /> },
          { path: 'black-friday', element: <BlackFriday /> },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
