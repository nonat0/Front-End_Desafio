/*
  Barrel file dos hooks customizados.

  Permite importação agrupada:
    import { useProducts, useDebounce } from '@/hooks'

  em vez do path-por-arquivo:
    import { useProducts } from '@/hooks/useProducts'
    import { useDebounce } from '@/hooks/useDebounce'

  É puramente ADITIVO — os imports antigos com path completo
  continuam funcionando, então nenhuma página precisa mudar
  agora; o barrel está disponível para novos consumers.
 */

export { useProducts } from './useProducts'
export { useProductDetail } from './useProductDetail'
export { useDebounce } from './useDebounce'
export { useFetch } from './useFetch'
export { useLatestRef } from './useLatestRef'
