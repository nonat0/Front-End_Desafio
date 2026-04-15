// Funções utilitárias de formatação.
// Centralizadas aqui para consistência visual em toda a aplicação.
// Fácil de expandir para novos formatos (ex: moedas internacionais, datas localizadas).

/**
 * Formata um número como moeda BRL.
 * @param {number} value - Valor numérico a formatar
 * @returns {string} Ex: "R$ 129,90"
 */
export function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Aplica desconto percentual sobre um preço e retorna o valor final.
 * @param {number} originalPrice - Preço original
 * @param {number} discountPercent - Percentual de desconto (0–100)
 * @returns {number} Preço com desconto aplicado
 */
export function applyDiscount(originalPrice, discountPercent) {
  if (!discountPercent || discountPercent <= 0) return originalPrice
  return originalPrice * (1 - discountPercent / 100)
}

/**
 * Trunca um texto longo adicionando reticências ao final.
 * @param {string} text - Texto original
 * @param {number} maxLength - Comprimento máximo
 * @returns {string} Texto truncado ou original se dentro do limite
 */
export function truncateText(text, maxLength = 60) {
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength).trimEnd() + '…' : text
}

/**
 * Capitaliza a primeira letra de uma string.
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Formata a nota de avaliação com uma casa decimal.
 * @param {number} rating
 * @returns {string} Ex: "4.3"
 */
export function formatRating(rating) {
  return Number(rating).toFixed(1)
}

/**
 * Retorna as opções de tamanho/variante para um produto conforme sua categoria.
 * Roupas → P, M, G. Jóias → tamanho único. Eletrônicos → armazenamento ou polegadas (monitor).
 * @param {object} product
 * @returns {{ label: string, options: string[] }}
 */
export function getProductSizeOptions(product) {
  const category = (product?.category || '').toLowerCase()
  const title    = (product?.title    || '').toLowerCase()

  /* Apenas roupas reais (não mochilas) têm grade de tamanhos */
  if (
    (category === "men's clothing" || category === "women's clothing") &&
    !title.includes('backpack')
  ) {
    return { label: 'Tamanho', options: ['P', 'M', 'G'] }
  }

  return null
}
