// WatchlistContext — lista de desejos (watchlist).
// Permite adicionar e remover produtos favoritos.
// Estado persistido no localStorage para sobreviver a refreshes.
// Expansível para sincronização com conta de usuário futuramente.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react'
import { STORAGE_KEYS } from '@/utils/constants'
import { getItem, setItem } from '@/services/storage/localStorage'

const WatchlistContext = createContext(null)

function watchlistReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      if (state.find((p) => p.id === action.payload.id)) return state
      return [...state, action.payload]
    case 'REMOVE':
      return state.filter((p) => p.id !== action.payload)
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function WatchlistProvider({ children }) {
  const [items, dispatch] = useReducer(
    watchlistReducer,
    getItem(STORAGE_KEYS.WATCHLIST, [])
  )

  useEffect(() => {
    setItem(STORAGE_KEYS.WATCHLIST, items)
  }, [items])

  const addToWatchlist = useCallback((product) => {
    dispatch({ type: 'ADD', payload: product })
  }, [])

  const removeFromWatchlist = useCallback((productId) => {
    dispatch({ type: 'REMOVE', payload: productId })
  }, [])

  const clearWatchlist = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  const isInWatchlist = useCallback(
    (productId) => items.some((p) => p.id === productId),
    [items]
  )

  return (
    <WatchlistContext.Provider
      value={{
        items,
        itemCount: items.length,
        addToWatchlist,
        removeFromWatchlist,
        clearWatchlist,
        isInWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlistContext() {
  const ctx = useContext(WatchlistContext)
  if (!ctx) throw new Error('useWatchlistContext deve ser usado dentro de WatchlistProvider')
  return ctx
}
