/*
 * Cliente HTTP centralizado usando Axios.
  ────────────────────────────────────────
 
  Manter UMA instância configurada do Axios para toda a aplicação
  é o padrão "API client singleton". Isso permite:
 
    - Definir `baseURL` e `timeout` em um único lugar.
    - Plugar interceptors (middleware) que rodam em TODA resposta —
      por exemplo, para padronizar erros ou adicionar auth.
    - Trocar a lib HTTP (Axios → fetch → ky) mudando apenas este arquivo.
 
  Neste projeto, o interceptor faz duas coisas importantes:
 
    1. RETRY COM BACKOFF EXPONENCIAL para erros transitórios
       (falhas de rede, 5xx). Um pico momentâneo de latência na API
       não deve mais quebrar a UX — tentamos novamente antes de exibir
       mensagem de erro ao usuário.
 
    2. NORMALIZAÇÃO DE MENSAGENS: em vez de propagar o objeto de erro
       cru do Axios (que varia entre "Network Error", "timeout of…",
       response.data.message, etc), devolvemos um Error com mensagem
       já amigável — pronto para exibir no toast.
 */

import axios from 'axios'
import { API_BASE_URL, API_RETRY } from '@/utils/constants'

/*
  Instância configurada. `timeout` dispara um erro se a requisição
  demorar mais que o valor em milissegundos — impedindo que uma
  chamada presa deixe o loading spinner girando para sempre.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

/*
  Decide se uma falha merece nova tentativa.
 
  Retry faz sentido APENAS para erros transitórios:
    - Sem `response` → problema de rede/DNS/timeout → tentar de novo.
    - `5xx`          → erro do servidor, possivelmente temporário.
 
  Retry NÃO faz sentido para:
    - `4xx` → erro do cliente (produto não existe, URL errada…).
      Repetir só desperdiçaria requisições e atrasaria o feedback.
    - Cancelamentos (AbortController) → o caller decidiu desistir.
 */
function isRetriableError(error) {
  if (axios.isCancel(error)) return false
  if (!error.response) return true
  const status = error.response.status
  return status >= 500 && status < 600
}

/*
 * Calcula o delay antes da próxima tentativa.
 
 * Backoff EXPONENCIAL: cada tentativa espera o dobro da anterior.
    tentativa 1 → BASE_DELAY_MS
    tentativa 2 → BASE_DELAY_MS * 2
    tentativa 3 → BASE_DELAY_MS * 4
 
 * Somamos um "jitter" aleatório (0–250ms) para evitar o cenário em
   que vários clientes, tendo falhado ao mesmo tempo, tentam de novo
   em sincronia e derrubam o servidor de novo (thundering herd).
 
 * O teto `MAX_DELAY_MS` impede esperas absurdas em tentativas tardias.
 */
function computeBackoffDelay(attempt) {
  const exponential = API_RETRY.BASE_DELAY_MS * 2 ** (attempt - 1)
  const jitter = Math.random() * 250
  return Math.min(exponential + jitter, API_RETRY.MAX_DELAY_MS)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/*
 * Interceptor de resposta.
 *
 * Fluxo:
 *   ┌─ sucesso (2xx) ──→ devolve response intacta
 *   └─ erro:
 *       ├─ cancelado?          → propaga o cancel (importante para o AbortController nos hooks)
 *       ├─ retriable + <limite → espera (backoff) + tenta de novo
 *       └─ falhou definitivo   → rejeita com Error de mensagem amigável
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config

    // Cancelamentos (AbortController) DEVEM passar inalterados para que
    // o chamador consiga detectar com `axios.isCancel` ou nome do erro.
    if (axios.isCancel(error) || !config) {
      return Promise.reject(error)
    }

    // Contador de tentativas anexado à própria config da requisição.
    // Persiste entre re-execuções porque o Axios reutiliza o objeto.
    config.__retryCount = config.__retryCount ?? 0

    if (isRetriableError(error) && config.__retryCount < API_RETRY.MAX_ATTEMPTS) {
      config.__retryCount += 1
      const delay = computeBackoffDelay(config.__retryCount)
      await sleep(delay)
      // Re-executa a MESMA config. O ciclo pode voltar aqui se falhar
      // de novo — até estourar MAX_ATTEMPTS ou o erro parar de ser retriable.
      return apiClient(config)
    }

    // Esgotadas as tentativas (ou erro não-retriable): normaliza a mensagem.
    const message =
      error.response?.data?.message ||
      error.message ||
      'Erro inesperado. Tente novamente.'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
