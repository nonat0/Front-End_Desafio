// ProductCard — card de produto reutilizável.
// Exibe: imagem, badge de promoção, título truncado, preço efetivo,
// rating, botão de adicionar ao carrinho e botão de watchlist.
// Usa `getEffectivePrice` do PromotionsContext para exibir preço correto globalmente.
// Os botões disparam toasts de feedback visual via ToastContext.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCartContext } from '@/context/CartContext'
import { useWatchlistContext } from '@/context/WatchlistContext'
import { usePromotionsContext } from '@/context/PromotionsContext'
import { useToastContext } from '@/context/ToastContext'
import { formatPrice, truncateText, formatRating } from '@/utils/formatters'
import styles from './ProductCard.module.css'

export function ProductCard({ product }) {
  const { addToCart, isInCart } = useCartContext()
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistContext()
  const { getEffectivePrice, isPromoted, discount } = usePromotionsContext()
  const { showToast } = useToastContext()

  /* Controla animação de feedback no botão do carrinho */
  const [cartPop, setCartPop] = useState(false)
  const [watchPop, setWatchPop] = useState(false)

  const inCart      = isInCart(product.id)
  const inWatchlist = isInWatchlist(product.id)
  const promoted    = isPromoted(product.id)
  const effectivePrice = getEffectivePrice(product)

  const handleAddToCart = (e) => {
    e.preventDefault()
    addToCart(product)
    showToast(`"${truncateText(product.title, 30)}" adicionado ao carrinho!`, 'success')
    /* Micro-animação no botão */
    setCartPop(true)
    setTimeout(() => setCartPop(false), 400)
  }

  const handleToggleWatchlist = (e) => {
    e.preventDefault()
    if (inWatchlist) {
      removeFromWatchlist(product.id)
      showToast('Removido da Watchlist.', 'info')
    } else {
      addToWatchlist(product)
      showToast(`"${truncateText(product.title, 30)}" adicionado à Watchlist!`, 'success')
    }
    setWatchPop(true)
    setTimeout(() => setWatchPop(false), 400)
  }

  return (
    <Link to={`/product/${product.id}`} className={styles.card}>
      {/* Badge de promoção */}
      {promoted && (
        <div className={styles.promoBadge}>-{discount}%</div>
      )}

      {/* Imagem */}
      <div className={styles.imageWrapper}>
        <img
          src={product.image}
          alt={product.title}
          className={styles.image}
          loading="lazy"
        />
      </div>

      {/* Informações */}
      <div className={styles.info}>
        <span className={styles.category}>{product.category}</span>
        <h3 className={styles.title}>{truncateText(product.title, 55)}</h3>

        {/* Rating */}
        <div className={styles.rating}>
          <span className={styles.star}>★</span>
          <span className={styles.ratingValue}>{formatRating(product.rating?.rate)}</span>
          <span className={styles.ratingCount}>({product.rating?.count})</span>
        </div>

        {/* Preço */}
        <div className={styles.priceRow}>
          {promoted && (
            <span className={styles.originalPrice}>{formatPrice(product.price)}</span>
          )}
          <span className={`${styles.price} ${promoted ? styles.pricePromo : ''}`}>
            {formatPrice(effectivePrice)}
          </span>
        </div>
      </div>

      {/* Ações */}
      <div className={styles.actions}>
        {/* Watchlist */}
        <button
          className={`${styles.watchBtn} ${inWatchlist ? styles.watchActive : ''} ${watchPop ? styles.pop : ''}`}
          onClick={handleToggleWatchlist}
          aria-label={inWatchlist ? 'Remover da Watchlist' : 'Adicionar à Watchlist'}
          title={inWatchlist ? 'Remover da Watchlist' : 'Adicionar à Watchlist'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={inWatchlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* Adicionar ao carrinho */}
        <button
          className={`${styles.cartBtn} ${inCart ? styles.cartActive : ''} ${cartPop ? styles.pop : ''}`}
          onClick={handleAddToCart}
          aria-label="Adicionar ao carrinho"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>
          </svg>
          {inCart ? 'No carrinho' : 'Adicionar'}
        </button>
      </div>
    </Link>
  )
}
