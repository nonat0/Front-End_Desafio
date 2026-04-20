/*
  Tradutor EN → PT-BR baseado na API pública MyMemory.

  Traduz textos curtos (títulos, descrições e categorias dos produtos
  da Fake Store API, que só vêm em inglês) para português do Brasil,
  sem depender de API key ou backend próprio.

 */

import { getItem, setItem } from '@/services/storage/localStorage'
import { STORAGE_KEYS, TRANSLATE_API } from '@/utils/constants'

/*
  Cache em memória que espelha o localStorage. Mantemos em memória para
  evitar JSON.parse a cada lookup durante a sessão: a primeira chamada
  hidrata o objeto a partir do storage e todas as seguintes leem direto
  daqui. A cada tradução nova, sincronizamos de volta para o storage.

  O formato é um mapa simples `{ [textoOriginal]: textoTraduzido }`.
  Usar o próprio texto em inglês como chave deixa o conteúdo do storage
  legível no DevTools para inspeção e debug, e tradução é determinística
  pela entrada — não há risco de colisão.
 */
let memoryCache = null

function ensureCacheLoaded() {
  if (memoryCache !== null) return
  memoryCache = getItem(STORAGE_KEYS.TRANSLATIONS, {}) ?? {}
}

function persistCache() {
  /*
    Gravamos a cada tradução nova. O custo é baixo (alguns KB, <1ms) e
    o ganho é que, se o usuário fechar a aba no meio de um lote, tudo
    que já foi traduzido fica disponível na próxima sessão — o cache
    amortiza seu custo incrementalmente.
   */
  setItem(STORAGE_KEYS.TRANSLATIONS, memoryCache)
}

/*
  Detecta respostas "envenenadas" da MyMemory. Em alguns casos a API
  responde HTTP 200 com texto de erro dentro do próprio campo
  `translatedText` (ex: "PLEASE SELECT TWO DISTINCT LANGUAGES",
  "MYMEMORY WARNING: ..."). Se tratássemos esses casos como sucesso,
  o lixo iria parar na UI. Aqui identificamos os padrões conhecidos
  e devolvemos false — o caller cai no fallback para o texto original.

  O heurístico final (resposta idêntica ao original com mais de uma
  palavra) cobre o caso em que a API ignorou silenciosamente a tradução.
  Limitamos a frases com duas ou mais palavras para não marcar como
  suspeita uma sigla ou termo que legitimamente não tem tradução.
 */
function isSuspiciousTranslation(translated, original) {
  if (!translated || typeof translated !== 'string') return true
  const upper = translated.toUpperCase()
  if (upper.startsWith('PLEASE SELECT')) return true
  if (upper.startsWith('MYMEMORY WARNING')) return true
  if (upper.startsWith('INVALID')) return true
  if (translated === original && original.trim().split(/\s+/).length > 1) return true
  return false
}

/*
  Monta a URL da chamada codificando o parâmetro `q`. Títulos e
  descrições podem conter aspas, `&` e `?` que quebrariam a query
  string se concatenados diretamente; `URLSearchParams` resolve
  a codificação de forma segura.
 */
function buildUrl(text) {
  const params = new URLSearchParams({
    q: text,
    langpair: TRANSLATE_API.LANG_PAIR,
  })
  return `${TRANSLATE_API.BASE_URL}?${params.toString()}`
}

/*
  Faz a chamada HTTP crua. Isolamos em uma função própria para facilitar
  testes (basta substituir este helper por um mock) e para manter o
  fluxo principal de `translateText` legível.

  Optamos por `fetch` nativo em vez do axios do projeto porque o
  `apiClient` já está configurado com baseURL da Fake Store API, não
  precisamos do interceptor de retry (tradução é best-effort, uma
  tentativa basta) e assim evitamos carregar lógica desnecessária.

  O timeout local usa um `AbortController` próprio combinado com o
  signal externo que o caller possa ter passado: se qualquer um dos
  dois disparar, a requisição aborta. Sem esse teto local, uma API
  que pare de responder sem fechar a conexão deixaria o fetch
  pendurado indefinidamente.
 */
async function callTranslateApi(text, { signal } = {}) {
  const localController = new AbortController()
  const timeoutId = setTimeout(() => localController.abort(), TRANSLATE_API.TIMEOUT_MS)

  const onExternalAbort = () => localController.abort()
  signal?.addEventListener('abort', onExternalAbort)

  try {
    const response = await fetch(buildUrl(text), { signal: localController.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const json = await response.json()
    return json?.responseData?.translatedText
  } finally {
    clearTimeout(timeoutId)
    signal?.removeEventListener('abort', onExternalAbort)
  }
}

/**
  Traduz um único texto EN → PT-BR.

  Textos vazios ou só com espaços retornam intactos, evitando gastar
  cota com input inútil. Cache hit devolve síncrono imediato. Qualquer
  falha (rede, timeout, resposta suspeita) retorna o ORIGINAL e a
  função NUNCA lança — o caller não precisa de try/catch.

  @param {string} text
  @param {object} [options]
  @param {AbortSignal} [options.signal] - Cancelamento externo (ex: do useFetch).
  @returns {Promise<string>}
 */
export async function translateText(text, { signal } = {}) {
  if (!text || typeof text !== 'string' || !text.trim()) return text

  ensureCacheLoaded()
  const cached = memoryCache[text]
  if (cached) return cached

  try {
    const translated = await callTranslateApi(text, { signal })
    if (isSuspiciousTranslation(translated, text)) return text

    memoryCache[text] = translated
    persistCache()
    return translated
  } catch {
    /*
      Falha silenciosa intencional. Logar aqui geraria ruído no console
      em cenários comuns (offline, rate-limit). Para depurar basta
      inspecionar a chave TRANSLATIONS do localStorage e comparar o que
      foi cacheado com o que faltou.
     */
    return text
  }
}

/**
  Traduz um array de textos com concorrência limitada.

  A execução é feita em chunks de `TRANSLATE_API.CONCURRENCY`: o lote
  aguarda terminar antes do próximo começar. Isso equilibra vazão e
  respeito ao servidor; abrir dezenas de requests em paralelo leva a
  rate-limit e, ironicamente, piora o tempo total.

  O resultado preserva a ORDEM de entrada — garantia importante para
  casos onde cada posição do array tem significado (ex: campos de um
  produto). Posições não traduzidas por abort no meio do lote caem no
  fallback do texto original, mantendo a invariante de que o retorno
  tem o mesmo tamanho da entrada e nunca contém undefined.

  @param {string[]} texts
  @param {object} [options]
  @param {AbortSignal} [options.signal]
  @returns {Promise<string[]>}
 */
export async function translateBatch(texts, { signal } = {}) {
  if (!Array.isArray(texts) || texts.length === 0) return []

  const results = new Array(texts.length)
  const concurrency = Math.max(1, TRANSLATE_API.CONCURRENCY)

  for (let i = 0; i < texts.length; i += concurrency) {
    if (signal?.aborted) break
    const slice = texts.slice(i, i + concurrency)
    const translated = await Promise.all(
      slice.map((text) => translateText(text, { signal }))
    )
    for (let j = 0; j < translated.length; j++) {
      results[i + j] = translated[j]
    }
  }

  for (let i = 0; i < texts.length; i++) {
    if (results[i] === undefined) results[i] = texts[i]
  }

  return results
}

/**
  Limpa o cache persistente de traduções. Usado em desenvolvimento
  quando se quer forçar uma nova rodada de requests, ou caso o
  catálogo da API mude textos já cacheados.
 */
export function clearTranslationCache() {
  memoryCache = {}
  persistCache()
}
