// ─── Artisan Catalogue App — Frontend Configuration ─────────────────────────
// The backend runs on port 5000 (from backend/.env and server.js).

const defaultBackendOrigin =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:5000`
    : 'http://localhost:5000';

export const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_ORIGIN || defaultBackendOrigin;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `${BACKEND_ORIGIN}/api/v1`;

// When true, services/api.js returns mock data instead of hitting the backend.
// Defaults strictly to false (LIVE BACKEND API mode on port 5000).
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
