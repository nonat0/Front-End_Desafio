/*
  CartDrawer — painel deslizante do carrinho de compras.
  ──────────────────────────────────────────────────────

  Exibe os itens com controle de quantidade, preço efetivo (com
  eventuais descontos) e um resumo financeiro separado em
  SUBTOTAL / ECONOMIA / TOTAL.

  Padrões de UX implementados:

    - ESC ou clique no overlay fecham o drawer.
    - Remover um item exibe um toast "Desfazer" que permite
      restaurar o item na mesma posição — padrão comum em apps
      modernos para compensar cliques acidentais sem precisar
      de um diálogo de confirmação a cada remoção.
    - "Limpar carrinho" abre um Modal de confirmação antes de
      apagar tudo — ação irreversível e potencialmente destrutiva
      merece uma segunda chance explícita.

  Expansível para incluir cupons, resumo de frete e checkout.
 */

import { useEffect, useRef, useState } from 'react'
import { useCartContext } from '@/context/CartContext'
import { usePromotionsContext } from '@/context/PromotionsContext'
import { useToastContext } from '@/context/ToastContext'
import { Modal } from '@/components/ui/Modal/Modal'
import { formatPrice, truncateText } from '@/utils/formatters'
import styles from './CartDrawer.module.css'

/*
  Hook auxiliar — mantém uma ref sempre apontando para o valor
  mais recente do parâmetro. Útil em callbacks assíncronos (como
  o `onClick` do toast, que executa muito depois de criado) para
  evitar "stale closures" — situação em que o callback captura
  uma versão VELHA de uma função/valor e age em dados desatualizados.
 */
function useLatestRef(value) {
  const ref = useRef(value)
  ref.current = value
  return ref
}

function CartItem({ item }) {
  const { removeFromCart, restoreItem, updateQuantity } = useCartContext()
  const { getEffectivePrice, isPromoted } = usePromotionsContext()
  const { showToast } = useToastContext()

  const effectivePrice = getEffectivePrice(item)
  const promoted = isPromoted(item.id)

  // Ref para evitar closure estagnada ao usar `restoreItem` dentro
  // do callback do toast (que pode disparar segundos depois).
  const restoreRef = useLatestRef(restoreItem)

  /*
    Remove o item + oferece desfazer.

    `removeFromCart` devolve `{ item, index }` com os dados
    necessários para restauração. Passamos isso direto para o
    `restoreItem` no handler do toast — se o usuário clicar em
    "Desfazer", a linha volta intacta (mesma quantidade, mesma
    posição). Janela de 5s é longa o suficiente para detectar o
    erro mas curta o suficiente para não atrapalhar.
   */
  const handleRemove = () => {
    const snapshot = removeFromCart(item.cartKey)
    if (!snapshot) return

    showToast({
      message: `${truncateText(snapshot.item.title, 30)} removido do carrinho`,
      type: 'info',
      duration: 5000,
      action: {
        label: 'Desfazer',
        onClick: () => restoreRef.current?.(snapshot),
      },
    })
  }

  return (
    <div className={styles.item}>
      <div className={styles.itemImage}>
        <img src={item.image} alt={item.title} />
      </div>
      <div className={styles.itemInfo}>
        <p className={styles.itemTitle}>{truncateText(item.title, 40)}</p>
        {item.size && <span className={styles.itemSize}>{item.size}</span>}
        <div className={styles.itemPriceRow}>
          {promoted && (
            <span className={styles.itemOriginalPrice}>{formatPrice(item.price)}</span>
          )}
          <span className={`${styles.itemPrice} ${promoted ? styles.itemPromoPrice : ''}`}>
            {formatPrice(effectivePrice)}
          </span>
        </div>
        <div className={styles.itemControls}>
          <button
            className={styles.qtyBtn}
            onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
            disabled={item.quantity <= 1}
            aria-label="Diminuir quantidade"
          >−</button>
          <span className={styles.qty}>{item.quantity}</span>
          <button
            className={styles.qtyBtn}
            onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
            aria-label="Aumentar quantidade"
          >+</button>
        </div>
      </div>
      <button
        className={styles.removeBtn}
        onClick={handleRemove}
        aria-label="Remover item"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}

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
              das promoções — padrão comum em e-commerce para
              converter a percepção de desconto em satisfação.
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

        Renderizado FORA do drawer para não herdar o transform
        deslizante. Como o Modal é `position: fixed`, fica
        corretamente sobreposto a tudo — inclusive ao drawer.
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
