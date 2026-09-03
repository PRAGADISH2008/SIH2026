import { NavLink } from 'react-router-dom';
import { Camera, ShoppingBag, LayoutGrid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './BottomNav.css';

export default function BottomNav() {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {isAuthenticated && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutGrid size={20} />
            <span>Studio</span>
          </NavLink>
        )}
        {isAuthenticated && (
          <NavLink
            to="/capture"
            className={({ isActive }) => `bottom-nav-item bottom-nav-capture ${isActive ? 'active' : ''}`}
          >
            <div className="capture-btn-ring">
              <Camera size={22} />
            </div>
            <span>Capture</span>
          </NavLink>
        )}
        <NavLink
          to="/marketplace"
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <ShoppingBag size={20} />
          <span>Market</span>
        </NavLink>
      </div>
    </nav>
  );
}
