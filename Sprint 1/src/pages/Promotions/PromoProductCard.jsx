/*
  PromoProductCard — card clicável de produto na grade do painel admin.
  ─────────────────────────────────────────────────────────────────────

  Antes vivia inline dentro de Promotions.jsx (~50 linhas + 2 outros
  sub-componentes no mesmo arquivo). Foi extraído para arquivo próprio
  porque:

    - O arquivo da página estava ficando longo demais (>400 LOC)
      e perdia legibilidade — diferenciar "página" de "cards" exigia
      muito scroll mental.
    - Cada um dos sub-componentes (PromoProductCard, ItemDiscountRow,
      PromoSection) tem responsabilidade bem distinta. Co-locá-los em
      arquivos separados torna explícita essa fronteira.
    - Facilita futuros testes/storybooks isolados — basta importar
      o card sem subir junto a página inteira.

  Importações relativas (`./Promotions.module.css`) intencionalmente —
  os estilos seguem co-locados com a página.
 */

import { applyDiscount, formatPrice, truncateText, capitalize } from '@/utils/formatters'
import styles from './Promotions.module.css'

export function PromoProductCard({ product, isSelected, onToggle, itemDiscount }) {
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
