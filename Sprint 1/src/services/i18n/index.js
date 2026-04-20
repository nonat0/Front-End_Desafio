/*
  Barrel do módulo de internacionalização.

  Exporta apenas os símbolos de alto nível destinados a consumidores
  externos (services e hooks). O módulo cru `translate.js` permanece
  como detalhe de implementação; quem precisar de tradução de texto
  arbitrário importa `translateText` via este barrel, não diretamente.
 */

export {
  translateProduct,
  translateProducts,
  translateCategorySlugs,
  translateText,
} from './productTranslator'

export { clearTranslationCache } from './translate'
