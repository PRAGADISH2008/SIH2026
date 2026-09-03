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

export const mockPriceResponse = {
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
