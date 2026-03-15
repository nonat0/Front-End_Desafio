// useDebounce — retarda a atualização de um valor por `delay` milissegundos.
// Usado na barra de busca para evitar requisições a cada tecla pressionada.
// Padrão amplamente adotado em performance de inputs reativos.

import { useEffect, useState } from 'react'

/**
 * @param {*} value - Valor a ser "debounced"
 * @param {number} delay - Atraso em milissegundos (padrão: 350ms)
 * @returns {*} Valor debounced
 */
export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
