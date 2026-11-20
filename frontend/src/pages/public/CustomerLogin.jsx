import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.warning('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/customer/login', formData);
      if (res.data && res.data.token) {
        localStorage.setItem('customerToken', res.data.token);
        localStorage.setItem('customerUser', JSON.stringify(res.data.customer));
        toast.success('Welcome back, ' + (res.data.customer?.name || 'Customer') + '!');
        setTimeout(() => {
          navigate('/customer/dashboard');
        }, 600);
      }
    } catch (err) {
      console.error('Customer login error:', err);
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <ToastContainer position="top-right" autoClose={2500} />

      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        padding: '36px 32px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
            color: '#ffffff',
            fontSize: '26px',
            marginBottom: '14px',
            boxShadow: '0 6px 16px rgba(13, 148, 136, 0.35)'
          }}>
            💳
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
            Customer Portal
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Benefit Financial Services (Loans & Cards)
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. customer@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                color: '#0f172a'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0d9488'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: 0 }}>
                Password
              </label>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                color: '#0f172a'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0d9488'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '15px',
              fontWeight: '700',
              color: '#ffffff',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
              transition: 'transform 0.15s ease'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Action Links */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <p style={{ fontSize: '13.5px', color: '#475569', margin: '0 0 12px' }}>
            Don't have a customer account?{' '}
            <Link to="/customer/register" style={{ color: '#0d9488', fontWeight: '700', textDecoration: 'none' }}>
              Register Here
            </Link>
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12.5px', flexWrap: 'wrap' }}>
            <Link to="/customer/track" style={{ color: '#0284c7', fontWeight: '600', textDecoration: 'none' }}>
              🔍 Track Application (No Login)
            </Link>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <Link to="/login" style={{ color: '#64748b', textDecoration: 'none' }}>
              Staff / Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
