import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CustomerRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.warning('Name, email, and password are required');
      return;
    }

    if (formData.password.length < 6) {
      toast.warning('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/customer/register', formData);
      toast.success(res.data?.message || 'Registration successful! Please sign in.');
      setTimeout(() => {
        navigate('/customer/login');
      }, 1200);
    } catch (err) {
      console.error('Customer register error:', err);
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
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
        maxWidth: '520px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        padding: '36px 32px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
            color: '#ffffff',
            fontSize: '24px',
            marginBottom: '12px',
            boxShadow: '0 6px 16px rgba(13, 148, 136, 0.35)'
          }}>
            📝
          </div>
          <h2 style={{ fontSize: '23px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
            New Customer Registration
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Sign up for instant loan applications and credit card tracking
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
              Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
                color: '#0f172a'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0d9488'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
              Email Address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              placeholder="e.g. rahul@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
                color: '#0f172a'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0d9488'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
              Password (Min 6 Characters) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
                color: '#0f172a'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0d9488'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#0f172a'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                City
              </label>
              <input
                type="text"
                placeholder="e.g. Pune, Mumbai"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#0f172a'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>
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
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
            }}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <p style={{ fontSize: '13.5px', color: '#475569', margin: 0 }}>
            Already registered?{' '}
            <Link to="/customer/login" style={{ color: '#0d9488', fontWeight: '700', textDecoration: 'none' }}>
              Sign In to Your Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
