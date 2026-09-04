const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const errorResponse = require('../utils/errorResponse');
const formatProduct = require('../utils/formatProduct');
const {
  enhanceProductImage,
  analyzeProductImage,
  extractProductAttributes,
  generatePricingIntelligence,
  mimeToExtension,
} = require('../utils/geminiService');
const { transcribeAudio } = require('../utils/assemblyService');

const router = express.Router();

// ─── Multer setup for file uploads ──────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage });

// ─── Helper: fetch product row by ID ────────────────────────────────────────
async function getProductById(productId) {
  const result = await pool.query(
    `SELECT p.*, 
            COALESCE(a.display_name, a.username, 'Master Artisan') AS artisan_name, 
            a.username AS artisan_username,
            a.mobile_number AS artisan_phone
     FROM products p
     LEFT JOIN artisans a ON p.artisan_id = a.id
     WHERE p.product_id = $1`,
    [productId]
  );
  return result.rows[0] || null;
}

// ═════════════════════════════════════════════════════════════════════════════
// 9. GET /products — Buyer-facing product list (PUBLIC, no auth)
//    Must be defined BEFORE the /:id routes so Express doesn't treat
//    "products" path segments as :id.
// ═════════════════════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const { category, craft_type, min_price, max_price } = req.query;

    let query = `
      SELECT p.*, 
             COALESCE(a.display_name, a.username, 'Master Artisan') AS artisan_name, 
             a.username AS artisan_username,
             a.mobile_number AS artisan_phone
      FROM products p
      LEFT JOIN artisans a ON p.artisan_id = a.id
      WHERE p.status = $1
    `;
    const params = ['published'];
    let paramIndex = 2;

    if (category) {
      query += ` AND p.category = $${paramIndex++}`;
      params.push(category);
    }
    if (craft_type) {
      query += ` AND p.craft_type = $${paramIndex++}`;
      params.push(craft_type);
    }
    if (min_price) {
      query += ` AND p.pricing_recommended_price >= $${paramIndex++}`;
      params.push(Number(min_price));
    }
    if (max_price) {
      query += ` AND p.pricing_recommended_price <= $${paramIndex++}`;
      params.push(Number(max_price));
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);

    res.status(200).json({
      products: result.rows.map(formatProduct),
    });
  } catch (err) {
    console.error('List products error:', err);
    return errorResponse(res, 500, 'Failed to fetch products');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. POST /products — Create Draft Product (auth required)
// ═════════════════════════════════════════════════════════════════════════════
router.post('/', authMiddleware, async (req, res) => {
  try {
    const artisan_id = req.artisan_id;
    const { images, language_original } = req.body;

    const product_id = uuidv4();
    const imagesOriginalUrl = images?.original_url || null;

    await pool.query(
      `INSERT INTO products (product_id, artisan_id, images_original_url, language_original, status)
       VALUES ($1, $2, $3, $4, 'draft')`,
      [product_id, artisan_id, imagesOriginalUrl, language_original || null]
    );

    const row = await getProductById(product_id);

    res.status(201).json(formatProduct(row));
  } catch (err) {
    console.error('Create product error:', err);
    return errorResponse(res, 500, 'Failed to create product');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. GET /products/:id — Get Product by ID (auth required)
// ═════════════════════════════════════════════════════════════════════════════
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const row = await getProductById(req.params.id);

    if (!row) {
      return errorResponse(res, 404, 'Product not found');
    }

    res.status(200).json(formatProduct(row));
  } catch (err) {
    console.error('Get product error:', err);
    return errorResponse(res, 500, 'Failed to fetch product');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. POST /products/:id/image — Upload & Enhance Image (auth required)
//    Sends uploaded image to Gemini (gemini-3.6-flash) for enhancement.
//    Falls back to original image URL if Gemini fails.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/:id/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const row = await getProductById(req.params.id);
    if (!row) {
      return errorResponse(res, 404, 'Product not found');
    }

    if (!req.file) {
      return errorResponse(res, 400, 'Image file is required (field name: "image")');
    }

    const originalUrl = `/uploads/${req.file.filename}`;
    let enhancedUrl = originalUrl; // fallback: use original if enhancement fails

    // ─── Gemini Image Enhancement ──────────────────────────────────────
    try {
      const imageBuffer = fs.readFileSync(req.file.path);
      const result = await enhanceProductImage(imageBuffer, req.file.mimetype);

      if (result && result.buffer && result.buffer.length > 0) {
        // Determine file extension from the MIME type Gemini returned
        const ext = mimeToExtension(result.mimeType);
        const enhancedFilename = `enhanced_${uuidv4()}${ext}`;
        const enhancedPath = path.join(__dirname, '..', 'uploads', enhancedFilename);

        fs.writeFileSync(enhancedPath, result.buffer);
        enhancedUrl = `/uploads/${enhancedFilename}`;
        console.log(`✅ Enhanced image saved: ${enhancedUrl}`);
      } else {
        console.warn(
          '⚠ Gemini image enhancement failed — original image used as enhanced_url fallback'
        );
      }
    } catch (enhanceErr) {
      console.warn(
        '⚠ Gemini image enhancement failed — original image used as enhanced_url fallback:',
        enhanceErr.message || enhanceErr
      );
    }

    // ─── Update database ───────────────────────────────────────────────
    await pool.query(
      'UPDATE products SET images_original_url = $1, images_enhanced_url = $2 WHERE product_id = $3',
      [originalUrl, enhancedUrl, req.params.id]
    );

    res.status(200).json({
      images: {
        original_url: originalUrl,
        enhanced_url: enhancedUrl,
      },
    });
  } catch (err) {
    console.error('Image upload error:', err);
    return errorResponse(res, 500, 'Failed to process image');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. POST /products/:id/voice — Upload & Transcribe Voice (auth required)
//    Pipeline:
//      Audio upload (Multer)
//      -> AssemblyAI (Speech-to-text transcription)
//      -> Gemini (Product attribute & story extraction)
//      -> PostgreSQL update
//      -> Standard product response contract
// ═════════════════════════════════════════════════════════════════════════════
router.post('/:id/voice', authMiddleware, upload.single('audio'), async (req, res) => {
  try {
    const row = await getProductById(req.params.id);
    if (!row) {
      return errorResponse(res, 404, 'Product not found');
    }

    if (!req.file) {
      return errorResponse(res, 400, 'Audio file is required (field name: "audio")');
    }

    const preferredLanguage = req.body.language || null;
    console.log(`🎙️ [AssemblyAI] Transcribing voice input: ${req.file.originalname} (${req.file.path}) [Language: ${preferredLanguage || 'auto-detect'}]`);
    const { text: transcriptText, languageCode, confidence } = await transcribeAudio(req.file.path, preferredLanguage);

    console.log(`🤖 [Gemini] Interpreting transcript and extracting attributes (language: ${languageCode})...`);
    const extracted = await extractProductAttributes(transcriptText, languageCode);

    const voiceResult = {
      description: extracted.description,
      language_original: extracted.language_original || row.language_original || languageCode || 'en',
      material: extracted.material,
      craft_type: extracted.craft_type,
      production: {
        time_days: extracted.production?.time_days || 5,
        technique: extracted.production?.technique || 'Handcrafted',
      },
      transcription_confidence: confidence,
    };

    // Update the product with extracted attributes in PostgreSQL
    await pool.query(
      `UPDATE products
       SET description = $1, language_original = $2, material = $3,
           craft_type = $4, production_time_days = $5, production_technique = $6
       WHERE product_id = $7`,
      [
        voiceResult.description,
        voiceResult.language_original,
        voiceResult.material,
        voiceResult.craft_type,
        voiceResult.production.time_days,
        voiceResult.production.technique,
        req.params.id,
      ]
    );

    console.log(`✅ [Voice Pipeline] Successfully processed voice and updated product ${req.params.id}`);
    res.status(200).json(voiceResult);
  } catch (err) {
    const safeMessage = (err.message || String(err))
      .replace(process.env.ASSEMBLYAI_API_KEY || '', '[REDACTED]')
      .replace(process.env.GEMINI_API_KEY || '', '[REDACTED]');
    console.error('Voice pipeline error:', safeMessage);
    return errorResponse(res, 500, `Failed to process voice: ${safeMessage}`);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. POST /products/:id/catalogue — Generate Catalogue Fields (auth required)
//    Uses Gemini Vision to analyze the product image and generate catalogue
//    fields. Falls back to stored product data if no image or Gemini fails.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/:id/catalogue', authMiddleware, async (req, res) => {
  try {
    const row = await getProductById(req.params.id);
    if (!row) {
      return errorResponse(res, 404, 'Product not found');
    }

    let catalogueFields = null;

    // ─── Attempt Gemini-powered catalogue generation from image ──────
    const imageUrl = row.images_original_url;
    if (imageUrl) {
      try {
        const imagePath = path.join(__dirname, '..', imageUrl);
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          // Infer MIME type from extension
          const ext = path.extname(imagePath).toLowerCase();
          const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
          const mimeType = mimeMap[ext] || 'image/jpeg';

          const analysis = await analyzeProductImage(imageBuffer, mimeType);

          if (analysis) {
            // Use Gemini to generate structured catalogue fields from the analysis
            const { GoogleGenAI } = require('@google/genai');
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

            const structuredResponse = await ai.models.generateContent({
              model: 'gemini-3.6-flash',
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text:
                        'Based on the following analysis of an artisan handicraft product, generate catalogue fields in STRICT JSON format (no markdown, no code fences, no extra text).\n\n' +
                        'Analysis:\n' + analysis + '\n\n' +
                        'Return ONLY a JSON object with exactly these fields:\n' +
                        '{\n' +
                        '  "product_name": "A concise, marketable product title",\n' +
                        '  "category": "A single product category",\n' +
                        '  "keywords": ["array", "of", "search", "keywords"],\n' +
                        '  "description": "A compelling product description for e-commerce"\n' +
                        '}',
                    },
                  ],
                },
              ],
              config: {
                responseModalities: ['TEXT'],
              },
            });

            const responseText = (structuredResponse.text || '').trim();
            // Strip markdown code fences if present
            const jsonStr = responseText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

            try {
              catalogueFields = JSON.parse(jsonStr);
              console.log('✅ Gemini catalogue generation succeeded');
            } catch (parseErr) {
              console.warn('⚠ Gemini returned non-JSON catalogue response:', responseText.substring(0, 200));
            }
          }
        }
      } catch (geminiErr) {
        console.warn('⚠ Gemini catalogue generation failed:', geminiErr.message || geminiErr);
      }
    }

    // ─── Fallback: use existing product data or sensible defaults ────
    if (!catalogueFields) {
      console.warn('⚠ Using fallback catalogue data (Gemini unavailable or no image)');
      catalogueFields = {
        product_name: row.product_name || row.craft_type || 'Artisan Handicraft Product',
        category: row.category || 'Handicrafts',
        keywords: row.keywords || ['handicraft', 'artisan', 'handmade'],
        description: row.description || 'A beautifully handcrafted artisan product.',
      };
    }

    // Ensure only the contract-defined fields are returned
    const result = {
      product_name: catalogueFields.product_name || 'Artisan Handicraft Product',
      category: catalogueFields.category || 'Handicrafts',
      keywords: Array.isArray(catalogueFields.keywords) ? catalogueFields.keywords : ['handicraft', 'artisan', 'handmade'],
      description: catalogueFields.description || 'A beautifully handcrafted artisan product.',
    };

    // Update the product in the database
    await pool.query(
      `UPDATE products
       SET product_name = $1, category = $2, keywords = $3, description = $4
       WHERE product_id = $5`,
      [
        result.product_name,
        result.category,
        result.keywords,
        result.description,
        req.params.id,
      ]
    );

    res.status(200).json(result);
  } catch (err) {
    console.error('Catalogue generation error:', err);
    return errorResponse(res, 500, 'Failed to generate catalogue fields');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. GET /products/:id/price — Get Price Recommendation (auth required)
//    Mock: returns realistic pricing data.
// ═════════════════════════════════════════════════════════════════════════════
router.get('/:id/price', authMiddleware, async (req, res) => {
  try {
    const row = await getProductById(req.params.id);
    if (!row) {
      return errorResponse(res, 404, 'Product not found');
    }

    // Generate dynamic AI Pricing Intelligence tailored specifically to this craft
    console.log(`🤖 [Pricing] Generating dynamic AI pricing for: ${row.product_name || row.craft_type || req.params.id}...`);
    const pricingData = await generatePricingIntelligence(row);

    // Update the product with bespoke pricing data
    await pool.query(
      `UPDATE products
       SET pricing_estimated_cost = $1, pricing_market_range_low = $2,
           pricing_market_range_high = $3, pricing_recommended_price = $4,
           pricing_confidence = $5, pricing_reasoning = $6
       WHERE product_id = $7`,
      [
        pricingData.estimated_cost,
        pricingData.market_range_low,
        pricingData.market_range_high,
        pricingData.recommended_price,
        pricingData.confidence,
        pricingData.reasoning,
        req.params.id,
      ]
    );

    console.log(`✅ [Pricing] Generated: Est ₹${pricingData.estimated_cost} | Range ₹${pricingData.market_range_low}-₹${pricingData.market_range_high} | Rec ₹${pricingData.recommended_price}`);
    res.status(200).json({ pricing: pricingData });
  } catch (err) {
    console.error('Price recommendation error:', err);
    return errorResponse(res, 500, 'Failed to generate price recommendation');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. PUT /products/:id/confirm — Confirm Product (auth required)
//    Merges corrected fields, sets status to "confirmed".
// ═════════════════════════════════════════════════════════════════════════════
router.put('/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const row = await getProductById(req.params.id);
    if (!row) {
      return errorResponse(res, 404, 'Product not found');
    }

    // Build dynamic UPDATE from the request body
    const allowedFields = {
      product_name: 'product_name',
      category: 'category',
      craft_type: 'craft_type',
      material: 'material',
      description: 'description',
      language_original: 'language_original',
      keywords: 'keywords',
    };

    const setClauses = ['status = \'confirmed\''];
    const values = [];
    let paramIndex = 1;

    // Handle flat fields
    for (const [jsonKey, dbColumn] of Object.entries(allowedFields)) {
      if (req.body[jsonKey] !== undefined) {
        setClauses.push(`${dbColumn} = $${paramIndex++}`);
        values.push(req.body[jsonKey]);
      }
    }

    // Handle nested pricing fields
    if (req.body.pricing) {
      const pricingMap = {
        estimated_cost: 'pricing_estimated_cost',
        market_range_low: 'pricing_market_range_low',
        market_range_high: 'pricing_market_range_high',
        recommended_price: 'pricing_recommended_price',
        confidence: 'pricing_confidence',
        reasoning: 'pricing_reasoning',
      };
      for (const [key, col] of Object.entries(pricingMap)) {
        if (req.body.pricing[key] !== undefined) {
          setClauses.push(`${col} = $${paramIndex++}`);
          values.push(req.body.pricing[key]);
        }
      }
    }

    // Handle nested production fields
    if (req.body.production) {
      if (req.body.production.time_days !== undefined) {
        setClauses.push(`production_time_days = $${paramIndex++}`);
        values.push(req.body.production.time_days);
      }
      if (req.body.production.technique !== undefined) {
        setClauses.push(`production_technique = $${paramIndex++}`);
        values.push(req.body.production.technique);
      }
    }

    // Handle nested images fields
    if (req.body.images) {
      if (req.body.images.original_url !== undefined) {
        setClauses.push(`images_original_url = $${paramIndex++}`);
        values.push(req.body.images.original_url);
      }
      if (req.body.images.enhanced_url !== undefined) {
        setClauses.push(`images_enhanced_url = $${paramIndex++}`);
        values.push(req.body.images.enhanced_url);
      }
    }

    values.push(req.params.id);

    await pool.query(
      `UPDATE products SET ${setClauses.join(', ')} WHERE product_id = $${paramIndex}`,
      values
    );

    const updated = await getProductById(req.params.id);
    res.status(200).json(formatProduct(updated));
  } catch (err) {
    console.error('Confirm product error:', err);
    return errorResponse(res, 500, 'Failed to confirm product');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. PUT /products/:id/publish — Publish Product (auth required)
//    REJECTS if status is not "confirmed".
// ═════════════════════════════════════════════════════════════════════════════
router.put('/:id/publish', authMiddleware, async (req, res) => {
  try {
    const row = await getProductById(req.params.id);
    if (!row) {
      return errorResponse(res, 404, 'Product not found');
    }

    if (row.status !== 'confirmed') {
      return errorResponse(
        res,
        400,
        `Cannot publish product — current status is "${row.status}". Product must be confirmed before publishing.`
      );
    }

    await pool.query(
      "UPDATE products SET status = 'published' WHERE product_id = $1",
      [req.params.id]
    );

    res.status(200).json({ status: 'published' });
  } catch (err) {
    console.error('Publish product error:', err);
    return errorResponse(res, 500, 'Failed to publish product');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// 10. GET /products/:id/export — Export Product (auth required)
//     Returns full product formatted for marketplace export.
// ═════════════════════════════════════════════════════════════════════════════
router.get('/:id/export', authMiddleware, async (req, res) => {
  try {
    const row = await getProductById(req.params.id);
    if (!row) {
      return errorResponse(res, 404, 'Product not found');
    }

    res.status(200).json(formatProduct(row));
  } catch (err) {
    console.error('Export product error:', err);
    return errorResponse(res, 500, 'Failed to export product');
  }
});

module.exports = router;
