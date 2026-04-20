/*
  Enriquecedor de produtos com tradução PT-BR.

  Este módulo é a costura entre a camada crua de tradução (`translate.js`,
  que fala com a API e cacheia) e a camada de serviço de produtos
  (`services/api/products.js`, que expõe os dados para hooks e
  componentes). Ele concentra a semântica específica do domínio
  "produto": quais campos faz sentido traduzir, como injetar o resultado
  preservando o shape original do objeto e como tratar o campo
  `category`, que serve simultaneamente como rótulo visível e como
  slug usado em rotas e filtros.

  Separar esse conhecimento de domínio do módulo cru de tradução permite
  trocar o fornecedor de tradução (MyMemory por outro) sem mexer em
  lógica de produto, e vice-versa: alterar quais campos são traduzidos
  exige alteração só aqui, sem mexer na mecânica de cache ou HTTP.
 */

import { translateBatch, translateText } from './translate'

/*
  Campos de texto do produto que passam pelo tradutor. Mantê-los em uma
  constante centraliza a decisão: adicionar `shortDescription` no
  futuro, por exemplo, exige mudar apenas esta linha. Incluímos
  `category` para que toda a localização flua pela mesma API, sem
  caminhos paralelos (dicionário manual + API) que dividiriam a fonte
  de verdade.
 */
const TRANSLATABLE_FIELDS = ['title', 'description', 'category']

/**
  Traduz os campos de texto de um produto e devolve uma cópia enriquecida.

  A categoria original (em inglês) é preservada no campo novo
  `categorySlug`, porque a UI a usa como chave em rotas e filtros
  (`/products/category/jewelery`). Sobrescrevemos apenas o `category`
  visível com o rótulo traduzido, mantendo compatibilidade com o resto
  do código que ainda depende do slug em inglês.

  Usamos `translateBatch` mesmo para um único produto: os três campos
  são traduzidos em paralelo, aproveitando a concorrência configurada
  e respeitando o limite global. O spread final preserva quaisquer
  campos extras que a API venha a adicionar, evitando perda silenciosa
  de dados em upgrades da Fake Store.

  @param {object} product
  @param {object} [options]
  @param {AbortSignal} [options.signal]
  @returns {Promise<object>}
 */
export async function translateProduct(product, { signal } = {}) {
  if (!product || typeof product !== 'object') return product

  const sourceTexts = TRANSLATABLE_FIELDS.map((field) => product[field] ?? '')
  const translated = await translateBatch(sourceTexts, { signal })

  const overrides = {}
  TRANSLATABLE_FIELDS.forEach((field, index) => {
    overrides[field] = translated[index]
  })

  return {
    ...product,
    ...overrides,
    categorySlug: product.category,
  }
}

/**
  Traduz uma lista de produtos em uma única varredura.

  Achatamos todos os campos traduzíveis de todos os produtos em um
  único array linear antes de chamar o batch. Isso permite que o
  `translateBatch` aplique a concorrência global sobre o conjunto
  inteiro — com 20 produtos, por exemplo, temos um único lote de 60
  strings respeitando o limite de paralelismo, em vez de 20 lotes
  separados de 3 strings cada que desperdiçariam o orçamento de
  concorrência.

  Um array `positions` paralelo registra a qual produto/campo cada
  posição do array linear pertence, permitindo desdobrar o resultado
  de volta no shape original sem ambiguidade de índice.

  @param {object[]} products
  @param {object} [options]
  @param {AbortSignal} [options.signal]
  @returns {Promise<object[]>}
 */
export async function translateProducts(products, { signal } = {}) {
  if (!Array.isArray(products) || products.length === 0) return products

  const flatTexts = []
  const positions = []

  products.forEach((product, productIndex) => {
    TRANSLATABLE_FIELDS.forEach((field) => {
      positions.push({ productIndex, field })
      flatTexts.push(product[field] ?? '')
    })
  })

  const flatTranslated = await translateBatch(flatTexts, { signal })

  const overridesByProduct = products.map(() => ({}))
  positions.forEach(({ productIndex, field }, i) => {
    overridesByProduct[productIndex][field] = flatTranslated[i]
  })

  return products.map((product, i) => ({
    ...product,
    ...overridesByProduct[i],
    categorySlug: product.category,
  }))
}

/**
  Traduz uma lista de slugs de categoria usados pelo filtro da UI.

  Devolvemos `{ slug, label }` em vez de strings traduzidas cruas
  porque a UI precisa dos dois valores simultaneamente: o `slug`
  original é usado para montar chamadas à API
  (`/products/category/electronics`), enquanto o `label` é o que o
  usuário lê. Misturar os dois em uma string só forçaria o componente
  a manter um mapa paralelo de correspondência, complicando sem ganho.

  @param {string[]} slugs
  @param {object} [options]
  @param {AbortSignal} [options.signal]
  @returns {Promise<Array<{ slug: string, label: string }>>}
 */
export async function translateCategorySlugs(slugs, { signal } = {}) {
  if (!Array.isArray(slugs) || slugs.length === 0) return []
  const labels = await translateBatch(slugs, { signal })
  return slugs.map((slug, i) => ({ slug, label: labels[i] ?? slug }))
}

/*
  Re-export de `translateText` para que todos os consumidores importem
  sempre a partir deste módulo de domínio. Isso mantém o `translate.js`
  cru como detalhe interno, livre para ser refatorado sem afetar quem
  só precisa da funcionalidade de alto nível.
 */
export { translateText }
