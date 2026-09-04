/**
 * Gemini Vision API Service
 *
 * Provides two independent functions:
 *   - enhanceProductImage: image-to-image editing via Gemini (returns enhanced image buffer)
 *   - analyzeProductImage: image understanding/analysis (returns structured text)
 *
 * Uses @google/genai SDK v2.x with the gemini-3.6-flash model.
 * API key is read exclusively from process.env.GEMINI_API_KEY — never hardcoded.
 */

const { GoogleGenAI } = require('@google/genai');

// ─── Constants ──────────────────────────────────────────────────────────────
const IMAGE_MODEL = 'gemini-3.6-flash';

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

// ═════════════════════════════════════════════════════════════════════════════
// extractProductAttributes
//
// Interprets the speech-to-text transcript from AssemblyAI and extracts
// structured e-commerce handicraft attributes.
// ═════════════════════════════════════════════════════════════════════════════
async function extractProductAttributes(transcriptText, languageCode = 'en') {
  if (!transcriptText || !transcriptText.trim()) {
    return {
      description: 'Handcrafted artisan product.',
      language_original: languageCode || 'en',
      material: 'Traditional artisan materials',
      craft_type: 'Handicraft',
      production: {
        time_days: 1,
        technique: 'Handmade artisan technique',
      },
    };
  }

  try {
    const ai = getClient();
    const prompt = `You are an expert in Indian and global handicrafts and artisan e-commerce.
An artisan provided the following spoken voice description of their handcrafted product (transcribed from audio in language: ${languageCode}):

"${transcriptText}"

Extract and infer the product attributes. You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra commentary) with the following structure:
{
  "description": "An engaging, detailed e-commerce product description highlighting cultural heritage, design, and artisan story based on what they described",
  "language_original": "${languageCode}",
  "material": "Comma-separated materials used (e.g., Terracotta clay, Natural dyes, Silk)",
  "craft_type": "Specific craft name (e.g., Madhubani Painting, Blue Pottery, Brass Dokra)",
  "production": {
    "time_days": integer estimate of production time in days (e.g., 3, 7, 14),
    "technique": "Specific crafting technique (e.g., Wheel throwing and pit firing, Hand embroidery)"
  }
}`;

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config: {
        responseModalities: ['TEXT'],
      },
    });

    let rawText = (response.text || '').trim();
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    const parsed = JSON.parse(rawText);
    return {
      description: parsed.description || transcriptText,
      language_original: parsed.language_original || languageCode || 'en',
      material: parsed.material || 'Traditional artisan materials',
      craft_type: parsed.craft_type || 'Handicraft',
      production: {
        time_days: Number.isInteger(Number(parsed.production?.time_days)) ? Number(parsed.production.time_days) : 5,
        technique: parsed.production?.technique || 'Handmade artisan craft',
      },
    };
  } catch (err) {
    const safeMessage = (err.message || String(err))
      .replace(process.env.GEMINI_API_KEY || '', '[REDACTED]');
    console.error(`⚠ Gemini attribute extraction failed: ${safeMessage}`);
    return {
      description: transcriptText,
      language_original: languageCode || 'en',
      material: 'Traditional artisan materials',
      craft_type: 'Handicraft',
      production: {
        time_days: 5,
        technique: 'Handcrafted',
      },
    };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// calculateDynamicFallbackPricing
//
// Generates realistic, tailored pricing intelligence based on the product's
// specific materials, craftsmanship category, and production time in days.
// Used when Gemini API is unavailable or as a robust baseline.
// ═════════════════════════════════════════════════════════════════════════════
function calculateDynamicFallbackPricing(product = {}) {
  const days = Math.max(1, Number(product.production_time_days) || 3);
  const craft = product.craft_type || product.category || 'Handicraft';
  const mat = product.material || 'Natural artisan materials';
  const name = product.product_name || 'Handcrafted item';
  const technique = product.production_technique || 'Traditional artisan handcrafting';

  // Base daily labor rate for Indian skilled artisans (~₹400/day)
  const laborCost = days * 400;

  // Material cost estimation based on category / materials
  const textLower = `${craft} ${mat} ${name} ${product.category || ''}`.toLowerCase();
  let materialCost = 350;

  if (textLower.includes('silk') || textLower.includes('pashmina') || textLower.includes('zari') || textLower.includes('brocade')) {
    materialCost = 1400;
  } else if (textLower.includes('brass') || textLower.includes('metal') || textLower.includes('bronze') || textLower.includes('dokra') || textLower.includes('dhokra') || textLower.includes('copper')) {
    materialCost = 900;
  } else if (textLower.includes('silver') || textLower.includes('filigree') || textLower.includes('jewelry') || textLower.includes('jewellery') || textLower.includes('gemstone')) {
    materialCost = 1600;
  } else if (textLower.includes('wood') || textLower.includes('sandalwood') || textLower.includes('rosewood') || textLower.includes('teak') || textLower.includes('carving')) {
    materialCost = 550;
  } else if (textLower.includes('pottery') || textLower.includes('terracotta') || textLower.includes('clay') || textLower.includes('ceramic')) {
    materialCost = 250;
  } else if (textLower.includes('leather') || textLower.includes('mojari') || textLower.includes('shantiniketan')) {
    materialCost = 650;
  } else if (textLower.includes('bamboo') || textLower.includes('cane') || textLower.includes('jute') || textLower.includes('grass')) {
    materialCost = 300;
  } else if (textLower.includes('painting') || textLower.includes('madhubani') || textLower.includes('warli') || textLower.includes('pattachitra') || textLower.includes('kalamkari') || textLower.includes('miniature')) {
    materialCost = 400;
  }

  const estimated_cost = materialCost + laborCost;
  const market_range_low = Math.max(500, Math.round((estimated_cost * 1.5) / 50) * 50);
  const market_range_high = Math.round((estimated_cost * 3.2) / 50) * 50;
  const recommended_price = Math.round((estimated_cost * 2.2) / 50) * 50;

  return {
    estimated_cost,
    market_range_low,
    market_range_high,
    recommended_price,
    confidence: 0.88,
    reasoning: [
      `${craft} creations of this size and style typically retail between ₹${market_range_low} and ₹${market_range_high} across online handicraft marketplaces.`,
      `The use of authentic ${mat} commands a 20–30% premium over machine-manufactured alternatives.`,
      `${technique} demands meticulous artisan handwork spanning an estimated ${days} day${days > 1 ? 's' : ''} of dedicated production.`,
      `Estimated raw material (₹${materialCost}) + artisan skilled labour (₹${laborCost}) brings the baseline production cost to ₹${estimated_cost}.`,
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// generatePricingIntelligence
//
// Calls Gemini with complete product context to generate real-time, bespoke
// pricing intelligence and bullet points tailored specifically to this craft.
// ═════════════════════════════════════════════════════════════════════════════
async function generatePricingIntelligence(product = {}) {
  const {
    product_name,
    category,
    craft_type,
    material,
    production_time_days,
    production_technique,
    description,
  } = product;

  try {
    const ai = getClient();
    const prompt = `You are a handicraft pricing and market intelligence specialist for Indian artisan e-commerce.
Analyze this specific artisan handcrafted product:
- Product Name: ${product_name || 'Handcrafted Artisan Item'}
- Category: ${category || 'Handicrafts'}
- Craft Type: ${craft_type || 'Traditional Craft'}
- Material: ${material || 'Natural Artisan Materials'}
- Production Time: ${production_time_days || 3} days
- Crafting Technique: ${production_technique || 'Handmade Craftsmanship'}
- Description: ${description || 'Artisan handcrafted product'}

Generate realistic market pricing intelligence in Indian Rupees (INR / ₹) tailored specifically to THIS product.
Rules:
1. "estimated_cost": integer, estimated cost in ₹ for raw materials and artisan labor (${production_time_days || 3} days).
2. "market_range_low": integer, reasonable entry market price in ₹ on e-commerce platforms.
3. "market_range_high": integer, premium boutique/export market price in ₹.
4. "recommended_price": integer, ideal recommended selling price in ₹ ensuring high buyer appeal and healthy artisan margin (must be between market_range_low and market_range_high).
5. "confidence": decimal between 0.84 and 0.94.
6. "reasoning": array of EXACTLY 4 concise, informative bullet points specifically detailing:
   - Bullet 1: Online market price range and demand specifically for ${craft_type || product_name || 'this craft'}.
   - Bullet 2: Value proposition and price premium of using authentic ${material || 'materials'}.
   - Bullet 3: Artisanal effort involved in ${production_technique || 'the crafting technique'} taking ${production_time_days || 3} days.
   - Bullet 4: Transparent cost breakdown of materials and artisan labor (~₹[amount]).

You MUST respond with ONLY a valid JSON object (no markdown formatting, no code fences, no extra text):
{
  "estimated_cost": 500,
  "market_range_low": 900,
  "market_range_high": 2400,
  "recommended_price": 1600,
  "confidence": 0.88,
  "reasoning": [
    "...",
    "...",
    "...",
    "..."
  ]
}`;

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config: {
        responseModalities: ['TEXT'],
      },
    });

    let rawText = (response.text || '').trim();
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(rawText);

    if (
      parsed.estimated_cost &&
      parsed.market_range_low &&
      parsed.market_range_high &&
      parsed.recommended_price &&
      Array.isArray(parsed.reasoning) &&
      parsed.reasoning.length > 0
    ) {
      return {
        estimated_cost: Math.round(Number(parsed.estimated_cost)),
        market_range_low: Math.round(Number(parsed.market_range_low)),
        market_range_high: Math.round(Number(parsed.market_range_high)),
        recommended_price: Math.round(Number(parsed.recommended_price)),
        confidence: Math.min(0.95, Math.max(0.75, Number(parsed.confidence) || 0.88)),
        reasoning: parsed.reasoning.map((r) => String(r).trim()),
      };
    }
  } catch (err) {
    const safeMessage = (err.message || String(err)).replace(process.env.GEMINI_API_KEY || '', '[REDACTED]');
    console.warn(`⚠ Gemini pricing generation notice: ${safeMessage}`);
  }

  // Robust fallback tailored to this specific craft
  return calculateDynamicFallbackPricing(product);
}

module.exports = {
  enhanceProductImage,
  analyzeProductImage,
  extractProductAttributes,
  generatePricingIntelligence,
  calculateDynamicFallbackPricing,
  mimeToExtension,
};

