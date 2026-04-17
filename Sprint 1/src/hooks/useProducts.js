/*
 * useProducts — hook de domínio para listagem de produtos + categorias.
  ─────────────────────────────────────────────────────────────────────
 
   * Este é um hook "fino": ele compõe o hook genérico `useFetch` para
   resolver duas buscas independentes (produtos da categoria atual
   e lista de categorias) e devolve uma API conveniente para a UI.
 
  * Toda a lógica pesada (cache TTL, AbortController, máquina de estados)
   vive em `useFetch`. Aqui só dizemos O QUE buscar — mantendo o hook
   pequeno, testável e fácil de entender.
 
  * Benefícios frente à versão anterior:
    - Troca rápida de categoria (clicks em sequência) NÃO dispara
      race conditions: requests antigos são cancelados pelo signal.
 
    - Cache TTL compartilhado: navegar Home → Detalhe → Home não
      refaz a chamada dos produtos se ocorrer dentro do TTL.
 
    - Estado como enum `status` — a UI pode diferenciar claramente
      "nunca tentou carregar" (idle) de "está carregando" (loading)
      se precisar (útil para skeleton screens, p. ex.).
 */

import { useCallback } from 'react'
import {
  fetchCategories,
  fetchProducts,
  fetchProductsByCategory,
} from '@/services/api/products'
import { useFetch } from './useFetch'

/**
 * @param {string} [category='all'] - Slug da categoria ou 'all' para tudo.
 */
export function useProducts(category = 'all') {
  /*
    Chave de cache por categoria. Usamos prefixo `products:` para
    permitir invalidação em bloco no futuro (`clearCache('products:')`).
   */
  const productsKey = `products:${category}`

  /*
    O fetcher recebe `{ signal }` do useFetch e repassa ao service.
    `useCallback` aqui é opcional (useFetch captura por ref), mas
    mantém a função estável — hábito saudável.
   */
  const productsFetcher = useCallback(
    ({ signal }) =>
      category === 'all'
        ? fetchProducts({ signal })
        : fetchProductsByCategory(category, { signal }),
    [category]
  )

  const productsQuery = useFetch(productsFetcher, { key: productsKey })

  /*
    Categorias são globais (não dependem de filtro), por isso ficam
    em uma chamada separada com sua própria chave de cache.
    Falha silenciosa faz sentido aqui: não ter a lista de categorias
    não impede o usuário de ver produtos — só some o filtro.
   */
  const categoriesFetcher = useCallback(
    ({ signal }) => fetchCategories({ signal }),
    []
  )
  const categoriesQuery = useFetch(categoriesFetcher, { key: 'categories' })

  return {
    products: productsQuery.data ?? [],
    categories: categoriesQuery.data ?? [],
    loading: productsQuery.loading,
    error: productsQuery.error?.message ?? null,
    status: productsQuery.status,
    refetch: productsQuery.refetch,
  }
}
