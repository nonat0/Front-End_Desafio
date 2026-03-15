// Cliente HTTP centralizado usando Axios.
// Configurar interceptors aqui permite tratar erros globalmente,
// adicionar tokens de autenticação futuramente e logar chamadas.

import axios from 'axios'
import { API_BASE_URL } from '@/utils/constants'

/* Instância base com URL e timeout padrão */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

/* Interceptor de resposta — transforma erros em mensagens amigáveis */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Erro inesperado. Tente novamente.'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
