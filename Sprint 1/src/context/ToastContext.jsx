/*
  ToastContext — sistema centralizado de feedback visual.
  ────────────────────────────────────────────────────────

  Qualquer componente pode disparar toasts sem prop drilling.
  Tipos suportados: success, error, warning, info.

  Além do toast simples, suportamos uma AÇÃO opcional dentro da
  notificação — útil para padrões como "Desfazer" (undo) em
  remoções, ou "Ver pedido" após finalizar compra. A ação é um
  objeto { label, onClick }. Quando o usuário clica, executamos
  o handler e removemos o toast imediatamente (não faz sentido
  manter o toast vivo depois que o usuário já agiu).

  `showToast` devolve o id do toast criado — assim, quem chamou
  pode removê-lo manualmente antes do timeout (ex: ao desmontar
  um componente, ou quando uma ação relacionada acontece).
 */

import { createContext, useCallback, useContext, useReducer, useRef } from 'react'
import { TOAST_DURATION } from '@/utils/constants'

const ToastContext = createContext(null)

/* Gera IDs únicos incrementais para cada toast */
let _id = 0
const uid = () => ++_id

function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, action.payload]
    case 'REMOVE':
      return state.filter((t) => t.id !== action.payload)
    default:
      return state
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, [])

  /*
    Mapa de timers por toast-id. Precisamos disso porque, se a
    ação (ex: "Desfazer") for clicada antes do timeout disparar,
    queremos CANCELAR o timer — caso contrário ele tentaria remover
    um toast que já foi removido manualmente, gerando um
    `dispatch` inútil (inofensivo, mas desleixado).
   */
  const timersRef = useRef(new Map())

  const removeToast = useCallback((id) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    dispatch({ type: 'REMOVE', payload: id })
  }, [])

  /**
   * Exibe um toast na tela.
   *
   * Assinatura aceita DOIS formatos:
   *
   *   1. Compatível com o legado: `showToast(message, type, duration)`.
   *      Mantém o código antigo funcionando sem refatoração.
   *
   *   2. Novo, via objeto: `showToast({ message, type, duration, action })`.
   *      Permite passar uma ação no formato { label, onClick }.
   *
   * @returns {number} ID do toast, útil para removê-lo manualmente depois.
   */
  const showToast = useCallback((messageOrOptions, type = 'info', duration = TOAST_DURATION) => {
    // Detecta o formato de objeto (novo) vs string (legado).
    const options =
      typeof messageOrOptions === 'string'
        ? { message: messageOrOptions, type, duration }
        : { type: 'info', duration: TOAST_DURATION, ...messageOrOptions }

    const id = uid()
    dispatch({
      type: 'ADD',
      payload: {
        id,
        message: options.message,
        type: options.type,
        action: options.action ?? null,
      },
    })

    const timer = setTimeout(() => {
      timersRef.current.delete(id)
      dispatch({ type: 'REMOVE', payload: id })
    }, options.duration)
    timersRef.current.set(id, timer)

    return id
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastContext deve ser usado dentro de ToastProvider')
  return ctx
}
