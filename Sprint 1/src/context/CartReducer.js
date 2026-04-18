/*
  CartReducer — lógica pura de transição de estado do carrinho.
  ──────────────────────────────────────────────────────────────

  Por que viver em um arquivo separado do CartContext?

    1. PUREZA: este arquivo NÃO importa nada do React, do localStorage
       ou de outros contextos. É 100% determinístico — mesma entrada,
       mesma saída. Isso o torna trivialmente testável com Vitest/Jest:
       basta importar `cartReducer`, chamar com (state, action) e
       asserir o retorno. Nenhum mock, nenhum render.

    2. SEPARAÇÃO DE PREOCUPAÇÕES: o CartContext.jsx vira mais enxuto
       e foca apenas no que é específico do React (hooks, providers,
       efeitos de side). Reducer cuida de COMO o estado muda; o
       Context cuida de QUEM tem acesso e QUANDO os side effects
       acontecem (persistência, sync entre abas).

    3. REUTILIZAÇÃO POTENCIAL: se um dia precisarmos rodar o reducer
       fora do React (ex: replay de ações no servidor, otimistic
       updates em Service Worker), basta importar daqui — sem trazer
       junto o peso de React/DOM.
 */

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

  Convenção das actions: { type, payload }.
  O payload muda de forma por type — documentado em cada case.
 */
export function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      // payload: { product, size }
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
      // payload: cartKey (string)
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
      // payload: { item, index }
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
      // payload: { cartKey, quantity }
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
      // payload: items[] já normalizado
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
export function normalizeStoredItems(raw) {
  return raw.map((i) =>
    i.cartKey
      ? i
      : { ...i, size: i.size ?? null, cartKey: makeCartKey(i.id, i.size ?? null) }
  )
}
