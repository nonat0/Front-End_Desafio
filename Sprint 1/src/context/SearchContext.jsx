// SearchContext — estado global da busca reativa.
// A Navbar escreve o termo digitado, a Home lê e filtra.
// Quando o input esvazia, searchQuery volta a '' e o grid exibe todos os produtos.

import { createContext, useCallback, useContext, useState } from 'react'

const SearchContext = createContext(null)

export function SearchProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('')

  const clearSearch = useCallback(() => setSearchQuery(''), [])

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery, clearSearch }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearchContext() {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearchContext deve ser usado dentro de SearchProvider')
  return ctx
}
