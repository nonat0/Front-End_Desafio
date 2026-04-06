// AppLayout — estrutura raiz de layout da aplicação.
// Monta: Navbar no topo, conteúdo das páginas (via <Outlet />)
// e o ToastContainer global no canto inferior direito.
// Qualquer elemento de layout global (ex: footer, chat de suporte)
// deve ser adicionado aqui.

import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar/Navbar'
import { Footer } from '@/components/layout/Footer/Footer'
import { ToastContainer } from '@/components/ui/Toast/Toast'
import { useToastContext } from '@/context/ToastContext'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { toasts, removeToast } = useToastContext()

  return (
    <div className={styles.app}>
      <Navbar />
      <div className={styles.content}>
        <Outlet />
      </div>
      <Footer />
      {/* Notificações globais — montado uma única vez aqui */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
