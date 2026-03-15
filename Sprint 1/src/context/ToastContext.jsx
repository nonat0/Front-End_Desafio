// ToastContext — sistema centralizado de feedback visual.
// Qualquer componente pode disparar toasts sem prop drilling.
// Tipos suportados: success, error, warning, info.
// Expansível para suportar ações dentro do toast (ex: desfazer).

import { createContext, useCallback, useContext, useReducer } from 'react'
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

  /**
   * Exibe um toast na tela e o remove automaticamente após `duration` ms.
   * @param {string} message - Mensagem a exibir
   * @param {'success'|'error'|'warning'|'info'} type - Tipo visual
   * @param {number} duration - Duração em ms (padrão: TOAST_DURATION)
   */
  const showToast = useCallback((message, type = 'info', duration = TOAST_DURATION) => {
    const id = uid()
    dispatch({ type: 'ADD', payload: { id, message, type } })
    setTimeout(() => dispatch({ type: 'REMOVE', payload: id }), duration)
  }, [])

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE', payload: id })
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
