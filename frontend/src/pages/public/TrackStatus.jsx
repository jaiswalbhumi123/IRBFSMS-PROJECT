import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function TrackStatus() {
  const [searchParams] = useSearchParams();
  const [appId, setAppId] = useState('');
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const idFromQuery = searchParams.get('id');
    if (idFromQuery) {
      setAppId(idFromQuery);
      fetchStatus(idFromQuery);
    }
  }, [searchParams]);

  const fetchStatus = async (idToSearch) => {
    const query = (idToSearch || appId).trim();
    if (!query) {
      toast.warning('Please enter an Application ID (e.g. LOAN-101 or CARD-102)');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get(`/customer/track/${encodeURIComponent(query)}`);
      if (res.data) {
        setApplication(res.data);
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setApplication(null);
      toast.error(err.response?.data?.message || 'No application found with that ID');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    fetchStatus();
  };

  // Helper to calculate progress step (1 to 4)
  const getStepStatus = (status) => {
    const st = (status || '').toLowerCase();
    if (st === 'approved') return { step: 4, label: 'Approved', color: '#16a34a' };
    if (st === 'rejected' || st === 'closed') return { step: 4, label: 'Rejected', color: '#ef4444', isRejected: true };
    if (st === 'under process' || st === 'submitted') return { step: 3, label: 'Under Process', color: '#0284c7' };
    if (st === 'documents pending') return { step: 2, label: 'Docs Pending', color: '#d97706' };
    return { step: 1, label: 'Application Submitted', color: '#64748b' };
  };

  const currentStepInfo = application ? getStepStatus(application.status) : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <ToastContainer position="top-right" autoClose={2500} />

      {/* TOP HEADER */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '16px'
          }}>
            BF
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
              Benefit Financial
            </h1>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>Public Application Tracker</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <Link to="/customer/login" style={{ color: '#0d9488', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
            Customer Login ↗
          </Link>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <Link to="/login" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>
            Staff Login
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: '780px', margin: '40px auto', padding: '0 20px' }}>
        {/* TRACKING INPUT CARD */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          marginBottom: '28px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: '#e0f2fe',
            color: '#0284c7',
            fontSize: '24px',
            marginBottom: '14px'
          }}>
            🔍
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
            Track Your Application
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: '13.5px', color: '#64748b' }}>
            Enter your unique Application ID (e.g. <strong style={{ color: '#0d9488' }}>LOAN-101</strong> or <strong style={{ color: '#0284c7' }}>CARD-102</strong>) to get live status updates. No login required!
          </p>

          <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '10px', maxWidth: '520px', margin: '0 auto' }}>
            <input
              type="text"
              placeholder="e.g. LOAN-101 or CARD-102"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              required
              style={{
                flex: 1,
                padding: '12px 16px',
                fontSize: '15px',
                fontWeight: '600',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                outline: 'none',
                color: '#0f172a',
                textTransform: 'uppercase'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0d9488'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '14px',
                borderRadius: '10px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              {loading ? 'Searching...' : 'Track Status'}
            </button>
          </form>
        </div>

        {/* RESULTS CARD */}
        {application && (
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            animation: 'fadeIn 0.3s ease'
          }}>
            {/* STATUS HEADER */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '20px',
              borderBottom: '1px solid #f1f5f9',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span style={{
                  background: '#eff6ff',
                  color: '#2563eb',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '800',
                  border: '1px solid #bfdbfe'
                }}>
                  {application.applicationId}
                </span>
                <h3 style={{ margin: '8px 0 2px', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                  {application.type} • {application.productTitle}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Applicant: <strong>{application.applicant_name}</strong>
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '800',
                  background: currentStepInfo.color === '#16a34a' ? '#dcfce7' : currentStepInfo.color === '#ef4444' ? '#fee2e2' : '#e0f2fe',
                  color: currentStepInfo.color
                }}>
                  ● {application.status}
                </span>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                  Applied: {new Date(application.application_date || application.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* VISUAL 4-STAGE PROGRESS STEPPER */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '14px' }}>
                Application Journey
              </div>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                {/* Step 1 */}
                <div style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: currentStepInfo.step >= 1 ? '#0d9488' : '#e2e8f0',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 6px',
                    fontWeight: '700',
                    fontSize: '13px'
                  }}>
                    ✓
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#0f172a', display: 'block' }}>
                    Submitted
                  </span>
                </div>

                <div style={{ height: '3px', flex: 1, background: currentStepInfo.step >= 2 ? '#0d9488' : '#e2e8f0' }} />

                {/* Step 2 */}
                <div style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: currentStepInfo.step >= 2 ? '#0d9488' : '#e2e8f0',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 6px',
                    fontWeight: '700',
                    fontSize: '13px'
                  }}>
                    {currentStepInfo.step >= 2 ? '✓' : '2'}
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '600', color: currentStepInfo.step >= 2 ? '#0f172a' : '#94a3b8', display: 'block' }}>
                    Doc Verification
                  </span>
                </div>

                <div style={{ height: '3px', flex: 1, background: currentStepInfo.step >= 3 ? '#0d9488' : '#e2e8f0' }} />

                {/* Step 3 */}
                <div style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: currentStepInfo.step >= 3 ? '#0d9488' : '#e2e8f0',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 6px',
                    fontWeight: '700',
                    fontSize: '13px'
                  }}>
                    {currentStepInfo.step >= 3 ? '✓' : '3'}
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '600', color: currentStepInfo.step >= 3 ? '#0f172a' : '#94a3b8', display: 'block' }}>
                    Under Process
                  </span>
                </div>

                <div style={{ height: '3px', flex: 1, background: currentStepInfo.step >= 4 ? currentStepInfo.color : '#e2e8f0' }} />

                {/* Step 4 */}
                <div style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: currentStepInfo.step >= 4 ? currentStepInfo.color : '#e2e8f0',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 6px',
                    fontWeight: '700',
                    fontSize: '13px'
                  }}>
                    {currentStepInfo.isRejected ? '✕' : currentStepInfo.step >= 4 ? '✓' : '4'}
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '600', color: currentStepInfo.step >= 4 ? currentStepInfo.color : '#94a3b8', display: 'block' }}>
                    {currentStepInfo.isRejected ? 'Rejected' : 'Approved'}
                  </span>
                </div>
              </div>
            </div>

            {/* DETAILS GRID */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              background: '#f8fafc',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              fontSize: '13px'
            }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Requested Amount / Income</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                  {application.amount ? `₹${parseFloat(application.amount).toLocaleString('en-IN')}` : '—'}
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Registered Location</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{application.city || 'Pune'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Employment Type</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{application.employment_type || 'Salaried'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Uploaded Proof</span>
                {application.documents ? (
                  <a
                    href={`http://localhost:5000${application.documents}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}
                  >
                    Verified Document ↗
                  </a>
                ) : (
                  <span style={{ color: '#94a3b8' }}>None Attached</span>
                )}
              </div>
            </div>

            {/* GUIDANCE MESSAGE */}
            <div style={{
              background: currentStepInfo.color === '#16a34a' ? '#f0fdf4' : currentStepInfo.color === '#ef4444' ? '#fef2f2' : '#eff6ff',
              padding: '14px 18px',
              borderRadius: '10px',
              border: `1px solid ${currentStepInfo.color === '#16a34a' ? '#bbf7d0' : currentStepInfo.color === '#ef4444' ? '#fecaca' : '#bfdbfe'}`,
              color: '#334155',
              fontSize: '13.5px',
              lineHeight: '1.5'
            }}>
              {application.status === 'Approved' ? (
                <span>🎉 <strong>Congratulations!</strong> Your application has been approved. Our financial disbursement team will contact you shortly to complete the loan agreement or card delivery.</span>
              ) : application.status === 'Documents Pending' ? (
                <span>⚠️ <strong>Documents Required:</strong> Some KYC or income proof documents are still pending verification. Please sign in to your customer account or reach out to your loan officer.</span>
              ) : application.status === 'Rejected' ? (
                <span>ℹ️ <strong>Status Notice:</strong> This application could not be approved at this time based on internal underwriting criteria. You may re-apply after 90 days.</span>
              ) : (
                <span>⏳ <strong>In Review:</strong> Your application is actively being processed by our underwriting and credit assessment team. Typical review time is 24 to 48 hours.</span>
              )}
            </div>
          </div>
        )}

        {/* NOT FOUND HELPER */}
        {hasSearched && !loading && !application && (
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '36px',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>❓</div>
            <h3 style={{ margin: '0 0 6px', fontSize: '17px', color: '#0f172a' }}>
              No Application Found
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: '#64748b' }}>
              Please check your Application ID and ensure it matches the format <strong>LOAN-101</strong> or <strong>CARD-102</strong>.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <Link
                to="/customer/login"
                style={{
                  padding: '9px 18px',
                  background: '#0d9488',
                  color: '#fff',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                  textDecoration: 'none'
                }}
              >
                Sign In to View All Applications
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
