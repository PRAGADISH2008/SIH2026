import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { listProducts, exportProduct } from '../services/api';
import { BACKEND_ORIGIN } from '../config';
import { resolveImageUrl, formatPrice } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  Search, Filter, ShoppingBag, Star, X, Copy,
  ChevronDown, Tag, Clock, FileText, Sparkles, LayoutGrid, PlusCircle, CheckCircle2,
  Phone, MessageSquare
} from 'lucide-react';
import './BuyerMarketplace.css';

export default function BuyerMarketplace({ toast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const justPublished = location.state?.justPublished;
  const publishedName = location.state?.productName;
  const [bannerVisible, setBannerVisible] = useState(Boolean(justPublished));

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

      {/* Success banner after artisan publishing */}
      {bannerVisible && (
        <div
          className="card animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.16), rgba(16, 185, 129, 0.08))',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            padding: '16px 20px',
            borderRadius: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'var(--clr-success, #22c55e)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 style={{ margin: 0, color: 'var(--clr-success, #22c55e)', fontWeight: 700, fontSize: '1.05rem' }}>
                Craft Published Successfully to Marketplace!
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: 'var(--clr-text-secondary, #94a3b8)' }}>
                {publishedName
                  ? `"${publishedName}" is now live and discoverable by buyers.`
                  : 'Your item is now live and discoverable by buyers.'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/dashboard')}
              title="Return to Artisan Studio Dashboard"
            >
              <LayoutGrid size={15} /> Artisan Studio
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/capture')}
              title="Capture and publish another craft"
            >
              <PlusCircle size={15} /> Add Another Craft
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setBannerVisible(false)}
              title="Dismiss notification"
              style={{ padding: '6px 8px' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Filter bar & Artisan Studio Links */}
      <div className="market-toolbar animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className={`btn btn-secondary btn-sm ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} /> Filters
            <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          <span className="market-count">{products.length} product{products.length !== 1 ? 's' : ''}</span>
        </div>

        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/dashboard')}
              title="Return to Artisan Studio"
            >
              <LayoutGrid size={14} /> Artisan Studio
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/capture')}
              title="Add New Craft"
            >
              <PlusCircle size={14} /> New Craft
            </button>
          </div>
        )}
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
                  <div className="pc-artisan-by">
                    <span className="pc-by-label">By</span>
                    <span className="pc-artisan-name">{p.artisan_name || 'Master Artisan'}</span>
                    {p.artisan_phone && (
                      <span className="pc-artisan-phone" title={`Contact: ${p.artisan_phone}`}>
                        <Phone size={10} /> {p.artisan_phone}
                      </span>
                    )}
                  </div>
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
                      <div className="detail-header-left">
                        <h2 className="detail-title">{p.product_name || 'Untitled'}</h2>
                        <div className="detail-artisan-badge-row">
                          <div className="detail-artisan-badge">
                            <span className="detail-artisan-label">Artisan:</span>
                            <span className="detail-artisan-name">✨ {p.artisan_name || 'Master Artisan'}</span>
                          </div>
                          {p.artisan_phone && (
                            <a
                              href={`tel:${p.artisan_phone}`}
                              className="detail-phone-pill"
                              title="Click to call artisan directly"
                            >
                              <Phone size={12} /> {p.artisan_phone}
                            </a>
                          )}
                        </div>
                      </div>
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
                      <div className="detail-desc-block">
                        <h4 className="detail-desc-heading">Product Description</h4>
                        <p className="detail-desc">{p.description}</p>
                        <div className="detail-artisan-signature">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', width: '100%' }}>
                            <div>
                              <span className="detail-sig-label">Authentic craft published by: </span>
                              <strong className="detail-sig-name">
                                🎨 {p.artisan_name || 'Master Artisan'}
                                {p.artisan_username ? ` (@${p.artisan_username})` : ''}
                              </strong>
                            </div>
                            {p.artisan_phone && (
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <a
                                  href={`tel:${p.artisan_phone}`}
                                  className="btn btn-secondary btn-sm"
                                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '0.78rem' }}
                                  title="Call artisan"
                                >
                                  <Phone size={12} /> Call: {p.artisan_phone}
                                </a>
                                <a
                                  href={`https://wa.me/${p.artisan_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${p.artisan_name || 'Artisan'}, I am interested in your craft "${p.product_name || 'Product'}" on KalaCraft.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-success btn-sm"
                                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '0.78rem' }}
                                  title="Contact artisan on WhatsApp"
                                >
                                  <MessageSquare size={12} /> WhatsApp
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
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
