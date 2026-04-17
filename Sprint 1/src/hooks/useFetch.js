/*
 * useFetch — hook genérico para qualquer requisição assíncrona.
 * ─────────────────────────────────────────────────────────────
 *
 * Motivação:
 *   Antes, `useProducts` e `useProductDetail` reimplementavam o mesmo
 *   padrão: estados de loading/error, `mountedRef` para evitar set em
 *   componente desmontado, cache em memória, etc. Código duplicado é
 *   código que DIVERGE com o tempo.
 *
 *   Este hook extrai essa lógica em um único lugar, de forma que os
 *   hooks de domínio (useProducts, useProductDetail) fiquem minúsculos
 *   e focados em DIZER O QUE buscar, não COMO gerenciar o ciclo de vida.
 *
 * O que ele oferece (que flags booleanas soltas não oferecem):
 *
 *   1. MÁQUINA DE ESTADOS explícita: `idle | loading | success | error`.
 *      Elimina combinações impossíveis (`loading=true` + `error=...`)
 *      que nascem quando se usa booleanas separadas.
 *
 *   2. ABORTCONTROLLER integrado: ao trocar de categoria rapidamente
 *      ou desmontar o componente, a request anterior é CANCELADA —
 *      evitando que uma resposta velha sobrescreva a nova (race
 *      condition) e economizando banda.
 *
 *   3. CACHE COM TTL compartilhado (`utils/cache`): respostas são
 *      reaproveitadas entre navegações pela mesma sessão, mas expiram
 *      após um período para não servir dados "congelados".
 *
 *   4. REFETCH manual exposto — útil para "puxe para atualizar" ou
 *      para recarregar após uma ação que invalide o cache.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { getCached, setCached } from '@/utils/cache'
import { CACHE_TTL } from '@/utils/constants'

/**
 * @template T
 * @param {(ctx: { signal: AbortSignal }) => Promise<T>} fetcher
 *   Função que faz a requisição. Recebe um objeto `{ signal }` que DEVE
 *   ser repassado ao axios/fetch para habilitar cancelamento.
 *
 * @param {object} [options]
 * @param {string|null} [options.key]
 *   Chave de cache. Se omitido ou `null`, o hook não usa cache (útil
 *   quando a resposta não deve ser reaproveitada, ex: POST).
 * @param {boolean} [options.enabled=true]
 *   Se `false`, o hook fica em estado `idle` sem disparar a chamada.
 *   Útil quando faltam parâmetros (ex: id ainda indefinido na rota).
 * @param {number} [options.ttl=CACHE_TTL]
 *   Tempo de vida do cache específico para esta chamada.
 *
 * @returns {{
 *   data: T|null,
 *   error: Error|null,
 *   status: 'idle'|'loading'|'success'|'error',
 *   loading: boolean,
 *   isSuccess: boolean,
 *   isError: boolean,
 *   refetch: () => Promise<void>,
 * }}
 */
export function useFetch(fetcher, { key = null, enabled = true, ttl = CACHE_TTL } = {}) {
  /*
   * Começamos em `loading` quando habilitado para preservar a UX
   * original (o spinner aparece desde o primeiro render). Quando
   * `enabled=false`, ficamos em `idle` — o componente pode escolher
   * exibir um placeholder ou nada.
   */
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  /*
   * Guardamos o fetcher em uma ref para que alterações na sua referência
   * (inevitáveis quando o caller cria a função inline) NÃO disparem um
   * novo fetch. O re-disparo só deve acontecer quando `key`/`enabled`
   * mudarem, que são os identificadores REAIS do que está sendo buscado.
   */
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  /*
   * Ref do AbortController ativo. Ao iniciar uma nova chamada,
   * abortamos a anterior — garantindo que somente UMA requisição
   * "ganha" e atualiza o estado.
   */
  const abortRef = useRef(null)

  const run = useCallback(async () => {
    if (!enabled) {
      setStatus('idle')
      return
    }

    // 1) Cache hit → preenche o estado imediatamente, sem tocar na rede.
    if (key) {
      const cached = getCached(key, ttl)
      if (cached !== undefined) {
        setData(cached)
        setError(null)
        setStatus('success')
        return
      }
    }

    // 2) Cancela requisição pendente (se houver) e cria um novo signal.
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('loading')
    setError(null)

    try {
      const result = await fetcherRef.current({ signal: controller.signal })

      // Mesmo com o await resolvido, pode ter sido abortado no meio do caminho
      // (entre a resposta chegar e o React agendar o setState). Ignora esses casos.
      if (controller.signal.aborted) return

      if (key) setCached(key, result)
      setData(result)
      setStatus('success')
    } catch (err) {
      // Cancelamentos NÃO devem virar erro na UI — o usuário não errou nada.
      if (controller.signal.aborted || axios.isCancel?.(err) || err.name === 'CanceledError' || err.name === 'AbortError') {
        return
      }
      setError(err)
      setStatus('error')
    }
  }, [key, ttl, enabled])

  /*
   * Efeito principal: roda ao montar e sempre que `run` mudar (ou seja,
   * quando `key`/`enabled`/`ttl` mudarem). Ao desmontar, aborta a chamada
   * em voo — o signal também é abortado no cleanup abaixo.
   */
  useEffect(() => {
    run()
    return () => abortRef.current?.abort()
  }, [run])

  return {
    data,
    error,
    status,
    loading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    refetch: run,
  }
}
