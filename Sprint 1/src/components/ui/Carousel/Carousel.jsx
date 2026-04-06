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

/* Pré-escaneia todos os arquivos em src/img/promobg/ em build time */
const promoBgs = import.meta.glob('../../../img/promobg/*', { eager: true, import: 'default' })

/* Retorna a URL do background para o produto:
   1. Imagem específica pelo ID  (ex: 3.jpg)
   2. Imagem global              (ex: global.jpg)
   3. undefined → fallback para o gradiente CSS */
function getPromoBg(productId) {
  const specific = Object.entries(promoBgs).find(([path]) =>
    path.match(new RegExp(`/${productId}\\.[^/]+$`))
  )
  if (specific) return specific[1]

  const global = Object.entries(promoBgs).find(([path]) =>
    path.match(/\/global\.[^/]+$/)
  )
  return global ? global[1] : undefined
}

export function Carousel() {
  const { promotedItems } = usePromotionsContext()
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const isPromo = promotedItems.length > 0

  /* Monta slides a partir dos produtos promovidos ou usa fallback */
  const slides = isPromo
    ? promotedItems.map((p) => ({
        id: p.id,
        title: p.title,
        discount: p.discount,
        originalPrice: formatPrice(p.price),
        promoPrice: formatPrice(applyDiscount(p.price, p.discount)),
        description: p.description,
        image: p.image,
        background: getPromoBg(p.id),
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
      {isPromo ? (
        /* Layout promocional: duas colunas — imagem | info */
        <div
          className={styles.promoLayout}
          style={slide.background ? { backgroundImage: `url(${slide.background})` } : undefined}
        >
          {slide.background && <div className={styles.promoBgOverlay} />}
          <div className={styles.promoImageBox}>
            <img
              key={slide.id + '-img'}
              src={slide.image}
              alt={slide.title}
              className={styles.promoProductImage}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>

          <div key={slide.id + '-info'} className={styles.promoInfoBox}>
            <div className={styles.promoBadges}>
              <span className={styles.promoBadge}>🔥 Promoção</span>
              <span className={styles.promoDiscountBadge}>−{slide.discount}%</span>
            </div>
            <h1 className={styles.promoTitle}>{slide.title}</h1>
            <div className={styles.promoPricing}>
              <span className={styles.promoOriginalPrice}>De {slide.originalPrice}</span>
              <span className={styles.promoFinalPrice}>Por {slide.promoPrice}</span>
            </div>
            <button
              className={styles.cta}
              onClick={() => navigate(`/product/${slide.productId}`)}
            >
              Ver produto
            </button>
          </div>
        </div>
      ) : (
        /* Layout padrão: imagem de fundo com overlay e texto */
        <>
          <div className={styles.bg}>
            <img
              key={slide.id}
              src={slide.image}
              alt={slide.title}
              className={styles.bgImage}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div className={styles.overlay} />
          </div>
          <div className={styles.content}>
            <h1 className={styles.title}>{slide.title}</h1>
            <p className={styles.description}>{slide.description}</p>
          </div>
        </>
      )}

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
