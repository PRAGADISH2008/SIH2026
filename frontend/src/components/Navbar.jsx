import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, Palette, Wifi, Sparkles, LogIn,
  LayoutGrid, Camera, ShoppingBag, User
} from 'lucide-react';
import { getMockMode, setMockMode } from '../config';

export default function Navbar() {
  const { isAuthenticated, user, isArtisan, isBuyer, logout } = useAuth();
  const navigate = useNavigate();
  const [isMock, setIsMock] = useState(getMockMode());

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMode = () => {
    const next = !isMock;
    setMockMode(next);
    setIsMock(next);
    window.location.reload();
  };

  const displayName = user?.display_name || user?.username || (isArtisan ? 'Artisan' : 'Buyer');
  const roleLabel = isBuyer ? ' (Buyer)' : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="navbar-logo">
            <img src="/zencraft-logo.jpg" alt="ZenCraft" className="navbar-logo-img" />
          </div>
          <div>
            <div className="navbar-title">ZenCraft</div>
            <div className="navbar-tagline">Artisan AI Studio</div>
          </div>
        </Link>

        {/* Desktop / Tablet Navigation Links - Studio & Capture visible ONLY to artisans */}
        <div className="navbar-desktop-nav">
          {isAuthenticated && isArtisan && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `navbar-nav-link ${isActive ? 'active' : ''}`}
              >
                <LayoutGrid size={16} />
                <span>Studio</span>
              </NavLink>
              <NavLink
                to="/capture"
                className={({ isActive }) => `navbar-nav-link ${isActive ? 'active' : ''}`}
              >
                <Camera size={16} />
                <span>Capture</span>
              </NavLink>
            </>
          )}
          <NavLink
            to="/marketplace"
            className={({ isActive }) => `navbar-nav-link ${isActive ? 'active' : ''}`}
          >
            <ShoppingBag size={16} />
            <span>Marketplace</span>
          </NavLink>
        </div>

        <div className="navbar-right">
          {/* Mode Switch */}
          <button
            className={`navbar-mode-btn ${isMock ? 'mode-mock' : 'mode-live'}`}
            onClick={toggleMode}
            title={isMock ? 'Currently in Demo/Mock Mode. Click to switch to Live Backend.' : 'Connecting to Live Backend (Port 5000). Click for Demo Mode.'}
          >
            {isMock ? (
              <>
                <Sparkles size={13} />
                <span>Demo Mode</span>
              </>
            ) : (
              <>
                <Wifi size={13} />
                <span>Live API (5000)</span>
              </>
            )}
          </button>

          {/* User Profile / Auth Actions */}
          {isAuthenticated ? (
            <div className="navbar-auth-group">
              <div className="navbar-user-badge" title={`Signed in as ${displayName}${roleLabel}`}>
                <div className="nub-avatar">
                  <User size={14} />
                </div>
                <span className="nub-name">{displayName}{roleLabel}</span>
              </div>
              <button className="navbar-action" onClick={handleLogout} title="Sign Out">
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-sm btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.82rem', gap: 6 }}
            >
              <LogIn size={14} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
