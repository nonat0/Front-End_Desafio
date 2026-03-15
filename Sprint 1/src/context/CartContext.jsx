// CartContext — gerenciamento do carrinho de compras.
// Responsável por:
//   - Adicionar, remover e atualizar quantidade de itens
//   - Calcular total em tempo real usando `getEffectivePrice` do PromotionsContext
//     para garantir que preços promocionais sejam aplicados no carrinho
//   - Persistir estado no localStorage
//   - Expor contagem de itens para o badge da navbar

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react'
import { STORAGE_KEYS } from '@/utils/constants'
import { getItem, setItem } from '@/services/storage/localStorage'
import { usePromotionsContext } from './PromotionsContext'

const CartContext = createContext(null)

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find((i) => i.id === action.payload.id)
      if (existing) {
        /* Se já existe, incrementa a quantidade */
        return state.map((i) =>
          i.id === action.payload.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...state, { ...action.payload, quantity: 1 }]
    }
    case 'REMOVE_ITEM':
      return state.filter((i) => i.id !== action.payload)
    case 'UPDATE_QUANTITY':
      return state.map((i) =>
        i.id === action.payload.id
          ? { ...i, quantity: Math.max(1, action.payload.quantity) }
          : i
      )
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(
    cartReducer,
    getItem(STORAGE_KEYS.CART, [])
  )
  const { getEffectivePrice } = usePromotionsContext()

  useEffect(() => {
    setItem(STORAGE_KEYS.CART, items)
  }, [items])

  const addToCart = useCallback((product) => {
    dispatch({ type: 'ADD_ITEM', payload: product })
  }, [])

  const removeFromCart = useCallback((productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId })
  }, [])

  const updateQuantity = useCallback((productId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  /**
   * Total do carrinho calculado em tempo real.
   * Usa `getEffectivePrice` para respeitar descontos de promoção.
   */
  const total = items.reduce(
    (sum, item) => sum + getEffectivePrice(item) * item.quantity,
    0
  )

  /** Quantidade total de unidades no carrinho (para o badge) */
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  const isInCart = useCallback(
    (productId) => items.some((i) => i.id === productId),
    [items]
  )

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCartContext() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCartContext deve ser usado dentro de CartProvider')
  return ctx
}
