// Constantes centralizadas da aplicação.
// Alterar valores aqui reflete em toda a aplicação,
// facilitando manutenção e futuras integrações (ex: trocar API, ajustar limites).

import banner1 from '@/img/banner-1.png'
import banner2 from '@/img/banner-2.png'
import banner3 from '@/img/banner-3.png'

/* URL base da Fake Store API */
export const API_BASE_URL = 'https://fakestoreapi.com'

/* Limite máximo de itens em promoção simultâneos */
export const MAX_PROMO_ITEMS = 3

/* Chaves do localStorage — evita strings duplicadas pelo código */
export const STORAGE_KEYS = {
  CART:       'desenvolve_cart',
  WATCHLIST:  'desenvolve_watchlist',
  PROMOTIONS: 'desenvolve_promotions',
  THEME:      'desenvolve_theme',
}

/* Duração padrão dos toasts em milissegundos */
export const TOAST_DURATION = 3000

/* Intervalo de auto-troca do carousel em milissegundos */
export const CAROUSEL_INTERVAL = 4500

/* Fallback para o carousel quando não há promoções ativas */
export const CAROUSEL_FALLBACK = [
  {
    id: 'fallback-1',
    title: 'Bem-vindo à Desenvolve Store',
    description: 'Os melhores produtos com os melhores preços. Explore nossa coleção completa.',
    image: banner1,
  },
  {
    id: 'fallback-2',
    title: 'Qualidade Garantida',
    description: 'Produtos selecionados com cuidado para a melhor experiência de compra.',
    image: banner2,
  },
  {
    id: 'fallback-3',
    title: 'Entrega Rápida e Segura',
    description: 'Receba seus pedidos com agilidade e total segurança.',
    image: banner3,
  },
]
