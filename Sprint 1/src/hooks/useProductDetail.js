// useProductDetail — busca e gerencia estado de um produto individual.
// Usado na página de detalhes do produto.
// Inclui cache em memória para evitar re-fetches ao navegar de volta.

import { useEffect, useRef, useState } from 'react'
import { fetchProductById } from '@/services/api/products'

const detailCache = {}

export function useProductDetail(id) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!id) return
    if (detailCache[id]) {
      setProduct(detailCache[id])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    fetchProductById(id)
      .then((data) => {
        detailCache[id] = data
        if (mountedRef.current) setProduct(data)
      })
      .catch((err) => {
        if (mountedRef.current) setError(err.message)
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false)
      })
  }, [id])

  return { product, loading, error }
}
