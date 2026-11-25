import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ApplyForm() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('loan'); // 'loan' | 'card'
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(null);

  // Loan Form State
  const [loanForm, setLoanForm] = useState({
    applicant_name: '',
    contact_details: '',
    loan_type: 'Personal Loan',
    loan_amount_requested: '',
    employment_type: 'Salaried',
    income_info: '',
    city: '',
    purpose: ''
  });
  const [loanFile, setLoanFile] = useState(null);

  // Card Form State
  const [cardForm, setCardForm] = useState({
    applicant_name: '',
    mobile_number: '',
    email: '',
    employment_type: 'Salaried',
    monthly_income: '',
    city: '',
    required_product: 'Platinum Rewards Card'
  });
  const [cardFile, setCardFile] = useState(null);

  // Pre-fill from customerUser or staff user
  useEffect(() => {
    try {
      const storedCust = localStorage.getItem('customerUser');
      const storedStaff = localStorage.getItem('user');
      const u = storedCust ? JSON.parse(storedCust) : (storedStaff ? JSON.parse(storedStaff) : null);
      if (u) {
        setLoanForm(prev => ({
          ...prev,
          applicant_name: prev.applicant_name || u.name || '',
          contact_details: prev.contact_details || u.phone || u.contact || '',
          city: prev.city || u.city || ''
        }));
        setCardForm(prev => ({
          ...prev,
          applicant_name: prev.applicant_name || u.name || '',
          mobile_number: prev.mobile_number || u.phone || u.contact || '',
          email: prev.email || u.email || '',
          city: prev.city || u.city || ''
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Submit Loan
  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    if (!loanForm.applicant_name || !loanForm.contact_details || !loanForm.loan_amount_requested) {
      toast.warning('Please fill in applicant name, contact number, and requested loan amount');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(loanForm).forEach(key => {
        if (loanForm[key] !== null && loanForm[key] !== undefined) {
          data.append(key, loanForm[key]);
        }
      });
      if (loanFile) {
        data.append('document', loanFile);
      }

      // Do NOT pass manual Content-Type header so Axios generates the boundary correctly
      const res = await api.post('/customer/apply-loan', data);

      if (res.data) {
        setSuccessModal({
          type: 'Loan',
          applicationId: res.data.applicationId,
          message: res.data.message || 'Your loan application has been received successfully!'
        });
      }
    } catch (err) {
      console.error('Loan submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit loan application');
    } finally {
      setLoading(false);
    }
  };

  // Submit Credit Card
  const handleCardSubmit = async (e) => {
    e.preventDefault();
    if (!cardForm.applicant_name || !cardForm.mobile_number || !cardForm.monthly_income) {
      toast.warning('Please fill in applicant name, mobile number, and monthly income');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(cardForm).forEach(key => {
        if (cardForm[key] !== null && cardForm[key] !== undefined) {
          data.append(key, cardForm[key]);
        }
      });
      if (cardFile) {
        data.append('document', cardFile);
      }

      // Do NOT pass manual Content-Type header so Axios generates the boundary correctly
      const res = await api.post('/customer/apply-card', data);

      if (res.data) {
        setSuccessModal({
          type: 'Credit Card',
          applicationId: res.data.applicationId,
          message: res.data.message || 'Your credit card application has been received successfully!'
        });
      }
    } catch (err) {
      console.error('Card submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit card application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <ToastContainer position="top-right" autoClose={2500} />

      {/* HEADER */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/customer/dashboard" style={{ textDecoration: 'none', color: '#0d9488', fontWeight: '700', fontSize: '14px' }}>
            ← Back to Dashboard
          </Link>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
            Apply for Financial Services
          </h1>
        </div>

        <Link to="/customer/track" style={{ color: '#0284c7', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
          🔍 Track Existing Application
        </Link>
      </header>

      {/* CONTAINER */}
      <main style={{ maxWidth: '800px', margin: '36px auto', padding: '0 20px' }}>
        {/* TABS */}
        <div style={{
          display: 'flex',
          background: '#ffffff',
          borderRadius: '12px',
          padding: '6px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('loan')}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '15px',
              fontWeight: '700',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'loan' ? 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)' : 'transparent',
              color: activeTab === 'loan' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            🏦 Apply for Loan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '15px',
              fontWeight: '700',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'card' ? 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)' : 'transparent',
              color: activeTab === 'card' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            💳 Apply for Credit Card
          </button>
        </div>

        {/* LOAN APPLICATION FORM */}
        {activeTab === 'loan' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                Loan Application Form
              </h2>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
                Instant paperless application for Personal, Business, Vehicle, and Home Loans
              </p>
            </div>

            <form onSubmit={handleLoanSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Applicant Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={loanForm.applicant_name}
                    onChange={(e) => setLoanForm({ ...loanForm, applicant_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Contact Phone / Mobile <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={loanForm.contact_details}
                    onChange={(e) => setLoanForm({ ...loanForm, contact_details: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Loan Category <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={loanForm.loan_type}
                    onChange={(e) => setLoanForm({ ...loanForm, loan_type: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="Personal Loan">Personal Loan (Instant)</option>
                    <option value="Home Loan">Home Loan</option>
                    <option value="Business Loan">Business Expansion Loan</option>
                    <option value="Vehicle Loan">Auto / Vehicle Loan</option>
                    <option value="Education Loan">Education Loan</option>
                    <option value="Gold Loan">Gold Loan</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Requested Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500000"
                    value={loanForm.loan_amount_requested}
                    onChange={(e) => setLoanForm({ ...loanForm, loan_amount_requested: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Employment Type
                  </label>
                  <select
                    value={loanForm.employment_type}
                    onChange={(e) => setLoanForm({ ...loanForm, employment_type: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="Salaried">Salaried Employee</option>
                    <option value="Self-Employed">Self-Employed Professional</option>
                    <option value="Business Owner">Business Owner / Merchant</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Monthly / Annual Income (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 75000"
                    value={loanForm.income_info}
                    onChange={(e) => setLoanForm({ ...loanForm, income_info: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pune, Bangalore"
                    value={loanForm.city}
                    onChange={(e) => setLoanForm({ ...loanForm, city: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Purpose of Loan
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Home Renovation, Medical, Business"
                    value={loanForm.purpose}
                    onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* FILE UPLOAD (MULTER) */}
              <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1.5px dashed #cbd5e1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                  📎 Supporting Document (Salary Slip / Bank Statement / KYC)
                </label>
                <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b' }}>
                  Upload PDF, Word document, or image (Max 15MB)
                </p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setLoanFile(e.target.files[0] || null)}
                  style={{ fontSize: '13px', color: '#334155' }}
                />
                {loanFile && (
                  <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#0d9488', fontWeight: '600' }}>
                    ✓ Selected: {loanFile.name} ({(loanFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '15px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
                }}
              >
                {loading ? 'Submitting Application...' : 'Submit Loan Application'}
              </button>
            </form>
          </div>
        )}

        {/* CREDIT CARD APPLICATION FORM */}
        {activeTab === 'card' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                Credit Card Application Form
              </h2>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
                Apply for premium reward cards, cashback benefits, and instant digital approval
              </p>
            </div>

            <form onSubmit={handleCardSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Applicant Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={cardForm.applicant_name}
                    onChange={(e) => setCardForm({ ...cardForm, applicant_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={cardForm.mobile_number}
                    onChange={(e) => setCardForm({ ...cardForm, mobile_number: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. cardholder@example.com"
                    value={cardForm.email}
                    onChange={(e) => setCardForm({ ...cardForm, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Required Card Product <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={cardForm.required_product}
                    onChange={(e) => setCardForm({ ...cardForm, required_product: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="Platinum Rewards Card">Platinum Rewards Card (5x Points)</option>
                    <option value="Millennia Cashback Card">Millennia Cashback Card (5% Cashback)</option>
                    <option value="Titanium Travel Card">Titanium Travel Card (Zero Forex)</option>
                    <option value="Business Fuel Card">Business Fuel Card (Surcharge Waiver)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Employment Type
                  </label>
                  <select
                    value={cardForm.employment_type}
                    onChange={(e) => setCardForm({ ...cardForm, employment_type: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="Salaried">Salaried Professional</option>
                    <option value="Self-Employed">Self-Employed / Business</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Monthly In-Hand Income (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50000"
                    value={cardForm.monthly_income}
                    onChange={(e) => setCardForm({ ...cardForm, monthly_income: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  City / Residential Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pune, Maharashtra"
                  value={cardForm.city}
                  onChange={(e) => setCardForm({ ...cardForm, city: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              {/* FILE UPLOAD */}
              <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1.5px dashed #cbd5e1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                  📎 Supporting Document (PAN Card / Aadhaar / Income Proof)
                </label>
                <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b' }}>
                  Upload PDF or image (Max 15MB)
                </p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setCardFile(e.target.files[0] || null)}
                  style={{ fontSize: '13px', color: '#334155' }}
                />
                {cardFile && (
                  <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#0d9488', fontWeight: '600' }}>
                    ✓ Selected: {cardFile.name} ({(cardFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '15px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
                }}
              >
                {loading ? 'Submitting Application...' : 'Submit Credit Card Application'}
              </button>
            </form>
          </div>
        )}

        {/* SUCCESS MODAL WITH GENERATED APPLICATION ID */}
        {successModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '32px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                fontSize: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                ✓
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                Application Submitted!
              </h3>
              <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px' }}>
                {successModal.message}
              </p>

              <div style={{
                background: '#f8fafc',
                border: '1.5px dashed #0d9488',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  YOUR UNIQUE APPLICATION ID
                </span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#0d9488', letterSpacing: '1px' }}>
                  {successModal.applicationId}
                </span>
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Please save this ID to track your status anytime without logging in.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/customer/dashboard')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#0d9488',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/customer/track?id=${successModal.applicationId}`)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#eff6ff',
                    color: '#0284c7',
                    fontWeight: '700',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                    cursor: 'pointer'
                  }}
                >
                  Track Live ↗
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
