import { useState, useEffect } from 'react';
import { listProducts, exportProduct } from '../services/api';
import { BACKEND_ORIGIN } from '../config';
import { resolveImageUrl, formatPrice } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';
import {
  Search, Filter, ShoppingBag, Star, X, Copy,
  ChevronDown, Tag, Clock, FileText, Sparkles
} from 'lucide-react';
import './BuyerMarketplace.css';

export default function BuyerMarketplace({ toast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    craft_type: '',
    min_price: '',
    max_price: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [exportJson, setExportJson] = useState(null);
  const [showExport, setShowExport] = useState(false);

  async function fetchProducts() {
    setLoading(true);
    try {
      // GET /products — public, no auth. Response: { products: [...] }
      const activeFilters = {};
      if (filters.category) activeFilters.category = filters.category;
      if (filters.craft_type) activeFilters.craft_type = filters.craft_type;
      if (filters.min_price) activeFilters.min_price = filters.min_price;
      if (filters.max_price) activeFilters.max_price = filters.max_price;
      const res = await listProducts(activeFilters);
      setProducts(res.products || []);
    } catch (err) {
      toast.error(err.serverMessage || err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function handleFilterApply() {
    fetchProducts();
    setShowFilters(false);
  }

  function clearFilters() {
    setFilters({ category: '', craft_type: '', min_price: '', max_price: '' });
    setTimeout(fetchProducts, 0);
  }

  async function handleExport(productId) {
    try {
      const data = await exportProduct(productId);
      setExportJson(data);
      setShowExport(true);
    } catch (err) {
      toast.error(err.serverMessage || err.message);
    }
  }

  function copyExport() {
    navigator.clipboard.writeText(JSON.stringify(exportJson, null, 2));
    toast.success('JSON copied to clipboard!');
  }

  return (
    <div className="page">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">Marketplace</h1>
        <p className="page-subtitle">Authentic handcrafted treasures from Indian artisans</p>
      </div>

      {/* Filter bar */}
      <div className="market-toolbar animate-fade-in">
        <button
          className={`btn btn-secondary btn-sm ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={14} /> Filters
          <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        <span className="market-count">{products.length} product{products.length !== 1 ? 's' : ''}</span>
      </div>

      {showFilters && (
        <div className="filter-panel card animate-fade-in">
          <div className="filter-grid">
            <div className="rf-group">
              <label className="input-label">Category</label>
              <input
                className="input-field"
                placeholder="e.g. Paintings & Wall Art"
                value={filters.category}
                onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="rf-group">
              <label className="input-label">Craft Type</label>
              <input
                className="input-field"
                placeholder="e.g. Madhubani Painting"
                value={filters.craft_type}
                onChange={(e) => setFilters(f => ({ ...f, craft_type: e.target.value }))}
              />
            </div>
            <div className="rf-group">
              <label className="input-label">Min Price (₹)</label>
              <input
                type="number"
                className="input-field"
                placeholder="0"
                value={filters.min_price}
                onChange={(e) => setFilters(f => ({ ...f, min_price: e.target.value }))}
              />
            </div>
            <div className="rf-group">
              <label className="input-label">Max Price (₹)</label>
              <input
                type="number"
                className="input-field"
                placeholder="10000"
                value={filters.max_price}
                onChange={(e) => setFilters(f => ({ ...f, max_price: e.target.value }))}
              />
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear</button>
            <button className="btn btn-primary btn-sm" onClick={handleFilterApply}>
              <Search size={14} /> Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Product grid */}
      {loading ? (
        <div className="market-loading">
          {[1, 2, 3].map(i => (
            <div key={i} className="product-card-skeleton card">
              <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-md)' }} />
              <div className="skeleton" style={{ height: 16, width: '70%', marginTop: 12 }} />
              <div className="skeleton" style={{ height: 12, width: '50%', marginTop: 8 }} />
              <div className="skeleton" style={{ height: 20, width: '30%', marginTop: 8 }} />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="market-empty animate-fade-in">
          <ShoppingBag size={48} strokeWidth={1} />
          <h3>No products yet</h3>
          <p>Published products will appear here</p>
        </div>
      ) : (
        <div className="product-grid stagger">
          {products.map((p) => {
            const imgUrl = resolveImageUrl(p.images?.enhanced_url || p.images?.original_url, BACKEND_ORIGIN);
            return (
              <div
                key={p.product_id}
                className="product-card card animate-fade-in-up"
                onClick={() => setSelectedProduct(p)}
              >
                <div className="pc-image-wrap">
                  {imgUrl ? (
                    <img src={imgUrl} alt={p.product_name} className="pc-image" />
                  ) : (
                    <div className="pc-image-placeholder">
                      <ShoppingBag size={32} strokeWidth={1} />
                    </div>
                  )}
                  <StatusBadge status={p.status} />
                </div>
                <div className="pc-body">
                  <h3 className="pc-title">{p.product_name || 'Untitled Craft'}</h3>
                  <p className="pc-category">{p.category || p.craft_type || 'Handmade'}</p>
                  <div className="pc-footer">
                    <span className="pc-price">{formatPrice(p.pricing?.recommended_price)}</span>
                    {p.craft_type && <span className="badge badge-accent">{p.craft_type}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product detail modal */}
      {selectedProduct && (
        <div className="detail-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="detail-modal glass-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setSelectedProduct(null)}>
              <X size={18} />
            </button>

            {(() => {
              const p = selectedProduct;
              const imgUrl = resolveImageUrl(p.images?.enhanced_url || p.images?.original_url, BACKEND_ORIGIN);
              return (
                <>
                  {imgUrl && <img src={imgUrl} alt={p.product_name} className="detail-image" />}

                  <div className="detail-body">
                    <div className="detail-header">
                      <h2 className="detail-title">{p.product_name || 'Untitled'}</h2>
                      <StatusBadge status={p.status} />
                    </div>

                    <p className="detail-price">{formatPrice(p.pricing?.recommended_price)}</p>

                    <div className="detail-meta">
                      {p.category && (
                        <span className="detail-meta-item"><Tag size={12} /> {p.category}</span>
                      )}
                      {p.craft_type && (
                        <span className="detail-meta-item"><Sparkles size={12} /> {p.craft_type}</span>
                      )}
                      {p.material && (
                        <span className="detail-meta-item"><Star size={12} /> {p.material}</span>
                      )}
                      {p.production?.time_days && (
                        <span className="detail-meta-item"><Clock size={12} /> {p.production.time_days} days</span>
                      )}
                    </div>

                    {p.description && (
                      <p className="detail-desc">{p.description}</p>
                    )}

                    {p.keywords?.length > 0 && (
                      <div className="detail-keywords">
                        {p.keywords.map((k, i) => (
                          <span key={i} className="chip">{k}</span>
                        ))}
                      </div>
                    )}

                    {p.pricing && (
                      <div className="detail-pricing">
                        <div className="dp-row">
                          <span>Market Range</span>
                          <span>{formatPrice(p.pricing.market_range_low)} — {formatPrice(p.pricing.market_range_high)}</span>
                        </div>
                        <div className="dp-row">
                          <span>Est. Material Cost</span>
                          <span>{formatPrice(p.pricing.estimated_cost)}</span>
                        </div>
                        {p.pricing.reasoning?.length > 0 && (
                          <div className="dp-reasoning">
                            {p.pricing.reasoning.map((r, i) => (
                              <p key={i}>• {r}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      className="btn btn-secondary btn-block"
                      onClick={() => handleExport(p.product_id)}
                    >
                      <FileText size={16} /> Export Marketplace JSON
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Export JSON modal */}
      {showExport && exportJson && (
        <div className="export-overlay" onClick={() => setShowExport(false)}>
          <div className="export-modal glass-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="export-header">
              <h3>ONDC / Marketplace JSON</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowExport(false)}>
                <X size={16} />
              </button>
            </div>
            <pre className="export-code">{JSON.stringify(exportJson, null, 2)}</pre>
            <button className="btn btn-primary btn-block" onClick={copyExport}>
              <Copy size={16} /> Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
