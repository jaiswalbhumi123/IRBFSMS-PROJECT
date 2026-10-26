import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/login.css';

export default function Login() {
  const [roleTab, setRoleTab] = useState('admin'); // 'admin' | 'employee'
  const [email, setEmail] = useState('admin@benefit.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setRoleTab(tab);
    setError('');
    if (tab === 'admin') {
      setEmail('admin@benefit.com');
      setPassword('admin123');
    } else {
      setEmail('it@benefit.com');
      setPassword('it123');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { 
        email: email.trim().toLowerCase(), 
        password 
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('sessionId', data.sessionId);

      // DIRECT PROPER ROUTING: Every user lands directly on their exact dashboard!
      if (data.user.role === 'Admin') {
        navigate('/admin/dashboard');
      } else if (data.user.module === 'IT') {
        navigate('/employee/it-dashboard');
      } else if (data.user.module === 'Recruitment') {
        navigate('/employee/recruitment-dashboard');
      } else if (data.user.module === 'Business') {
        navigate('/employee/crm-dashboard');
      } else if (data.user.module === 'Financial') {
        navigate('/employee/financial-dashboard');
      } else {
        // Fallback only if no department/module assigned
        navigate('/employee/select-module');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* ================= TOP GLOBAL NAVBAR (Image 1 Style) ================= */}
      <header className="login-top-navbar">
        <div className="navbar-brand">
          <div className="navbar-logo-badge">👥</div>
          <span className="navbar-system-title">
            Integrated Recruitment, Business & Financial Services Management System
          </span>
        </div>
        <div className="navbar-tagline">
          <span>Smarter Business</span>
          <span className="sep">|</span>
          <span>Better Connections</span>
          <span className="sep">|</span>
          <span>Greater Opportunities</span>
        </div>
      </header>

      {/* ================= MAIN SPLIT BODY ================= */}
      <div className="login-body-wrapper">
        
        {/* LEFT BRANDING PANEL */}
        <section className="login-left-panel">
          <div className="left-panel-overlay">
            
            {/* Top Brand Logo & Name */}
            <div className="company-header">
              <div className="company-logo-pill">👥</div>
              <div>
                <h1 className="company-name">Benefit Business Solutions</h1>
                <p className="company-type">Pvt. Ltd.</p>
              </div>
            </div>

            {/* Main Punchline & Description */}
            <div className="brand-hero-text">
              <h2 className="hero-headline">
                Integrated Recruitment, Business & Financial Services Management System
              </h2>
              <p className="hero-subline">
                Manage your recruitment, clients, leads and financial applications — all in one place.
              </p>
            </div>

            {/* 4 Feature Badges (Matching Screenshot 1 & 3 exactly) */}
            <div className="features-grid">
              <div className="feature-card badge-blue">
                <div className="feature-icon-wrapper">👥</div>
                <div className="feature-info">
                  <strong>Recruitment Management</strong>
                  <small>Jobs, Candidates, Interviews</small>
                </div>
              </div>

              <div className="feature-card badge-teal">
                <div className="feature-icon-wrapper">🤝</div>
                <div className="feature-info">
                  <strong>Business / CRM Management</strong>
                  <small>Clients, Leads, Follow-ups</small>
                </div>
              </div>

              <div className="feature-card badge-purple">
                <div className="feature-icon-wrapper">💳</div>
                <div className="feature-info">
                  <strong>Financial Services Management</strong>
                  <small>Loan & Credit Card Applications</small>
                </div>
              </div>

              <div className="feature-card badge-orange">
                <div className="feature-icon-wrapper">📊</div>
                <div className="feature-info">
                  <strong>Reports & Analytics</strong>
                  <small>Track Performance & Growth</small>
                </div>
              </div>
            </div>

            {/* Handwritten Motto & Trust Footer */}
            <div className="left-panel-footer">
              <div className="motto-handwritten">
                Simplify Business. Build Better Relationships.
              </div>
              <div className="trust-tags">
                <span>🛡️ Secure</span>
                <span className="dot">•</span>
                <span>⚡ Reliable</span>
                <span className="dot">•</span>
                <span>💼 Easy to Use</span>
              </div>
            </div>

          </div>
        </section>

        {/* RIGHT LOGIN FORM PANEL */}
        <section className="login-right-panel">
          
          {/* Top Right Language Selector (Image 2 & 4 style) */}
          <div className="top-lang-bar">
            <span className="lang-selector">🌐 English ▾</span>
          </div>

          {/* Centered Login Card */}
          <div className="login-card">
            
            {/* Center Circular Logo Icon */}
            <div className="card-top-icon">
              <div className="icon-circle">👥</div>
            </div>

            <h2 className="card-heading">Welcome Back!</h2>
            <p className="card-subheading">Sign in to your account to access the system</p>

            {/* Role Tabs: Admin Login vs Employee / Customer Login (Image 2 style) */}
            <div className="role-switch-tabs">
              <button
                type="button"
                className={`switch-tab-btn ${roleTab === 'admin' ? 'active' : ''}`}
                onClick={() => handleTabChange('admin')}
              >
                👤 Admin Login
              </button>
              <button
                type="button"
                className={`switch-tab-btn ${roleTab === 'employee' ? 'active' : ''}`}
                onClick={() => handleTabChange('employee')}
              >
                👥 Employee Login
              </button>
            </div>

            {error && (
              <div className="login-error-alert" role="alert">
                <span>⚠️ {error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group-row">
                <label className="input-label">Email Address</label>
                <div className="input-box-wrapper">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email address"
                    className="styled-input"
                  />
                </div>
              </div>

              <div className="input-group-row">
                <label className="input-label">Password</label>
                <div className="input-box-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="styled-input"
                  />
                  <button
                    type="button"
                    className="pwd-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="form-helper-row">
                <label className="remember-me-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" className="forgot-password-link">Forgot password?</a>
              </div>

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? 'Signing In...' : 'Login →'}
              </button>
            </form>

            <div className="divider-line">
              <span>OR</span>
            </div>

            {/* Register Option (Image 2 style) */}
            <div className="register-action-box">
              <button 
                type="button" 
                className="register-btn-outline"
                onClick={() => alert('Registration is managed by Admin. Please contact HR or IT department.')}
              >
                👤+ Don't have an account? <strong>Register</strong>
              </button>
            </div>

            {/* Quick Demo Credentials Assistant */}
            <div className="quick-creds-hint">
              <span>💡 Quick Login Demo:</span>
              <button type="button" onClick={() => { setRoleTab('admin'); setEmail('admin@benefit.com'); setPassword('admin123'); }}>
                Admin
              </button>
              <button type="button" onClick={() => { setRoleTab('employee'); setEmail('it@benefit.com'); setPassword('it123'); }}>
                IT Staff
              </button>
              <button type="button" onClick={() => { setRoleTab('employee'); setEmail('priya@benefit.com'); setPassword('emp123'); }}>
                HR Staff
              </button>
            </div>

            {/* Card Bottom Security Tag */}
            <div className="card-security-footer">
              🛡️ Secure Login | Your data is safe with us
            </div>
          </div>

          {/* Bottom Copyright Footer */}
          <footer className="page-legal-footer">
            © 2025 Benefit Business Solutions Pvt. Ltd. | All Rights Reserved
          </footer>
        </section>

      </div>
    </div>
  );
}
