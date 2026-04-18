/*
  Barrel file dos contextos da aplicação.

  Expõe APENAS os HOOKS de consumo (use*Context) e os Providers.
  Detalhes internos (reducers, helpers privados como makeCartKey)
  ficam fora — são "implementação", não "API pública" do módulo.

  Exemplo:
    import { useCartContext, AppProviders } from '@/context'
 */

export { AppProviders } from './AppProviders'

export { CartProvider, useCartContext } from './CartContext'
export { WatchlistProvider, useWatchlistContext } from './WatchlistContext'
export { PromotionsProvider, usePromotionsContext } from './PromotionsContext'
export { SearchProvider, useSearchContext } from './SearchContext'
export { ToastProvider, useToastContext } from './ToastContext'
export { ThemeProvider, useThemeContext } from './ThemeContext'
