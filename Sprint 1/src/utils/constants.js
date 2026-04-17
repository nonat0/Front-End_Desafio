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

/*
 * TTL (Time To Live) do cache de requisições em milissegundos.
 
 * Após esse período, uma entrada do cache é considerada "velha" e será
   descartada — forçando uma nova chamada à API. O valor de 5 minutos
   equilibra performance (evita requests repetidos em navegação rápida)
   com frescor dos dados (catálogo pode mudar no servidor).
 
 * Antes do TTL, o cache apenas crescia até a página ser recarregada.
 */
export const CACHE_TTL = 5 * 60 * 1000

/*
 * Parâmetros do retry automático aplicado no interceptor do Axios.
 
  - MAX_ATTEMPTS: número máximo de re-tentativas após a falha inicial.
  - BASE_DELAY_MS: tempo de espera da PRIMEIRA re-tentativa.
  - MAX_DELAY_MS:  teto de espera para evitar delays absurdos.
 
  Usamos backoff exponencial — cada tentativa espera o dobro da anterior
  (500ms → 1000ms → 2000ms …), limitado por MAX_DELAY_MS. Isso dá tempo
  para a rede/servidor se recuperar sem martelar o backend.
 */
export const API_RETRY = {
  MAX_ATTEMPTS: 2,
  BASE_DELAY_MS: 500,
  MAX_DELAY_MS: 4000,
}

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
