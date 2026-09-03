import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';
import './DashboardPage.css';

export default function DashboardPage() {
  const { artisanId } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="page-header animate-fade-in">
        <p className="page-subtitle">Welcome back, Artisan</p>
        <h1 className="page-title">Your Creative Studio</h1>
      </div>

      <div className="dashboard-grid stagger">
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
            <p>Browse published artisan products</p>
          </div>
          <ArrowRight size={18} className="dac-arrow" />
        </button>
      </div>

      <div className="dashboard-hero glass-card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <Sparkles size={20} className="dh-sparkle" />
        <h3>AI-Powered Cataloguing</h3>
        <p>
          Photograph your craft, describe it in your language, and let AI generate
          marketplace-ready titles, descriptions, pricing, and keywords — all in seconds.
        </p>
      </div>

      {artisanId && (
        <p className="dashboard-id">
          Artisan ID: <code>{artisanId.slice(0, 8)}…</code>
        </p>
      )}
    </div>
  );
}
