/*
  Barrel file dos componentes UI reutilizáveis.

  Permite ao consumidor importar várias peças do "design system"
  interno em uma única linha:
    import { Modal, Spinner, Toast, ErrorBoundary } from '@/components/ui'

  Cada componente continua co-locado com seu próprio CSS Module
  no respectivo subdiretório — esse barrel só agrupa os exports.
 */

export { Modal } from './Modal/Modal'
export { Spinner } from './Spinner/Spinner'
export { Toast, ToastContainer } from './Toast/Toast'
export { Carousel } from './Carousel/Carousel'
export { ErrorBoundary } from './ErrorBoundary/ErrorBoundary'
