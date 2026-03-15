// Camada de abstração do localStorage.
// Encapsula leitura/escrita para evitar erros em ambientes sem suporte
// (ex: SSR, modo privado) e facilita futura migração para IndexedDB ou API remota.

/**
 * Lê e desserializa um valor do localStorage.
 * @param {string} key - Chave de armazenamento
 * @param {*} fallback - Valor padrão caso a chave não exista
 * @returns {*} Valor armazenado ou fallback
 */
export function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

/**
 * Serializa e salva um valor no localStorage.
 * @param {string} key - Chave de armazenamento
 * @param {*} value - Valor a ser salvo
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* Falha silenciosa — ex: storage cheio ou modo privado */
  }
}

/**
 * Remove uma chave do localStorage.
 * @param {string} key - Chave a ser removida
 */
export function removeItem(key) {
  try {
    localStorage.removeItem(key)
  } catch { /* Falha silenciosa */ }
}
