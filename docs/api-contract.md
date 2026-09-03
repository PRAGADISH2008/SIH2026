# API Contract — Artisan AI Catalogue App

This document lists every backend endpoint the frontend will call. All request/response bodies follow the schema defined in `api-contract.json`. Both frontend and backend AI prompts should reference this file directly.

---

## Base URL
```
/api/v1
```

---

## 1. Create Draft Product
Used after photo/voice capture to create an initial product draft.

**POST** `/products`

**Request body** (partial schema — whatever fields are known so far):
```json
{
  "artisan_id": "string",
  "images": { "original_url": "string" },
  "language_original": "string"
}
```

**Response** — `201 Created`
```json
{
  "product_id": "string",
  "status": "draft",
  "...": "rest of schema, other fields null/empty until filled"
}
```

---

## 2. Get Product by ID
Fetch full product details (used by review screen, edit screen, backend checks).

**GET** `/products/:id`

**Response** — `200 OK`
```json
{ "...": "full schema object" }
```

**Errors:** `404` if product not found.

---

## 3. Upload & Enhance Image
Upload a raw product photo; backend runs background removal/enhancement.

**POST** `/products/:id/image`

**Request:** multipart/form-data, field `image` (file)

**Response** — `200 OK`
```json
{
  "images": {
    "original_url": "string",
    "enhanced_url": "string"
  }
}
```

---

## 4. Upload & Transcribe Voice
Upload artisan's voice note; backend runs speech-to-text + attribute extraction.

**POST** `/products/:id/voice`

**Request:** multipart/form-data, field `audio` (file)

**Response** — `200 OK`
```json
{
  "description": "string",
  "language_original": "string",
  "material": "string",
  "craft_type": "string",
  "production": {
    "time_days": "number",
    "technique": "string"
  },
  "transcription_confidence": "number"
}
```

---

## 5. Generate Catalogue Fields
Trigger LLM to generate title, category, keywords, and refined description from extracted attributes.

**POST** `/products/:id/catalogue`

**Request body:** none (uses data already stored against `product_id`)

**Response** — `200 OK`
```json
{
  "product_name": "string",
  "category": "string",
  "keywords": ["string"],
  "description": "string"
}
```

---

## 6. Get Price Recommendation
Run the pricing engine on the current product data.

**GET** `/products/:id/price`

**Response** — `200 OK`
```json
{
  "pricing": {
    "estimated_cost": "number",
    "market_range_low": "number",
    "market_range_high": "number",
    "recommended_price": "number",
    "confidence": "number",
    "reasoning": ["string"]
  }
}
```

---

## 7. Confirm Product (Human-in-the-Loop)
Artisan reviews AI-generated fields and confirms or corrects them. **No product should reach `published` status without passing through this step.**

**PUT** `/products/:id/confirm`

**Request body:** any corrected fields, e.g.
```json
{
  "product_name": "string",
  "material": "string",
  "pricing": { "recommended_price": "number" }
}
```

**Response** — `200 OK`
```json
{ "status": "confirmed", "...": "updated schema" }
```

---

## 8. Publish Product
Makes the product visible on the buyer dashboard.

**PUT** `/products/:id/publish`

**Response** — `200 OK`
```json
{ "status": "published" }
```

**Errors:** `400` if `status` is not `confirmed` yet — publishing unconfirmed AI output should be blocked at the API level.

---

## 9. Buyer-Facing Product List
Public/buyer view — only returns published products.

**GET** `/products`

**Query params (optional):** `category`, `craft_type`, `min_price`, `max_price`

**Response** — `200 OK`
```json
{
  "products": [ "array of published product schema objects" ]
}
```

---

## 10. Export Product (Marketplace-Ready JSON)
Returns a single product formatted for external marketplace export (ONDC/IndiaHandmade style).

**GET** `/products/:id/export`

**Response** — `200 OK`
```json
{ "...": "canonical schema object, ready for adapter/export use" }
```

---

## Auth
All endpoints except `GET /products` (buyer view) require an `Authorization: Bearer <token>` header. Auth is OTP/mobile-number based — token issued via a separate `/auth/otp/verify` endpoint (define with backend owner if needed for demo).

---

## Status Field Rules
- `draft` → created, AI fields may still be generating
- `confirmed` → artisan has reviewed and approved all AI-generated fields
- `published` → visible on buyer dashboard

**Rule:** the backend must reject `publish` calls on any product still in `draft` status. This enforces human-in-the-loop review at the API level, not just the UI level.
