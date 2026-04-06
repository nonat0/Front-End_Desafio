import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '@/hooks/useProducts'
import { useDebounce } from '@/hooks/useDebounce'
import { formatPrice } from '@/utils/formatters'
import styles from './SearchPopup.module.css'

export function SearchPopup({ query, onClose }) {
  const { products } = useProducts('all')
  const debouncedQuery = useDebounce(query, 300)
  const navigate = useNavigate()

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return []
    const q = debouncedQuery.toLowerCase()
    return products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 6)
  }, [products, debouncedQuery])

  if (!debouncedQuery.trim()) return null

  const handleSelect = (product) => {
    navigate(`/product/${product.id}`)
    onClose()
  }

  return (
    <div className={styles.popup} role="listbox">
      {results.length === 0 ? (
        <p className={styles.empty}>Nenhum produto encontrado</p>
      ) : (
        <ul className={styles.list}>
          {results.map((product) => (
            <li key={product.id} role="option">
              <button
                className={styles.item}
                onMouseDown={(e) => e.preventDefault()} // evita blur antes do click
                onClick={() => handleSelect(product)}
              >
                <div className={styles.imgWrap}>
                  <img src={product.image} alt={product.title} className={styles.img} />
                </div>
                <div className={styles.info}>
                  <span className={styles.title}>{product.title}</span>
                  <span className={styles.price}>{formatPrice(product.price)}</span>
                </div>
                <svg className={styles.arrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
