/*
 * Cache TTL (Time To Live) em memória para respostas de API.
 * ────────────────────────────────────────────────────────────
 *
 * Antes, cada hook (useProducts, useProductDetail) mantinha seu próprio
 * objeto `{}` como cache. Isso funciona, mas tem dois problemas:
 *
 *   1. Entradas NUNCA expiravam — se o servidor atualizasse um produto,
 *      o usuário só veria a mudança ao recarregar a página inteira.
 *
 *   2. Cada hook reinventava a lógica, dificultando evoluir todo mundo
 *      junto (ex: quando quisermos limpar o cache após um logout).
 *
 * Este módulo centraliza o cache com um `Map` (mais eficiente que `{}`
 * para inserção/remoção frequente) e timestamp por entrada. Sempre que
 * lemos uma chave, comparamos `Date.now()` com o timestamp — se o TTL
 * estourou, a entrada é removida e `undefined` é retornado, sinalizando
 * ao chamador que precisa buscar de novo.
 *
 * Usamos `undefined` como "miss" (em vez de `null`) para diferenciar
 * de valores legítimos armazenados como `null`.
 */

import { CACHE_TTL } from './constants'

/*
 * Store singleton compartilhada por toda a aplicação.
 * `Map` é preferível a objeto literal porque:
 *   - Itera na ordem de inserção (útil para depuração).
 *   - Tem `.size`, `.delete`, `.clear` como métodos nativos.
 *   - Não colide com propriedades herdadas (ex: 'toString').
 */
const store = new Map()

/**
 * Lê uma entrada do cache, respeitando o TTL.
 *
 * @param {string} key - Chave identificadora (ex: `products:all`, `product:5`).
 * @param {number} [ttl=CACHE_TTL] - TTL customizado; útil para dados mais voláteis.
 * @returns {*|undefined} Valor cacheado, ou `undefined` se ausente/expirado.
 */
export function getCached(key, ttl = CACHE_TTL) {
  const entry = store.get(key)
  if (!entry) return undefined

  const age = Date.now() - entry.timestamp
  if (age > ttl) {
    // Entrada expirada: remover proativamente evita que o Map cresça
    // indefinidamente em sessões longas.
    store.delete(key)
    return undefined
  }

  return entry.value
}

/**
 * Salva um valor no cache com timestamp atual.
 *
 * @param {string} key - Chave identificadora.
 * @param {*} value - Valor a ser armazenado (pode ser qualquer tipo serializável).
 */
export function setCached(key, value) {
  store.set(key, { value, timestamp: Date.now() })
}

/**
 * Remove uma entrada específica do cache.
 * Útil após mutações (ex: admin alterou a lista de promoções).
 *
 * @param {string} key - Chave a ser invalidada.
 */
export function invalidateCache(key) {
  store.delete(key)
}

/**
 * Limpa o cache inteiro OU apenas entradas com um prefixo.
 *
 * Chamar `clearCache('products:')` apaga tudo de produtos mas preserva
 * outras chaves (ex: categorias). Útil ao trocar de contexto/usuário.
 *
 * @param {string} [prefix] - Se omitido, limpa tudo.
 */
export function clearCache(prefix) {
  if (!prefix) {
    store.clear()
    return
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
