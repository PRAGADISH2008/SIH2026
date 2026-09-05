import { NavLink } from 'react-router-dom';
import { Camera, ShoppingBag, LayoutGrid, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './BottomNav.css';

export default function BottomNav() {
  const { isAuthenticated, isArtisan } = useAuth();

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {isAuthenticated && isArtisan && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutGrid size={20} />
            <span>Studio</span>
          </NavLink>
        )}
        {isAuthenticated && isArtisan && (
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
        {!isAuthenticated && (
          <NavLink
            to="/login"
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <LogIn size={20} />
            <span>Login</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}
