import { useEffect, useState } from 'react';
import api from '../../services/api';
import EmployeeHeader from '../../components/EmployeeHeader';
import '../../styles/dashboard.css';

export default function FinancialDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // FILTER & LOGS
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [workLogs, setWorkLogs] = useState([]);

  // REAL DATA STATES
  const [statsData, setStatsData] = useState({ totalEnquiries: 0, totalLoans: 0, totalCards: 0, docsPending: 0, approved: 0 });
  const [loans, setLoans] = useState([]);
  const [cards, setCards] = useState([]);

  // KYC & DOCUMENTS
  const [documentsList, setDocumentsList] = useState([]);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [uploadDocSubmitting, setUploadDocSubmitting] = useState(false);
  const [uploadDocFile, setUploadDocFile] = useState(null);
  const [uploadDocForm, setUploadDocForm] = useState({
    reference_type: 'Loan',
    reference_id: '',
    document_type: 'PAN Card',
    update_status: 'Submitted'
  });

  // SEARCH & FILTER
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // MODALS
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  // FORMS
  const [loanForm, setLoanForm] = useState({ applicant_name: '', contact_details: '', employment_type: 'Salaried', income_info: '', loan_amount_requested: '', purpose: '', city: '', loan_type: 'Personal Loan', required_documents: '' });
  const [cardForm, setCardForm] = useState({ applicant_name: '', mobile_number: '', email: '', employment_type: 'Salaried', monthly_income: '', city: '', required_product: 'Platinum Card', required_documents: '' });

  const getDocumentUrl = (path) => {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${base}${path}`;
  };

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/employee/dashboard-data'),
        api.get('/financial/stats'),
        api.get('/financial/loans'),
        api.get('/financial/credit-cards'),
        api.get('/financial/documents')
      ]);

      if (results[0].status === 'fulfilled') setData(results[0].value.data);
      if (results[1].status === 'fulfilled') setStatsData(results[1].value.data);
      if (results[2].status === 'fulfilled') setLoans(results[2].value.data);
      if (results[3].status === 'fulfilled') setCards(results[3].value.data);
      if (results[4].status === 'fulfilled') setDocumentsList(results[4].value.data);
      
    } catch (err) {
      console.warn("Data loading failed. Check if Backend is running & routes are correct.", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkLog = async () => {
    try {
      const res = await api.get('/employee/work-log');
      setWorkLogs(res.data.sessions || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
    fetchWorkLog();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleTaskAction = async (taskId, newStatus) => {
    try {
      await api.put(`/employee/tasks/${taskId}/status`, { status: newStatus });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    try {
      await api.post('/financial/loans', loanForm);
      setShowLoanModal(false);
      setLoanForm({ applicant_name: '', contact_details: '', employment_type: 'Salaried', income_info: '', loan_amount_requested: '', purpose: '', city: '', loan_type: 'Personal Loan', required_documents: '' });
      fetchData();
      alert('✅ Loan Application Added!');
    } catch (err) { alert('Error adding loan application'); }
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    try {
      await api.post('/financial/credit-cards', cardForm);
      setShowCardModal(false);
      setCardForm({ applicant_name: '', mobile_number: '', email: '', employment_type: 'Salaried', monthly_income: '', city: '', required_product: 'Platinum Card', required_documents: '' });
      fetchData();
      alert('✅ Credit Card Application Added!');
    } catch (err) { alert('Error adding credit card application'); }
  };

  const handleStatusChange = async (type, id, status) => {
    try {
      if(type === 'loan') await api.put(`/financial/loans/${id}/status`, { status });
      else await api.put(`/financial/credit-cards/${id}/status`, { status });
      fetchData();
    } catch (err) { alert('Error updating status'); }
  };

  const openUploadForApp = (type, id) => {
    setUploadDocForm({
      reference_type: type === 'loan' ? 'Loan' : 'CreditCard',
      reference_id: id,
      document_type: 'PAN Card',
      update_status: 'Submitted'
    });
    setUploadDocFile(null);
    setShowUploadDocModal(true);
  };

  const handleUploadKYCDoc = async (e) => {
    e.preventDefault();
    if (!uploadDocFile) return alert('Kripya document file select karein!');
    if (!uploadDocForm.reference_id) return alert('Kripya applicant select karein!');

    const formData = new FormData();
    formData.append('document', uploadDocFile);
    formData.append('reference_id', uploadDocForm.reference_id);
    formData.append('reference_type', uploadDocForm.reference_type);
    formData.append('document_type', uploadDocForm.document_type);
    if (uploadDocForm.update_status) {
      formData.append('update_status', uploadDocForm.update_status);
    }

    try {
      setUploadDocSubmitting(true);
      await api.post('/financial/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('✅ KYC Document successfully upload ho gaya!');
      setShowUploadDocModal(false);
      setUploadDocFile(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error uploading KYC document');
    } finally {
      setUploadDocSubmitting(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm('Kya aap is document ko delete karna chahte hain?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchData();
      alert('Document delete ho gaya!');
    } catch (err) {
      alert('Error deleting document');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'New': { bg: '#f1f5f9', text: '#475569' },
      'Documents Pending': { bg: '#fef3c7', text: '#b45309' },
      'Submitted': { bg: '#dbeafe', text: '#1e40af' },
      'Under Process': { bg: '#e0e7ff', text: '#4338ca' },
      'Approved': { bg: '#dcfce7', text: '#15803d' },
      'Rejected': { bg: '#fee2e2', text: '#b91c1c' },
      'Closed': { bg: '#f1f5f9', text: '#64748b' }
    };
    const c = colors[status] || colors['New'];
    return <span style={{ background: c.bg, color: c.text, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>● {status}</span>;
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Financial Dashboard...</div>;

  const { user, session, stats, tasks = [] } = data || {};

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <div className="dash-logo-icon" style={{ background: '#7c3aed' }}>FIN</div>
          <span>Benefit Business<br />Solutions</span>
        </div>
        <nav className="dash-nav">
          <p className="nav-section-title">MY WORK</p>
          <a className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</a>
          <a className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}>📋 My Tasks ({stats?.assignedToday || 0})</a>
          <a className={activeTab === 'worklog' ? 'active' : ''} onClick={() => setActiveTab('worklog')}>⏱️ Work Log</a>
          
          <p className="nav-section-title">FINANCIAL SERVICES</p>
          <a className={activeTab === 'applications' ? 'active' : ''} onClick={() => setActiveTab('applications')}>💳 Loan & Credit Apps</a>
          <a className={activeTab === 'enquiries' ? 'active' : ''} onClick={() => setActiveTab('enquiries')}>📄 Customer Enquiries</a>
          <a className={activeTab === 'documents' ? 'active' : ''} onClick={() => setActiveTab('documents')}>📁 KYC Documents ({documentsList.length})</a>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dash-main">
        <EmployeeHeader user={user} session={session} stats={stats} moduleBadgeColor="purple" onBreakChange={fetchData} />
        
        <div className="dash-content">
          {/* DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="greeting-header">
                <h1>Good morning, {user?.name?.split(' ')[0] || 'Neha'}!</h1>
                <p>Financial Advisory & Loan Processing Team</p>
              </div>

              {/* ROW 1: TASK CARDS */}
              <div className="cards-row-tasks">
                <div className="kpi-card blue"><h2>{stats?.assignedToday || 0}</h2><p>Tasks assigned today</p></div>
                <div className="kpi-card indigo"><h2>{stats?.inProgress || 0}</h2><p>In progress</p></div>
                <div className="kpi-card green"><h2>{stats?.completed || 0}</h2><p>Completed</p></div>
                <div className="kpi-card red"><h2>{stats?.overdue || 0}</h2><p>Overdue</p></div>
              </div>

              {/* ROW 2: REAL FINANCIAL METRICS */}
              <div className="cards-row-tasks">
                <div className="kpi-card purple" onClick={() => setActiveTab('applications')} style={{ cursor: 'pointer' }}>
                  <h2>{statsData.totalEnquiries}</h2><p>Total Applications →</p>
                </div>
                <div className="kpi-card green" onClick={() => setActiveTab('applications')} style={{ cursor: 'pointer' }}>
                  <h2>{statsData.approved}</h2><p>Approved Files →</p>
                </div>
                <div className="kpi-card amber" onClick={() => setActiveTab('documents')} style={{ cursor: 'pointer' }}>
                  <h2>{statsData.docsPending}</h2><p>Pending KYC →</p>
                </div>
                <div className="kpi-card blue" onClick={() => setActiveTab('applications')} style={{ cursor: 'pointer' }}>
                  <h2>{statsData.totalLoans}</h2><p>Loan Applications →</p>
                </div>
              </div>

              {/* 2 COLUMNS */}
              <div className="dashboard-grid-2col">
                <div className="panel-card">
                  <div className="panel-title"><span>Pending Tasks Today</span></div>
                  <table className="dash-table">
                    <thead><tr><th>Task Title</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {tasks.slice(0, 4).map(t => (
                        <tr key={t.id}>
                          <td><strong>{t.title}</strong></td>
                          <td><span className={`task-status-badge ${t.status.toLowerCase().replace(' ', '-')}`}>{t.status}</span></td>
                          <td>
                            {t.status === 'Assigned' && <button onClick={() => handleTaskAction(t.id, 'In Progress')} className="btn-action-task start">Start</button>}
                            {t.status === 'In Progress' && <button onClick={() => handleTaskAction(t.id, 'Completed')} className="btn-action-task complete">Complete</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="panel-card">
                  <div className="panel-title"><span>Important Note</span></div>
                  <div style={{ background: '#fffbeb', padding: 15, borderRadius: 8, border: '1px solid #fde68a', marginTop: 10 }}>
                    <p style={{ color: '#92400e', fontSize: '13px', margin: 0 }}>
                      The system is intended for enquiry/application management and tracking. Actual eligibility assessment, KYC verification, credit decisions and approval will remain subject to the applicable bank/NBFC/financial institution's official process.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* APPLICATIONS VIEW (COMBINED LOANS & CARDS) */}
          {activeTab === 'applications' && (
            <div>
              <div className="greeting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0 }}>💳 Loan & Credit Applications</h1>
                  <p style={{ margin: 0, color: '#64748b' }}>Manage and track all financial applications</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowLoanModal(true)} style={{ background: '#7c3aed', color: '#fff', padding: '10px 15px', borderRadius: 6, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>+ New Loan</button>
                  <button onClick={() => setShowCardModal(true)} style={{ background: '#2563eb', color: '#fff', padding: '10px 15px', borderRadius: 6, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>+ New Credit Card</button>
                </div>
              </div>

              {/* FILTER & SEARCH BAR */}
              <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="🔍 Search by applicant, phone or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, minWidth: 220, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: '#fff' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Documents Pending">Documents Pending</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Process">Under Process</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Closed">Closed</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: '#fff' }}
                >
                  <option value="ALL">All Types (Loans & Cards)</option>
                  <option value="LOANS">Loans Only</option>
                  <option value="CARDS">Credit Cards Only</option>
                </select>
              </div>

              <div className="panel-card" style={{ marginTop: 15 }}>
                <div className="panel-title">
                  <span>
                    Applications List ({
                      (typeFilter === 'CARDS' ? 0 : loans.filter(l => (statusFilter === 'ALL' || l.status === statusFilter) && (!searchQuery || l.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) || l.contact_details?.toLowerCase().includes(searchQuery.toLowerCase()) || l.city?.toLowerCase().includes(searchQuery.toLowerCase()))).length) +
                      (typeFilter === 'LOANS' ? 0 : cards.filter(c => (statusFilter === 'ALL' || c.status === statusFilter) && (!searchQuery || c.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.mobile_number?.toLowerCase().includes(searchQuery.toLowerCase()) || c.city?.toLowerCase().includes(searchQuery.toLowerCase()))).length)
                    })
                  </span>
                </div>
                <table className="dash-table">
                  <thead>
                    <tr><th>Applicant</th><th>Type</th><th>Amount / Income</th><th>City</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {/* Render Loans */}
                    {typeFilter !== 'CARDS' && loans
                      .filter(l => (statusFilter === 'ALL' || l.status === statusFilter))
                      .filter(l => !searchQuery || l.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) || l.contact_details?.toLowerCase().includes(searchQuery.toLowerCase()) || l.city?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(l => (
                        <tr key={`loan-${l.id}`}>
                          <td><strong>{l.applicant_name}</strong><div style={{fontSize:12, color:'#64748b'}}>{l.contact_details}</div></td>
                          <td><span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>🏦 {l.loan_type}</span></td>
                          <td>₹{parseFloat(l.loan_amount_requested).toLocaleString('en-IN')}</td>
                          <td>{l.city}</td>
                          <td>{getStatusBadge(l.status)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <select value={l.status} onChange={(e) => handleStatusChange('loan', l.id, e.target.value)} style={{ padding: '5px', borderRadius: '5px', fontSize: '12px' }}>
                                {['New', 'Documents Pending', 'Submitted', 'Under Process', 'Approved', 'Rejected', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button
                                onClick={() => openUploadForApp('loan', l.id)}
                                title="Upload KYC Document"
                                style={{ padding: '4px 8px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                📤 Doc
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                    {/* Render Credit Cards */}
                    {typeFilter !== 'LOANS' && cards
                      .filter(c => (statusFilter === 'ALL' || c.status === statusFilter))
                      .filter(c => !searchQuery || c.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.mobile_number?.toLowerCase().includes(searchQuery.toLowerCase()) || c.city?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(c => (
                        <tr key={`card-${c.id}`}>
                          <td><strong>{c.applicant_name}</strong><div style={{fontSize:12, color:'#64748b'}}>{c.mobile_number}</div></td>
                          <td><span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>💳 {c.required_product}</span></td>
                          <td>₹{parseFloat(c.monthly_income).toLocaleString('en-IN')} (Income)</td>
                          <td>{c.city}</td>
                          <td>{getStatusBadge(c.status)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <select value={c.status} onChange={(e) => handleStatusChange('card', c.id, e.target.value)} style={{ padding: '5px', borderRadius: '5px', fontSize: '12px' }}>
                                {['New', 'Documents Pending', 'Submitted', 'Under Process', 'Approved', 'Rejected', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button
                                onClick={() => openUploadForApp('card', c.id)}
                                title="Upload KYC Document"
                                style={{ padding: '4px 8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                📤 Doc
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ENQUIRIES VIEW (Shows only New Applications) */}
          {activeTab === 'enquiries' && (
            <div>
              <div className="greeting-header">
                <h1 style={{ margin: 0 }}>📄 Customer Enquiries</h1>
                <p style={{ margin: 0, color: '#64748b' }}>New incoming customer requests requiring action</p>
              </div>
              <div className="panel-card" style={{ marginTop: 20 }}>
                <table className="dash-table">
                  <thead><tr><th>Customer Name</th><th>Product Inquired</th><th>Contact</th><th>Status</th></tr></thead>
                  <tbody>
                    {loans.filter(l => l.status === 'New').map(l => (
                      <tr key={l.id}>
                        <td><strong>{l.applicant_name}</strong></td>
                        <td>🏦 {l.loan_type}</td>
                        <td>{l.contact_details}</td>
                        <td>{getStatusBadge(l.status)}</td>
                      </tr>
                    ))}
                    {cards.filter(c => c.status === 'New').map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.applicant_name}</strong></td>
                        <td>💳 {c.required_product}</td>
                        <td>{c.mobile_number}</td>
                        <td>{getStatusBadge(c.status)}</td>
                      </tr>
                    ))}
                    {loans.filter(l => l.status === 'New').length === 0 && cards.filter(c => c.status === 'New').length === 0 && (
                      <tr><td colSpan="4" style={{textAlign: 'center', padding: 20}}>No new enquiries found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DOCUMENTS VIEW (Shows Pending Documents + Uploaded Repository) */}
          {activeTab === 'documents' && (
            <div>
              <div className="greeting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0 }}>📁 KYC & Document Verification</h1>
                  <p style={{ margin: 0, color: '#64748b' }}>Manage KYC documents, collection status, and customer file verification</p>
                </div>
                <button
                  onClick={() => {
                    setUploadDocFile(null);
                    setShowUploadDocModal(true);
                  }}
                  style={{ background: '#7c3aed', color: '#fff', padding: '10px 18px', borderRadius: 8, border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  📤 Upload KYC Document
                </button>
              </div>

              {/* 1. Pending Documents Alert Table */}
              <div className="panel-card" style={{ marginTop: 20 }}>
                <div className="panel-title">
                  <span>⏳ Applications Requiring Documents ({loans.filter(l => l.status === 'Documents Pending').length + cards.filter(c => c.status === 'Documents Pending').length})</span>
                </div>
                <table className="dash-table">
                  <thead>
                    <tr><th>Applicant</th><th>Application Type</th><th>Required Documents</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {loans.filter(l => l.status === 'Documents Pending').map(l => (
                      <tr key={`pending-l-${l.id}`}>
                        <td><strong>{l.applicant_name}</strong><div style={{fontSize:12, color:'#64748b'}}>{l.contact_details}</div></td>
                        <td><span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>🏦 {l.loan_type}</span></td>
                        <td>{l.required_documents || 'Standard KYC (PAN, Aadhar, Income Proof)'}</td>
                        <td>{getStatusBadge(l.status)}</td>
                        <td>
                          <button
                            onClick={() => openUploadForApp('loan', l.id)}
                            style={{ padding: '6px 12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            📤 Upload Doc
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cards.filter(c => c.status === 'Documents Pending').map(c => (
                      <tr key={`pending-c-${c.id}`}>
                        <td><strong>{c.applicant_name}</strong><div style={{fontSize:12, color:'#64748b'}}>{c.mobile_number}</div></td>
                        <td><span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>💳 {c.required_product}</span></td>
                        <td>{c.required_documents || 'PAN, Aadhar, Income Proof'}</td>
                        <td>{getStatusBadge(c.status)}</td>
                        <td>
                          <button
                            onClick={() => openUploadForApp('card', c.id)}
                            style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            📤 Upload Doc
                          </button>
                        </td>
                      </tr>
                    ))}
                    {loans.filter(l => l.status === 'Documents Pending').length === 0 && cards.filter(c => c.status === 'Documents Pending').length === 0 && (
                      <tr><td colSpan="5" style={{textAlign: 'center', padding: 20, color: '#10b981', fontWeight: 600 }}>✅ All active applications have completed KYC documentation!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 2. Uploaded Documents Repository Table */}
              <div className="panel-card" style={{ marginTop: 24 }}>
                <div className="panel-title">
                  <span>📄 Uploaded KYC Documents Repository ({documentsList.length})</span>
                </div>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Applicant Name</th>
                      <th>Application Type</th>
                      <th>Document Type</th>
                      <th>Uploaded On</th>
                      <th>Uploaded By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentsList.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>No KYC documents uploaded yet. Click "+ Upload KYC Document" to attach files.</td></tr>
                    ) : (
                      documentsList.map(doc => (
                        <tr key={doc.id}>
                          <td><strong>{doc.applicant_name || 'N/A'}</strong></td>
                          <td>
                            <span style={{ background: doc.reference_type === 'Loan' ? '#dbeafe' : '#f3e8ff', color: doc.reference_type === 'Loan' ? '#1e40af' : '#7e22ce', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                              {doc.reference_type === 'Loan' ? '🏦 Loan' : '💳 Credit Card'}
                            </span>
                          </td>
                          <td><strong>{doc.document_type}</strong></td>
                          <td>{new Date(doc.uploaded_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td>{doc.uploader_name || 'Executive'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <a
                                href={getDocumentUrl(doc.file_path)}
                                target="_blank"
                                rel="noreferrer"
                                style={{ padding: '5px 10px', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                👁️ View File
                              </a>
                              <button
                                onClick={() => handleDeleteDoc(doc.id)}
                                style={{ padding: '5px 10px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* WORKLOG VIEW */}
          {activeTab === 'worklog' && (
            <div>
              <div className="greeting-header"><h1 style={{ margin: 0 }}>⏱️ My Work Log History</h1></div>
              <div className="panel-card" style={{ marginTop: 20 }}>
                <table className="dash-table">
                  <thead><tr><th>Date</th><th>Login</th><th>Logout</th><th>Break</th><th>Status</th></tr></thead>
                  <tbody>
                    {workLogs.map(log => (
                      <tr key={log.id}>
                        <td><strong>{new Date(log.login_time).toLocaleDateString('en-IN')}</strong></td>
                        <td>{new Date(log.login_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{log.logout_time ? new Date(log.logout_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}</td>
                        <td>{log.break_minutes || 0} mins</td>
                        <td><span style={{ background: log.status === 'Working' ? '#dcfce7' : '#f1f5f9', color: log.status === 'Working' ? '#15803d' : '#64748b', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{log.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL: NEW LOAN */}
      {showLoanModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 12, width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>🏦 New Loan Application</h2>
            <form onSubmit={handleCreateLoan} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input required placeholder="Applicant Name" value={loanForm.applicant_name} onChange={e => setLoanForm({...loanForm, applicant_name: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <input required placeholder="Contact (Phone)" value={loanForm.contact_details} onChange={e => setLoanForm({...loanForm, contact_details: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <select value={loanForm.loan_type} onChange={e => setLoanForm({...loanForm, loan_type: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }}>
                  <option value="Personal Loan">Personal Loan</option><option value="Business Loan">Business Loan</option><option value="Vehicle Loan">Vehicle Loan</option><option value="Other">Other</option>
                </select>
                <select value={loanForm.employment_type} onChange={e => setLoanForm({...loanForm, employment_type: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }}>
                  <option value="Salaried">Salaried</option><option value="Self-Employed">Self-Employed</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input required type="number" placeholder="Loan Amount" value={loanForm.loan_amount_requested} onChange={e => setLoanForm({...loanForm, loan_amount_requested: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
                <input type="number" placeholder="Monthly Income" value={loanForm.income_info} onChange={e => setLoanForm({...loanForm, income_info: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              </div>
              <input placeholder="City" value={loanForm.city} onChange={e => setLoanForm({...loanForm, city: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <input placeholder="Purpose" value={loanForm.purpose} onChange={e => setLoanForm({...loanForm, purpose: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <textarea placeholder="Required Documents" value={loanForm.required_documents} onChange={e => setLoanForm({...loanForm, required_documents: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <div style={{ display: 'flex', gap: 10 }}><button type="submit" style={{ flex: 1, padding: 12, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold' }}>Create</button><button type="button" onClick={() => setShowLoanModal(false)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 6 }}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW CREDIT CARD */}
      {showCardModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 12, width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>💳 New Credit Card Application</h2>
            <form onSubmit={handleCreateCard} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input required placeholder="Applicant Name" value={cardForm.applicant_name} onChange={e => setCardForm({...cardForm, applicant_name: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input required placeholder="Mobile Number" value={cardForm.mobile_number} onChange={e => setCardForm({...cardForm, mobile_number: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
                <input type="email" placeholder="Email" value={cardForm.email} onChange={e => setCardForm({...cardForm, email: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <select value={cardForm.employment_type} onChange={e => setCardForm({...cardForm, employment_type: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }}>
                  <option value="Salaried">Salaried</option><option value="Self-Employed">Self-Employed</option>
                </select>
                <input type="number" placeholder="Monthly Income" value={cardForm.monthly_income} onChange={e => setCardForm({...cardForm, monthly_income: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input placeholder="City" value={cardForm.city} onChange={e => setCardForm({...cardForm, city: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
                <select value={cardForm.required_product} onChange={e => setCardForm({...cardForm, required_product: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }}>
                  <option value="Platinum Card">Platinum Card</option><option value="Gold Card">Gold Card</option><option value="Signature Card">Signature Card</option>
                </select>
              </div>
              <textarea placeholder="Required Documents" value={cardForm.required_documents} onChange={e => setCardForm({...cardForm, required_documents: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <div style={{ display: 'flex', gap: 10 }}><button type="submit" style={{ flex: 1, padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold' }}>Create</button><button type="button" onClick={() => setShowCardModal(false)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 6 }}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD KYC DOCUMENT */}
      {showUploadDocModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', padding: 28, borderRadius: 14, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, fontSize: 20, color: '#1e293b' }}>📤 Upload KYC Document</h2>
            <p style={{ marginTop: -8, marginBottom: 18, color: '#64748b', fontSize: 13 }}>Attach customer identification, income proof, or banking records</p>
            <form onSubmit={handleUploadKYCDoc} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Select Application / Applicant *</label>
                <select
                  required
                  value={`${uploadDocForm.reference_type}-${uploadDocForm.reference_id}`}
                  onChange={(e) => {
                    const [refType, refId] = e.target.value.split('-');
                    setUploadDocForm({ ...uploadDocForm, reference_type: refType, reference_id: refId });
                  }}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13.5, background: '#fff' }}
                >
                  <option value="">-- Choose Applicant --</option>
                  <optgroup label="🏦 Loan Applications">
                    {loans.map(l => (
                      <option key={`l-${l.id}`} value={`Loan-${l.id}`}>
                        {l.applicant_name} ({l.loan_type} - {l.status})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="💳 Credit Card Applications">
                    {cards.map(c => (
                      <option key={`c-${c.id}`} value={`CreditCard-${c.id}`}>
                        {c.applicant_name} ({c.required_product} - {c.status})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Document Type *</label>
                  <select
                    value={uploadDocForm.document_type}
                    onChange={(e) => setUploadDocForm({ ...uploadDocForm, document_type: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13.5, background: '#fff' }}
                  >
                    <option value="PAN Card">PAN Card</option>
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Salary Slip (3 Months)">Salary Slip (3 Months)</option>
                    <option value="Bank Statement (6 Months)">Bank Statement (6 Months)</option>
                    <option value="Form 16 / ITR">Form 16 / ITR</option>
                    <option value="Address Proof">Address Proof</option>
                    <option value="Business Registration / GST">Business Registration / GST</option>
                    <option value="Other KYC Document">Other KYC Document</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Update Application Status</label>
                  <select
                    value={uploadDocForm.update_status}
                    onChange={(e) => setUploadDocForm({ ...uploadDocForm, update_status: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13.5, background: '#fff' }}
                  >
                    <option value="Submitted">Mark as Submitted</option>
                    <option value="Under Process">Mark as Under Process</option>
                    <option value="Documents Pending">Keep as Documents Pending</option>
                    <option value="">Don't Change Status</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Choose File (PDF, Word, or Image) *</label>
                <input
                  required
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => setUploadDocFile(e.target.files[0])}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px dashed #7c3aed', borderRadius: 8, fontSize: 13, background: '#faf5ff' }}
                />
                {uploadDocFile && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b21a8' }}>
                    Selected: <strong>{uploadDocFile.name}</strong> ({(uploadDocFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={uploadDocSubmitting}
                  style={{ flex: 1, padding: 12, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {uploadDocSubmitting ? 'Uploading...' : '📤 Upload Document'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(false)}
                  style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 8, color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}