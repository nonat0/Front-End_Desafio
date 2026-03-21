// Página Promotions — painel de gerenciamento de promoções.
// Cada item selecionado tem seu próprio percentual de desconto (0–50%).
// O botão "Confirmar" só ativa quando o valor muda.
// Um modal de segunda confirmação exibe o preço antes/depois antes de aplicar.

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
// Exibida no painel abaixo do contador para cada produto selecionado.
// Input: aceita apenas 1–50. Botão "Confirmar" ativa ao detectar mudança.
// Ao confirmar abre modal de segunda confirmação com preço antes/depois.

function ItemDiscountRow({ item, onConfirm }) {
  const [inputValue, setInputValue] = useState(item.discount)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Mantém inputValue sincronizado se o desconto do item mudar externamente
  // (ex: outro componente aplicou o desconto)
  const isDirty = Number(inputValue) !== item.discount
  const pendingDiscount = Number(inputValue)
  const isValid = !isNaN(pendingDiscount) && pendingDiscount >= 0 && pendingDiscount <= 50

  const handleChange = (e) => {
    const raw = e.target.value
    if (raw === '') { setInputValue(''); return }
    // Clamp entre 1 e 50
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

  const handleCancel = () => {
    setConfirmOpen(false)
  }

  return (
    <>
      <div className={styles.discountRow}>
        {/* Miniatura do produto */}
        <img src={item.image} alt={item.title} className={styles.discountRowImg} />

        {/* Nome truncado */}
        <span className={styles.discountRowTitle}>{truncateText(item.title, 40)}</span>

        {/* Input com limite 1–50 — borda âmbar quando valor pendente */}
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

        {/* Botão confirmar — desabilitado se valor não mudou ou for inválido */}
        <button
          className={styles.confirmBtn}
          onClick={handleConfirmClick}
          disabled={!isDirty || inputValue === '' || !isValid}
        >
          Confirmar
        </button>

        {/* Badge mostrando o desconto atualmente ativo */}
        {item.discount > 0 && (
          <span className={styles.activeDiscountBadge}>Ativo: -{item.discount}%</span>
        )}
      </div>

      {/* Modal de segunda confirmação — mostra preço antes e depois */}
      <Modal
        isOpen={confirmOpen}
        onClose={handleCancel}
        title="Confirmar desconto"
      >
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

// ─── Página principal ─────────────────────────────────────────────────────────

export function Promotions() {
  const {
    promotedItems,
    isPromoted,
    getItemDiscount,
    addPromoItem,
    removePromoItem,
    setItemDiscount,
    clearPromos,
  } = usePromotionsContext()

  const { products, categories, loading } = useProducts('all')

  const [searchInput, setSearchInput]       = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const debouncedSearch = useDebounce(searchInput, 300)

  const [errorModalOpen, setErrorModalOpen] = useState(false)

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

        {/* Cabeçalho */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Promoções</h1>
            <p className={styles.pageDesc}>
              Selecione até {MAX_PROMO_ITEMS} produtos e defina o desconto individual de cada um (0–50%).
            </p>
          </div>
          {promotedItems.length > 0 && (
            <button className={styles.clearBtn} onClick={clearPromos}>
              Limpar seleção
            </button>
          )}
        </div>

        {/* Contador de selecionados */}
        <div className={styles.configPanel}>
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
        </div>

        {/* Painel de descontos individuais — aparece ao selecionar pelo menos 1 item */}
        {promotedItems.length > 0 && (
          <div className={styles.discountPanel}>
            <h2 className={styles.discountPanelTitle}>Descontos individuais</h2>
            {promotedItems.map((item) => (
              <ItemDiscountRow
                key={item.id}
                item={item}
                onConfirm={setItemDiscount}
              />
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

        {/* Grid de produtos */}
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
                isSelected={isPromoted(product.id)}
                onToggle={handleToggle}
                itemDiscount={getItemDiscount(product.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal — limite de seleção atingido */}
      <Modal isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} title="Limite atingido">
        <div className={styles.modalContent}>
          <div className={styles.modalIcon}>⚠️</div>
          <p className={styles.modalText}>
            Você já selecionou o máximo de <strong>{MAX_PROMO_ITEMS} produtos</strong> em promoção simultaneamente.
          </p>
          <p className={styles.modalHint}>Remova um produto antes de adicionar outro.</p>
          <div className={styles.modalActions}>
            <button className={styles.modalConfirmBtn} onClick={() => setErrorModalOpen(false)}>
              Entendido
            </button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
