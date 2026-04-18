/*
  PromoSection — bloco reutilizável que renderiza UM canal de promoção.
  ────────────────────────────────────────────────────────────────────

  O painel admin tem dois canais (Eventos e Pontuais) com a MESMA UI
  mas dados/handlers diferentes (cada canal vive em um pedaço próprio
  do PromotionsContext). Em vez de duplicar 150 linhas de JSX, esta
  seção recebe TODO o "feixe" de dependências por props:

    - items, isSelected, getDiscount: leitura
    - onAdd, onRemove, onSetDiscount, onClear: escrita
    - products, categories, loading: catálogo de origem
    - maxItems: limite — pode ser Infinity para canais sem teto

  É um padrão "render-with-injection": o componente cuida da interação
  e visual; a página só decide "qual canal está ativo" e injeta os
  callbacks correspondentes.

  Estado local importante:
    - searchInput / filterCategory: filtros do grid (com debounce no
      texto para evitar re-render a cada tecla).
    - errorModalOpen: flag do modal "limite atingido", só relevante
      quando hasLimit === true.
 */

import { useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { Modal } from '@/components/ui/Modal/Modal'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { capitalize } from '@/utils/formatters'
import { PromoProductCard } from './PromoProductCard'
import { ItemDiscountRow } from './ItemDiscountRow'
import styles from './Promotions.module.css'

export function PromoSection({
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
