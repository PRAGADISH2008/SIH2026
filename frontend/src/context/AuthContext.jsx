import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [role, setRole] = useState(() => {
    return localStorage.getItem('auth_role') || (localStorage.getItem('artisan_id') ? 'artisan' : null);
  });
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user') || localStorage.getItem('artisan_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!token;
  const isArtisan = role === 'artisan';
  const isBuyer = role === 'buyer';
  const artisanId = isArtisan ? (user?.artisan_id || user?.id || localStorage.getItem('artisan_id')) : null;
  const artisan = isArtisan ? user : null;

  // Restore session dynamically from GET /auth/me on load
  useEffect(() => {
    let isMounted = true;
    if (token) {
      getMe()
        .then((profile) => {
          if (!isMounted || !profile) return;
          const userRole = profile.role || (profile.artisan_id ? 'artisan' : 'buyer');
          const userData = {
            id: profile.id || profile.artisan_id || profile.user_id,
            artisan_id: profile.artisan_id || profile.id,
            username: profile.username,
            display_name: profile.display_name || profile.username,
            mobile_number: profile.mobile_number || null,
            region: profile.region || null,
            role: userRole,
          };
          setRole(userRole);
          setUser(userData);
          localStorage.setItem('auth_role', userRole);
          localStorage.setItem('auth_user', JSON.stringify(userData));
          if (userRole === 'artisan') {
            localStorage.setItem('artisan_id', userData.id);
            localStorage.setItem('artisan_user', JSON.stringify(userData));
          }
        })
        .catch((err) => {
          // If token expired or invalid, reset session
          if (err?.code === 401 || err?.status === 401) {
            logout();
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [token]);

  function login(newToken, profileData, explicitRole = null) {
    const userRole = explicitRole || profileData?.role || (profileData?.artisan_id ? 'artisan' : 'buyer');
    const id = profileData?.id || profileData?.artisan_id || profileData?.user_id || 'user-id';

    const userData = {
      id,
      artisan_id: userRole === 'artisan' ? id : null,
      username: profileData?.username || 'user',
      display_name: profileData?.display_name || profileData?.username || 'User',
      mobile_number: profileData?.mobile_number || null,
      region: profileData?.region || null,
      role: userRole,
    };

    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_role', userRole);
    localStorage.setItem('auth_user', JSON.stringify(userData));

    if (userRole === 'artisan') {
      localStorage.setItem('artisan_id', id);
      localStorage.setItem('artisan_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('artisan_id');
      localStorage.removeItem('artisan_user');
    }

    setToken(newToken);
    setRole(userRole);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('artisan_id');
    localStorage.removeItem('artisan_user');
    setToken(null);
    setRole(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        user,
        artisanId,
        artisan,
        isAuthenticated,
        isArtisan,
        isBuyer,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
