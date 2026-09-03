// ─── Centralized API Service ─────────────────────────────────────────────────
// Every backend call lives here. UI components NEVER call fetch directly.
// When MOCK_MODE is true, mock data is returned with simulated latency.
//
// All shapes match the ACTUAL backend implementation in backend/routes/*.js

import { API_BASE_URL, MOCK_MODE } from '../config';
import { sleep } from '../utils/helpers';
import * as mock from './mockData';

// ─── Internal helpers ────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('auth_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, { body, isFormData } = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = { ...authHeaders() };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const options = { method, headers };
  if (body) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();

  if (!res.ok) {
    // Backend returns { error: true, message: string, code: number }
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.code = data.code || res.status;
    err.serverMessage = data.message;
    throw err;
  }

  return data;
}

// ═════════════════════════════════════════════════════════════════════════════
// AUTH — POST /auth/otp/request  &  POST /auth/otp/verify
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Request OTP.
 * POST /api/v1/auth/otp/request
 * Body: { mobile_number: string }
 * Response: { message, delivery_method }
 */
export async function requestOtp(mobile_number) {
  if (MOCK_MODE) {
    await sleep(800);
    return mock.mockOtpRequestResponse;
  }
  return request('POST', '/auth/otp/request', {
    body: { mobile_number },
  });
}

/**
 * Verify OTP and receive JWT + artisan_id.
 * POST /api/v1/auth/otp/verify
 * Body: { mobile_number: string, otp: string }
 * Response: { message, token, artisan_id }
 */
export async function verifyOtp(mobile_number, otp) {
  if (MOCK_MODE) {
    await sleep(600);
    return mock.mockOtpVerifyResponse;
  }
  return request('POST', '/auth/otp/verify', {
    body: { mobile_number, otp },
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. CREATE DRAFT PRODUCT — POST /products
// Body: { images: { original_url }, language_original }
// Response: full product object (status: "draft")
// ═════════════════════════════════════════════════════════════════════════════

export async function createDraftProduct(language_original = 'hi') {
  if (MOCK_MODE) {
    await sleep(500);
    return mock.mockCreateDraftResponse();
  }
  return request('POST', '/products', {
    body: {
      images: { original_url: null },
      language_original,
    },
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. GET PRODUCT BY ID — GET /products/:id
// Response: full product object
// ═════════════════════════════════════════════════════════════════════════════

export async function getProduct(productId) {
  if (MOCK_MODE) {
    await sleep(300);
    return mock.mockCreateDraftResponse(); // reuse shape
  }
  return request('GET', `/products/${productId}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. UPLOAD & ENHANCE IMAGE — POST /products/:id/image
// Request: multipart/form-data, field name "image"
// Response: { images: { original_url, enhanced_url } }
// ═════════════════════════════════════════════════════════════════════════════

export async function uploadImage(productId, imageFile) {
  if (MOCK_MODE) {
    await sleep(2000);
    return mock.mockImageUploadResponse;
  }
  const formData = new FormData();
  formData.append('image', imageFile);
  return request('POST', `/products/${productId}/image`, {
    body: formData,
    isFormData: true,
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. UPLOAD & TRANSCRIBE VOICE — POST /products/:id/voice
// Request: multipart/form-data, field name "audio"
// Response: { description, language_original, material, craft_type,
//             production: { time_days, technique }, transcription_confidence }
// ═════════════════════════════════════════════════════════════════════════════

export async function uploadVoice(productId, audioFile) {
  if (MOCK_MODE) {
    await sleep(3000);
    return mock.mockVoiceUploadResponse;
  }
  const formData = new FormData();
  formData.append('audio', audioFile);
  return request('POST', `/products/${productId}/voice`, {
    body: formData,
    isFormData: true,
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. GENERATE CATALOGUE — POST /products/:id/catalogue
//
// VERIFIED from backend/routes/products.js lines 212-256:
//   - The handler DOES NOT read req.body at all
//   - It only uses req.params.id to look up the product
//   - It uses data already stored in the DB against that product_id
//   - NO request body is needed — send nothing
//
// Headers: Authorization: Bearer <token>
//          Content-Type: application/json  (harmless, no body sent)
//
// Response (200):
//   {
//     product_name: string,
//     category: string,
//     keywords: string[],
//     description: string
//   }
//
// Errors:
//   404 → { error: true, message: "Product not found", code: 404 }
//   500 → { error: true, message: "Failed to generate catalogue fields", code: 500 }
// ═════════════════════════════════════════════════════════════════════════════

export async function generateCatalogue(productId) {
  if (MOCK_MODE) {
    await sleep(3500);
    return mock.mockCatalogueResponse;
  }
  // POST with NO body — backend ignores req.body entirely
  return request('POST', `/products/${productId}/catalogue`);
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. GET PRICE RECOMMENDATION — GET /products/:id/price
// Response: { pricing: { estimated_cost, market_range_low, market_range_high,
//             recommended_price, confidence, reasoning[] } }
// ═════════════════════════════════════════════════════════════════════════════

export async function getPrice(productId) {
  if (MOCK_MODE) {
    await sleep(2500);
    return mock.mockPriceResponse;
  }
  return request('GET', `/products/${productId}/price`);
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. CONFIRM PRODUCT — PUT /products/:id/confirm
// Body: any corrected fields (flat + nested pricing/production/images)
// Always sets status to "confirmed"
// Response: full product object with status: "confirmed"
// ═════════════════════════════════════════════════════════════════════════════

export async function confirmProduct(productId, corrections = {}) {
  if (MOCK_MODE) {
    await sleep(800);
    return mock.mockConfirmResponse(mock.mockCreateDraftResponse(), corrections);
  }
  return request('PUT', `/products/${productId}/confirm`, {
    body: corrections,
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 8. PUBLISH PRODUCT — PUT /products/:id/publish
// No body. Backend rejects if status !== "confirmed" (400).
// Response: { status: "published" }
// ═════════════════════════════════════════════════════════════════════════════

export async function publishProduct(productId) {
  if (MOCK_MODE) {
    await sleep(600);
    return mock.mockPublishResponse;
  }
  return request('PUT', `/products/${productId}/publish`);
}

// ═════════════════════════════════════════════════════════════════════════════
// 9. BUYER PRODUCT LIST — GET /products (PUBLIC, no auth needed)
// Query params: category, craft_type, min_price, max_price
// Response: { products: [...] }
// ═════════════════════════════════════════════════════════════════════════════

export async function listProducts(filters = {}) {
  if (MOCK_MODE) {
    await sleep(500);
    return mock.mockBuyerProducts;
  }
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.craft_type) params.set('craft_type', filters.craft_type);
  if (filters.min_price) params.set('min_price', filters.min_price);
  if (filters.max_price) params.set('max_price', filters.max_price);

  const qs = params.toString();
  // This endpoint is PUBLIC — no auth header needed, but our request()
  // helper sends it anyway (harmless; backend simply ignores it for GET /).
  return request('GET', `/products${qs ? `?${qs}` : ''}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// 10. EXPORT PRODUCT — GET /products/:id/export
// Response: full product object (marketplace-ready JSON)
// ═════════════════════════════════════════════════════════════════════════════

export async function exportProduct(productId) {
  if (MOCK_MODE) {
    await sleep(400);
    return mock.mockExportResponse(mock.mockCreateDraftResponse());
  }
  return request('GET', `/products/${productId}/export`);
}

// ═════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK — GET /health (no auth)
// ═════════════════════════════════════════════════════════════════════════════

export async function healthCheck() {
  if (MOCK_MODE) return { status: 'ok', timestamp: new Date().toISOString() };
  return request('GET', '/health');
}
