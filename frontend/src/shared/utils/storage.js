export function readStorage(key, fallback = null) {
  try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw) } catch { return fallback }
}
export function writeStorage(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
