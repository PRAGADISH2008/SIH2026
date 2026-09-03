// ─── Artisan Catalogue App — Frontend Configuration ─────────────────────────
// The backend runs on port 5000 (from backend/.env and server.js).

export const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:5000';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `${BACKEND_ORIGIN}/api/v1`;

// When true, services/api.js returns mock data instead of hitting the backend.
// Defaults to true if no postgres is configured, or toggled via the UI button.
const storedMock = localStorage.getItem('artisan_mock_mode');
export let MOCK_MODE = storedMock !== null ? storedMock === 'true' : false;

export function getMockMode() {
  return MOCK_MODE;
}

export function setMockMode(enabled) {
  MOCK_MODE = enabled;
  localStorage.setItem('artisan_mock_mode', String(enabled));
}
