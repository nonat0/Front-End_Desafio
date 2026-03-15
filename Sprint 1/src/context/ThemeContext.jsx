// ThemeContext — gerencia o tema claro/escuro da aplicação.
// Aplica o atributo `data-theme` no elemento raiz HTML para que
// as variáveis CSS do tema escuro entrem em vigor automaticamente.
// Persiste a preferência do usuário no localStorage.

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { STORAGE_KEYS } from '@/utils/constants'
import { getItem, setItem } from '@/services/storage/localStorage'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    /* Respeita preferência salva ou do sistema operacional */
    const saved = getItem(STORAGE_KEYS.THEME)
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  /* Aplica o atributo no <html> sempre que o tema muda */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    setItem(STORAGE_KEYS.THEME, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeContext deve ser usado dentro de ThemeProvider')
  return ctx
}
