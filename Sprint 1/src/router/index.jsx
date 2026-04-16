// Router — configuração central de rotas da aplicação.
// Usa createBrowserRouter do React Router v6 para suporte completo a:
//   - Loaders/actions futuros (integração com backend)
//   - Error boundaries por rota
//   - Code splitting via lazy() quando o bundle crescer

// Adicionar novas rotas aqui (ex: /checkout, /profile, /admin).

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Home } from '@/pages/Home/Home'
import { ProductDetail } from '@/pages/ProductDetail/ProductDetail'
import { Watchlist } from '@/pages/Watchlist/Watchlist'
import { Promotions } from '@/pages/Promotions/Promotions'
import { BlackFriday } from '@/pages/BlackFriday/BlackFriday'

const router = createBrowserRouter([
  {
    /* Layout raiz — todas as páginas herdam Navbar + ToastContainer */
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'product/:id', element: <ProductDetail /> },
      { path: 'watchlist', element: <Watchlist /> },
      { path: 'admin', element: <Promotions /> },
      { path: 'black-friday', element: <BlackFriday /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
