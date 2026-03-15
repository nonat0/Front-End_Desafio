// ProductFilter — barra horizontal de filtros acima do grid de produtos.
// Categoria exibida como botões pill lado a lado.
// Ordenação como select à direita.
// Layout em faixa única para que o grid ocupe 100% da largura abaixo.

import { capitalize } from '@/utils/formatters'
import styles from './ProductFilter.module.css'

export function ProductFilter({ categories, activeCategory, onCategoryChange, sortBy, onSortChange }) {
  return (
    <div className={styles.bar}>
      {/* Categorias — botões pill com scroll horizontal no mobile */}
      <div className={styles.categories}>
        <button
          className={`${styles.pill} ${activeCategory === 'all' ? styles.pillActive : ''}`}
          onClick={() => onCategoryChange('all')}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.pill} ${activeCategory === cat ? styles.pillActive : ''}`}
            onClick={() => onCategoryChange(cat)}
          >
            {capitalize(cat)}
          </button>
        ))}
      </div>

      {/* Ordenação — alinhada à direita */}
      <select
        className={styles.select}
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        aria-label="Ordenar produtos"
      >
        <option value="default">Ordenar: Padrão</option>
        <option value="price-asc">Ordenar: Menor preço</option>
        <option value="price-desc">Ordenar: Maior preço</option>
        <option value="rating">Ordenar: Melhor avaliação</option>
        <option value="name">Ordenar: Nome A–Z</option>
      </select>
    </div>
  )
}
