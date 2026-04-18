/*
  ErrorBoundary — captura erros de render em qualquer descendente.
  ─────────────────────────────────────────────────────────────────

  Por que ainda usamos uma classe em um projeto "100% hooks"?

    - Em React 18 a captura de erros de render só está disponível
      via componentes de classe que implementam `getDerivedStateFromError`
      e/ou `componentDidCatch`. Não existe (ainda) um hook equivalente.
    - É um caso EXCEPCIONAL e bem isolado: a boundary fica num único
      arquivo, e o resto da aplicação segue 100% funcional.

  O que esta boundary protege?

    - Erros de RENDER (props inválidas, componentes que jogam exception,
      acesso a propriedade de undefined em JSX, etc).

  O que esta boundary NÃO captura (limitação do React, não bug):

    - Erros em event handlers (onClick, onSubmit…). Esses devem ser
      tratados localmente com try/catch.
    - Erros em código assíncrono (Promises, setTimeout, fetch). Trate
      no callback ou em um `useEffect` com try/catch.
    - Erros durante server-side rendering.

  Estratégia de recuperação:

    - Botão "Tentar novamente" zera o estado de erro e força um
      re-render do conteúdo. Se a causa raiz já se resolveu (ex:
      promo recarregada, rota mudou), o app volta ao normal.
    - Botão "Voltar para a Home" navega para "/" via window.location
      — usar location força um reload completo, garantindo que
      qualquer estado corrompido em memória seja descartado.
 */

import { Component } from 'react'
import styles from './ErrorBoundary.module.css'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  /*
    Atualiza o state ANTES do próximo render — método estático e
    síncrono, sem efeitos colaterais. É aqui que decidimos exibir
    o fallback em vez do `children`.
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  /*
    Roda DEPOIS do render do fallback, então é o lugar certo para
    side effects: log no console (dev), envio para Sentry/Datadog
    (prod), métrica de produto, etc. No momento, só logamos no
    console — quando integrarmos um serviço de monitoramento, é
    só plugar aqui.
   */
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className={styles.wrapper} role="alert">
        <div className={styles.icon}>⚠️</div>
        <h1 className={styles.title}>Algo deu errado</h1>
        <p className={styles.description}>
          Encontramos um problema inesperado ao renderizar esta tela.
          Você pode tentar novamente ou voltar à página inicial.
        </p>

        {/*
          Em desenvolvimento, mostramos a mensagem do erro para
          facilitar o debug. Em produção isso ficaria escondido —
          import.meta.env.DEV é a flag do Vite (true só no dev server).
         */}
        {import.meta.env.DEV && this.state.error && (
          <pre className={styles.errorDetail}>
            {this.state.error.message}
          </pre>
        )}

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={this.handleReset}>
            Tentar novamente
          </button>
          <button className={styles.secondaryBtn} onClick={this.handleGoHome}>
            Voltar para a Home
          </button>
        </div>
      </div>
    )
  }
}
