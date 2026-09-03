import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestOtp, verifyOtp } from '../services/api';
import { Phone, ArrowRight, Shield, Sparkles, Wand2 } from 'lucide-react';
import { getMockMode, setMockMode } from '../config';
import './LoginPage.css';

export default function LoginPage({ toast }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [showDemoSuggestion, setShowDemoSuggestion] = useState(false);

  async function handleRequestOtp(e) {
    e.preventDefault();
    if (!mobile.trim()) return;
    setLoading(true);
    setShowDemoSuggestion(false);
    try {
      const res = await requestOtp(mobile.trim());
      setDeliveryMethod(res.delivery_method);
      setStep('otp');
      toast.success('OTP sent! Check your ' + (res.delivery_method === 'twilio' ? 'SMS' : 'server console'));
    } catch (err) {
      toast.error(err.serverMessage || err.message);
      // If server DB is down, show demo mode suggestion
      setShowDemoSuggestion(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    try {
      const res = await verifyOtp(mobile.trim(), otp.trim());
      login(res.token, res.artisan_id);
      toast.success('Welcome, Artisan!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.serverMessage || err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEnableDemo() {
    setMockMode(true);
    login('mock-jwt-token-for-dev', 'mock-artisan-id-001');
    toast.success('Entered Demo Mode! Full artisan catalogue ready.');
    navigate('/dashboard');
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
            AI-powered catalogue for Indian artisans
          </p>
        </div>

        <div className="login-card glass-card">
          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp}>
              <h2 className="login-card-title">
                <Phone size={18} />
                Enter your mobile number
              </h2>
              <p className="login-card-desc">
                We&apos;ll send you an OTP to verify your identity
              </p>
              <div className="login-input-wrap">
                <span className="login-input-prefix">+91</span>
                <input
                  type="tel"
                  className="input-field login-phone-input"
                  placeholder="9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  maxLength={15}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading || !mobile.trim()}
              >
                {loading ? 'Sending OTP...' : 'Get OTP'}
                {!loading && <ArrowRight size={18} />}
              </button>

              {showDemoSuggestion && (
                <div style={{ marginTop: 14, padding: 10, background: 'rgba(245, 158, 11, 0.12)', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.3)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.78rem', color: '#fbbf24', marginBottom: 8 }}>
                    PostgreSQL database not detected on local server.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm btn-block"
                    onClick={handleEnableDemo}
                    style={{ borderColor: 'var(--clr-accent)', color: 'var(--clr-accent)' }}
                  >
                    <Wand2 size={14} /> Continue with Demo Mode
                  </button>
                </div>
              )}

              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleEnableDemo}
                  style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}
                >
                  <Wand2 size={13} /> Skip to Demo Mode (No DB required)
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <h2 className="login-card-title">
                <Shield size={18} />
                Verify OTP
              </h2>
              <p className="login-card-desc">
                Enter the 6-digit code sent to {mobile}
                {deliveryMethod === 'console' && (
                  <span className="login-hint"> (check server console)</span>
                )}
              </p>
              <input
                type="text"
                className="input-field login-otp-input"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                autoFocus
                style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.5rem' }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading || otp.length < 6}
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => { setStep('phone'); setOtp(''); }}
                style={{ marginTop: 8 }}
              >
                Change number
              </button>
            </form>
          )}
        </div>

        <p className="login-footer">
          Your crafts, your story — digitized with AI
        </p>
      </div>
    </div>
  );
}
