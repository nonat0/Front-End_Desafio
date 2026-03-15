// main.jsx — ponto de entrada da aplicação.
// Monta os providers globais (AppProviders) que encapsulam
// todos os contextos na ordem correta, depois inicializa o router.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/context/AppProviders'
import { AppRouter } from '@/router/index'
import '@/styles/globals.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>
)
