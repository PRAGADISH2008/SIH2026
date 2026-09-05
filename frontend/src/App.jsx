import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastContainer, useToast } from './components/Toast';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CaptureFlow from './pages/CaptureFlow';
import BuyerMarketplace from './pages/BuyerMarketplace';
import './index.css';

function ArtisanRoute({ children }) {
  const { isAuthenticated, isArtisan } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isArtisan) return <Navigate to="/marketplace" replace />;
  return children;
}

function AppRoutes() {
  const toast = useToast();
  const { isAuthenticated, isArtisan } = useAuth();

  const defaultHome = isAuthenticated ? (isArtisan ? '/dashboard' : '/marketplace') : '/login';

  return (
    <>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={<Navigate to={defaultHome} replace />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to={defaultHome} replace /> : <LoginPage toast={toast} />}
        />
        <Route
          path="/dashboard"
          element={<ArtisanRoute><DashboardPage /></ArtisanRoute>}
        />
        <Route
          path="/capture"
          element={<ArtisanRoute><CaptureFlow toast={toast} /></ArtisanRoute>}
        />
        <Route
          path="/marketplace"
          element={<BuyerMarketplace toast={toast} />}
        />
        <Route
          path="*"
          element={<Navigate to={defaultHome} replace />}
        />
      </Routes>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppRoutes />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
