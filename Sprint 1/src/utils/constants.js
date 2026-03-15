// Constantes centralizadas da aplicação.
// Alterar valores aqui reflete em toda a aplicação,
// facilitando manutenção e futuras integrações (ex: trocar API, ajustar limites).

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
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
  },
  {
    id: 'fallback-2',
    title: 'Qualidade Garantida',
    description: 'Produtos selecionados com cuidado para a melhor experiência de compra.',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&q=80',
  },
  {
    id: 'fallback-3',
    title: 'Entrega Rápida e Segura',
    description: 'Receba seus pedidos com agilidade e total segurança.',
    image: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=1200&q=80',
  },
]
