import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listProducts } from '../services/api';
import { resolveImageUrl } from '../utils/helpers';
import { BACKEND_ORIGIN } from '../config';
import {
  Camera, ShoppingBag, ArrowRight,
  Package, TrendingUp, MapPin, Phone,
  MessageSquare, CheckCircle2, ShieldCheck,
  Plus, ExternalLink, Copy, Check
} from 'lucide-react';
import './DashboardPage.css';

export default function DashboardPage() {
  const { artisan, artisanId } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const displayName = artisan?.display_name || artisan?.username || 'Artisan';
  const region = artisan?.region || 'Tamil Nadu, India';
  const phone = artisan?.mobile_number;

  useEffect(() => {
    let isMounted = true;
    listProducts()
      .then((res) => {
        if (!isMounted) return;
        const list = res?.products || res || [];
        setProducts(list);
      })
      .catch((err) => console.error('Failed to load products for dashboard:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products by current artisan (match by ID, name, or registered phone)
  const myProducts = products.filter((p) => {
    if (!artisan && !artisanId) return false;
    const matchId = p.artisan_id && (p.artisan_id === artisanId || p.artisan_id === artisan?.id || p.artisan_id === artisan?.artisan_id);
    const matchName = p.artisan_name && displayName && (
      p.artisan_name.toLowerCase() === displayName.toLowerCase() ||
      displayName.toLowerCase().includes(p.artisan_name.toLowerCase()) ||
      p.artisan_name.toLowerCase().includes(displayName.toLowerCase()) ||
      (artisan?.username && p.artisan_name.toLowerCase() === artisan.username.toLowerCase())
    );
    const matchPhone = p.artisan_phone && phone && (
      p.artisan_phone.replace(/\D/g, '') === String(phone).replace(/\D/g, '')
    );
    return matchId || matchName || matchPhone;
  });

  const displayCrafts = myProducts.length > 0 ? myProducts : [];

  const totalValue = displayCrafts.reduce((sum, p) => {
    const price = Number(p.pricing?.recommended_price || p.pricing?.final_price || 0);
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  function handleCopyShareLink() {
    const shareUrl = `${window.location.origin}/marketplace`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="page dashboard-page">
      <div className="page-header animate-fade-in">
        <p className="page-subtitle">Welcome back, {displayName}</p>
        <h1 className="page-title">Your Creative Studio</h1>
      </div>

      <div className="dashboard-container">
        {/* Left Column: Quick Actions & Live Catalogue */}
        <div className="dashboard-main-col stagger">
          {/* Action Cards (Kept as requested) */}
          <div className="dashboard-grid">
            <button
              className="dashboard-action-card animate-fade-in-up"
              onClick={() => navigate('/capture')}
            >
              <div className="dac-icon" style={{ background: 'linear-gradient(135deg, var(--clr-accent), var(--clr-terracotta))' }}>
                <Camera size={28} />
              </div>
              <div className="dac-content">
                <h3>New Product</h3>
                <p>Capture, describe & publish a craft</p>
              </div>
              <ArrowRight size={18} className="dac-arrow" />
            </button>

            <button
              className="dashboard-action-card animate-fade-in-up"
              onClick={() => navigate('/marketplace')}
            >
              <div className="dac-icon" style={{ background: 'linear-gradient(135deg, var(--clr-success), #059669)' }}>
                <ShoppingBag size={28} />
              </div>
              <div className="dac-content">
                <h3>Marketplace</h3>
                <p>Browse live artisan handicrafts</p>
              </div>
              <ArrowRight size={18} className="dac-arrow" />
            </button>
          </div>

          {/* Studio Metrics Strip */}
          <div className="studio-stats-row animate-fade-in-up">
            <div className="stat-pill-card">
              <div className="stat-pill-icon stat-icon-amber">
                <Package size={20} />
              </div>
              <div className="stat-pill-info">
                <span className="stat-pill-label">Live Listings</span>
                <span className="stat-pill-value">{displayCrafts.length}</span>
              </div>
            </div>

            <div className="stat-pill-card">
              <div className="stat-pill-icon stat-icon-green">
                <TrendingUp size={20} />
              </div>
              <div className="stat-pill-info">
                <span className="stat-pill-label">Catalogue Value</span>
                <span className="stat-pill-value">₹{totalValue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="stat-pill-card">
              <div className="stat-pill-icon stat-icon-terracotta">
                <MapPin size={20} />
              </div>
              <div className="stat-pill-info">
                <span className="stat-pill-label">Craft Region</span>
                <span className="stat-pill-value stat-pill-truncate" title={region}>{region}</span>
              </div>
            </div>
          </div>

          {/* My Published Crafts Showcase */}
          <div className="studio-catalogue-card glass-card animate-fade-in-up">
            <div className="scc-header">
              <div>
                <h3 className="scc-title">My Published Crafts</h3>
                <p className="scc-subtitle">Real-time view of your crafts live on the ZenCraft Marketplace</p>
              </div>
              <button
                className="btn btn-secondary btn-sm scc-view-all"
                onClick={() => navigate('/marketplace')}
              >
                <span>View in Marketplace</span>
                <ExternalLink size={14} />
              </button>
            </div>

            {loading ? (
              <div className="scc-loading">
                <div className="spinner-sm" />
                <span>Loading your studio crafts...</span>
              </div>
            ) : displayCrafts.length > 0 ? (
              <div className="scc-grid">
                {displayCrafts.slice(0, 4).map((craft) => {
                  const rawImg = craft.images?.enhanced_url || craft.images?.original_url || craft.primary_image || (Array.isArray(craft.images) ? (craft.images[0]?.url || craft.images[0]) : null);
                  const img = resolveImageUrl(rawImg, BACKEND_ORIGIN);
                  const price = craft.pricing?.recommended_price || craft.pricing?.final_price;
                  return (
                    <div key={craft.product_id || craft.id} className="studio-craft-card">
                      <div className="scc-img-wrap">
                        {img ? (
                          <img src={img} alt={craft.product_name || 'Craft'} />
                        ) : (
                          <div className="scc-img-placeholder">
                            <ShoppingBag size={28} strokeWidth={1.5} />
                          </div>
                        )}
                        <span className="scc-status-badge">Live</span>
                      </div>
                      <div className="scc-craft-body">
                        <h4 className="scc-craft-name">{craft.product_name || 'Handmade Craft'}</h4>
                        <p className="scc-craft-type">{craft.craft_type || craft.category || 'Handicraft'}</p>
                        <div className="scc-craft-footer">
                          <span className="scc-craft-price">
                            {price ? `₹${Number(price).toLocaleString('en-IN')}` : 'Fair Price'}
                          </span>
                          <button
                            className="scc-craft-btn"
                            onClick={() => navigate('/marketplace')}
                            title="Inspect craft on marketplace"
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="scc-empty-state">
                <div className="scc-empty-icon">
                  <Package size={36} />
                </div>
                <h4>No Crafts Published Yet</h4>
                <p>Capture your first handmade creation using our AI camera and voice assistant to publish to the marketplace.</p>
                <button
                  className="btn btn-primary btn-md"
                  onClick={() => navigate('/capture')}
                >
                  <Plus size={16} />
                  <span>Catalog Your First Craft</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Artisan Business Card & Direct Share */}
        <div className="dashboard-side-col animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="card studio-profile-card">
            <div className="spc-badge-row">
              <span className="spc-verified-badge">
                <ShieldCheck size={14} /> Verified Artisan
              </span>
              <span className="spc-status-live">● Active on ZenCraft</span>
            </div>

            <div className="spc-artisan-header">
              <div className="spc-avatar">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="spc-name">{displayName}</h3>
                <p className="spc-region">
                  <MapPin size={13} /> {region}
                </p>
              </div>
            </div>

            <div className="spc-details-box">
              <div className="spc-detail-row">
                <span className="spc-detail-label">Buyer Contact</span>
                <span className="spc-detail-val">
                  <Phone size={13} /> {phone || 'Not registered'}
                </span>
              </div>
              <div className="spc-detail-row">
                <span className="spc-detail-label">Marketplace Status</span>
                <span className="spc-detail-val spc-status-ok">
                  <CheckCircle2 size={13} /> Direct WhatsApp Ready
                </span>
              </div>
              <div className="spc-detail-row">
                <span className="spc-detail-label">Studio ID</span>
                <span className="spc-detail-val font-mono">
                  {artisanId ? `${artisanId.slice(0, 10)}…` : 'Verified'}
                </span>
              </div>
            </div>

            <div className="spc-actions">
              {phone && (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out authentic handcrafted products by ${displayName} from ${region} on ZenCraft: ${window.location.origin}/marketplace`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-success btn-block spc-share-btn"
                >
                  <MessageSquare size={16} />
                  <span>Share Studio on WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                className="btn btn-secondary btn-block spc-copy-btn"
                onClick={handleCopyShareLink}
              >
                {copied ? <Check size={16} style={{ color: 'var(--clr-success)' }} /> : <Copy size={16} />}
                <span>{copied ? 'Catalogue Link Copied!' : 'Copy Marketplace Link'}</span>
              </button>
            </div>

            <div className="spc-quick-tip">
              <p>
                💡 <strong>Artisan Tip:</strong> When buyers discover your craft in the marketplace, they can contact your registered phone directly via WhatsApp or Phone call.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

