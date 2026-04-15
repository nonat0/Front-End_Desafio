// ProductCard — card de produto reutilizável.
// Exibe: imagem, badge de promoção, título truncado, preço efetivo,
// rating e botão de watchlist. A compra acontece apenas na página de detalhes.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWatchlistContext } from '@/context/WatchlistContext'
import { usePromotionsContext } from '@/context/PromotionsContext'
import { useToastContext } from '@/context/ToastContext'
import { formatPrice, truncateText, formatRating } from '@/utils/formatters'
import styles from './ProductCard.module.css'

export function ProductCard({ product }) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistContext()
  const { getEffectivePrice, isPromoted, getItemDiscount } = usePromotionsContext()
  const { showToast } = useToastContext()

  const [watchPop, setWatchPop] = useState(false)

  const inWatchlist = isInWatchlist(product.id)
  const promoted    = isPromoted(product.id)
  const itemDiscount   = getItemDiscount(product.id)
  const effectivePrice = getEffectivePrice(product)

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
        <div className={styles.promoBadge}>-{itemDiscount}%</div>
      )}

      {/* Imagem */}
      <div className={styles.imageWrapper}>
        <img
          src={product.image}
          alt={product.title}
          className={styles.image}
          loading="lazy"
        />
        <button
          className={`${styles.watchBtn} ${inWatchlist ? styles.watchActive : ''} ${watchPop ? styles.pop : ''}`}
          onClick={handleToggleWatchlist}
          aria-label={inWatchlist ? 'Remover da Watchlist' : 'Adicionar à Watchlist'}
          title={inWatchlist ? 'Remover da Watchlist' : 'Adicionar à Watchlist'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={inWatchlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
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

        {/* Rodapé: apenas preço */}
        <div className={styles.footer}>
          <div className={styles.priceBlock}>
            <span className={styles.priceLabel}>Preço</span>
            {promoted && (
              <span className={styles.originalPrice}>{formatPrice(product.price)}</span>
            )}
            <span className={`${styles.price} ${promoted ? styles.pricePromo : ''}`}>
              {formatPrice(effectivePrice)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
