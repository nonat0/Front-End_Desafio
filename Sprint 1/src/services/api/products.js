// Serviço de produtos.
// Centraliza todas as chamadas relacionadas a produtos e categorias.
// Trocar a API no futuro requer mudança apenas neste arquivo.

import apiClient from './client'

/**
 * Busca todos os produtos disponíveis.
 * @returns {Promise<Product[]>}
 */
export async function fetchProducts() {
  const { data } = await apiClient.get('/products')
  return data
}

/**
 * Busca um produto pelo ID.
 * @param {number|string} id
 * @returns {Promise<Product>}
 */
export async function fetchProductById(id) {
  const { data } = await apiClient.get(`/products/${id}`)
  return data
}

/**
 * Busca todas as categorias disponíveis.
 * @returns {Promise<string[]>}
 */
export async function fetchCategories() {
  const { data } = await apiClient.get('/products/categories')
  return data
}

/**
 * Busca produtos de uma categoria específica.
 * @param {string} category
 * @returns {Promise<Product[]>}
 */
export async function fetchProductsByCategory(category) {
  const { data } = await apiClient.get(`/products/category/${category}`)
  return data
}
