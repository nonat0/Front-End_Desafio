/*
  CartContext — gerenciamento do carrinho de compras.
  ────────────────────────────────────────────────────

  Este arquivo contém apenas o que é específico de React: o Provider,
  os hooks (`useReducer`, `useEffect`, `useMemo`, `useCallback`) e o
  hook de consumo. Toda a lógica pura de transição de estado vive em
  `./CartReducer.js` — separação que facilita teste unitário e
  mantém o arquivo legível.

  Responsabilidades:
    - Inicializar o estado a partir do localStorage.
    - Persistir mudanças no localStorage.
    - SINCRONIZAR entre abas via evento `storage`.
    - Calcular SUBTOTAL / TOTAL / ECONOMIA em tempo real, respeitando
      preços promocionais via `getEffectivePrice`.
    - Expor uma API conveniente (addToCart, removeFromCart, restoreItem
      etc.) que esconde os detalhes do `dispatch`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import { STORAGE_KEYS } from '@/utils/constants'
import { getItem, setItem } from '@/services/storage/localStorage'
import { usePromotionsContext } from './PromotionsContext'
import { cartReducer, makeCartKey, normalizeStoredItems } from './CartReducer'

const CartContext = createContext(null)

// Re-exportado por compatibilidade — alguns consumers podem importar daqui.
export { makeCartKey }

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(
    cartReducer,
    null,
    () => normalizeStoredItems(getItem(STORAGE_KEYS.CART, []))
  )
  const { getEffectivePrice } = usePromotionsContext()

  /*
    Ref que guarda a ÚLTIMA serialização escrita no localStorage
    por esta aba. Usada pelo listener de `storage` para distinguir
    "eu mesmo acabei de escrever" de "outra aba escreveu". Em
    navegadores modernos o evento `storage` só dispara em OUTRAS
    abas, mas deixar essa guarda torna o código robusto contra
    comportamentos de browsers antigos e contra bugs futuros.
   */
  const lastWrittenRef = useRef(null)

  // Persistência em localStorage a cada mudança nos items.
  useEffect(() => {
    const serialized = JSON.stringify(items)
    lastWrittenRef.current = serialized
    setItem(STORAGE_KEYS.CART, items)
  }, [items])

  /*
    Sincronização entre abas.

    O evento `storage` é disparado pelo browser em TODA janela/aba
    que compartilha o mesmo localStorage — EXCETO na aba que fez a
    escrita. Então, quando vemos um `storage` event com a chave do
    carrinho, é porque OUTRA aba mexeu no carrinho e precisamos nos
    atualizar.

    Comparamos `e.newValue` com a última string que nós mesmos
    escrevemos — se forem iguais, não há nada novo para aplicar
    (evita um REPLACE_ALL redundante).
   */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEYS.CART) return
      if (e.newValue === null) {
        // localStorage foi limpo externamente → carrinho vazio.
        dispatch({ type: 'REPLACE_ALL', payload: [] })
        return
      }
      if (e.newValue === lastWrittenRef.current) return

      try {
        const parsed = JSON.parse(e.newValue)
        if (Array.isArray(parsed)) {
          dispatch({ type: 'REPLACE_ALL', payload: normalizeStoredItems(parsed) })
        }
      } catch {
        /* JSON inválido — ignora silenciosamente, melhor que crashar */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addToCart = useCallback((product, size = null) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, size } })
  }, [])

  /**
   * Remove um item e DEVOLVE um snapshot para permitir "undo".
   *
   * Chamadores (ex: CartDrawer) usam o snapshot + índice para
   * chamar `restoreItem` dentro do handler de "Desfazer" do toast.
   * Devolver a informação aqui (em vez de forçar o consumidor a
   * ler items[] antes) evita uma race condition: o estado pode
   * mudar entre a leitura e o dispatch.
   */
  const removeFromCart = useCallback((cartKey) => {
    const index = items.findIndex((i) => i.cartKey === cartKey)
    const removed = index >= 0 ? items[index] : null
    dispatch({ type: 'REMOVE_ITEM', payload: cartKey })
    return removed ? { item: removed, index } : null
  }, [items])

  /**
   * Restaura um item previamente removido (usado pelo Undo).
   * Aceita `{ item, index }` — normalmente o próprio retorno
   * de `removeFromCart`.
   */
  const restoreItem = useCallback((payload) => {
    if (!payload?.item) return
    dispatch({ type: 'RESTORE_ITEM', payload })
  }, [])

  const updateQuantity = useCallback((cartKey, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { cartKey, quantity } })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  /*
    Derivados memoizados.

    - SUBTOTAL: soma dos preços ORIGINAIS (sem desconto).
    - TOTAL:    soma dos preços EFETIVOS (com desconto aplicado).
    - SAVINGS:  economia = subtotal - total (sempre ≥ 0).

    Depender de `items` e `getEffectivePrice` garante que mudanças
    em promoções (ex: admin altera desconto) recomputem o total
    automaticamente — sem precisar "refrescar" o carrinho.
   */
  const { subtotal, total, savings } = useMemo(() => {
    let sub = 0
    let tot = 0
    for (const item of items) {
      sub += item.price * item.quantity
      tot += getEffectivePrice(item) * item.quantity
    }
    // Arredonda para 2 casas para evitar artifacts de float (ex: 0.0000001)
    const round = (n) => Math.round(n * 100) / 100
    return {
      subtotal: round(sub),
      total: round(tot),
      savings: round(sub - tot),
    }
  }, [items, getEffectivePrice])

  /** Quantidade total de unidades no carrinho (para o badge) */
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  )

  const isInCart = useCallback(
    (productId) => items.some((i) => i.id === productId),
    [items]
  )

  /*
    `value` também memoizado: sem isso, qualquer render do Provider
    criaria um novo objeto e forçaria re-render em TODO consumidor
    do contexto — mesmo que nada tenha mudado de fato.
   */
  const value = useMemo(
    () => ({
      items,
      subtotal,
      total,
      savings,
      itemCount,
      addToCart,
      removeFromCart,
      restoreItem,
      updateQuantity,
      clearCart,
      isInCart,
    }),
    [
      items,
      subtotal,
      total,
      savings,
      itemCount,
      addToCart,
      removeFromCart,
      restoreItem,
      updateQuantity,
      clearCart,
      isInCart,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCartContext() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCartContext deve ser usado dentro de CartProvider')
  return ctx
}
