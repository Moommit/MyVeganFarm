export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  return fetch(url, options);
}
