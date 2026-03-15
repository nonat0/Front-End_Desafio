// Página Promotions — painel de gerenciamento de promoções.
// Funcionalidades:
//   - Grid de todos os produtos filtrável por nome (busca com debounce) e categoria
//   - Seleção de até MAX_PROMO_ITEMS produtos com borda verde de feedback
//   - Campo de % de desconto aplicado globalmente via PromotionsContext
//   - Modal de erro exibido na posição atual do scroll ao tentar selecionar mais de 3
//   - Produtos selecionados alimentam o carousel da Home automaticamente
//   - Ao remover da promoção, o preço volta ao valor original da API

// Nota de arquitetura:
//   O estado de seleção é controlado inteiramente pelo PromotionsContext,
//   garantindo que qualquer mudança aqui reflita globalmente na loja.

import { useMemo, useState } from 'react'
import { usePromotionsContext } from '@/context/PromotionsContext'
import { useProducts } from '@/hooks/useProducts'
import { useDebounce } from '@/hooks/useDebounce'
import { Modal } from '@/components/ui/Modal/Modal'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { formatPrice, applyDiscount, truncateText, capitalize } from '@/utils/formatters'
import { MAX_PROMO_ITEMS } from '@/utils/constants'
import styles from './Promotions.module.css'

/** Card individual de produto na grade de promoções */
function PromoProductCard({ product, isSelected, onToggle, discount }) {
  const effectivePrice = isSelected ? applyDiscount(product.price, discount) : product.price

  return (
    <button
      className={`${styles.promoCard} ${isSelected ? styles.promoCardSelected : ''}`}
      onClick={() => onToggle(product)}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Remover' : 'Selecionar'} ${product.title}`}
    >
      {/* Ícone de check quando selecionado */}
      <div className={`${styles.checkIcon} ${isSelected ? styles.checkVisible : ''}`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </div>

      {/* Imagem */}
      <div className={styles.cardImage}>
        <img src={product.image} alt={product.title} loading="lazy" />
      </div>

      {/* Info */}
      <div className={styles.cardInfo}>
        <span className={styles.cardCategory}>{capitalize(product.category)}</span>
        <p className={styles.cardTitle}>{truncateText(product.title, 48)}</p>
        <div className={styles.cardPriceRow}>
          {isSelected && (
            <span className={styles.cardOriginalPrice}>{formatPrice(product.price)}</span>
          )}
          <span className={`${styles.cardPrice} ${isSelected ? styles.cardPricePromo : ''}`}>
            {formatPrice(effectivePrice)}
          </span>
          {isSelected && discount > 0 && (
            <span className={styles.cardDiscountBadge}>-{discount}%</span>
          )}
        </div>
      </div>
    </button>
  )
}

export function Promotions() {
  const {
    promotedItems,
    discount,
    isPromoted,
    addPromoItem,
    removePromoItem,
    setDiscount,
    clearPromos,
  } = usePromotionsContext()

  const { products, categories, loading } = useProducts('all')

  /* Busca local com debounce */
  const [searchInput, setSearchInput]       = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const debouncedSearch = useDebounce(searchInput, 300)

  /* Modal de erro para limite de promoções atingido */
  const [errorModalOpen, setErrorModalOpen] = useState(false)

  /**
   * Alterna a seleção de um produto na lista de promoções.
   * Se o limite MAX_PROMO_ITEMS for atingido, exibe o modal de erro.
   */
  const handleToggle = (product) => {
    if (isPromoted(product.id)) {
      removePromoItem(product.id)
    } else {
      if (promotedItems.length >= MAX_PROMO_ITEMS) {
        setErrorModalOpen(true)
        return
      }
      addPromoItem(product)
    }
  }

  /* Filtro aplicado localmente — busca por nome e categoria */
  const filteredProducts = useMemo(() => {
    let list = [...products]
    if (filterCategory !== 'all') {
      list = list.filter((p) => p.category === filterCategory)
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter((p) => p.title.toLowerCase().includes(q))
    }
    return list
  }, [products, filterCategory, debouncedSearch])

  return (
    <main className={styles.main}>
      <div className="container">

        {/* ─── Cabeçalho ─── */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Promoções</h1>
            <p className={styles.pageDesc}>
              Selecione até {MAX_PROMO_ITEMS} produtos para exibir no carousel e aplicar desconto global.
            </p>
          </div>
          {promotedItems.length > 0 && (
            <button className={styles.clearBtn} onClick={clearPromos}>
              Limpar seleção
            </button>
          )}
        </div>

        {/* ─── Painel de configuração ─── */}
        <div className={styles.configPanel}>
          {/* Contador de selecionados */}
          <div className={styles.selectionInfo}>
            <div className={styles.selectionDots}>
              {Array.from({ length: MAX_PROMO_ITEMS }).map((_, i) => (
                <span
                  key={i}
                  className={`${styles.selectionDot} ${i < promotedItems.length ? styles.selectionDotActive : ''}`}
                />
              ))}
            </div>
            <span className={styles.selectionText}>
              <strong>{promotedItems.length}</strong> de {MAX_PROMO_ITEMS} produtos selecionados
            </span>
          </div>

          {/* Campo de desconto */}
          <div className={styles.discountControl}>
            <label htmlFor="discount-input" className={styles.discountLabel}>
              Desconto aplicado
            </label>
            <div className={styles.discountInputWrapper}>
              <input
                id="discount-input"
                type="number"
                min="1"
                max="99"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className={styles.discountInput}
                aria-label="Percentual de desconto"
              />
              <span className={styles.discountSymbol}>%</span>
            </div>
            {promotedItems.length > 0 && (
              <p className={styles.discountHint}>
                Aplicado a {promotedItems.length} produto{promotedItems.length !== 1 ? 's' : ''} no carousel e na loja
              </p>
            )}
          </div>
        </div>

        {/* ─── Filtros ─── */}
        <div className={styles.filters}>
          <input
            type="search"
            placeholder="Buscar produto por nome…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.searchInput}
            aria-label="Buscar produto"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={styles.categorySelect}
            aria-label="Filtrar por categoria"
          >
            <option value="all">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{capitalize(cat)}</option>
            ))}
          </select>
        </div>

        {/* ─── Grid de produtos ─── */}
        {loading ? (
          <div className={styles.loadingWrapper}>
            <Spinner size="lg" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={styles.empty}>
            <span>🔍</span>
            <p>Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredProducts.map((product) => (
              <PromoProductCard
                key={product.id}
                product={product}
                isSelected={isPromoted(product.id)}
                onToggle={handleToggle}
                discount={discount}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Modal de erro — limite atingido ─── */}
      <Modal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Limite atingido"
      >
        <div className={styles.modalContent}>
          <div className={styles.modalIcon}>⚠️</div>
          <p className={styles.modalText}>
            Você já selecionou o máximo de <strong>{MAX_PROMO_ITEMS} produtos</strong> em promoção simultaneamente.
          </p>
          <p className={styles.modalHint}>
            Remova um produto selecionado antes de adicionar outro.
          </p>
          <button
            className={styles.modalCloseBtn}
            onClick={() => setErrorModalOpen(false)}
          >
            Entendido
          </button>
        </div>
      </Modal>
    </main>
  )
}
