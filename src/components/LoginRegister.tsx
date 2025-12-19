import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

interface LoginRegisterProps {
  onLogin: (userData: any) => void;
}

const LoginRegister: React.FC<LoginRegisterProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const API = API_BASE;

  // Check screen size for responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const submit = async () => {
    setError('');
    setLoading(true);

    try {
      const url = isLogin ? '/api/login' : '/api/register';
      const body: any = { email, password };
      if (!isLogin) body.name = name;

      const apiUrl = API ? `${API}${url}` : url;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      // Store user data and token
      sessionStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.setItem('token', data.token);
      
      // Call parent handler
      onLogin(data.user);
      
      // Navigate to home page
      navigate('/');
      
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-grid auth-page">
      <div className="hero auth-hero">
        <h1 style={{ fontSize: isMobile ? '24px' : '32px' }}>
          {isLogin ? 'Welcome Back! 👋' : 'Join Smart Study 🤖'}
        </h1>
        <p className="lead" style={{ fontSize: isMobile ? '14px' : '16px' }}>
          {isLogin 
            ? 'Continue your learning journey with personalized study plans'
            : 'Create your account and unlock AI-powered study planning'}
        </p>
      </div>

      <div className="glass-card auth-card" style={{ padding: isMobile ? '16px' : '20px' }}>
        <div className="card-header-inline">
          <div>
            <p className="eyebrow">Authentication</p>
            <h3 style={{ fontSize: isMobile ? '20px' : '24px' }}>{isLogin ? 'Login to Your Account' : 'Create New Account'}</h3>
          </div>
          <div className="ai-pill">🔐 Secure</div>
        </div>

        <div className="auth-form">
          {!isLogin && (
            <div className="input-stack">
              <label className="form-label" style={{ fontSize: isMobile ? '14px' : '16px' }}>Full Name</label>
              <input
                type="text"
                className="input-neo"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ fontSize: isMobile ? '16px' : 'inherit' }}
              />
            </div>
          )}

          <div className="input-stack">
            <label className="form-label" style={{ fontSize: isMobile ? '14px' : '16px' }}>Email Address</label>
            <input
              type="email"
              className="input-neo"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ fontSize: isMobile ? '16px' : 'inherit' }}
            />
          </div>

          <div className="input-stack">
            <label className="form-label" style={{ fontSize: isMobile ? '14px' : '16px' }}>Password</label>
            <input
              type="password"
              className="input-neo"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ fontSize: isMobile ? '16px' : 'inherit' }}
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button 
            className="btn-primary-neo auth-btn" 
            onClick={submit}
            disabled={loading}
            style={{ fontSize: isMobile ? '16px' : '18px', padding: isMobile ? '12px 16px' : '14px 20px' }}
          >
            {loading ? (
              <span className="loading-text">⏳ Processing...</span>
            ) : isLogin ? (
              'Login to Account'
            ) : (
              'Create Account'
            )}
          </button>

          <div className="auth-switch">
            <p style={{ fontSize: isMobile ? '14px' : '16px' }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button"
                className="switch-link" 
                onClick={() => setIsLogin(!isLogin)}
                style={{ fontSize: isMobile ? '14px' : '16px' }}
              >
                {isLogin ? ' Register now' : ' Login here'}
              </button>
            </p>
          </div>

          <div className="auth-features" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
            <div className="feature">
              <span className="feature-icon">📊</span>
              <p style={{ fontSize: isMobile ? '13px' : '14px' }}>Track your study progress</p>
            </div>
            <div className="feature">
              <span className="feature-icon">🤖</span>
              <p style={{ fontSize: isMobile ? '13px' : '14px' }}>AI-powered planning</p>
            </div>
            <div className="feature">
              <span className="feature-icon">🎯</span>
              <p style={{ fontSize: isMobile ? '13px' : '14px' }}>Personalized dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;