import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [artisanId, setArtisanId] = useState(() => localStorage.getItem('artisan_id'));
  const [artisan, setArtisan] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('artisan_user') || 'null');
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  useEffect(() => {
    setIsAuthenticated(!!token);
  }, [token]);

  function login(newToken, artisanData) {
    const id = typeof artisanData === 'object' && artisanData !== null
      ? artisanData.artisan_id
      : artisanData;
    const userObj = typeof artisanData === 'object' && artisanData !== null
      ? artisanData
      : { artisan_id: id, username: 'artisan', display_name: 'Master Artisan' };

    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('artisan_id', id);
    localStorage.setItem('artisan_user', JSON.stringify(userObj));

    setToken(newToken);
    setArtisanId(id);
    setArtisan(userObj);
  }

  function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('artisan_id');
    localStorage.removeItem('artisan_user');
    setToken(null);
    setArtisanId(null);
    setArtisan(null);
  }

  return (
    <AuthContext.Provider value={{ token, artisanId, artisan, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
