import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeedFill = (seedEmail) => {
    setEmail(seedEmail);
    setPassword('password123');
    setIsLogin(true);
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="app-glow-bg"></div>
      <div className="auth-card">
        <div className="auth-header">
          <h1>ETHARA</h1>
          <p>{isLogin ? 'Welcome back! Log in to manage your pipeline' : 'Create an account to start managing projects'}</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid var(--priority-high)',
            color: 'white',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                type="text"
                className="form-input"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '10px' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <p>
              New to Ethara?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); setError(''); }}>
                Sign up
              </a>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); setError(''); }}>
                Sign in
              </a>
            </p>
          )}
        </div>

        {/* Instructive Quick Demo Seeding Box */}
        <div style={{
          marginTop: '30px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px dashed var(--border-glass-bright)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <p style={{ 
            fontSize: '0.75rem', 
            fontWeight: '700', 
            color: 'var(--primary-color)', 
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            ⚡ Demo Access & Role Testing
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'center' }}>
            Click an account to auto-fill its credentials:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => handleSeedFill('admin@example.com')}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', width: '100%' }}
            >
              <span>🔑 Admin (Sarah Connor)</span>
              <span style={{ color: 'var(--secondary-color)', fontSize: '0.7rem' }}>Full Access</span>
            </button>
            <button
              onClick={() => handleSeedFill('member@example.com')}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', width: '100%' }}
            >
              <span>👤 Member (John Doe)</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>View & Move Status</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
