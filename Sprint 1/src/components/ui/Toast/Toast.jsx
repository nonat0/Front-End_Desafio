/*
  Toast — notificação visual temporária.
  ───────────────────────────────────────

  Tipos: success (verde), error (vermelho), warning (âmbar), info (neutro).
  Renderizado pelo ToastContainer que é montado uma única vez no AppLayout.

  Suporta uma AÇÃO opcional (ex: "Desfazer" após remover item do carrinho).
  Quando presente, a ação aparece como um botão antes do ícone de fechar.
  Clicar na ação executa o handler fornecido E remove o toast — a remoção
  explícita evita que o timeout do toast dispare depois e tente remover
  um toast já removido.
 */

import styles from './Toast.module.css'

const ICONS = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
}

export function Toast({ toast, onRemove }) {
  /*
    Handler para a ação (ex: Desfazer). Primeiro executa o callback
    do consumidor, depois remove o toast da tela — nessa ordem para
    garantir que, se a ação tiver side effects síncronos, o toast
    continue visível até o final da execução.
   */
  const handleActionClick = () => {
    toast.action?.onClick?.()
    onRemove(toast.id)
  }

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`} role="alert">
      <span className={styles.icon}>{ICONS[toast.type]}</span>
      <p className={styles.message}>{toast.message}</p>

      {/* Botão de ação opcional — renderizado apenas se o toast foi criado com `action` */}
      {toast.action && (
        <button
          type="button"
          className={styles.action}
          onClick={handleActionClick}
        >
          {toast.action.label}
        </button>
      )}

      <button
        className={styles.close}
        onClick={() => onRemove(toast.id)}
        aria-label="Fechar notificação"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}

/**
 * ToastContainer — renderiza todos os toasts ativos.
 * Deve ser montado uma única vez no layout raiz da aplicação.
 */
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className={styles.container} aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}
