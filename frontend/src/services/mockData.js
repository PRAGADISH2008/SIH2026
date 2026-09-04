// ─── Mock Data — matches the ACTUAL backend mock responses exactly ────────────
// Every shape here mirrors what the real backend returns, so the UI code
// doesn't need to know whether it's talking to real or mock.

import { v4Fallback } from '../utils/helpers';

export const mockOtpRequestResponse = {
  message: 'OTP sent successfully',
  delivery_method: 'console',
};

export const mockOtpVerifyResponse = {
  message: 'OTP verified successfully',
  token: 'mock-jwt-token-for-dev',
  artisan_id: 'mock-artisan-id-001',
};

export function mockCreateDraftResponse() {
  const id = v4Fallback();
  return {
    product_id: id,
    artisan_id: 'mock-artisan-id-001',
    product_name: null,
    category: null,
    craft_type: null,
    material: null,
    description: null,
    language_original: 'hi',
    keywords: [],
    images: { original_url: null, enhanced_url: null },
    production: { time_days: null, technique: null },
    pricing: {
      estimated_cost: null,
      market_range_low: null,
      market_range_high: null,
      recommended_price: null,
      confidence: null,
      reasoning: [],
    },
    status: 'draft',
    created_at: new Date().toISOString(),
  };
}

export const mockImageUploadResponse = {
  images: {
    original_url: '/uploads/mock-original.jpg',
    enhanced_url: '/uploads/enhanced_mock-original.jpg',
  },
};

export const mockVoiceUploadResponse = {
  description:
    'Handcrafted Madhubani painting on handmade paper using natural dyes. Features traditional fish and lotus motifs symbolising fertility and prosperity. Made using the Bharni (filled) style with fine bamboo nib detailing.',
  language_original: 'hi',
  material: 'Handmade paper, natural dyes, bamboo nib',
  craft_type: 'Madhubani Painting',
  production: {
    time_days: 7,
    technique: 'Bharni (filled) style with bamboo nib',
  },
  transcription_confidence: 0.92,
};

// Catalogue response — EXACT match of backend mock (no request body used)
export const mockCatalogueResponse = {
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
  description:
    'An exquisite Madhubani painting crafted in the traditional Bharni (filled) style on handmade paper. Featuring iconic fish and lotus motifs rendered with natural dyes and fine bamboo nib detailing, this piece embodies the rich artistic heritage of Mithila, Bihar. Each piece is one-of-a-kind, reflecting hours of meticulous handwork by a skilled artisan.',
};

export function getDynamicMockPrice(product = {}) {
  const days = Math.max(1, Number(product.production_time_days || product.production?.time_days) || 3);
  const craft = product.craft_type || product.category || 'Handcrafted Craft';
  const mat = product.material || 'Artisan materials';
  const laborCost = days * 420;
  const textLower = `${craft} ${mat} ${product.product_name || ''}`.toLowerCase();

  let materialCost = 350;
  if (textLower.includes('silk') || textLower.includes('pashmina')) materialCost = 1400;
  else if (textLower.includes('brass') || textLower.includes('metal') || textLower.includes('dokra')) materialCost = 900;
  else if (textLower.includes('wood') || textLower.includes('carving')) materialCost = 550;
  else if (textLower.includes('pottery') || textLower.includes('terracotta') || textLower.includes('clay')) materialCost = 250;
  else if (textLower.includes('leather')) materialCost = 650;
  else if (textLower.includes('bamboo') || textLower.includes('cane') || textLower.includes('jute')) materialCost = 300;

  const estimated_cost = materialCost + laborCost;
  const market_range_low = Math.max(500, Math.round((estimated_cost * 1.5) / 50) * 50);
  const market_range_high = Math.round((estimated_cost * 3.2) / 50) * 50;
  const recommended_price = Math.round((estimated_cost * 2.2) / 50) * 50;

  return {
    pricing: {
      estimated_cost,
      market_range_low,
      market_range_high,
      recommended_price,
      confidence: 0.88,
      reasoning: [
        `${craft} items of this size typically retail between ₹${market_range_low} and ₹${market_range_high} online`,
        `The use of authentic ${mat} commands a 20-30% premium over synthetic alternatives`,
        `Crafting requires dedicated artisan handwork spanning approximately ${days} day${days > 1 ? 's' : ''}`,
        `Estimated raw material (₹${materialCost}) + artisan labour (₹${laborCost}) is approximately ₹${estimated_cost}`,
      ],
    },
  };
}

export const mockPriceResponse = getDynamicMockPrice();

export const mockPublishResponse = { status: 'published' };

export function mockConfirmResponse(product, corrections) {
  return {
    ...product,
    ...corrections,
    status: 'confirmed',
  };
}

export const mockBuyerProducts = {
  products: [
    {
      product_id: 'pub-001',
      artisan_id: 'mock-artisan-id-001',
      product_name: 'Madhubani Fish & Lotus Painting — Bharni Style',
      category: 'Paintings & Wall Art',
      craft_type: 'Madhubani Painting',
      material: 'Handmade paper, natural dyes, bamboo nib',
      description:
        'An exquisite Madhubani painting crafted in the traditional Bharni (filled) style.',
      language_original: 'hi',
      keywords: ['madhubani', 'mithila art', 'bharni style'],
      images: {
        original_url: null,
        enhanced_url: null,
      },
      production: { time_days: 7, technique: 'Bharni (filled) style with bamboo nib' },
      pricing: {
        estimated_cost: 450,
        market_range_low: 800,
        market_range_high: 2500,
        recommended_price: 1500,
        confidence: 0.85,
        reasoning: [],
      },
      status: 'published',
      created_at: new Date().toISOString(),
    },
  ],
};

export function mockExportResponse(product) {
  return product;
}
