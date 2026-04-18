/*
  CartDrawer — painel deslizante do carrinho de compras.
  ──────────────────────────────────────────────────────

  Cuida apenas da MOLDURA do carrinho:
    - Header com título e botão fechar.
    - Lista de itens (delegando cada linha ao componente CartItem).
    - Footer com breakdown SUBTOTAL / ECONOMIA / TOTAL e ações.
    - Modal de confirmação para "Limpar carrinho".

  A lógica de cada item (quantidade, remoção com undo, preço efetivo)
  vive em CartItem.jsx — separação que facilita reuso e teste.

  Padrões de UX implementados:
    - ESC ou clique no overlay fecham o drawer.
    - Ações destrutivas e irreversíveis (limpar) passam por Modal.
    - Scroll do body é bloqueado enquanto o drawer está aberto,
      evitando "double scroll" desconfortável.
 */

import { useEffect, useState } from 'react'
import { useCartContext } from '@/context/CartContext'
import { Modal } from '@/components/ui/Modal/Modal'
import { formatPrice } from '@/utils/formatters'
import { CartItem } from './CartItem'
import styles from './CartDrawer.module.css'

export function CartDrawer({ isOpen, onClose }) {
  const { items, subtotal, savings, total, clearCart } = useCartContext()
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleClearConfirm = () => {
    clearCart()
    setConfirmClearOpen(false)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`} role="dialog" aria-label="Carrinho de compras">
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>
            Carrinho
            {items.length > 0 && <span className={styles.headerCount}>{items.length}</span>}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar carrinho">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Conteúdo */}
        {items.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🛍️</span>
            <p className={styles.emptyTitle}>Carrinho vazio</p>
            <p className={styles.emptyDesc}>Adicione produtos para começar.</p>
          </div>
        ) : (
          <>
            <div className={styles.itemsList}>
              {items.map((item) => <CartItem key={item.cartKey} item={item} />)}
            </div>

            {/*
              Footer com resumo financeiro.

              Breakdown do preço:
                subtotal → soma dos preços originais
                economia → quanto o usuário POUPOU com promoções
                total    → o que ele REALMENTE vai pagar

              Exibir "economia" destacada reforça o valor percebido
              das promoções — padrão comum em e-commerce.
            */}
            <div className={styles.footer}>
              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Subtotal</span>
                  <span className={styles.summaryValue}>{formatPrice(subtotal)}</span>
                </div>
                {savings > 0 && (
                  <div className={`${styles.summaryRow} ${styles.summarySavings}`}>
                    <span className={styles.summaryLabel}>Economia</span>
                    <span className={styles.summaryValue}>− {formatPrice(savings)}</span>
                  </div>
                )}
              </div>

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalValue}>{formatPrice(total)}</span>
              </div>

              <button className={styles.checkoutBtn}>
                Finalizar compra
              </button>
              <button
                className={styles.clearBtn}
                onClick={() => setConfirmClearOpen(true)}
              >
                Limpar carrinho
              </button>
            </div>
          </>
        )}
      </div>

      {/*
        Modal de confirmação para clearCart.
        Renderizado fora do drawer para não herdar o transform deslizante.
      */}
      <Modal
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        title="Limpar carrinho?"
      >
        <p className={styles.confirmText}>
          Todos os itens serão removidos. Essa ação não pode ser desfeita.
        </p>
        <div className={styles.confirmActions}>
          <button
            type="button"
            className={styles.confirmCancel}
            onClick={() => setConfirmClearOpen(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.confirmDanger}
            onClick={handleClearConfirm}
          >
            Sim, limpar
          </button>
        </div>
      </Modal>
    </>
  )
}
