// Página Watchlist — lista de produtos salvos pelo usuário.
// Exibe os produtos favoritados com opção de adicionar ao carrinho diretamente,
// remover da watchlist e acessar detalhes.
// Estado gerenciado pelo WatchlistContext com persistência no localStorage.
// Expansível para: compartilhamento de lista, notificações de queda de preço.

import { useWatchlistContext } from '@/context/WatchlistContext'
import { useCartContext } from '@/context/CartContext'
import { usePromotionsContext } from '@/context/PromotionsContext'
import { useToastContext } from '@/context/ToastContext'
import { formatPrice, truncateText, formatRating } from '@/utils/formatters'
import { Link } from 'react-router-dom'
import styles from './Watchlist.module.css'

function WatchlistCard({ product }) {
  const { removeFromWatchlist } = useWatchlistContext()
  const { addToCart, isInCart } = useCartContext()
  const { getEffectivePrice, isPromoted, discount } = usePromotionsContext()
  const { showToast } = useToastContext()

  const inCart      = isInCart(product.id)
  const promoted    = isPromoted(product.id)
  const effectivePrice = getEffectivePrice(product)

  const handleAddToCart = () => {
    addToCart(product)
    showToast(`"${truncateText(product.title, 28)}" adicionado ao carrinho!`, 'success')
  }

  const handleRemove = () => {
    removeFromWatchlist(product.id)
    showToast('Removido da Watchlist.', 'info')
  }

  return (
    <div className={styles.card}>
      {/* Badge promoção */}
      {promoted && <div className={styles.promoBadge}>-{discount}%</div>}

      {/* Botão remover */}
      <button
        className={styles.removeBtn}
        onClick={handleRemove}
        aria-label="Remover da Watchlist"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>

      {/* Imagem */}
      <Link to={`/product/${product.id}`} className={styles.imageLink}>
        <div className={styles.imageWrapper}>
          <img src={product.image} alt={product.title} className={styles.image} loading="lazy" />
        </div>
      </Link>

      {/* Info */}
      <div className={styles.info}>
        <span className={styles.category}>{product.category}</span>
        <Link to={`/product/${product.id}`} className={styles.titleLink}>
          <h3 className={styles.title}>{truncateText(product.title, 55)}</h3>
        </Link>

        <div className={styles.rating}>
          <span className={styles.star}>★</span>
          <span>{formatRating(product.rating?.rate)}</span>
          <span className={styles.ratingCount}>({product.rating?.count})</span>
        </div>

        <div className={styles.priceRow}>
          {promoted && (
            <span className={styles.originalPrice}>{formatPrice(product.price)}</span>
          )}
          <span className={`${styles.price} ${promoted ? styles.pricePromo : ''}`}>
            {formatPrice(effectivePrice)}
          </span>
        </div>

        <button
          className={`${styles.cartBtn} ${inCart ? styles.cartActive : ''}`}
          onClick={handleAddToCart}
        >
          {inCart ? '✓ No carrinho' : 'Adicionar ao carrinho'}
        </button>
      </div>
    </div>
  )
}

export function Watchlist() {
  const { items, clearWatchlist } = useWatchlistContext()

  return (
    <main className={styles.main}>
      <div className="container">
        {/* Cabeçalho */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Watchlist</h1>
            <p className={styles.pageDesc}>
              {items.length > 0
                ? `${items.length} produto${items.length !== 1 ? 's' : ''} salvo${items.length !== 1 ? 's' : ''}`
                : 'Sua lista de desejos está vazia'}
            </p>
          </div>
          {items.length > 0 && (
            <button className={styles.clearBtn} onClick={clearWatchlist}>
              Limpar tudo
            </button>
          )}
        </div>

        {/* Grid ou estado vazio */}
        {items.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🤍</span>
            <p className={styles.emptyTitle}>Nenhum produto salvo ainda</p>
            <p className={styles.emptyDesc}>
              Clique no ícone de coração nos produtos para adicioná-los aqui.
            </p>
            <Link to="/" className={styles.shopLink}>Explorar produtos</Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map((product) => (
              <WatchlistCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
