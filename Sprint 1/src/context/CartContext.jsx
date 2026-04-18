/*
  CartContext — gerenciamento do carrinho de compras.
  ────────────────────────────────────────────────────

  Responsabilidades:
    - Adicionar, remover e atualizar quantidade de itens.
    - Calcular SUBTOTAL (sem desconto), TOTAL (com desconto) e
      ECONOMIA em tempo real, consultando `getEffectivePrice` do
      PromotionsContext para respeitar preços promocionais.
    - Persistir estado no localStorage.
    - SINCRONIZAR entre abas do navegador via evento `storage`
      (quando o usuário tem o site aberto em duas abas, mexer em
      uma reflete na outra).
    - Expor `restoreItem` para o padrão "Desfazer" após remoção.

  Notas de arquitetura:

    - Usamos `useReducer` em vez de `useState` porque o estado do
      carrinho tem transições bem definidas (ADD, REMOVE, RESTORE,
      UPDATE_QUANTITY, REPLACE_ALL, CLEAR). Reducers puros são mais
      fáceis de testar (entrada → saída sem side effects) e
      permitem que a lógica fique EXPORTADA (ver export abaixo) para
      ser consumida por testes unitários sem mockar o React.

    - `useMemo` para `total`, `subtotal` e `savings` evita
      recalcular em renders onde `items` não mudou — pequeno mas
      cumulativo em listas grandes de itens.
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

const CartContext = createContext(null)

/**
 * Chave composta que identifica uma linha do carrinho.
 *
 * Produtos iguais com variantes diferentes (ex: tamanho P vs M)
 * viram linhas SEPARADAS no carrinho — unificá-los em uma única linha
 * esconderia do usuário qual variante ele pediu.
 */
export function makeCartKey(id, size) {
  return `${id}::${size ?? ''}`
}

/*
  Reducer puro do carrinho.

  EXPORTADO para poder ser testado unitariamente sem renderizar
  nenhum componente — basta importar, chamar com (state, action)
  e asserir o retorno. Também mantém o "princípio da pureza":
  sem side effects (I/O, randomness, dispatch encadeado).
 */
export function cartReducer(state, action) {
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

    case 'RESTORE_ITEM': {
      /*
        Usado pelo Undo: insere um item já "pronto" (com quantity e
        cartKey preservados) de volta no carrinho. Se já existir um
        item com a mesma cartKey (improvável mas possível — usuário
        adicionou de novo antes de desfazer), fundimos as quantidades
        para não duplicar a linha.

        `index` opcional tenta restaurar a posição original — mais
        fiel à intenção do usuário do que sempre jogar no final.
       */
      const { item, index } = action.payload
      const existing = state.find((i) => i.cartKey === item.cartKey)
      if (existing) {
        return state.map((i) =>
          i.cartKey === item.cartKey
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      if (typeof index === 'number' && index >= 0 && index <= state.length) {
        const next = state.slice()
        next.splice(index, 0, item)
        return next
      }
      return [...state, item]
    }

    case 'UPDATE_QUANTITY':
      return state.map((i) =>
        i.cartKey === action.payload.cartKey
          ? { ...i, quantity: Math.max(1, action.payload.quantity) }
          : i
      )

    /*
      REPLACE_ALL é usado pelo listener de `storage` (sync entre abas).
      Em vez de dispatch um ADD por item da outra aba, substituímos
      o estado de uma vez só — mais simples e consistente.
     */
    case 'REPLACE_ALL':
      return action.payload

    case 'CLEAR':
      return []

    default:
      return state
  }
}

/*
  Normaliza itens lidos do localStorage.

  Versões antigas do app salvavam itens sem `cartKey` (antes da
  feature de tamanhos). Para não quebrar o carrinho de usuários
  que já tinham dados persistidos, reconstruímos a chave quando
  ela estiver ausente. É uma "migração silenciosa".
 */
function normalizeStoredItems(raw) {
  return raw.map((i) =>
    i.cartKey
      ? i
      : { ...i, size: i.size ?? null, cartKey: makeCartKey(i.id, i.size ?? null) }
  )
}

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
