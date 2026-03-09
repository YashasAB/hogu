
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './shells/App'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

const _originalFetch = window.fetch.bind(window);
window.fetch = function(input, init) {
  let url = typeof input === 'string' ? input
    : input instanceof URL ? input.href
    : (input as Request).url;
  if (API_BASE && url.startsWith('/api/')) {
    url = API_BASE + url;
    input = url;
  }
  if (url.includes('/api/')) {
    const token = sessionStorage.getItem('dating_token');
    if (token) {
      const existing = (init?.headers instanceof Headers)
        ? Object.fromEntries((init.headers as Headers).entries())
        : (init?.headers as Record<string, string> || {});
      init = { ...init, headers: { 'X-Auth-Token': token, ...existing } };
    }
  }
  return _originalFetch(input, init);
};

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

const root = createRoot(container)
root.render(
  <StrictMode>
    <App />
  </StrictMode>
)
