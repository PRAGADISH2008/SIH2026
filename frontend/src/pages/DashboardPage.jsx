import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Camera, ShoppingBag, Sparkles, ArrowRight,
  Mic, DollarSign, Globe, CheckCircle2, ShieldCheck
} from 'lucide-react';
import './DashboardPage.css';

export default function DashboardPage() {
  const { artisan, artisanId } = useAuth();
  const navigate = useNavigate();

  const displayName = artisan?.display_name || artisan?.username || 'Artisan';

  return (
    <div className="page dashboard-page">
      <div className="page-header animate-fade-in">
        <p className="page-subtitle">Welcome back, {displayName}</p>
        <h1 className="page-title">Your Creative Studio</h1>
      </div>

      <div className="dashboard-container">
        {/* Left Column: Quick Actions & Workflow */}
        <div className="dashboard-main-col stagger">
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

          <div className="dashboard-hero glass-card animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={20} className="dh-sparkle" />
              <h3 style={{ margin: 0 }}>Smart Multilingual Cataloguing</h3>
            </div>
            <p>
              Photograph your craft, describe it naturally in your mother tongue, and let our
              AI pipeline generate marketplace-ready titles, descriptions, pricing, and keywords — in seconds.
            </p>

            <div className="workflow-steps">
              <div className="wf-step">
                <span className="wf-num">1</span>
                <span>Photo & Gemini enhancement</span>
              </div>
              <div className="wf-step">
                <span className="wf-num">2</span>
                <span>AssemblyAI speech transcription</span>
              </div>
              <div className="wf-step">
                <span className="wf-num">3</span>
                <span>Gemini cataloguing & pricing</span>
              </div>
              <div className="wf-step">
                <span className="wf-num">4</span>
                <span>Publish to marketplace</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Studio Insights & Features */}
        <div className="dashboard-side-col animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <div className="card studio-insights-card">
            <h3 className="sic-title">
              <Sparkles size={18} style={{ color: 'var(--clr-accent)' }} />
              AI Studio Capabilities
            </h3>

            <div className="sic-item">
              <div className="sic-icon" style={{ color: 'var(--clr-accent)' }}>
                <Globe size={18} />
              </div>
              <div>
                <h4>Multilingual Audio Recognition</h4>
                <p>Speak in Hindi, Tamil, Bengali, Marathi, Telugu, or English. AssemblyAI listens in your native dialect.</p>
              </div>
            </div>

            <div className="sic-item">
              <div className="sic-icon" style={{ color: 'var(--clr-confirmed)' }}>
                <DollarSign size={18} />
              </div>
              <div>
                <h4>Dynamic Pricing Intelligence</h4>
                <p>Calculates materials, artisan labor time, and market benchmarks to recommend optimal selling prices.</p>
              </div>
            </div>

            <div className="sic-item">
              <div className="sic-icon" style={{ color: 'var(--clr-success)' }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h4>ONDC / E-Commerce Export</h4>
                <p>One-click JSON export for seamless onboarding to national open networks and export boutiques.</p>
              </div>
            </div>

            <div className="sic-footer">
              <div className="sic-verified">
                <ShieldCheck size={16} />
                <span>Verified Artisan Account: <strong>{displayName}</strong></span>
              </div>
              {artisanId && (
                <p className="dashboard-id">
                  ID: <code>{artisanId.slice(0, 8)}…</code>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
