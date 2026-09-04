import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginWithPassword, registerWithPassword } from '../services/api';
import { User, Lock, Eye, EyeOff, Sparkles, UserPlus, LogIn, CheckCircle2, Phone } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage({ toast }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithPassword(username.trim(), password);
      login(res.token, res.artisan);
      toast.success(`Welcome back, ${res.artisan?.display_name || res.artisan?.username || 'Artisan'}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.serverMessage || err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (username.trim().length < 3) {
      toast.error('Username must be at least 3 characters long.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (!mobileNumber.trim()) {
      toast.error('Please provide a mobile number so buyers can contact you.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerWithPassword(username.trim(), password, displayName.trim(), mobileNumber.trim());
      login(res.token, res.artisan);
      toast.success('Artisan account created successfully! Welcome to KalaCraft.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.serverMessage || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  function handleFillDemo() {
    setUsername('artisan');
    setPassword('password123');
    setMode('login');
    toast.info('Demo credentials populated (artisan / password123)');
  }

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />
      <div className="login-content animate-fade-in-up">
        <div className="login-hero">
          <div className="login-icon-wrap">
            <Sparkles size={32} />
          </div>
          <h1 className="login-title">KalaCraft</h1>
          <p className="login-subtitle">
            AI-Powered Smart Catalogue Studio for Artisans
          </p>
        </div>

        <div className="login-card glass-card">
          <div className="login-tab-bar">
            <button
              type="button"
              className={`login-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              className={`login-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >
              <UserPlus size={16} />
              <span>Create Account</span>
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="login-form">
              <h2 className="login-card-title">
                <User size={18} />
                Welcome Artisan
              </h2>
              <p className="login-card-desc">
                Sign in to your creative studio to catalog and publish products
              </p>

              <div className="login-field-group">
                <label className="input-label" htmlFor="login-username">Username</label>
                <div className="login-input-container">
                  <User size={16} className="login-input-icon" />
                  <input
                    id="login-username"
                    type="text"
                    className="input-field login-field"
                    placeholder="e.g. artisan"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="login-field-group">
                <label className="input-label" htmlFor="login-password">Password</label>
                <div className="login-input-container">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field login-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="login-pw-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="login-divider">
                <span>OR</span>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-block demo-btn"
                onClick={handleFillDemo}
              >
                <Sparkles size={16} /> Try Demo Account (artisan)
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="login-form">
              <h2 className="login-card-title">
                <UserPlus size={18} />
                Create Artisan Account
              </h2>
              <p className="login-card-desc">
                Join our handicraft marketplace and reach buyers nationwide
              </p>

              <div className="login-field-group">
                <label className="input-label" htmlFor="reg-name">Your Full Name or Craft Title</label>
                <div className="login-input-container">
                  <User size={16} className="login-input-icon" />
                  <input
                    id="reg-name"
                    type="text"
                    className="input-field login-field"
                    placeholder="e.g. Master Artisan / Ramesh Kumar"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="login-field-group">
                <label className="input-label" htmlFor="reg-mobile">
                  Mobile Number <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>(visible to buyers in marketplace)</span>
                </label>
                <div className="login-input-container">
                  <Phone size={16} className="login-input-icon" />
                  <input
                    id="reg-mobile"
                    type="tel"
                    className="input-field login-field"
                    placeholder="e.g. 9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              <div className="login-field-group">
                <label className="input-label" htmlFor="reg-username">Username</label>
                <div className="login-input-container">
                  <User size={16} className="login-input-icon" />
                  <input
                    id="reg-username"
                    type="text"
                    className="input-field login-field"
                    placeholder="Choose a username (min 3 chars)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="login-field-group">
                <label className="input-label" htmlFor="reg-password">Password</label>
                <div className="login-input-container">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field login-field"
                    placeholder="Create password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="login-pw-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="login-field-group">
                <label className="input-label" htmlFor="reg-confirm">Confirm Password</label>
                <div className="login-input-container">
                  <CheckCircle2 size={16} className="login-input-icon" />
                  <input
                    id="reg-confirm"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field login-field"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading}
                style={{ marginTop: 'var(--space-md)' }}
              >
                {loading ? 'Creating Account...' : 'Create Artisan Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
