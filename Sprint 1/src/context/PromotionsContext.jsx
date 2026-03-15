// PromotionsContext — núcleo do sistema de promoções.
// Responsável por:
//   - Manter lista de produtos em promoção (máx. MAX_PROMO_ITEMS)
//   - Armazenar o percentual de desconto global
//   - Expor `getEffectivePrice(product)` que todos os componentes usam
//     para obter o preço correto (original ou promocional)
//   - Persistir estado no localStorage para sobreviver a refreshes

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react'
import { MAX_PROMO_ITEMS, STORAGE_KEYS } from '@/utils/constants'
import { applyDiscount } from '@/utils/formatters'
import { getItem, setItem } from '@/services/storage/localStorage'

const PromotionsContext = createContext(null)

const initialState = {
  /* Array de produtos completos selecionados para promoção */
  promotedItems: getItem(STORAGE_KEYS.PROMOTIONS, {
    items: [],
    discount: 10,
  }).items,
  /* Percentual de desconto aplicado a todos os itens promovidos */
  discount: getItem(STORAGE_KEYS.PROMOTIONS, { items: [], discount: 10 }).discount,
}

function promotionsReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      /* Impede duplicatas e respeita o limite máximo */
      if (state.promotedItems.length >= MAX_PROMO_ITEMS) return state
      if (state.promotedItems.find((p) => p.id === action.payload.id)) return state
      return { ...state, promotedItems: [...state.promotedItems, action.payload] }
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        promotedItems: state.promotedItems.filter((p) => p.id !== action.payload),
      }
    case 'SET_DISCOUNT':
      return { ...state, discount: action.payload }
    case 'CLEAR':
      return { ...state, promotedItems: [] }
    default:
      return state
  }
}

export function PromotionsProvider({ children }) {
  const [state, dispatch] = useReducer(promotionsReducer, initialState)

  /* Persiste automaticamente no localStorage sempre que o estado muda */
  useEffect(() => {
    setItem(STORAGE_KEYS.PROMOTIONS, {
      items: state.promotedItems,
      discount: state.discount,
    })
  }, [state])

  /**
   * Verifica se um produto está na lista de promoções.
   * @param {number} productId
   * @returns {boolean}
   */
  const isPromoted = useCallback(
    (productId) => state.promotedItems.some((p) => p.id === productId),
    [state.promotedItems]
  )

  /**
   * Retorna o preço efetivo de um produto:
   * se estiver em promoção, aplica o desconto; caso contrário, retorna o original.
   * Este é o método central que deve ser chamado em TODOS os lugares que exibem preço.
   * @param {Product} product
   * @returns {number}
   */
  const getEffectivePrice = useCallback(
    (product) => {
      if (!product) return 0
      if (isPromoted(product.id)) {
        return applyDiscount(product.price, state.discount)
      }
      return product.price
    },
    [isPromoted, state.discount]
  )

  const addPromoItem = useCallback((product) => {
    dispatch({ type: 'ADD_ITEM', payload: product })
  }, [])

  const removePromoItem = useCallback((productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId })
  }, [])

  const setDiscount = useCallback((value) => {
    dispatch({ type: 'SET_DISCOUNT', payload: Number(value) })
  }, [])

  const clearPromos = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  return (
    <PromotionsContext.Provider
      value={{
        promotedItems: state.promotedItems,
        discount: state.discount,
        isPromoted,
        getEffectivePrice,
        addPromoItem,
        removePromoItem,
        setDiscount,
        clearPromos,
      }}
    >
      {children}
    </PromotionsContext.Provider>
  )
}

export function usePromotionsContext() {
  const ctx = useContext(PromotionsContext)
  if (!ctx) throw new Error('usePromotionsContext deve ser usado dentro de PromotionsProvider')
  return ctx
}
