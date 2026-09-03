import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [artisanId, setArtisanId] = useState(() => localStorage.getItem('artisan_id'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  useEffect(() => {
    setIsAuthenticated(!!token);
  }, [token]);

  function login(newToken, newArtisanId) {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('artisan_id', newArtisanId);
    setToken(newToken);
    setArtisanId(newArtisanId);
  }

  function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('artisan_id');
    setToken(null);
    setArtisanId(null);
  }

  return (
    <AuthContext.Provider value={{ token, artisanId, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
