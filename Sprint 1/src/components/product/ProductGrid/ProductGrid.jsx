// ProductGrid — grid responsivo de produtos.
// Recebe produtos já filtrados como prop para manter responsabilidade única.
// Exibe skeletons durante loading para UX fluida.
// Mensagem de estado vazio quando nenhum produto corresponde ao filtro.

import { ProductCard } from '../ProductCard/ProductCard'
import styles from './ProductGrid.module.css'

/** Skeleton de um card durante loading */
function CardSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={`skeleton ${styles.skelImage}`} />
      <div className={styles.skelBody}>
        <div className={`skeleton ${styles.skelLine}`} style={{ width: '40%' }} />
        <div className={`skeleton ${styles.skelLine}`} style={{ width: '90%' }} />
        <div className={`skeleton ${styles.skelLine}`} style={{ width: '70%' }} />
        <div className={`skeleton ${styles.skelLine}`} style={{ width: '30%', height: '1.5rem' }} />
      </div>
    </div>
  )
}

export function ProductGrid({ products, loading, error }) {
  if (error) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>⚠️</span>
        <p className={styles.emptyTitle}>Erro ao carregar produtos</p>
        <p className={styles.emptyDesc}>{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🔍</span>
        <p className={styles.emptyTitle}>Nenhum produto encontrado</p>
        <p className={styles.emptyDesc}>Tente ajustar os filtros ou a busca.</p>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
