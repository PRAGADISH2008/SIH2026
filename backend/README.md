# Artisan Catalogue Backend

Node.js + Express + PostgreSQL backend for the Artisan AI Catalogue App.  
Implements all endpoints from [`docs/api-contract.md`](../docs/api-contract.md).

---

## Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14 (running locally or remote)
- **npm** (comes with Node.js)

---

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `5000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs (any random string) |
| `GEMINI_API_KEY` | Google Gemini API key (for image enhancement, vision analysis, & product attribute extraction) |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API key (for speech-to-text audio transcription) |
| `FAST2SMS_API_KEY` | Fast2SMS API Key (preferred for Indian numbers — route: 'otp') |
| `SMS_PROVIDER_SID` | Twilio Account SID (optional fallback) |
| `SMS_PROVIDER_AUTH_TOKEN` | Twilio Auth Token |
| `SMS_PROVIDER_FROM_NUMBER` | Twilio "From" phone number (e.g. `+1234567890`) |

> **Note:** `GEMINI_API_KEY` is used for image enhancement, visual analysis, and AI attribute extraction. `ASSEMBLYAI_API_KEY` powers the voice transcription pipeline. SMS delivery supports Fast2SMS (for domestic Indian SMS) and Twilio, with automatic console fallback for development. Background removal and white background styling are handled natively by Gemini.

### 3. Create the database

```bash
# Connect to PostgreSQL and create the database
psql -U postgres
CREATE DATABASE artisan_app;
\q
```

### 4. Run the schema

```bash
psql -U postgres -d artisan_app -f db/schema.sql
```

Or using the full connection string:

```bash
psql "postgresql://user:password@localhost:5432/artisan_app" -f db/schema.sql
```

---

## Run

### Development (with auto-restart on file changes)

```bash
npm run dev
```

### Production

```bash
npm start
```

The server starts at **http://localhost:5000** (or the port in `.env`).

---

## API Overview

Base URL: `http://localhost:5000/api/v1`

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/otp/request` | Request an OTP (sent via Twilio or logged to console) |
| POST | `/auth/otp/verify` | Verify OTP and receive a JWT |

### Products (auth required unless noted)

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | POST | `/products` | Create a draft product |
| 2 | GET | `/products/:id` | Get product by ID |
| 3 | POST | `/products/:id/image` | Upload & enhance image (Gemini Vision) |
| 4 | POST | `/products/:id/voice` | Upload & transcribe voice (AssemblyAI STT + Gemini) |
| 5 | POST | `/products/:id/catalogue` | Generate catalogue fields (Gemini Vision) |
| 6 | GET | `/products/:id/price` | Get price recommendation (mock) |
| 7 | PUT | `/products/:id/confirm` | Confirm product (human-in-the-loop) |
| 8 | PUT | `/products/:id/publish` | Publish product (rejects if not confirmed) |
| 9 | GET | `/products` | List published products (**public, no auth**) |
| 10 | GET | `/products/:id/export` | Export product as marketplace-ready JSON |

### Health Check

```
GET /api/v1/health
```

---

## Quick Test (curl)

```bash
# 1. Request OTP
curl -X POST http://localhost:5000/api/v1/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"mobile_number": "+919876543210"}'

# 2. Check console for OTP (if Twilio not configured), then verify
curl -X POST http://localhost:5000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"mobile_number": "+919876543210", "otp": "123456"}'

# 3. Use the returned token for all subsequent requests
export TOKEN="<paste token here>"

# 4. Create a draft product
curl -X POST http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"images": {"original_url": "https://example.com/photo.jpg"}, "language_original": "hi"}'

# 5. Try publishing without confirming (should fail with 400)
curl -X PUT http://localhost:5000/api/v1/products/<product_id>/publish \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Format

All errors follow this shape (per `docs/tech-stack.md`):

```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": 400
}
```

---

## Project Structure

```
backend/
├── server.js               # Entry point
├── package.json
├── .env.example
├── .gitignore
├── db/
│   ├── pool.js             # PostgreSQL connection pool
│   └── schema.sql          # Database schema
├── middleware/
│   └── auth.js             # JWT verification middleware
├── routes/
│   ├── auth.js             # OTP request/verify + JWT
│   └── products.js         # All 10 product endpoints
├── utils/
│   ├── errorResponse.js    # Standardised error helper
│   └── formatProduct.js    # DB row → API JSON transformer
└── uploads/                # Uploaded images/audio (gitignored)
```
