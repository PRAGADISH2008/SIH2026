import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { listProducts } from '../services/api';
import { BACKEND_ORIGIN } from '../config';
import { resolveImageUrl, formatPrice } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  Search, Filter, ShoppingBag, Star, X,
  ChevronDown, Tag, Clock, Sparkles, LayoutGrid, PlusCircle, CheckCircle2,
  Phone, MessageSquare, MapPin, Share2, Printer
} from 'lucide-react';
import './BuyerMarketplace.css';

export default function BuyerMarketplace({ toast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isArtisan } = useAuth();
  const justPublished = location.state?.justPublished;
  const publishedName = location.state?.productName;
  const [bannerVisible, setBannerVisible] = useState(Boolean(justPublished));

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    craft_type: '',
    min_price: '',
    max_price: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  async function fetchProducts(search = searchQuery) {
    setLoading(true);
    try {
      const activeFilters = {};
      if (search && typeof search === 'string' && search.trim()) {
        activeFilters.search = search.trim();
      }
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

  // Fetch on mount and when filters or debounced search query change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, filters]);

  function handleFilterApply() {
    fetchProducts(searchQuery);
    setShowFilters(false);
  }

  function clearFilters() {
    setFilters({ category: '', craft_type: '', min_price: '', max_price: '' });
  }

  // ─── Share Details Dossier & Print / PDF Generation ───────────────────────
  function printProductDossier(p) {
    if (!p) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    const title = p.product_name || 'Handcrafted Artisan Product';
    const priceFormatted = p.pricing?.recommended_price
      ? `₹${Number(p.pricing.recommended_price).toLocaleString('en-IN')}`
      : 'Fair Market Price';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>ZenCraft Dossier - ${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 40px;
      color: #0f172a;
      line-height: 1.6;
    }
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #b45309;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand img {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      object-fit: cover;
    }
    .subtitle {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section {
      margin-bottom: 18px;
    }
    .label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .value {
      font-size: 15px;
      color: #0f172a;
      font-weight: 500;
    }
    .price-value {
      font-size: 22px;
      font-weight: 800;
      color: #b45309;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .desc-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px;
      font-size: 14px;
      color: #334155;
      margin-top: 4px;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { margin: 20mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <img src="/zencraft-logo.jpg" alt="ZenCraft" />
      <span>ZENCRAFT</span>
    </div>
    <div class="subtitle">CRAFT PRODUCT DOSSIER</div>
  </div>

  <div class="section">
    <div class="label">Product</div>
    <div class="value" style="font-size: 18px; font-weight: 700;">${p.product_name || 'Handcrafted Artisan Product'}</div>
  </div>

  <div class="grid">
    <div class="section">
      <div class="label">Artisan</div>
      <div class="value">${p.artisan_name || 'Master Artisan'}</div>
    </div>
    <div class="section">
      <div class="label">Region</div>
      <div class="value">${p.artisan_region || 'Tamil Nadu, India'}</div>
    </div>
    <div class="section">
      <div class="label">Craft Type</div>
      <div class="value">${p.craft_type || p.category || 'Handicraft'}</div>
    </div>
    <div class="section">
      <div class="label">Category</div>
      <div class="value">${p.category || 'Traditional Crafts'}</div>
    </div>
    <div class="section">
      <div class="label">Material</div>
      <div class="value">${p.material || 'Natural artisan materials'}</div>
    </div>
    <div class="section">
      <div class="label">Technique</div>
      <div class="value">${p.production?.technique || 'Traditional Handcrafted'}</div>
    </div>
    <div class="section">
      <div class="label">Production Time</div>
      <div class="value">${p.production?.time_days ? `${p.production.time_days} days` : 'Dedicated Handwork'}</div>
    </div>
    <div class="section">
      <div class="label">Recommended Price</div>
      <div class="price-value">${priceFormatted}</div>
    </div>
  </div>

  ${p.artisan_phone ? `
  <div class="section">
    <div class="label">Contact Artisan</div>
    <div class="value" style="font-weight: 700; color: #047857;">📞 ${p.artisan_phone}</div>
  </div>
  ` : ''}

  <div class="section">
    <div class="label">Description</div>
    <div class="desc-box">${p.description || 'Authentic handmade craft curated on ZenCraft.'}</div>
  </div>

  <div class="footer">
    <span>ZenCraft AI-Driven Market Linkage Platform (SIH26090)</span>
    <span>Verified Artisan Catalogue</span>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  function handleShareDetails(p) {
    if (!p) return;

    const title = `ZenCraft — ${p.product_name || 'Artisan Craft'}`;
    const text = [
      `ZENCRAFT`,
      `CRAFT PRODUCT DOSSIER`,
      `────────────────────────`,
      `Product: ${p.product_name || 'Handcrafted Craft'}`,
      `Artisan: ${p.artisan_name || 'Master Artisan'}`,
      p.artisan_region ? `Region: ${p.artisan_region}` : null,
      p.craft_type ? `Craft Type: ${p.craft_type}` : null,
      p.category ? `Category: ${p.category}` : null,
      p.material ? `Material: ${p.material}` : null,
      p.production?.technique ? `Technique: ${p.production.technique}` : null,
      p.production?.time_days ? `Production Time: ${p.production.time_days} days` : null,
      p.description ? `Description: ${p.description}` : null,
      p.pricing?.recommended_price ? `Recommended Price: ₹${p.pricing.recommended_price}` : null,
      p.artisan_phone ? `Contact Artisan: ${p.artisan_phone}` : null,
    ].filter(Boolean).join('\n');

    // On browsers supporting Web Share API
    if (navigator.share) {
      navigator
        .share({
          title,
          text,
          url: window.location.href,
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            printProductDossier(p);
          }
        });
    } else {
      // Print / Save as PDF fallback
      printProductDossier(p);
    }
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
            {isArtisan && (
              <>
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
              </>
            )}
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

      {/* Real-time Interactive Search Box */}
      <div className="market-search-bar animate-fade-in">
        <div className="market-search-input-wrap">
          <Search size={18} className="market-search-icon" />
          <input
            type="text"
            className="market-search-input"
            placeholder="Search by craft, material, artisan, or region (e.g. Tenkasi, bamboo, Ahilan)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="market-search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filter bar & Artisan Studio Links */}
      <div className="market-toolbar animate-fade-in">
        <div className="market-toolbar-left">
          <button
            className={`btn btn-secondary btn-sm ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} /> Filters
            <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          <span className="market-count">{products.length} product{products.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Studio buttons visible ONLY to Artisans */}
        {isAuthenticated && isArtisan && (
          <div className="market-toolbar-actions">
            <button
              className="btn btn-secondary btn-sm market-studio-btn"
              onClick={() => navigate('/dashboard')}
              title="Return to Artisan Studio"
            >
              <LayoutGrid size={14} /> Artisan Studio
            </button>
            <button
              className="btn btn-primary btn-sm market-newcraft-btn"
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
          <h3>No products found</h3>
          <p>{searchQuery ? `No crafts matching "${searchQuery}"` : 'Published products will appear here'}</p>
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
                    {p.artisan_region && (
                      <span className="pc-artisan-region" title={`Origin: ${p.artisan_region}`}>
                        <MapPin size={9} /> {p.artisan_region}
                      </span>
                    )}
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
                          {p.artisan_region && (
                            <div className="detail-region-pill" title="Artisan origin & region">
                              <MapPin size={12} /> {p.artisan_region}
                            </div>
                          )}
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
                                {p.artisan_region ? ` (${p.artisan_region})` : ''}
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
                                  href={`https://wa.me/${p.artisan_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${p.artisan_name || 'Artisan'}, I am interested in your craft "${p.product_name || 'Product'}" on ZenCraft.`)}`}
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

                    {/* SHARE DETAILS BUTTON — Replaces Export Marketplace JSON */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                      <button
                        className="btn btn-primary btn-block"
                        onClick={() => handleShareDetails(p)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px 16px' }}
                        title="Share or download product dossier as PDF"
                      >
                        <Share2 size={16} /> Share Details
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => printProductDossier(p)}
                        style={{ padding: '11px 16px' }}
                        title="Print / Save as PDF"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
