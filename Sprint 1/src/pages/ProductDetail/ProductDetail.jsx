// Página ProductDetail — exibe informações completas de um produto.
// Busca o produto pelo ID da URL usando useProductDetail.
// Usa getEffectivePrice para exibir preço correto (com ou sem promoção).
// Contém botões de carrinho e watchlist com feedbacks visuais via toast.
// Expansível para: galeria de imagens, comentários, produtos relacionados, rating por usuário.

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProductDetail } from '@/hooks/useProductDetail'
import { useCartContext } from '@/context/CartContext'
import { useWatchlistContext } from '@/context/WatchlistContext'
import { usePromotionsContext } from '@/context/PromotionsContext'
import { useToastContext } from '@/context/ToastContext'
import { formatPrice, formatRating, capitalize } from '@/utils/formatters'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import styles from './ProductDetail.module.css'

export function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { product, loading, error } = useProductDetail(id)

  const { addToCart, isInCart } = useCartContext()
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistContext()
  const { getEffectivePrice, isPromoted, discount } = usePromotionsContext()
  const { showToast } = useToastContext()

  const [cartPop, setCartPop] = useState(false)

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className={styles.errorWrapper}>
        <span>⚠️</span>
        <p>{error || 'Produto não encontrado.'}</p>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>Voltar</button>
      </div>
    )
  }

  const inCart      = isInCart(product.id)
  const inWatchlist = isInWatchlist(product.id)
  const promoted    = isPromoted(product.id)
  const effectivePrice = getEffectivePrice(product)

  const handleAddToCart = () => {
    addToCart(product)
    showToast('Adicionado ao carrinho!', 'success')
    setCartPop(true)
    setTimeout(() => setCartPop(false), 400)
  }

  const handleToggleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(product.id)
      showToast('Removido da Watchlist.', 'info')
    } else {
      addToWatchlist(product)
      showToast('Adicionado à Watchlist!', 'success')
    }
  }

  /* Número de estrelas cheias para o rating visual */
  const stars = Math.round(product.rating?.rate ?? 0)

  return (
    <main className={styles.main}>
      <div className="container">
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <button onClick={() => navigate('/')} className={styles.breadLink}>Loja</button>
          <span className={styles.breadSep}>›</span>
          <span className={styles.breadCurrent}>{capitalize(product.category)}</span>
        </nav>

        <div className={styles.layout}>
          {/* Imagem */}
          <div className={styles.imageSection}>
            {promoted && (
              <div className={styles.promoBadge}>-{discount}% OFF</div>
            )}
            <div className={styles.imageWrapper}>
              <img src={product.image} alt={product.title} className={styles.image} />
            </div>
          </div>

          {/* Informações */}
          <div className={styles.infoSection}>
            <span className={styles.category}>{capitalize(product.category)}</span>
            <h1 className={styles.title}>{product.title}</h1>

            {/* Rating */}
            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < stars ? styles.starFilled : styles.starEmpty}>★</span>
                ))}
              </div>
              <span className={styles.ratingValue}>{formatRating(product.rating?.rate)}</span>
              <span className={styles.ratingCount}>({product.rating?.count} avaliações)</span>
            </div>

            {/* Preço */}
            <div className={styles.priceBlock}>
              {promoted && (
                <div className={styles.promoInfo}>
                  <span className={styles.originalPrice}>{formatPrice(product.price)}</span>
                  <span className={styles.discountBadge}>-{discount}%</span>
                </div>
              )}
              <span className={`${styles.price} ${promoted ? styles.pricePromo : ''}`}>
                {formatPrice(effectivePrice)}
              </span>
              {promoted && (
                <p className={styles.savingText}>
                  Economia de {formatPrice(product.price - effectivePrice)}
                </p>
              )}
            </div>

            {/* Descrição */}
            <p className={styles.description}>{product.description}</p>

            {/* Ações */}
            <div className={styles.actions}>
              <button
                className={`${styles.cartBtn} ${inCart ? styles.cartActive : ''} ${cartPop ? styles.pop : ''}`}
                onClick={handleAddToCart}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>
                </svg>
                {inCart ? 'No carrinho' : 'Adicionar ao carrinho'}
              </button>

              <button
                className={`${styles.watchBtn} ${inWatchlist ? styles.watchActive : ''}`}
                onClick={handleToggleWatchlist}
                aria-label={inWatchlist ? 'Remover da Watchlist' : 'Adicionar à Watchlist'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={inWatchlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {inWatchlist ? 'Na Watchlist' : 'Watchlist'}
              </button>
            </div>

            {/* Info extra — expansível para mais detalhes */}
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Categoria</span>
                <span className={styles.metaValue}>{capitalize(product.category)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Avaliação</span>
                <span className={styles.metaValue}>{formatRating(product.rating?.rate)} / 5</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Código</span>
                <span className={styles.metaValue}>#{String(product.id).padStart(4, '0')}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Disponibilidade</span>
                <span className={`${styles.metaValue} ${styles.inStock}`}>Em estoque</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
