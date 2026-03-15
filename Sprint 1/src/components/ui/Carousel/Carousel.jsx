// Carousel — hero section da loja.
// Exibe slides dos produtos em promoção com imagem, título e descrição.
// Quando não há promoções ativas, usa o array CAROUSEL_FALLBACK.
// Auto-play configurável pelo intervalo CAROUSEL_INTERVAL.
// Expansível para adicionar slides de banners editoriais ou campanhas.

import { useEffect, useState } from 'react'
import { CAROUSEL_FALLBACK, CAROUSEL_INTERVAL } from '@/utils/constants'
import { usePromotionsContext } from '@/context/PromotionsContext'
import { formatPrice, applyDiscount } from '@/utils/formatters'
import { useNavigate } from 'react-router-dom'
import styles from './Carousel.module.css'

export function Carousel() {
  const { promotedItems, discount } = usePromotionsContext()
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  /* Monta slides a partir dos produtos promovidos ou usa fallback */
  const slides = promotedItems.length > 0
    ? promotedItems.map((p) => ({
        id: p.id,
        title: p.title,
        description: `${discount}% de desconto • De ${formatPrice(p.price)} por ${formatPrice(applyDiscount(p.price, discount))}`,
        image: p.image,
        productId: p.id,
      }))
    : CAROUSEL_FALLBACK

  /* Auto-play: avança slide a cada CAROUSEL_INTERVAL ms */
  useEffect(() => {
    if (paused || slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, CAROUSEL_INTERVAL)
    return () => clearInterval(timer)
  }, [paused, slides.length])

  /* Reinicia o índice se o número de slides mudar (ex: promoção removida) */
  useEffect(() => {
    setCurrent(0)
  }, [slides.length])

  const goTo = (index) => setCurrent(index)
  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length)
  const next = () => setCurrent((c) => (c + 1) % slides.length)

  const slide = slides[current]

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Imagem de fundo com overlay */}
      <div>
        <div className={styles.bg}>
        <img
          key={slide.id}
          src={slide.image}
          alt={slide.title}
          className={styles.bgImage}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80' }}
        />
        <div className={styles.overlay} />
        </div>

        {/* Conteúdo do slide */}
        <div className={styles.content}>
          {promotedItems.length > 0 && (
            <span className={styles.promoBadge}>🔥 Promoção</span>
          )}
          <h1 className={styles.title}>{slide.title}</h1>
          <p className={styles.description}>{slide.description}</p>
          {slide.productId && (
            <button
              className={styles.cta}
              onClick={() => navigate(`/product/${slide.productId}`)}
            >
              Ver produto
            </button>
          )}
        </div>
      </div>
      

      {/* Controles de navegação */}
      {slides.length > 1 && (
        <>
          <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="Slide anterior">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="Próximo slide">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {/* Indicadores (dots) */}
          <div className={styles.dots}>
            {slides.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Ir para slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
