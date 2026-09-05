import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LogOut, Palette, Wifi, Sparkles, LogIn,
  LayoutGrid, Camera, ShoppingBag, User, Globe, ChevronDown
} from 'lucide-react';
import { getMockMode, setMockMode } from '../config';

export default function Navbar() {
  const { isAuthenticated, user, isArtisan, isBuyer, logout } = useAuth();
  const { language, setLanguage, t, currentLangObj, supportedLanguages } = useLanguage();
  const navigate = useNavigate();
  const [isMock, setIsMock] = useState(getMockMode());
  const [langOpen, setLangOpen] = useState(false);
  const langDropdownRef = useRef(null);

  // Close language menu on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    }
    if (langOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [langOpen]);

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
            <div className="navbar-tagline">{t('nav.tagline', 'Artisan AI Studio')}</div>
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
                <span>{t('nav.studio', 'Studio')}</span>
              </NavLink>
              <NavLink
                to="/capture"
                className={({ isActive }) => `navbar-nav-link ${isActive ? 'active' : ''}`}
              >
                <Camera size={16} />
                <span>{t('nav.capture', 'Capture')}</span>
              </NavLink>
            </>
          )}
          <NavLink
            to="/marketplace"
            className={({ isActive }) => `navbar-nav-link ${isActive ? 'active' : ''}`}
          >
            <ShoppingBag size={16} />
            <span>{t('nav.marketplace', 'Marketplace')}</span>
          </NavLink>
        </div>

        <div className="navbar-right">
          {/* Global Regional Language Switcher */}
          <div className="navbar-lang-container" ref={langDropdownRef}>
            <button
              type="button"
              className="navbar-lang-btn"
              onClick={() => setLangOpen(!langOpen)}
              title="Change Language / மொழியை மாற்றவும்"
            >
              <Globe size={14} />
              <span className="navbar-lang-name">{currentLangObj.native}</span>
              <ChevronDown size={12} className={langOpen ? 'icon-rotate' : ''} />
            </button>

            {langOpen && (
              <div className="navbar-lang-dropdown animate-fade-in">
                <div className="nld-header">
                  <span>🌐 Regional Languages</span>
                </div>
                <div className="nld-list">
                  {supportedLanguages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      className={`nld-option ${language === l.code ? 'active' : ''}`}
                      onClick={() => {
                        setLanguage(l.code);
                        setLangOpen(false);
                      }}
                    >
                      <span className="nld-native">{l.native}</span>
                      <span className="nld-english">{l.english}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mode Switch */}
          <button
            className={`navbar-mode-btn ${isMock ? 'mode-mock' : 'mode-live'}`}
            onClick={toggleMode}
            title={isMock ? 'Currently in Demo/Mock Mode. Click to switch to Live Backend.' : 'Connecting to Live Backend (Port 5000). Click for Demo Mode.'}
          >
            {isMock ? (
              <>
                <Sparkles size={13} />
                <span>{t('nav.demo', 'Demo Mode')}</span>
              </>
            ) : (
              <>
                <Wifi size={13} />
                <span>{t('nav.live', 'Live API (5000)')}</span>
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
              <button className="navbar-action" onClick={handleLogout} title={t('nav.logout', 'Sign Out')}>
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
              <span>{t('nav.login', 'Login')}</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
