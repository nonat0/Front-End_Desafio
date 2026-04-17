/*
  useProductDetail — busca e gerencia estado de um produto individual.
  ────────────────────────────────────────────────────────────────────
 
    Usado na página de detalhes do produto. Assim como `useProducts`,
    é um hook "fino" que delega todo o trabalho bruto para `useFetch`
    e apenas formata a entrada/saída para o domínio.
  
    Pontos importantes:
  
    - `enabled: Boolean(id)` — se o `id` ainda não chegou (ex: leitura
      do `useParams` em um primeiro render), não disparamos a chamada.
      O hook fica em `idle` até o id estar disponível.
 
    - Chave de cache por id (`product:<id>`) — voltar para um produto
      já visitado é instantâneo enquanto o TTL não expirar.
 
    - Ao navegar para OUTRO produto, o useFetch aborta a request
      em voo do anterior — impedindo que, se o primeiro fetch
      demorar mais, ele sobrescreva o produto atual.
 */

import { useCallback } from 'react'
import { fetchProductById } from '@/services/api/products'
import { useFetch } from './useFetch'

/**
 * @param {number|string|undefined} id - ID do produto a buscar.
 */
export function useProductDetail(id) {
  const fetcher = useCallback(
    ({ signal }) => fetchProductById(id, { signal }),
    [id]
  )

  const query = useFetch(fetcher, {
    key: id ? `product:${id}` : null,
    enabled: Boolean(id),
  })

  return {
    product: query.data,
    loading: query.loading,
    error: query.error?.message ?? null,
    status: query.status,
    refetch: query.refetch,
  }
}
