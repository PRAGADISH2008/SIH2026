// ─── Utility Helpers ─────────────────────────────────────────────────────────

/** Fallback UUID v4 for mock mode (no external dependency). */
export function v4Fallback() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Format price in ₹ */
export function formatPrice(amount) {
  if (amount == null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

/** Capitalize first letter */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Resolve a possibly-relative image URL to a full URL */
export function resolveImageUrl(url, backendOrigin) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${backendOrigin}${url}`;
}

/** Sleep helper for simulated delays in mock mode */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
