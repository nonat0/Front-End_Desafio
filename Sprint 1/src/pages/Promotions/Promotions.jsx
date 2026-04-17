// Página Admin — painel de gerenciamento de promoções, dividido em dois canais:
//   - Eventos           → alimenta o grid da página Black Friday
//   - Promoções pontuais → alimenta o carousel da página inicial
// A troca entre canais é feita por abas; o restante da UI (contador, descontos
// individuais, filtros e grid) é compartilhado e parametrizado pelo canal ativo.

import { useMemo, useState } from 'react'
import { usePromotionsContext } from '@/context/PromotionsContext'
import { useProducts } from '@/hooks/useProducts'
import { useDebounce } from '@/hooks/useDebounce'
import { Modal } from '@/components/ui/Modal/Modal'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { formatPrice, applyDiscount, truncateText, capitalize } from '@/utils/formatters'
import { MAX_PROMO_ITEMS } from '@/utils/constants'
import styles from './Promotions.module.css'

// ─── Card de produto na grade ────────────────────────────────────────────────

function PromoProductCard({ product, isSelected, onToggle, itemDiscount }) {
  const effectivePrice = isSelected ? applyDiscount(product.price, itemDiscount) : product.price

  return (
    <button
      className={`${styles.promoCard} ${isSelected ? styles.promoCardSelected : ''}`}
      onClick={() => onToggle(product)}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Remover' : 'Selecionar'} ${product.title}`}
    >
      <div className={`${styles.checkIcon} ${isSelected ? styles.checkVisible : ''}`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </div>

      <div className={styles.cardImage}>
        <img src={product.image} alt={product.title} loading="lazy" />
      </div>

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
          {isSelected && itemDiscount > 0 && (
            <span className={styles.cardDiscountBadge}>-{itemDiscount}%</span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Linha de desconto individual por item ───────────────────────────────────

function ItemDiscountRow({ item, onConfirm }) {
  const [inputValue, setInputValue] = useState(item.discount)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isDirty = Number(inputValue) !== item.discount
  const pendingDiscount = Number(inputValue)
  const isValid = !isNaN(pendingDiscount) && pendingDiscount >= 0 && pendingDiscount <= 50

  const handleChange = (e) => {
    const raw = e.target.value
    if (raw === '') { setInputValue(''); return }
    const clamped = Math.min(50, Math.max(1, Number(raw)))
    setInputValue(clamped)
  }

  const handleConfirmClick = () => {
    if (!isDirty || !isValid) return
    setConfirmOpen(true)
  }

  const handleApply = () => {
    onConfirm(item.id, pendingDiscount)
    setConfirmOpen(false)
  }

  const handleCancel = () => setConfirmOpen(false)

  return (
    <>
      <div className={styles.discountRow}>
        <img src={item.image} alt={item.title} className={styles.discountRowImg} />

        <span className={styles.discountRowTitle}>{truncateText(item.title, 40)}</span>

        <div className={`${styles.discountInputWrapper} ${isDirty ? styles.discountInputDirty : ''}`}>
          <input
            type="number"
            min="1"
            max="50"
            value={inputValue}
            onChange={handleChange}
            className={styles.discountInput}
            aria-label={`Desconto para ${item.title}`}
          />
          <span className={styles.discountSymbol}>%</span>
        </div>

        <button
          className={styles.confirmBtn}
          onClick={handleConfirmClick}
          disabled={!isDirty || inputValue === '' || !isValid}
        >
          Confirmar
        </button>

        {item.discount > 0 && (
          <span className={styles.activeDiscountBadge}>Ativo: -{item.discount}%</span>
        )}
      </div>

      <Modal isOpen={confirmOpen} onClose={handleCancel} title="Confirmar desconto">
        <div className={styles.modalContent}>
          <div className={styles.modalIcon}>🏷️</div>
          <p className={styles.modalText}>
            Você está prestes a aplicar um desconto de{' '}
            <strong className={styles.modalHighlight}>-{pendingDiscount}%</strong>{' '}
            para o produto:
          </p>
          <p className={styles.modalProductName}>{item.title}</p>
          <div className={styles.modalPricePreview}>
            <span className={styles.modalOriginalPrice}>{formatPrice(item.price)}</span>
            <span className={styles.modalArrow}>→</span>
            <span className={styles.modalFinalPrice}>
              {formatPrice(applyDiscount(item.price, pendingDiscount))}
            </span>
          </div>
          <div className={styles.modalActions}>
            <button className={styles.modalCancelBtn} onClick={handleCancel}>
              Cancelar
            </button>
            <button className={styles.modalConfirmBtn} onClick={handleApply}>
              Confirmar desconto
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ─── Seção reutilizável (Eventos ou Pontuais) ────────────────────────────────
// Recebe o canal como um feixe de callbacks/estado — toda a UI é idêntica.

function PromoSection({
  description,
  items,
  isSelected,
  getDiscount,
  onAdd,
  onRemove,
  onSetDiscount,
  onClear,
  products,
  categories,
  loading,
  maxItems,
}) {
  const [searchInput, setSearchInput]       = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const debouncedSearch = useDebounce(searchInput, 300)

  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const hasLimit = Number.isFinite(maxItems)

  const handleToggle = (product) => {
    if (isSelected(product.id)) {
      onRemove(product.id)
      return
    }
    if (hasLimit && items.length >= maxItems) {
      setErrorModalOpen(true)
      return
    }
    onAdd(product)
  }

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
    <>
      {/* Descrição + botão limpar */}
      <div className={styles.sectionHeader}>
        <p className={styles.pageDesc}>{description}</p>
        {items.length > 0 && (
          <button className={styles.clearBtn} onClick={onClear}>
            Limpar seleção
          </button>
        )}
      </div>

      {/* Contador */}
      <div className={styles.configPanel}>
        <div className={styles.selectionInfo}>
          {hasLimit && (
            <div className={styles.selectionDots}>
              {Array.from({ length: maxItems }).map((_, i) => (
                <span
                  key={i}
                  className={`${styles.selectionDot} ${i < items.length ? styles.selectionDotActive : ''}`}
                />
              ))}
            </div>
          )}
          <span className={styles.selectionText}>
            {hasLimit ? (
              <><strong>{items.length}</strong> de {maxItems} produtos selecionados</>
            ) : (
              <><strong>{items.length}</strong> {items.length === 1 ? 'produto selecionado' : 'produtos selecionados'} <em className={styles.unlimitedHint}>· sem limite</em></>
            )}
          </span>
        </div>
      </div>

      {/* Painel de descontos individuais */}
      {items.length > 0 && (
        <div className={styles.discountPanel}>
          <h2 className={styles.discountPanelTitle}>Descontos individuais</h2>
          {items.map((item) => (
            <ItemDiscountRow key={item.id} item={item} onConfirm={onSetDiscount} />
          ))}
        </div>
      )}

      {/* Filtros */}
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

      {/* Grid */}
      {loading ? (
        <div className={styles.loadingWrapper}><Spinner size="lg" /></div>
      ) : filteredProducts.length === 0 ? (
        <div className={styles.empty}><span>🔍</span><p>Nenhum produto encontrado.</p></div>
      ) : (
        <div className={styles.grid}>
          {filteredProducts.map((product) => (
            <PromoProductCard
              key={product.id}
              product={product}
              isSelected={isSelected(product.id)}
              onToggle={handleToggle}
              itemDiscount={getDiscount(product.id)}
            />
          ))}
        </div>
      )}

      {/* Modal — limite de seleção atingido (só aparece quando há limite) */}
      {hasLimit && (
        <Modal isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} title="Limite atingido">
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}>⚠️</div>
            <p className={styles.modalText}>
              Você já selecionou o máximo de <strong>{maxItems} produtos</strong> nesta seção.
            </p>
            <p className={styles.modalHint}>Remova um produto antes de adicionar outro.</p>
            <div className={styles.modalActions}>
              <button className={styles.modalConfirmBtn} onClick={() => setErrorModalOpen(false)}>
                Entendido
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function Promotions() {
  const {
    eventItems,
    isEventItem,
    getEventItemDiscount,
    addEventItem,
    removeEventItem,
    setEventItemDiscount,
    clearEventItems,

    spotItems,
    isSpotItem,
    getSpotItemDiscount,
    addSpotItem,
    removeSpotItem,
    setSpotItemDiscount,
    clearSpotItems,
  } = usePromotionsContext()

  const { products, categories, loading } = useProducts('all')
  const [activeTab, setActiveTab] = useState('events')

  return (
    <main className={styles.main}>
      <div className="container">

        {/* Cabeçalho */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Admin</h1>
            <p className={styles.pageDesc}>
              Gerencie as promoções da loja em dois canais independentes.
            </p>
          </div>
        </div>

        {/* Abas de canais */}
        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'events'}
            className={`${styles.tab} ${activeTab === 'events' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <span className={styles.tabLabel}>Eventos</span>
            <span className={styles.tabCount}>{eventItems.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'spots'}
            className={`${styles.tab} ${activeTab === 'spots' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('spots')}
          >
            <span className={styles.tabLabel}>Promoções pontuais</span>
            <span className={styles.tabCount}>{spotItems.length}</span>
          </button>
        </div>

        {activeTab === 'events' ? (
          <PromoSection
            description="Selecione quantos produtos quiser para o grid da página Black Friday (desconto de 0–50% por item)."
            items={eventItems}
            isSelected={isEventItem}
            getDiscount={getEventItemDiscount}
            onAdd={addEventItem}
            onRemove={removeEventItem}
            onSetDiscount={setEventItemDiscount}
            onClear={clearEventItems}
            products={products}
            categories={categories}
            loading={loading}
            maxItems={Infinity}
          />
        ) : (
          <PromoSection
            description={`Selecione até ${MAX_PROMO_ITEMS} produtos para o carousel da página inicial (desconto de 0–50% por item).`}
            items={spotItems}
            isSelected={isSpotItem}
            getDiscount={getSpotItemDiscount}
            onAdd={addSpotItem}
            onRemove={removeSpotItem}
            onSetDiscount={setSpotItemDiscount}
            onClear={clearSpotItems}
            products={products}
            categories={categories}
            loading={loading}
            maxItems={MAX_PROMO_ITEMS}
          />
        )}
      </div>
    </main>
  )
}
