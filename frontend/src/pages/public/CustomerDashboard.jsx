import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('customerUser');
      if (stored) {
        setCustomer(JSON.parse(stored));
      }
    } catch {
      // ignore
    }

    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customer/my-applications');
      if (res.data) {
        const appsList = res.data.applications || (Array.isArray(res.data) ? res.data : []);
        setApplications(appsList);
        if (res.data.stats) {
          setStats(res.data.stats);
        } else {
          setStats({
            total: appsList.length,
            approved: appsList.filter(a => (a.status || '').toLowerCase() === 'approved').length,
            pending: appsList.filter(a => ['new', 'documents pending', 'submitted', 'under process'].includes((a.status || '').toLowerCase())).length,
            rejected: appsList.filter(a => ['rejected', 'closed'].includes((a.status || '').toLowerCase())).length
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      toast.error('Failed to load your applications');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    toast.info('Logged out from Customer Portal');
    setTimeout(() => {
      navigate('/customer/login');
    }, 400);
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      (app.applicationId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.productTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.applicant_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.status || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || app.type === filterType;
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status) => {
    const st = (status || 'New').toLowerCase();
    if (st === 'approved') {
      return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', label: 'Approved' };
    }
    if (st === 'rejected' || st === 'closed') {
      return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca', label: status };
    }
    if (st === 'under process' || st === 'submitted') {
      return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', label: status };
    }
    if (st === 'documents pending') {
      return { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'Docs Pending' };
    }
    return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', label: status || 'New' };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <ToastContainer position="top-right" autoClose={2500} />

      {/* TOP NAVIGATION BAR */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '800'
          }}>
            BF
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              Benefit Financial
            </h1>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              Customer Services Portal
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
              {customer?.name || 'Customer'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {customer?.email || ''}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#ef4444',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* BANNER GREETING & QUICK CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)'
        }}>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '800' }}>
              Welcome, {customer?.name || 'Valued Customer'}! 👋
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', maxWidth: '580px' }}>
              Track your loan and credit card requests in real-time, view verified documents, or submit a brand new application.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              to="/customer/apply"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '14px',
                borderRadius: '10px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)'
              }}
            >
              <span>+</span> New Application
            </Link>
            <Link
              to="/customer/track"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '14px',
                borderRadius: '10px',
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              🔍 Track by ID
            </Link>
          </div>
        </div>

        {/* KPI METRICS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              Total Applications
            </span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
              {stats.total}
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Loans & Credit Cards</span>
          </div>

          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', borderLeft: '4px solid #16a34a' }}>
            <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              Approved Applications
            </span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a' }}>
              {stats.approved}
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Sanctioned & Active</span>
          </div>

          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', borderLeft: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '13px', color: '#d97706', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              Pending / Under Review
            </span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706' }}>
              {stats.pending}
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Verification in progress</span>
          </div>

          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', borderLeft: '4px solid #ef4444' }}>
            <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              Rejected / Closed
            </span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444' }}>
              {stats.rejected}
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Archived requests</span>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          {/* TABLE CONTROLS */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                My Applications
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
                Real-time tracking of all submitted financial requests
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#334155',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              >
                <option value="ALL">All Types</option>
                <option value="Loan">Loans Only</option>
                <option value="Credit Card">Credit Cards Only</option>
              </select>

              {/* Search */}
              <div style={{ position: 'relative', width: '260px' }}>
                <svg
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by ID, product, status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 28px 8px 34px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#f8fafc',
                    color: '#0f172a',
                    boxSizing: 'border-box'
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: '#e2e8f0', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: 10 }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* TABLE DATA */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 20px' }}>Application ID</th>
                  <th style={{ padding: '14px 20px' }}>Type</th>
                  <th style={{ padding: '14px 20px' }}>Product Title</th>
                  <th style={{ padding: '14px 20px' }}>Requested / Income</th>
                  <th style={{ padding: '14px 20px' }}>Date</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center' }}>Documents</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Loading your applications...
                    </td>
                  </tr>
                ) : filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px' }}>
                      <div style={{ fontSize: '36px', marginBottom: '12px' }}>📂</div>
                      <h4 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '16px' }}>
                        No applications found
                      </h4>
                      <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '13px' }}>
                        {searchTerm ? 'No applications match your search query.' : 'You have not submitted any loan or credit card applications yet.'}
                      </p>
                      <Link
                        to="/customer/apply"
                        style={{
                          display: 'inline-block',
                          padding: '9px 18px',
                          background: '#0d9488',
                          color: '#ffffff',
                          fontWeight: '600',
                          borderRadius: '8px',
                          fontSize: '13px',
                          textDecoration: 'none'
                        }}
                      >
                        Apply Now
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filteredApps.map(app => {
                    const badge = getStatusBadge(app.status);
                    const formattedDate = app.application_date || app.created_at
                      ? new Date(app.application_date || app.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '—';

                    return (
                      <tr
                        key={app.applicationId}
                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '16px 20px', fontWeight: '700', color: '#0f172a' }}>
                          <span style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            border: '1px solid #bfdbfe'
                          }}>
                            {app.applicationId}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: app.type === 'Loan' ? '#f0fdf4' : '#faf5ff',
                            color: app.type === 'Loan' ? '#166534' : '#6b21a8',
                            border: `1px solid ${app.type === 'Loan' ? '#bbf7d0' : '#e9d5ff'}`
                          }}>
                            {app.type === 'Loan' ? '🏦 Loan' : '💳 Card'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: '600', color: '#334155' }}>
                          {app.productTitle}
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: '700', color: '#0f172a' }}>
                          {app.amount ? `₹${parseFloat(app.amount).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td style={{ padding: '16px 20px', color: '#64748b' }}>
                          {formattedDate}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`
                          }}>
                            ● {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          {app.required_documents ? (
                            <a
                              href={`http://localhost:5000${app.required_documents}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: '#0284c7',
                                textDecoration: 'none',
                                fontWeight: '600',
                                fontSize: '12.5px',
                                background: '#f0f9ff',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: '1px solid #bae6fd'
                              }}
                            >
                              📄 View File
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedApp(app)}
                            style={{
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILS MODAL */}
        {selectedApp && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  Application #{selectedApp.applicationId}
                </h3>
                <button
                  onClick={() => setSelectedApp(null)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Product Type:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedApp.type} ({selectedApp.productTitle})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Applicant Name:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedApp.applicant_name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Contact:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedApp.contact_details || '—'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Amount:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedApp.amount ? `₹${parseFloat(selectedApp.amount).toLocaleString('en-IN')}` : '—'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Current Status:</span>
                  <strong style={{ color: '#0d9488' }}>{selectedApp.status || 'New'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>City:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedApp.city || '—'}</strong>
                </div>
                {selectedApp.required_documents && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                    <span style={{ color: '#64748b' }}>Document:</span>
                    <a
                      href={`http://localhost:5000${selectedApp.required_documents}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}
                    >
                      Download Uploaded Proof ↗
                    </a>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  to={`/customer/track?id=${selectedApp.applicationId}`}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '10px',
                    background: '#0d9488',
                    color: '#ffffff',
                    fontWeight: '700',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '13px'
                  }}
                >
                  View Public Live Tracker ↗
                </Link>
                <button
                  onClick={() => setSelectedApp(null)}
                  style={{
                    padding: '10px 16px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: '600',
                    color: '#334155',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
