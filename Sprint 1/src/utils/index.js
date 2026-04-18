/*
  Barrel file dos utilitários puros.

  Agrupa formatters, constants e cache em um único ponto de import:
    import { formatPrice, MAX_PROMO_ITEMS, getCached } from '@/utils'

  Mantemos o re-export EXPLÍCITO em vez de `export *` para deixar
  rastreável o que é "API pública" do módulo. `export *` esconderia
  qualquer adição futura — bom para autocompletar, ruim para revisão
  de PR e tree-shaking de leitura humana.
 */

export {
  formatPrice,
  applyDiscount,
  truncateText,
  capitalize,
  formatRating,
  getProductSizeOptions,
} from './formatters'

export {
  API_BASE_URL,
  MAX_PROMO_ITEMS,
  DEFAULT_PROMO_DISCOUNT,
  MAX_PROMO_DISCOUNT,
  UNDO_TOAST_DURATION,
  STORAGE_KEYS,
  TOAST_DURATION,
  CAROUSEL_INTERVAL,
  CACHE_TTL,
  API_RETRY,
  CAROUSEL_FALLBACK,
} from './constants'

export {
  getCached,
  setCached,
  invalidateCache,
  clearCache,
} from './cache'
