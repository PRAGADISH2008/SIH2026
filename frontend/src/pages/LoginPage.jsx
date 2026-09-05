import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  loginWithPassword,
  registerWithPassword,
  loginBuyerWithPassword,
  registerBuyerWithPassword,
} from '../services/api';
import {
  User, Lock, Eye, EyeOff, Sparkles, UserPlus, LogIn,
  CheckCircle2, Phone, MapPin, ShoppingBag, Palette, ArrowRight,
  Play, X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './LoginPage.css';

export default function LoginPage({ toast }) {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [portal, setPortal] = useState('select'); // 'select' | 'artisan' | 'buyer'
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [region, setRegion] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setShowVideoModal(false);
      }
    }
    if (showVideoModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVideoModal]);

  // Reset fields when switching portals
  function handleSelectPortal(selected) {
    setPortal(selected);
    setMode('login');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setMobileNumber('');
    setRegion('');
  }

  async function handleLogin(e) {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      if (portal === 'artisan') {
        const res = await loginWithPassword(username.trim(), password);
        login(res.token, res.artisan, 'artisan');
        toast.success(`Welcome back, ${res.artisan?.display_name || res.artisan?.username || 'Artisan'}!`);
        navigate('/dashboard');
      } else {
        const res = await loginBuyerWithPassword(username.trim(), password);
        login(res.token, res.user, 'buyer');
        toast.success(`Welcome back, ${res.user?.display_name || res.user?.username || 'Buyer'}!`);
        navigate('/marketplace');
      }
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

    setLoading(true);
    try {
      if (portal === 'artisan') {
        if (!mobileNumber.trim()) {
          toast.error('Please provide a mobile number so buyers can contact you.');
          setLoading(false);
          return;
        }

        const res = await registerWithPassword(
          username.trim(),
          password,
          displayName.trim(),
          mobileNumber.trim(),
          region.trim()
        );
        login(res.token, res.artisan, 'artisan');
        toast.success('Artisan account created successfully! Welcome to ZenCraft.');
        navigate('/dashboard');
      } else {
        const res = await registerBuyerWithPassword(
          username.trim(),
          password,
          displayName.trim(),
          mobileNumber.trim()
        );
        login(res.token, res.user, 'buyer');
        toast.success('Buyer account created successfully! Welcome to the Marketplace.');
        navigate('/marketplace');
      }
    } catch (err) {
      toast.error(err.serverMessage || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  function handleFillDemo() {
    if (portal === 'artisan') {
      setUsername('artisan');
      setPassword('password123');
      setMode('login');
      toast.info('Artisan demo credentials populated (artisan / password123)');
    } else {
      setUsername('buyer');
      setPassword('password123');
      setMode('login');
      toast.info('Buyer demo credentials populated (buyer / password123)');
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />
      <div className={`login-content animate-fade-in-up ${mode === 'register' ? 'login-content-wide' : ''}`}>
        {portal !== 'select' && (
          <div className="login-hero">
            <div className="login-icon-wrap">
              <img src="/zencraft-logo.jpg" alt="ZenCraft Logo" className="login-icon-img" />
            </div>
            <div className="login-hero-text-wrap">
              <img src="/zencraft-text.png" alt="ZenCraft" className="login-hero-text-img" />
            </div>
            <p className="login-subtitle">
              AI-Driven Market Linkage & Smart Cataloging for Artisans
            </p>
          </div>
        )}

        <div className="login-card">
          {/* STEP 1: PORTAL SELECTION (Before Login) */}
          {portal === 'select' ? (
            <div className="role-select-container">
              <div className="role-logo-banner">
                <img
                  src="/zencraft-logo.jpg"
                  alt="ZenCraft Logo"
                  className="role-logo-banner-img"
                />
              </div>

              <div className="role-text-banner">
                <img
                  src="/zencraft-text.png"
                  alt="ZenCraft"
                  className="role-text-banner-img"
                />
              </div>

              <h2 className="role-select-title">{t('login.choosePortal', 'Choose Your Portal')}</h2>
              <p className="role-select-desc">
                {t('login.choosePortalSub', 'Select how you would like to enter ZenCraft')}
              </p>

              <div className="role-cards-row">
                <button
                  type="button"
                  className="role-card role-card-artisan"
                  onClick={() => handleSelectPortal('artisan')}
                >
                  <div className="role-card-header">
                    <div className="role-card-icon">
                      <Palette size={22} />
                    </div>
                    <ArrowRight size={18} className="role-card-arrow" />
                  </div>
                  <div className="role-card-title">{t('login.artisanPortalTitle', 'Artisan Portal')}</div>
                  <div className="role-card-subtitle">
                    {t('login.artisanPortalDesc', 'For creators, weavers & craftspeople. Access AI camera enhancement, voice storytelling, fair pricing & studio.')}
                  </div>
                </button>

                <button
                  type="button"
                  className="role-card role-card-buyer"
                  onClick={() => handleSelectPortal('buyer')}
                >
                  <div className="role-card-header">
                    <div className="role-card-icon">
                      <ShoppingBag size={22} />
                    </div>
                    <ArrowRight size={18} className="role-card-arrow" />
                  </div>
                  <div className="role-card-title">{t('login.buyerPortalTitle', 'User / Buyer Portal')}</div>
                  <div className="role-card-subtitle">
                    {t('login.buyerPortalDesc', 'For customers & craft enthusiasts. Discover authentic handicrafts, verify fair pricing & contact artisans directly.')}
                  </div>
                </button>
              </div>

              {/* Watch Overview Button */}
              <div className="login-overview-wrap">
                <button
                  type="button"
                  className="login-overview-btn"
                  onClick={() => setShowVideoModal(true)}
                  title="Watch Platform Overview Video"
                >
                  <span className="login-overview-icon">
                    <Play size={13} fill="currentColor" />
                  </span>
                  <span>{t('login.watchOverview', 'Watch Overview')}</span>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: LOGIN / REGISTER FOR SELECTED PORTAL */
            <div>
              <div className="portal-header-row">
                <span className="portal-current-pill">
                  {portal === 'artisan' ? <Palette size={13} /> : <ShoppingBag size={13} />}
                  <span>{portal === 'artisan' ? t('login.artisanStudio', 'Artisan Studio') : t('login.buyerUser', 'Buyer / User')}</span>
                </span>
                <button
                  type="button"
                  className="portal-switch-btn"
                  onClick={() => setPortal('select')}
                >
                  ← {t('login.switchPortal', 'Switch Portal')}
                </button>
              </div>

              <div className="login-tab-bar">
                <button
                  type="button"
                  className={`login-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => setMode('login')}
                >
                  <LogIn size={16} />
                  <span>{t('login.signInTab', 'Sign In')}</span>
                </button>
                <button
                  type="button"
                  className={`login-tab ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => setMode('register')}
                >
                  <UserPlus size={16} />
                  <span>{t('login.createAccountTab', 'Create Account')}</span>
                </button>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="login-form">
                  <h2 className="login-card-title">
                    <User size={18} />
                    {portal === 'artisan' ? t('login.artisanSignInTitle', 'Artisan Sign In') : t('login.buyerSignInTitle', 'Buyer Sign In')}
                  </h2>
                  <p className="login-card-desc">
                    {portal === 'artisan'
                      ? t('login.artisanSignInDesc', 'Sign in to your creative studio to catalog and publish products')
                      : t('login.buyerSignInDesc', 'Sign in to explore handicrafts and connect directly with master artisans')}
                  </p>

                  <div className="login-field-group">
                    <label className="input-label" htmlFor="login-username">{t('login.username', 'Username')}</label>
                    <div className="login-input-container">
                      <User size={16} className="login-input-icon" />
                      <input
                        id="login-username"
                        type="text"
                        className="input-field login-field"
                        placeholder={portal === 'artisan' ? 'e.g. artisan or ahilan' : 'e.g. buyer'}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  <div className="login-field-group">
                    <label className="input-label" htmlFor="login-password">{t('login.password', 'Password')}</label>
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
                    {loading ? t('login.signingIn', 'Signing in...') : (portal === 'artisan' ? t('login.signInAsArtisan', 'Sign In as Artisan') : t('login.signInAsBuyer', 'Sign In as Buyer'))}
                  </button>

                  <div className="login-divider">
                    <span>{t('login.or', 'OR')}</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-block demo-btn"
                    onClick={handleFillDemo}
                  >
                    <Sparkles size={16} /> {t('login.tryDemo', 'Try Demo Account')} ({portal === 'artisan' ? 'artisan' : 'buyer'})
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="login-form">
                  <h2 className="login-card-title">
                    <UserPlus size={18} />
                    {portal === 'artisan' ? t('login.createArtisanTitle', 'Create Artisan Account') : t('login.createBuyerTitle', 'Create Buyer Account')}
                  </h2>
                  <p className="login-card-desc">
                    {portal === 'artisan'
                      ? t('login.createArtisanDesc', 'Join our craft community and reach buyers nationwide with AI tools')
                      : t('login.createBuyerDesc', 'Create your account to discover and purchase authentic handmade treasures')}
                  </p>

                  <div className="login-grid-2col">
                    <div className="login-field-group">
                      <label className="input-label" htmlFor="reg-name">{t('login.fullName', 'Full Name')}</label>
                      <div className="login-input-container">
                        <User size={16} className="login-input-icon" />
                        <input
                          id="reg-name"
                          type="text"
                          className="input-field login-field"
                          placeholder="e.g. Ramesh Kumar"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="login-field-group">
                      <label className="input-label" htmlFor="reg-mobile">
                        {t('login.mobileNumber', 'Mobile Number')} {portal === 'artisan' && <span className="label-hint">{t('login.visibleInMarket', '(visible in marketplace)')}</span>}
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
                          required={portal === 'artisan'}
                        />
                      </div>
                    </div>

                    {/* Region field for Artisan */}
                    {portal === 'artisan' ? (
                      <>
                        <div className="login-field-group">
                          <label className="input-label" htmlFor="reg-region">
                            {t('login.region', 'Region / Location')}
                          </label>
                          <div className="login-input-container">
                            <MapPin size={16} className="login-input-icon" />
                            <input
                              id="reg-region"
                              type="text"
                              className="input-field login-field"
                              placeholder="District, State (e.g. Tenkasi, Tamilnadu)"
                              value={region}
                              onChange={(e) => setRegion(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="login-field-group">
                          <label className="input-label" htmlFor="reg-username">{t('login.username', 'Username')}</label>
                          <div className="login-input-container">
                            <User size={16} className="login-input-icon" />
                            <input
                              id="reg-username"
                              type="text"
                              className="input-field login-field"
                              placeholder="Choose username (min 3 chars)"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              autoComplete="username"
                              required
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="login-field-group login-grid-full-width">
                        <label className="input-label" htmlFor="reg-username">{t('login.username', 'Username')}</label>
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
                    )}

                    <div className="login-field-group">
                      <label className="input-label" htmlFor="reg-password">{t('login.password', 'Password')}</label>
                      <div className="login-input-container">
                        <Lock size={16} className="login-input-icon" />
                        <input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          className="input-field login-field"
                          placeholder="Password (min 6 chars)"
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
                      <label className="input-label" htmlFor="reg-confirm">{t('login.confirmPassword', 'Confirm Password')}</label>
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
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block btn-lg"
                    disabled={loading}
                    style={{ marginTop: 'var(--space-md)' }}
                  >
                    {loading ? t('login.creatingAccount', 'Creating Account...') : (portal === 'artisan' ? t('login.createArtisanBtn', 'Create Artisan Account') : t('login.createBuyerBtn', 'Create Buyer Account'))}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overview Video Modal Lightbox */}
      {showVideoModal && (
        <div
          className="video-modal-backdrop animate-fade-in"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="video-modal-card glass-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="video-modal-header">
              <div className="video-modal-title">
                <span className="video-modal-icon-badge">
                  <Play size={12} fill="currentColor" />
                </span>
                <span>{t('login.overviewModalTitle', 'ZenCraft Platform Overview')}</span>
              </div>
              <button
                type="button"
                className="video-modal-close"
                onClick={() => setShowVideoModal(false)}
                title="Close video"
              >
                <X size={18} />
              </button>
            </div>
            <div className="video-modal-player-wrap">
              <video
                src="/videos/Video%20Project%2054.mp4"
                controls
                autoPlay
                playsInline
                className="video-modal-player"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
