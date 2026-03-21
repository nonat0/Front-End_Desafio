// PromotionsContext — núcleo do sistema de promoções.
// Cada item promovido carrega seu próprio percentual de desconto individual.
// getEffectivePrice() lê o desconto do próprio item, não mais um valor global.

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
  // Cada item carrega { ...produto, discount: number } — desconto individual
  promotedItems: getItem(STORAGE_KEYS.PROMOTIONS, { items: [] }).items,
}

function promotionsReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      if (state.promotedItems.length >= MAX_PROMO_ITEMS) return state
      if (state.promotedItems.find((p) => p.id === action.payload.id)) return state
      // Adiciona o item com discount: 10 como valor padrão inicial
      return { ...state, promotedItems: [...state.promotedItems, { ...action.payload, discount: 10 }] }
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        promotedItems: state.promotedItems.filter((p) => p.id !== action.payload),
      }
    // Define o desconto de um item específico pelo ID
    case 'SET_ITEM_DISCOUNT':
      return {
        ...state,
        promotedItems: state.promotedItems.map((p) =>
          p.id === action.payload.id
            ? { ...p, discount: action.payload.discount }
            : p
        ),
      }
    case 'CLEAR':
      return { ...state, promotedItems: [] }
    default:
      return state
  }
}

export function PromotionsProvider({ children }) {
  const [state, dispatch] = useReducer(promotionsReducer, initialState)

  // Persiste automaticamente — cada item já carrega seu próprio discount
  useEffect(() => {
    setItem(STORAGE_KEYS.PROMOTIONS, { items: state.promotedItems })
  }, [state])

  const isPromoted = useCallback(
    (productId) => state.promotedItems.some((p) => p.id === productId),
    [state.promotedItems]
  )

  // Retorna o preço efetivo usando o desconto individual do próprio item
  const getEffectivePrice = useCallback(
    (product) => {
      if (!product) return 0
      const promoItem = state.promotedItems.find((p) => p.id === product.id)
      if (promoItem) {
        return applyDiscount(product.price, promoItem.discount)
      }
      return product.price
    },
    [state.promotedItems]
  )

  const addPromoItem = useCallback((product) => {
    dispatch({ type: 'ADD_ITEM', payload: product })
  }, [])

  const removePromoItem = useCallback((productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId })
  }, [])

  // Define o desconto de um item específico (substitui o antigo setDiscount global)
  const setItemDiscount = useCallback((productId, value) => {
    dispatch({ type: 'SET_ITEM_DISCOUNT', payload: { id: productId, discount: Number(value) } })
  }, [])

  // Retorna o discount atual de um item específico (usado nos inputs da página)
  const getItemDiscount = useCallback(
    (productId) => {
      const item = state.promotedItems.find((p) => p.id === productId)
      return item ? item.discount : 10
    },
    [state.promotedItems]
  )

  const clearPromos = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  return (
    <PromotionsContext.Provider
      value={{
        promotedItems: state.promotedItems,
        isPromoted,
        getEffectivePrice,
        getItemDiscount,
        addPromoItem,
        removePromoItem,
        setItemDiscount,
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
