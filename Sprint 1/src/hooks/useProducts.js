// useProducts — hook central para busca de produtos.
// Gerencia loading, erro e cache em memória durante a sessão.
// O cache evita requisições repetidas para a mesma categoria,
// melhorando a performance e reduzindo consumo da API.
// Expansível para incluir paginação, ordenação e busca server-side.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchCategories,
  fetchProducts,
  fetchProductsByCategory,
} from '@/services/api/products'

/* Cache simples em memória — persiste durante a sessão do browser */
const cache = {}

export function useProducts(category = 'all') {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /* Ref para evitar atualização de estado em componente desmontado */
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const loadCategories = useCallback(async () => {
    if (cache['categories']) {
      setCategories(cache['categories'])
      return
    }
    try {
      const data = await fetchCategories()
      cache['categories'] = data
      if (mountedRef.current) setCategories(data)
    } catch { /* Categorias são opcionais, falha silenciosa */ }
  }, [])

  const loadProducts = useCallback(async () => {
    const cacheKey = category === 'all' ? '__all__' : category
    if (cache[cacheKey]) {
      if (mountedRef.current) {
        setProducts(cache[cacheKey])
        setLoading(false)
      }
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data =
        category === 'all'
          ? await fetchProducts()
          : await fetchProductsByCategory(category)
      cache[cacheKey] = data
      if (mountedRef.current) setProducts(data)
    } catch (err) {
      if (mountedRef.current) setError(err.message)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [category])

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [loadCategories, loadProducts])

  return { products, categories, loading, error, refetch: loadProducts }
}
