// PromotionsContext — núcleo do sistema de promoções.
// Dois canais independentes de promoção, cada um com seu próprio limite e estado:
//   - eventItems → alimentam o grid da página Black Friday
//   - spotItems  → alimentam o carousel da página inicial
// Cada item carrega seu próprio percentual de desconto individual.

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

// Migração do formato antigo ({ items: [...] }) → novo formato ({ events, spots }).
// Itens do formato antigo caem no canal "spots" porque era o que alimentava o carousel.
function loadInitialState() {
  const stored = getItem(STORAGE_KEYS.PROMOTIONS, null)
  if (!stored) return { eventItems: [], spotItems: [] }
  if (Array.isArray(stored.items)) {
    return { eventItems: [], spotItems: stored.items }
  }
  return {
    eventItems: stored.events ?? [],
    spotItems: stored.spots ?? [],
  }
}

const initialState = loadInitialState()

// Reducer genérico parametrizado pela chave da lista (eventItems | spotItems).
function promotionsReducer(state, action) {
  const { type, list } = action
  const key = list // 'eventItems' ou 'spotItems'

  switch (type) {
    case 'ADD_ITEM': {
      // Apenas o canal de "pontuais" (carousel) tem limite — eventos são ilimitados.
      if (key === 'spotItems' && state[key].length >= MAX_PROMO_ITEMS) return state
      if (state[key].find((p) => p.id === action.payload.id)) return state
      return {
        ...state,
        [key]: [...state[key], { ...action.payload, discount: 10 }],
      }
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        [key]: state[key].filter((p) => p.id !== action.payload),
      }
    case 'SET_ITEM_DISCOUNT':
      return {
        ...state,
        [key]: state[key].map((p) =>
          p.id === action.payload.id
            ? { ...p, discount: action.payload.discount }
            : p
        ),
      }
    case 'CLEAR':
      return { ...state, [key]: [] }
    default:
      return state
  }
}

export function PromotionsProvider({ children }) {
  const [state, dispatch] = useReducer(promotionsReducer, initialState)

  useEffect(() => {
    setItem(STORAGE_KEYS.PROMOTIONS, {
      events: state.eventItems,
      spots: state.spotItems,
    })
  }, [state])

  // ─── Helpers que olham para ambas as listas ─────────────────────────────────

  const isEventItem = useCallback(
    (id) => state.eventItems.some((p) => p.id === id),
    [state.eventItems]
  )

  const isSpotItem = useCallback(
    (id) => state.spotItems.some((p) => p.id === id),
    [state.spotItems]
  )

  // Consumers legados (ProductCard, Watchlist, CartDrawer…) continuam perguntando
  // apenas "este produto está promovido?" — retorna true se estiver em qualquer canal.
  const isPromoted = useCallback(
    (id) => isEventItem(id) || isSpotItem(id),
    [isEventItem, isSpotItem]
  )

  // Prioriza o desconto do canal de evento (Black Friday) quando o item aparece em ambos.
  const findPromoItem = useCallback(
    (id) =>
      state.eventItems.find((p) => p.id === id) ??
      state.spotItems.find((p) => p.id === id) ??
      null,
    [state.eventItems, state.spotItems]
  )

  const getEffectivePrice = useCallback(
    (product) => {
      if (!product) return 0
      const promo = findPromoItem(product.id)
      return promo ? applyDiscount(product.price, promo.discount) : product.price
    },
    [findPromoItem]
  )

  const getItemDiscount = useCallback(
    (id) => findPromoItem(id)?.discount ?? 10,
    [findPromoItem]
  )

  // ─── API por canal ──────────────────────────────────────────────────────────

  const addEventItem       = useCallback((p)   => dispatch({ type: 'ADD_ITEM',          list: 'eventItems', payload: p }), [])
  const removeEventItem    = useCallback((id)  => dispatch({ type: 'REMOVE_ITEM',       list: 'eventItems', payload: id }), [])
  const setEventItemDiscount = useCallback((id, v) => dispatch({ type: 'SET_ITEM_DISCOUNT', list: 'eventItems', payload: { id, discount: Number(v) } }), [])
  const clearEventItems    = useCallback(()    => dispatch({ type: 'CLEAR',             list: 'eventItems' }), [])
  const getEventItemDiscount = useCallback(
    (id) => state.eventItems.find((p) => p.id === id)?.discount ?? 10,
    [state.eventItems]
  )

  const addSpotItem        = useCallback((p)   => dispatch({ type: 'ADD_ITEM',          list: 'spotItems', payload: p }), [])
  const removeSpotItem     = useCallback((id)  => dispatch({ type: 'REMOVE_ITEM',       list: 'spotItems', payload: id }), [])
  const setSpotItemDiscount = useCallback((id, v) => dispatch({ type: 'SET_ITEM_DISCOUNT', list: 'spotItems', payload: { id, discount: Number(v) } }), [])
  const clearSpotItems     = useCallback(()    => dispatch({ type: 'CLEAR',             list: 'spotItems' }), [])
  const getSpotItemDiscount = useCallback(
    (id) => state.spotItems.find((p) => p.id === id)?.discount ?? 10,
    [state.spotItems]
  )

  return (
    <PromotionsContext.Provider
      value={{
        /* Estado dos dois canais */
        eventItems: state.eventItems,
        spotItems:  state.spotItems,

        /* Helpers genéricos (uso consumidor) */
        isPromoted,
        getEffectivePrice,
        getItemDiscount,

        /* API canal evento */
        isEventItem,
        addEventItem,
        removeEventItem,
        setEventItemDiscount,
        clearEventItems,
        getEventItemDiscount,

        /* API canal pontual */
        isSpotItem,
        addSpotItem,
        removeSpotItem,
        setSpotItemDiscount,
        clearSpotItems,
        getSpotItemDiscount,
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
