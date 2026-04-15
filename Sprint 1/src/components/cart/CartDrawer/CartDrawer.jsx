// CartDrawer — painel deslizante do carrinho de compras.
// Exibe itens com controle de quantidade, preço efetivo e total.
// Fecha com ESC, clique no overlay ou no botão fechar.
// Expansível para incluir cupons, resumo de frete e checkout.

import { useEffect } from 'react'
import { useCartContext } from '@/context/CartContext'
import { usePromotionsContext } from '@/context/PromotionsContext'
import { formatPrice, truncateText } from '@/utils/formatters'
import styles from './CartDrawer.module.css'

function CartItem({ item }) {
  const { removeFromCart, updateQuantity } = useCartContext()
  const { getEffectivePrice, isPromoted } = usePromotionsContext()

  const effectivePrice = getEffectivePrice(item)
  const promoted = isPromoted(item.id)

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
        onClick={() => removeFromCart(item.cartKey)}
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
  const { items, total, clearCart } = useCartContext()

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

            {/* Footer com total */}
            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalValue}>{formatPrice(total)}</span>
              </div>
              <button className={styles.checkoutBtn}>
                Finalizar compra
              </button>
              <button className={styles.clearBtn} onClick={clearCart}>
                Limpar carrinho
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
