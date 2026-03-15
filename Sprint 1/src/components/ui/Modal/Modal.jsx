// Modal — popup genérico reutilizável.
// Usado para erros críticos (ex: limite de promoções atingido)
// e futuras confirmações de ações (ex: limpar carrinho, finalizar compra).
// Acessível: foco preso dentro do modal, fecha com ESC e clique no overlay.

import { useEffect } from 'react'
import styles from './Modal.module.css'

export function Modal({ isOpen, onClose, title, children }) {
  /* Fecha com tecla ESC */
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  /* Bloqueia scroll do body enquanto o modal está aberto */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
