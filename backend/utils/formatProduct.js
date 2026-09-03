/**
 * Transform a flat database row into the nested JSON shape
 * defined in api-contract.json.
 */
function formatProduct(row) {
  if (!row) return null;

  return {
    product_id: row.product_id,
    artisan_id: row.artisan_id,
    product_name: row.product_name || null,
    category: row.category || null,
    craft_type: row.craft_type || null,
    material: row.material || null,
    description: row.description || null,
    language_original: row.language_original || null,
    keywords: row.keywords || [],
    images: {
      original_url: row.images_original_url || null,
      enhanced_url: row.images_enhanced_url || null,
    },
    production: {
      time_days: row.production_time_days != null ? Number(row.production_time_days) : null,
      technique: row.production_technique || null,
    },
    pricing: {
      estimated_cost: row.pricing_estimated_cost != null ? Number(row.pricing_estimated_cost) : null,
      market_range_low: row.pricing_market_range_low != null ? Number(row.pricing_market_range_low) : null,
      market_range_high: row.pricing_market_range_high != null ? Number(row.pricing_market_range_high) : null,
      recommended_price: row.pricing_recommended_price != null ? Number(row.pricing_recommended_price) : null,
      confidence: row.pricing_confidence != null ? Number(row.pricing_confidence) : null,
      reasoning: row.pricing_reasoning || [],
    },
    status: row.status,
    created_at: row.created_at,
  };
}

module.exports = formatProduct;
