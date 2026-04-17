// Página Black Friday — campanha temporária com contagem regressiva de 24h
// e vitrine dos produtos promovidos alimentados via painel Admin.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard } from '@/components/product/ProductCard/ProductCard'
import { usePromotionsContext } from '@/context/PromotionsContext'
import styles from './BlackFriday.module.css'

// Alvo dinâmico: meia-noite do próximo dia — dá sempre até 24h restantes.
function getNextMidnight() {
  const d = new Date()
  d.setHours(24, 0, 0, 0)
  return d.getTime()
}

function useCountdown() {
  const [target, setTarget] = useState(getNextMidnight)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  /* Quando o alvo expira, rola automaticamente para o próximo ciclo de 24h */
  useEffect(() => {
    if (now >= target) setTarget(getNextMidnight())
  }, [now, target])

  const remaining = Math.max(0, target - now)
  const totalSec = Math.floor(remaining / 1000)
  return {
    hours:   String(Math.floor(totalSec / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0'),
    seconds: String(totalSec % 60).padStart(2, '0'),
  }
}

export function BlackFriday() {
  const { eventItems } = usePromotionsContext()
  const { hours, minutes, seconds } = useCountdown()

  const products = useMemo(() => eventItems ?? [], [eventItems])

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className="container">
          <span className={styles.kicker}>Oferta por tempo limitado</span>
          <h1 className={styles.title}>Black Friday</h1>
          <p className={styles.subtitle}>
            Descontos exclusivos nos produtos selecionados. A campanha encerra em:
          </p>

          <div className={styles.countdown} role="timer" aria-live="polite">
            <div className={styles.unit}>
              <span className={styles.digits}>{hours}</span>
              <span className={styles.label}>Horas</span>
            </div>
            <span className={styles.sep}>:</span>
            <div className={styles.unit}>
              <span className={styles.digits}>{minutes}</span>
              <span className={styles.label}>Minutos</span>
            </div>
            <span className={styles.sep}>:</span>
            <div className={styles.unit}>
              <span className={styles.digits}>{seconds}</span>
              <span className={styles.label}>Segundos</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.productsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Produtos em promoção</h2>
            <span className={styles.sectionCount}>
              {products.length} {products.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {products.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Nenhum produto promovido no momento</p>
              <p className={styles.emptyDesc}>
                As ofertas da Black Friday são definidas pelo painel Admin.
              </p>
              <Link to="/admin" className={styles.emptyLink}>Ir para o Admin</Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
