/*
  useLatestRef — mantém uma ref sempre apontando para o valor mais
  recente passado como argumento.
  ───────────────────────────────────────────────────────────────────

  Problema que resolve: o "stale closure".

  Em React, um callback assíncrono (setTimeout, Promise, listener de
  evento global, callback de toast etc.) captura por valor as
  variáveis do escopo onde foi criado. Se a função/valor capturado
  mudar nas próximas renderizações, o callback continuará usando a
  versão VELHA — agindo em dados desatualizados.

  Exemplo clássico (RUIM):

      const handleClick = () => {
        setTimeout(() => {
          doSomething(props.value)  // ← captura a versão de `value` no momento do clique
        }, 5000)
      }

  Se `props.value` mudar nesse intervalo, o `doSomething` rodará
  com o valor antigo. `useLatestRef` resolve isso porque a ref é
  ATUALIZADA a cada render — `ref.current` sempre devolve o valor
  mais recente quando é lido.

  Uso típico:

      const valueRef = useLatestRef(value)
      const handleClick = () => {
        setTimeout(() => doSomething(valueRef.current), 5000)
      }

  Padrão amplamente usado em libs como React Query, Floating UI etc.
 */

import { useRef } from 'react'

export function useLatestRef(value) {
  const ref = useRef(value)
  ref.current = value
  return ref
}
