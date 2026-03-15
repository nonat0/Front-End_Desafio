// Navbar — barra de navegação principal.
// Contém: logo, links (Loja, Watchlist, Promoções), badges de contagem,
// barra de busca e toggle de dark mode.
// Sticky no topo com blur para manter contexto durante scroll.
// Expansível para adicionar menu de usuário autenticado, notificações, etc.

import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCartContext } from '@/context/CartContext'
import { useWatchlistContext } from '@/context/WatchlistContext'
import { useThemeContext } from '@/context/ThemeContext'
import { useDebounce } from '@/hooks/useDebounce'
import { CartDrawer } from '@/components/cart/CartDrawer/CartDrawer'
import styles from './Navbar.module.css'

export function Navbar() {
  const { itemCount } = useCartContext()
  const { itemCount: watchCount } = useWatchlistContext()
  const { isDark, toggleTheme } = useThemeContext()
  const navigate = useNavigate()

  const [cartOpen, setCartOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const debouncedSearch = useDebounce(searchValue, 350)

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (debouncedSearch.trim()) {
      navigate(`/?search=${encodeURIComponent(debouncedSearch.trim())}`)
      setSearchValue('')
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.inner}`}>
          {/* Logo */}
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>◈</span>
            <span className={styles.logoText}>Desenvolve<span className={styles.logoAccent}>Store</span></span>
          </Link>

          {/* Nav links — desktop */}
          <nav className={styles.nav}>
            <NavLink to="/" end className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
              Loja
            </NavLink>
            <NavLink to="/watchlist" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
              Watchlist
              {watchCount > 0 && <span className={styles.badge}>{watchCount}</span>}
            </NavLink>
            <NavLink to="/promotions" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
              Promoções
            </NavLink>
          </nav>

          {/* Busca */}
          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <input
              type="search"
              placeholder="Buscar produtos…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className={styles.searchInput}
              aria-label="Buscar produtos"
            />
            <button type="submit" className={styles.searchBtn} aria-label="Pesquisar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </form>

          {/* Ações */}
          <div className={styles.actions}>
            {/* Dark mode */}
            <button className={styles.iconBtn} onClick={toggleTheme} aria-label="Alternar tema">
              {isDark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Carrinho */}
            <button
              className={styles.iconBtn}
              onClick={() => setCartOpen(true)}
              aria-label={`Carrinho — ${itemCount} itens`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {itemCount > 0 && (
                <span className={styles.cartBadge}>{itemCount > 99 ? '99+' : itemCount}</span>
              )}
            </button>

            {/* Menu mobile */}
            <button
              className={`${styles.iconBtn} ${styles.menuBtn}`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen
                  ? <path d="M18 6 6 18M6 6l12 12"/>
                  : <path d="M3 12h18M3 6h18M3 18h18"/>}
              </svg>
            </button>
          </div>
        </div>

        {/* Menu mobile expandido */}
        {menuOpen && (
          <div className={styles.mobileMenu}>
            <NavLink to="/" end onClick={() => setMenuOpen(false)} className={styles.mobileLink}>Loja</NavLink>
            <NavLink to="/watchlist" onClick={() => setMenuOpen(false)} className={styles.mobileLink}>
              Watchlist {watchCount > 0 && `(${watchCount})`}
            </NavLink>
            <NavLink to="/promotions" onClick={() => setMenuOpen(false)} className={styles.mobileLink}>Promoções</NavLink>
          </div>
        )}
      </header>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
