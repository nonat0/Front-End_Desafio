/*
  Promotions — página /admin do painel de promoções.

  Esta página é puramente "orquestradora": ela apenas escolhe entre
  dois CANAIS de promoção (Eventos e Pontuais) e injeta no PromoSection
  os handlers/estado correspondentes do PromotionsContext.

  - Eventos alimenta o grid da página black-friday(sem limite — o admin escolhe quantos quiser).

  - Promoções pontuais  alimenta o carousel da Home (limitado a MAX_PROMO_ITEMS para não diluir o destaque visual de cada slide).

  Toda a UI (contador, descontos individuais, filtros, grid e modais)
  vive em PromoSection — ver `./PromoSection.jsx`. Cada sub-componente
  da página tem agora seu próprio arquivo, o que mantém este aqui
  enxuto e fácil de ler "de cima a baixo".
 */

import { useState } from 'react'
import { usePromotionsContext } from '@/context/PromotionsContext'
import { useProducts } from '@/hooks/useProducts'
import { MAX_PROMO_ITEMS } from '@/utils/constants'
import { PromoSection } from './PromoSection'
import styles from './Promotions.module.css'

export function Promotions() {
  const {
    eventItems,
    isEventItem,
    getEventItemDiscount,
    addEventItem,
    removeEventItem,
    setEventItemDiscount,
    clearEventItems,

    spotItems,
    isSpotItem,
    getSpotItemDiscount,
    addSpotItem,
    removeSpotItem,
    setSpotItemDiscount,
    clearSpotItems,
  } = usePromotionsContext()

  const { products, categories, loading } = useProducts('all')
  const [activeTab, setActiveTab] = useState('events')

  return (
    <main className={styles.main}>
      <div className="container">

        {/* Cabeçalho */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Admin</h1>
            <p className={styles.pageDesc}>
              Gerencie as promoções da loja em dois canais independentes.
            </p>
          </div>
        </div>

        {/* Abas de canais */}
        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'events'}
            className={`${styles.tab} ${activeTab === 'events' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <span className={styles.tabLabel}>Eventos</span>
            <span className={styles.tabCount}>{eventItems.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'spots'}
            className={`${styles.tab} ${activeTab === 'spots' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('spots')}
          >
            <span className={styles.tabLabel}>Promoções pontuais</span>
            <span className={styles.tabCount}>{spotItems.length}</span>
          </button>
        </div>

        {activeTab === 'events' ? (
          <PromoSection
            description="Selecione quantos produtos quiser para o grid da página Black Friday (desconto de 0–50% por item)."
            items={eventItems}
            isSelected={isEventItem}
            getDiscount={getEventItemDiscount}
            onAdd={addEventItem}
            onRemove={removeEventItem}
            onSetDiscount={setEventItemDiscount}
            onClear={clearEventItems}
            products={products}
            categories={categories}
            loading={loading}
            maxItems={Infinity}
          />
        ) : (
          <PromoSection
            description={`Selecione até ${MAX_PROMO_ITEMS} produtos para o carousel da página inicial (desconto de 0–50% por item).`}
            items={spotItems}
            isSelected={isSpotItem}
            getDiscount={getSpotItemDiscount}
            onAdd={addSpotItem}
            onRemove={removeSpotItem}
            onSetDiscount={setSpotItemDiscount}
            onClear={clearSpotItems}
            products={products}
            categories={categories}
            loading={loading}
            maxItems={MAX_PROMO_ITEMS}
          />
        )}
      </div>
    </main>
  )
}
