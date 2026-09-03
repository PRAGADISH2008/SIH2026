/**
 * Gemini Vision API Service
 *
 * Provides two independent functions:
 *   - enhanceProductImage: image-to-image editing via Gemini (returns enhanced image buffer)
 *   - analyzeProductImage: image understanding/analysis (returns structured text)
 *
 * Uses @google/genai SDK v2.x with the gemini-2.5-flash-image model.
 * API key is read exclusively from process.env.GEMINI_API_KEY — never hardcoded.
 */

const { GoogleGenAI } = require('@google/genai');

// ─── Constants ──────────────────────────────────────────────────────────────
const IMAGE_MODEL = 'gemini-2.5-flash-image';

// ─── Lazy-initialised client (created on first call) ────────────────────────
let _ai = null;

function getClient() {
  if (_ai) return _ai;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Set a valid key in backend/.env'
    );
  }

  _ai = new GoogleGenAI({ apiKey });
  return _ai;
}

// ─── MIME type → file extension mapping ─────────────────────────────────────
function mimeToExtension(mimeType) {
  const map = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return map[mimeType] || '.png';
}

// ═════════════════════════════════════════════════════════════════════════════
// enhanceProductImage
//
// Sends the uploaded product image to Gemini and requests an enhanced version
// suitable for e-commerce cataloguing. Returns { buffer, mimeType } on success,
// or null if the model cannot produce an image.
//
// This function is INDEPENDENT of analyzeProductImage.
// ═════════════════════════════════════════════════════════════════════════════
async function enhanceProductImage(imageBuffer, mimeType) {
  try {
    const ai = getClient();
    const base64Data = imageBuffer.toString('base64');

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                'You are a professional product photographer. Enhance this artisan handicraft product image for an e-commerce catalogue. ' +
                'Improve lighting and color balance. Make the product stand out with a clean, white background. ' +
                'Keep the product itself exactly as-is — do not alter, distort, or remove any part of the craft. ' +
                'Return only the enhanced image.',
            },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    // Extract the generated image from response candidates
    const candidates = response.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const buffer = Buffer.from(part.inlineData.data, 'base64');
          const returnedMime = part.inlineData.mimeType || 'image/png';
          console.log(
            `✅ Gemini image enhancement succeeded. Output MIME: ${returnedMime}, size: ${buffer.length} bytes`
          );
          return { buffer, mimeType: returnedMime };
        }
      }
    }

    // Model returned a response but no image data
    console.warn(
      '⚠ Gemini returned a response but no image data in candidates.'
    );
    return null;
  } catch (err) {
    // Log the error without exposing the API key
    const safeMessage = (err.message || String(err))
      .replace(process.env.GEMINI_API_KEY || '', '[REDACTED]');
    console.error(`⚠ Gemini image enhancement failed: ${safeMessage}`);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// analyzeProductImage
//
// Sends the uploaded product image to Gemini for visual analysis.
// Returns a structured text description of the craft, or null on failure.
//
// This function is INDEPENDENT of enhanceProductImage.
// ═════════════════════════════════════════════════════════════════════════════
async function analyzeProductImage(imageBuffer, mimeType) {
  try {
    const ai = getClient();
    const base64Data = imageBuffer.toString('base64');

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                'Analyze this artisan handicraft product image. Identify and describe:\n' +
                '1. Type of craft (e.g., pottery, textile, painting, woodwork)\n' +
                '2. Materials visible (e.g., clay, silk, natural dyes, wood)\n' +
                '3. Techniques used (e.g., hand-painted, woven, carved)\n' +
                '4. Colors and patterns\n' +
                '5. Cultural or regional origin if identifiable\n' +
                '6. Approximate quality and craftsmanship level\n' +
                'Provide a structured, concise analysis.',
            },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['TEXT'],
      },
    });

    const text = response.text || '';
    if (text) {
      console.log(`✅ Gemini image analysis succeeded. Length: ${text.length} chars`);
    }
    return text || null;
  } catch (err) {
    const safeMessage = (err.message || String(err))
      .replace(process.env.GEMINI_API_KEY || '', '[REDACTED]');
    console.error(`⚠ Gemini image analysis failed: ${safeMessage}`);
    return null;
  }
}

module.exports = {
  enhanceProductImage,
  analyzeProductImage,
  mimeToExtension,
};
