// Spinner — indicador visual de carregamento.
// Usado em qualquer chamada assíncrona da aplicação.
// Tamanho e cor configuráveis via props.

import styles from './Spinner.module.css'

export function Spinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`${styles.spinner} ${styles[size]} ${className}`}
      role="status"
      aria-label="Carregando"
    />
  )
}
