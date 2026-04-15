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

/**
 * Chave composta que identifica uma linha do carrinho.
 * Produtos iguais com variantes diferentes (ex: tamanho P vs M)
 * viram linhas separadas no carrinho.
 */
export function makeCartKey(id, size) {
  return `${id}::${size ?? ''}`
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, size } = action.payload
      const cartKey = makeCartKey(product.id, size)
      const existing = state.find((i) => i.cartKey === cartKey)
      if (existing) {
        return state.map((i) =>
          i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...state, { ...product, size: size ?? null, cartKey, quantity: 1 }]
    }
    case 'REMOVE_ITEM':
      return state.filter((i) => i.cartKey !== action.payload)
    case 'UPDATE_QUANTITY':
      return state.map((i) =>
        i.cartKey === action.payload.cartKey
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
    getItem(STORAGE_KEYS.CART, []).map((i) =>
      i.cartKey ? i : { ...i, size: i.size ?? null, cartKey: makeCartKey(i.id, i.size ?? null) }
    )
  )
  const { getEffectivePrice } = usePromotionsContext()

  useEffect(() => {
    setItem(STORAGE_KEYS.CART, items)
  }, [items])

  const addToCart = useCallback((product, size = null) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, size } })
  }, [])

  const removeFromCart = useCallback((cartKey) => {
    dispatch({ type: 'REMOVE_ITEM', payload: cartKey })
  }, [])

  const updateQuantity = useCallback((cartKey, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { cartKey, quantity } })
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
