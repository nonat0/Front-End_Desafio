// AppProviders — composição de todos os contextos.
// Centraliza a árvore de providers para manter o main.jsx limpo.
// A ordem importa: PromotionsProvider deve vir antes de CartProvider
// pois CartContext depende de getEffectivePrice do PromotionsContext.

import { ThemeProvider } from './ThemeContext'
import { ToastProvider } from './ToastContext'
import { PromotionsProvider } from './PromotionsContext'
import { CartProvider } from './CartContext'
import { WatchlistProvider } from './WatchlistContext'
import { SearchProvider } from './SearchContext'

export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <PromotionsProvider>
          <CartProvider>
            <WatchlistProvider>
              <SearchProvider>
                {children}
              </SearchProvider>
            </WatchlistProvider>
          </CartProvider>
        </PromotionsProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
