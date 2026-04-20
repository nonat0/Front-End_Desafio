/*
  Serviço de produtos.

  Centraliza todas as chamadas relacionadas a produtos e categorias
  da Fake Store API. Isolar o consumo da API em uma única camada
  (padrão "service layer") traz três benefícios diretos.

  Primeiro, trocar a API no futuro (ex: migrar para um backend próprio)
  exige mudanças APENAS neste arquivo; os hooks e componentes nem
  precisam saber. Segundo, cada função aceita um objeto `{ signal }`
  opcional, que é o `AbortSignal` de um `AbortController`. Passar o
  signal ao Axios permite que o React CANCELE requisições em voo
  quando o usuário navega antes da resposta chegar, evitando race
  conditions onde a resposta antiga sobrescreve a nova. Terceiro, as
  funções ficam puras do ponto de vista de dependências: recebem
  entrada, devolvem Promise. Isso facilita teste unitário (basta
  mockar `apiClient`) e composição em hooks genéricos.

  Este módulo também é o ponto onde os produtos recebem a tradução
  PT-BR. A camada de i18n (`services/i18n`) é aplicada aqui, antes
  dos dados chegarem aos hooks, para que toda a aplicação consuma
  produtos já localizados sem precisar conhecer a existência do
  tradutor. O signal de cancelamento é propagado também para o
  tradutor, então abortar a busca aborta simultaneamente as chamadas
  à API de tradução, evitando trabalho desperdiçado.
 */

import apiClient from './client'
import {
  translateProduct,
  translateProducts,
  translateCategorySlugs,
} from '@/services/i18n'

/**
  Busca todos os produtos disponíveis, já com tradução aplicada.

  @param {object} [options]
  @param {AbortSignal} [options.signal] - Sinal para cancelamento externo.
  @returns {Promise<Product[]>}
 */
export async function fetchProducts({ signal } = {}) {
  const { data } = await apiClient.get('/products', { signal })
  return translateProducts(data, { signal })
}

/**
  Busca um produto pelo ID, já com tradução aplicada.

  @param {number|string} id
  @param {object} [options]
  @param {AbortSignal} [options.signal]
  @returns {Promise<Product>}
 */
export async function fetchProductById(id, { signal } = {}) {
  const { data } = await apiClient.get(`/products/${id}`, { signal })
  return translateProduct(data, { signal })
}

/**
  Busca todas as categorias disponíveis, devolvidas como objetos
  `{ slug, label }` onde `slug` é o identificador usado em rotas
  e filtros (inalterado em inglês) e `label` é o rótulo traduzido
  para exibição.

  @param {object} [options]
  @param {AbortSignal} [options.signal]
  @returns {Promise<Array<{ slug: string, label: string }>>}
 */
export async function fetchCategories({ signal } = {}) {
  const { data } = await apiClient.get('/products/categories', { signal })
  return translateCategorySlugs(data, { signal })
}

/**
  Busca produtos de uma categoria específica, já com tradução aplicada.
  A categoria de entrada continua sendo o slug em inglês da Fake Store
  (ex: `electronics`), preservando a contrapartida com as rotas.

  @param {string} category
  @param {object} [options]
  @param {AbortSignal} [options.signal]
  @returns {Promise<Product[]>}
 */
export async function fetchProductsByCategory(category, { signal } = {}) {
  const { data } = await apiClient.get(`/products/category/${category}`, { signal })
  return translateProducts(data, { signal })
}
