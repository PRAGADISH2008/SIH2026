// ─── Artisan Catalogue App — Frontend Configuration ─────────────────────────
// Production Render Backend URL: https://zencraft-backend.onrender.com

const PROD_BACKEND_URL = 'https://zencraft-backend.onrender.com';

// 1. Resolve raw URL from Vite environment variables or mode-appropriate default
const rawEnvUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_ORIGIN ||
  '';

const resolvedUrl = (
  rawEnvUrl ||
  (import.meta.env.PROD
    ? PROD_BACKEND_URL
    : typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? `http://${window.location.hostname}:5000`
      : 'http://localhost:5000')
).trim().replace(/\/+$/, '');

// 2. Derive BACKEND_ORIGIN (root origin without /api or /api/v1, used for static /uploads image URLs)
export const BACKEND_ORIGIN = resolvedUrl.replace(/\/api(\/v1)?$/i, '');

// 3. Derive API_BASE_URL (always pointing to /api/v1 for all endpoints in services/api.js)
export const API_BASE_URL = resolvedUrl.endsWith('/api/v1')
  ? resolvedUrl
  : resolvedUrl.endsWith('/api')
    ? `${resolvedUrl}/v1`
    : `${BACKEND_ORIGIN}/api/v1`;

// When true, services/api.js returns mock data instead of hitting the backend.
// Defaults strictly to false (LIVE BACKEND API mode).
if (localStorage.getItem('artisan_mock_mode') !== 'true_explicit') {
  localStorage.setItem('artisan_mock_mode', 'false');
}
const storedMock = localStorage.getItem('artisan_mock_mode');
export let MOCK_MODE = storedMock === 'true_explicit';

export function getMockMode() {
  return MOCK_MODE;
}

export function setMockMode(enabled) {
  MOCK_MODE = enabled;
  localStorage.setItem('artisan_mock_mode', enabled ? 'true_explicit' : 'false');
}
