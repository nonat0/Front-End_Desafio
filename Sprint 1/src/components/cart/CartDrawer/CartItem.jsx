/*
  CartItem — uma linha do carrinho dentro do CartDrawer.
  ──────────────────────────────────────────────────────

  Antes vivia inline dentro do CartDrawer.jsx. Foi extraído
  para arquivo próprio para:

    - Reduzir o tamanho do CartDrawer e separar responsabilidades
      (drawer cuida da MOLDURA, item cuida da LINHA).
    - Permitir que outras telas reutilizem a linha sem precisar
      arrastar o drawer todo (ex: futura página /carrinho dedicada).
    - Facilitar testes visuais isolados.

  Cada CartItem é responsável por:
    - Renderizar imagem, título, tamanho, preço (com/sem promo) e
      controles de quantidade.
    - Disparar o toast com ação "Desfazer" ao remover, usando
      `useLatestRef` para evitar stale closure no callback do toast.
 */

import { useCartContext } from '@/context/CartContext'
import { usePromotionsContext } from '@/context/PromotionsContext'
import { useToastContext } from '@/context/ToastContext'
import { useLatestRef } from '@/hooks/useLatestRef'
import { formatPrice, truncateText } from '@/utils/formatters'
import { UNDO_TOAST_DURATION } from '@/utils/constants'
import styles from './CartDrawer.module.css'

export function CartItem({ item }) {
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
    posição). A janela mais longa (UNDO_TOAST_DURATION) dá tempo
    de detectar o erro sem atrapalhar.
   */
  const handleRemove = () => {
    const snapshot = removeFromCart(item.cartKey)
    if (!snapshot) return

    showToast({
      message: `${truncateText(snapshot.item.title, 30)} removido do carrinho`,
      type: 'info',
      duration: UNDO_TOAST_DURATION,
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
