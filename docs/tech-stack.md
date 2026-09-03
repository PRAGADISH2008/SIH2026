# Tech Stack — Locked Decisions

This file exists so both the frontend and backend AI prompts reference the exact same setup. Don't deviate from this without updating this file first and telling the whole team.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React (with React Router, fetch/axios for API calls) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| AI Services | Gemini API (catalogue generation), BHASHINI (speech-to-text/translation), remove.bg (image background removal) |

---

## Base URL

```
http://localhost:5000/api/v1
```

- Backend runs on port `5000` locally during development
- All endpoints in `api-contract.md` are relative to this base URL
- When deploying (if you get to that), this becomes an environment variable (`API_BASE_URL`) in the frontend — never hardcode the URL in frontend code beyond a single config file

---

## Auth Approach (Real OTP-based)

Mobile-number + OTP login, fully implemented — not a placeholder.

### Endpoints
- `POST /auth/otp/request` — body: `{ "mobile_number": "string" }`. Backend generates a 6-digit OTP, stores it (with expiry, e.g. 5 min) against that number, and sends it via an SMS provider.
- `POST /auth/otp/verify` — body: `{ "mobile_number": "string", "otp": "string" }`. Backend checks the OTP, and if valid, creates/fetches the artisan record and returns a signed JWT.

### SMS delivery for the demo
Use a real SMS provider's **test/trial mode** so the flow is functionally real without needing a paid production account:
- **Twilio** — free trial account gives real SMS delivery to verified numbers, which is enough for a live demo (verify your team's phones as test recipients).
- Alternative: **MSG91** or **Fast2SMS** (Indian providers) also offer free-tier test credits, often simpler for Indian mobile numbers.

### Token handling
- On successful OTP verification, backend issues a JWT (`jsonwebtoken` npm package), signed with a secret in `.env` (`JWT_SECRET=`).
- Frontend stores the JWT (in memory / React state, not localStorage per artifact rules if this ever runs as an artifact — for a real React app, localStorage is fine) and sends it as:
  ```
  Authorization: Bearer <token>
  ```
- Backend validates the JWT on every protected endpoint via middleware, extracts `artisan_id` from the token payload — the frontend never needs to manually pass `artisan_id` in the body.

### Why this is worth the time
A real OTP flow is one continuous, well-documented pattern (generate → store → verify → issue token) — implementable in a few hours with an AI's help, and it removes a fake-auth red flag a judge could easily catch by asking "how does login actually work?"

---

## Error Format

All error responses from the backend must follow this shape, so the frontend can handle errors generically instead of per-endpoint:

```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": 400
}
```

**Common codes to implement:**
- `400` — bad request / validation error (e.g. missing required field)
- `401` — unauthorized (missing/invalid artisan_id or token)
- `404` — product not found
- `409` — conflict (e.g. trying to publish a product that's still in `draft` status)
- `500` — server/internal error

**Note:** This error format section should also be copied into `docs/api-contract.md` under a new "Error Format" heading, since that's the file both AI prompts will reference when generating request/response handling code. Keeping it in both places (or just moving it fully into `api-contract.md`) avoids one AI seeing it and the other missing it.

---

## Environment Variables (backend `.env`)

```
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/artisan_app
JWT_SECRET=
GEMINI_API_KEY=
BHASHINI_USER_ID=
BHASHINI_API_KEY=
REMOVE_BG_API_KEY=
SMS_PROVIDER_SID=
SMS_PROVIDER_AUTH_TOKEN=
SMS_PROVIDER_FROM_NUMBER=
```

Add a `.env.example` with these keys (no real values) to the repo root or `/backend` folder so the backend AI prompt can reference it directly.
