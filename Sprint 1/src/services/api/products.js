/*
 * Serviço de produtos.
 * ────────────────────
 *
 * Centraliza todas as chamadas relacionadas a produtos e categorias
 * da Fake Store API. Isolar o consumo da API em uma única camada
 * (padrão "service layer") traz três benefícios:
 *
 *   1. Trocar a API no futuro (ex: migrar para um backend próprio)
 *      exige mudanças APENAS neste arquivo — os hooks e componentes
 *      nem precisam saber.
 *
 *   2. Cada função aceita um objeto `{ signal }` opcional, que é o
 *      `AbortSignal` de um `AbortController`. Passar o signal ao Axios
 *      permite que o React CANCELE requisições em voo quando o usuário
 *      navega antes da resposta chegar — evitando "race conditions"
 *      onde a resposta antiga sobrescreve a nova.
 *
 *   3. As funções ficam "puras" do ponto de vista de dependências:
 *      recebem entrada, devolvem Promise. Isso facilita teste unitário
 *      (basta mockar `apiClient`) e composição em hooks genéricos.
 */

import apiClient from './client'

/**
 * Busca todos os produtos disponíveis.
 *
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - Sinal para cancelamento externo.
 * @returns {Promise<Product[]>}
 */
export async function fetchProducts({ signal } = {}) {
  const { data } = await apiClient.get('/products', { signal })
  return data
}

/**
 * Busca um produto pelo ID.
 *
 * @param {number|string} id
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Product>}
 */
export async function fetchProductById(id, { signal } = {}) {
  const { data } = await apiClient.get(`/products/${id}`, { signal })
  return data
}

/**
 * Busca todas as categorias disponíveis.
 *
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<string[]>}
 */
export async function fetchCategories({ signal } = {}) {
  const { data } = await apiClient.get('/products/categories', { signal })
  return data
}

/**
 * Busca produtos de uma categoria específica.
 *
 * @param {string} category
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Product[]>}
 */
export async function fetchProductsByCategory(category, { signal } = {}) {
  const { data } = await apiClient.get(`/products/category/${category}`, { signal })
  return data
}
