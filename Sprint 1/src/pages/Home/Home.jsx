// Página Home — página principal da loja.
// Layout: carousel hero → cabeçalho → barra de filtros → grid de produtos.
// O grid ocupa 100% da largura — filtros ficam em faixa horizontal acima.

import { useMemo, useState } from 'react'
import { Carousel } from '@/components/ui/Carousel/Carousel'
import { ProductFilter } from '@/components/product/ProductFilter/ProductFilter'
import { ProductGrid } from '@/components/product/ProductGrid/ProductGrid'
import { useProducts } from '@/hooks/useProducts'
import { usePromotionsContext } from '@/context/PromotionsContext'
import { useSearchContext } from '@/context/SearchContext'
import { useDebounce } from '@/hooks/useDebounce'
import styles from './Home.module.css'

export function Home() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState('default')

  // Lê a busca do contexto global (escrito pela Navbar em tempo real)
  const { searchQuery } = useSearchContext()
  // Debounce local evita filtrar a cada tecla
  const debouncedQuery = useDebounce(searchQuery, 300)

  const { products, categories, loading, error } = useProducts('all')
  const { getEffectivePrice } = usePromotionsContext()

  const filteredProducts = useMemo(() => {
    let list = [...products]

    if (activeCategory !== 'all') {
      list = list.filter((p) => p.categorySlug === activeCategory)
    }

    // Filtra pelo termo debounced — quando vazio exibe tudo
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase()
      list = list.filter((p) => p.title.toLowerCase().includes(q))
    }

    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b))
        break
      case 'price-desc':
        list.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a))
        break
      case 'rating':
        list.sort((a, b) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0))
        break
      case 'name':
        list.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        break
    }

    return list
  }, [products, activeCategory, debouncedQuery, sortBy, getEffectivePrice])

  return (
    <main className={styles.main}>
      <div className="container">

        {/* Hero carousel */}
        <section className={styles.hero}>
          <Carousel />
        </section>

        {/* Cabeçalho */}
        <div className={styles.shopHeader}>
          <div>
            <h2 className={styles.shopTitle}>
              {debouncedQuery.trim() ? `Resultados para "${debouncedQuery}"` : 'Produtos'}
            </h2>
            <p className={styles.shopCount}>
              {loading ? 'Carregando…' : `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Filtros em faixa + grid em largura total */}
        <div className={styles.shopSection}>
          <ProductFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
          <ProductGrid products={filteredProducts} loading={loading} error={error} />
        </div>

      </div>
    </main>
  )
}
