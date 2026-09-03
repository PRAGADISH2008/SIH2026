const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const errorResponse = require('../utils/errorResponse');
const formatProduct = require('../utils/formatProduct');

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
    'SELECT * FROM products WHERE product_id = $1',
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

    let query = 'SELECT * FROM products WHERE status = $1';
    const params = ['published'];
    let paramIndex = 2;

    if (category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(category);
    }
    if (craft_type) {
      query += ` AND craft_type = $${paramIndex++}`;
      params.push(craft_type);
    }
    if (min_price) {
      query += ` AND pricing_recommended_price >= $${paramIndex++}`;
      params.push(Number(min_price));
    }
    if (max_price) {
      query += ` AND pricing_recommended_price <= $${paramIndex++}`;
      params.push(Number(max_price));
    }

    query += ' ORDER BY created_at DESC';

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
//    Mock: saves file, returns original + mock enhanced URL.
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
    // Mock: enhanced URL is the same file with a suffix in the name
    const enhancedUrl = `/uploads/enhanced_${req.file.filename}`;

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
//    Mock: returns realistic Indian handicraft transcription data.
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

    // Mock transcription / attribute extraction
    const mockResult = {
      description: 'Handcrafted Madhubani painting on handmade paper using natural dyes. Features traditional fish and lotus motifs symbolising fertility and prosperity. Made using the Bharni (filled) style with fine bamboo nib detailing.',
      language_original: row.language_original || 'hi',
      material: 'Handmade paper, natural dyes, bamboo nib',
      craft_type: 'Madhubani Painting',
      production: {
        time_days: 7,
        technique: 'Bharni (filled) style with bamboo nib',
      },
      transcription_confidence: 0.92,
    };

    // Update the product with extracted attributes
    await pool.query(
      `UPDATE products
       SET description = $1, language_original = $2, material = $3,
           craft_type = $4, production_time_days = $5, production_technique = $6
       WHERE product_id = $7`,
      [
        mockResult.description,
        mockResult.language_original,
        mockResult.material,
        mockResult.craft_type,
        mockResult.production.time_days,
        mockResult.production.technique,
        req.params.id,
      ]
    );

    res.status(200).json(mockResult);
  } catch (err) {
    console.error('Voice upload error:', err);
    return errorResponse(res, 500, 'Failed to process voice');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. POST /products/:id/catalogue — Generate Catalogue Fields (auth required)
//    Mock: returns realistic LLM-generated catalogue data.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/:id/catalogue', authMiddleware, async (req, res) => {
  try {
    const row = await getProductById(req.params.id);
    if (!row) {
      return errorResponse(res, 404, 'Product not found');
    }

    // Mock LLM-generated catalogue fields
    const mockCatalogue = {
      product_name: 'Madhubani Fish & Lotus Painting — Bharni Style',
      category: 'Paintings & Wall Art',
      keywords: [
        'madhubani',
        'mithila art',
        'bharni style',
        'folk painting',
        'natural dyes',
        'handmade paper',
        'indian handicraft',
        'wall decor',
        'traditional art',
      ],
      description: 'An exquisite Madhubani painting crafted in the traditional Bharni (filled) style on handmade paper. Featuring iconic fish and lotus motifs rendered with natural dyes and fine bamboo nib detailing, this piece embodies the rich artistic heritage of Mithila, Bihar. Each piece is one-of-a-kind, reflecting hours of meticulous handwork by a skilled artisan.',
    };

    // Update the product
    await pool.query(
      `UPDATE products
       SET product_name = $1, category = $2, keywords = $3, description = $4
       WHERE product_id = $5`,
      [
        mockCatalogue.product_name,
        mockCatalogue.category,
        mockCatalogue.keywords,
        mockCatalogue.description,
        req.params.id,
      ]
    );

    res.status(200).json(mockCatalogue);
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

    // Mock pricing engine output
    const mockPricing = {
      pricing: {
        estimated_cost: 450,
        market_range_low: 800,
        market_range_high: 2500,
        recommended_price: 1500,
        confidence: 0.85,
        reasoning: [
          'Madhubani paintings of this size typically sell for ₹800–₹2500 online',
          'Natural dye works command a 20-30% premium over synthetic alternatives',
          'Bharni style is one of the most sought-after Madhubani techniques',
          'Estimated material + labour cost is approximately ₹450',
        ],
      },
    };

    // Update the product with pricing data
    await pool.query(
      `UPDATE products
       SET pricing_estimated_cost = $1, pricing_market_range_low = $2,
           pricing_market_range_high = $3, pricing_recommended_price = $4,
           pricing_confidence = $5, pricing_reasoning = $6
       WHERE product_id = $7`,
      [
        mockPricing.pricing.estimated_cost,
        mockPricing.pricing.market_range_low,
        mockPricing.pricing.market_range_high,
        mockPricing.pricing.recommended_price,
        mockPricing.pricing.confidence,
        mockPricing.pricing.reasoning,
        req.params.id,
      ]
    );

    res.status(200).json(mockPricing);
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
