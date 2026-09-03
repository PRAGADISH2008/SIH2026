import { useState, useEffect } from 'react';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';
import { LogOut, Palette, Wifi, Sparkles } from 'lucide-react';
import { getMockMode, setMockMode } from '../config';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const [isMock, setIsMock] = useState(getMockMode());

  const toggleMode = () => {
    const next = !isMock;
    setMockMode(next);
    setIsMock(next);
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="navbar-logo">
            <Palette size={22} />
          </div>
          <div>
            <div className="navbar-title">KalaCraft</div>
            <div className="navbar-tagline">Artisan AI Studio</div>
          </div>
        </div>
        <div className="navbar-right">
          <button
            className={`navbar-mode-btn ${isMock ? 'mode-mock' : 'mode-live'}`}
            onClick={toggleMode}
            title={isMock ? 'Currently in Demo/Mock Mode. Click to switch to Live Backend.' : 'Currently connecting to Live Backend (Port 5000). Click for Demo Mode.'}
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
          {isAuthenticated && (
            <button className="navbar-action" onClick={logout} title="Logout">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
