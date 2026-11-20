import { useEffect, useState } from 'react';
import api from '../../services/api';
import EmployeeHeader from '../../components/EmployeeHeader';
import '../../styles/dashboard.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'react-toastify';

export default function FinancialDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // FILTER & LOGS
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [workLogs, setWorkLogs] = useState([]);

  // REAL DATA STATES
  const [statsData, setStatsData] = useState({
    totalEnquiries: 0,
    totalLoans: 0,
    totalCards: 0,
    docsPending: 0,
    approved: 0,
    underProcess: 0,
    funnelData: [],
    productData: []
  });
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
  const [viewApp, setViewApp] = useState(null);

  // PAGINATION
  const [appPage, setAppPage] = useState(1);
  const appsPerPage = 8;

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
      toast.success('Loan application submitted successfully');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit loan application'); }
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    try {
      await api.post('/financial/credit-cards', cardForm);
      setShowCardModal(false);
      setCardForm({ applicant_name: '', mobile_number: '', email: '', employment_type: 'Salaried', monthly_income: '', city: '', required_product: 'Platinum Card', required_documents: '' });
      fetchData();
      toast.success('Credit card application submitted successfully');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit credit card application'); }
  };

  const handleStatusChange = async (type, id, status) => {
    try {
      if(type === 'loan') await api.put(`/financial/loans/${id}/status`, { status });
      else await api.put(`/financial/credit-cards/${id}/status`, { status });
      fetchData();
      toast.success(`Status updated to ${status}`);
    } catch (err) { toast.error('Failed to update status'); }
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
    if (!uploadDocFile) return toast.error('Please select a document file to upload');
    if (!uploadDocForm.reference_id) return toast.error('Please select an applicant reference');

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
      toast.success('KYC document uploaded successfully');
      setShowUploadDocModal(false);
      setUploadDocFile(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error uploading KYC document');
    } finally {
      setUploadDocSubmitting(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchData();
      toast.success('Document deleted successfully');
    } catch (err) {
      toast.error('Failed to delete document');
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

  const filteredLoans = (typeFilter === 'CARDS' ? [] : loans)
    .filter(l => (statusFilter === 'ALL' || l.status === statusFilter))
    .filter(l => !searchQuery || l.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) || l.contact_details?.toLowerCase().includes(searchQuery.toLowerCase()) || l.city?.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(l => ({
      ...l,
      appType: 'Loan',
      displayTitle: l.applicant_name,
      displaySub: l.contact_details,
      displayType: l.loan_type,
      displayAmount: `₹${parseFloat(l.loan_amount_requested || 0).toLocaleString('en-IN')}`,
      typeBadgeBg: '#dbeafe',
      typeBadgeColor: '#1e40af',
      typeIcon: '🏦'
    }));

  const filteredCards = (typeFilter === 'LOANS' ? [] : cards)
    .filter(c => (statusFilter === 'ALL' || c.status === statusFilter))
    .filter(c => !searchQuery || c.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.mobile_number?.toLowerCase().includes(searchQuery.toLowerCase()) || c.city?.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(c => ({
      ...c,
      appType: 'CreditCard',
      displayTitle: c.applicant_name,
      displaySub: c.mobile_number,
      displayType: c.required_product,
      displayAmount: `₹${parseFloat(c.monthly_income || 0).toLocaleString('en-IN')} (Income)`,
      typeBadgeBg: '#f3e8ff',
      typeBadgeColor: '#7e22ce',
      typeIcon: '💳'
    }));

  const allApplications = [...filteredLoans, ...filteredCards];
  const totalAppPages = Math.ceil(allApplications.length / appsPerPage);
  const indexOfLastApp = appPage * appsPerPage;
  const indexOfFirstApp = indexOfLastApp - appsPerPage;
  const currentApps = allApplications.slice(indexOfFirstApp, indexOfLastApp);

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
        <EmployeeHeader
          user={user}
          session={session}
          stats={stats}
          moduleBadgeColor="purple"
          variant="case-study"
          departmentSubtitle="Financial Advisory & Lending team"
          showGreeting={activeTab === 'dashboard'}
          onBreakChange={() => fetchData()}
        />
        
        <div className="dash-content" style={{ paddingTop: activeTab === 'dashboard' ? '18px' : '30px' }}>
          {/* DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div>
              {/* ROW 1: 4 TASK KPI CARDS */}
              <div className="cards-row-kpi-4">
                <div className="cs-kpi-card" onClick={() => setActiveTab('tasks')} style={{ borderLeftColor: '#2563eb', cursor: 'pointer' }}>
                  <h2>{stats?.assignedToday ?? 0}</h2>
                  <p>Tasks assigned today</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('tasks')} style={{ borderLeftColor: '#7c3aed', cursor: 'pointer' }}>
                  <h2>{stats?.inProgress ?? 0}</h2>
                  <p>In progress</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('tasks')} style={{ borderLeftColor: '#10b981', cursor: 'pointer' }}>
                  <h2>{stats?.completed ?? 0}</h2>
                  <p>Completed</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('tasks')} style={{ borderLeftColor: '#ef4444', cursor: 'pointer' }}>
                  <h2>{stats?.overdue ?? 0}</h2>
                  <p>Overdue</p>
                </div>
              </div>

              {/* ROW 2: 5 FINANCIAL DOMAIN KPI CARDS */}
              <div className="cards-row-kpi-5">
                <div className="cs-kpi-card" onClick={() => setActiveTab('applications')} style={{ borderLeftColor: '#2563eb', cursor: 'pointer' }}>
                  <h2>{statsData?.kpi?.totalEnquiries ?? statsData.totalEnquiries ?? 0}</h2>
                  <p>Total Applications</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('applications')} style={{ borderLeftColor: '#6366f1', cursor: 'pointer' }}>
                  <h2>{statsData?.kpi?.underProcess ?? statsData.underProcess ?? 0}</h2>
                  <p>In Verification</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('applications')} style={{ borderLeftColor: '#10b981', cursor: 'pointer' }}>
                  <h2>{statsData?.kpi?.approved ?? statsData.approved ?? 0}</h2>
                  <p>Approved Files</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('documents')} style={{ borderLeftColor: '#f59e0b', cursor: 'pointer' }}>
                  <h2>{statsData?.kpi?.docsPending ?? statsData.docsPending ?? 0}</h2>
                  <p>Pending KYC Docs</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('applications')} style={{ borderLeftColor: '#8b5cf6', cursor: 'pointer' }}>
                  <h2>{statsData?.kpi?.totalLoans ?? statsData.totalLoans ?? 0}</h2>
                  <p>Loan Portfolio</p>
                </div>
              </div>

              {/* ROW 3: TWO COLUMNS (My Tasks Today & Today's Activity Timeline) */}
              <div className="cs-grid-tasks-timeline">
                {/* Left: My Tasks Today */}
                <div className="cs-panel-card">
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>My tasks today</h3>
                  <table className="dash-table" style={{ width: '100%' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                        <th style={{ padding: '8px 10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Task</th>
                        <th style={{ padding: '8px 10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Assigned by</th>
                        <th style={{ padding: '8px 10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Due</th>
                        <th style={{ padding: '8px 10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Priority</th>
                        <th style={{ padding: '8px 10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(tasks && tasks.length > 0 ? tasks.slice(0, 5) : [
                        { id: 't1', title: 'Verify income docs for Rajesh Kumar', assigned_by_name: 'Admin', due_time: '12:30 PM', priority: 'High', status: 'In Progress' },
                        { id: 't2', title: 'Follow up on business loan application', assigned_by_name: 'Admin', due_time: '02:00 PM', priority: 'High', status: 'Assigned' },
                        { id: 't3', title: 'Upload PAN & Aadhaar for Platinum card', assigned_by_name: 'Manager', due_time: '03:45 PM', priority: 'Medium', status: 'Completed' },
                        { id: 't4', title: 'Review credit eligibility parameters', assigned_by_name: 'Admin', due_time: '05:00 PM', priority: 'Low', status: 'Assigned' }
                      ]).map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '12px 10px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{t.title}</td>
                          <td style={{ padding: '12px 10px', fontSize: '12.5px', color: '#475569' }}>{t.assigned_by_name || 'Admin'}</td>
                          <td style={{ padding: '12px 10px', fontSize: '12px', color: '#475569' }}>{t.due_time || '05:00 PM'}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span className={'priority-badge ' + (t.priority || 'medium').toLowerCase()}>
                              {t.priority || 'Medium'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span
                              className={'task-status-badge ' + (t.status || 'assigned').toLowerCase().replace(' ', '-')}
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (t.status === 'Assigned') handleTaskAction(t.id, 'In Progress');
                                else if (t.status === 'In Progress') handleTaskAction(t.id, 'Completed');
                              }}
                              title={t.status === 'In Progress' ? 'Click to complete' : t.status === 'Assigned' ? 'Click to start' : 'Completed'}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Right: Today's Activity Timeline */}
                <div className="cs-panel-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Today's activity</h3>
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>
                      <span className="live-dot"></span> Live
                    </span>
                  </div>
                  <div style={{ padding: '4px 0', maxHeight: '380px', overflowY: 'auto' }}>
                    {(data?.timeline && data.timeline.length > 0 ? data.timeline : [
                      { time: '09:05 AM', text: 'Logged in to Financial workspace', type: 'login', status: 'Active', note: 'Session initiated' },
                      { time: '09:40 AM', text: 'Started: Verify income docs for Rajesh Kumar', type: 'task', status: 'In Progress', note: 'Salary slip and Bank statements reviewed' },
                      { time: '11:20 AM', text: 'Completed: Upload PAN & Aadhaar for Platinum card', type: 'task', status: 'Completed', note: 'KYC verified with issuing partner' },
                      { time: '01:10 PM', text: 'Break started (30 min)', type: 'break', status: 'On break', note: 'Lunch break' },
                      { time: '02:40 PM', text: 'Submitted: Personal Loan file to underwriting', type: 'task', status: 'Completed', note: 'File moved to credit assessment stage' }
                    ]).map((act, idx, arr) => {
                      const timeStr = act.time
                        ? (act.time.includes('AM') || act.time.includes('PM')
                            ? act.time
                            : new Date(act.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
                        : '09:00 AM';

                      return (
                        <div key={idx} className="cs-timeline-item">
                          {idx < arr.length - 1 && <div className="cs-timeline-line" />}
                          <div className="cs-timeline-dot" style={{ background: '#8b5cf6' }} />
                          <div className="cs-timeline-text" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="cs-timeline-time" style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>
                                {timeStr}
                              </span>
                              <span style={{ color: '#0f172a', fontWeight: 600, fontSize: '13px' }}>
                                {act.text}
                              </span>
                            </div>
                            {act.note && (
                              <div
                                style={{
                                  marginTop: '4px',
                                  fontSize: '11.5px',
                                  color: '#475569',
                                  background: '#f8fafc',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  borderLeft: '3px solid #8b5cf6',
                                  lineHeight: 1.35
                                }}
                              >
                                <span style={{ fontWeight: 600, color: '#334155' }}>Process:</span> {act.note}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ROW 4: 3 CHARTS GRID */}
              <div className="cs-charts-row">
                {/* 1. Application Funnel Progress Bars */}
                <div className="cs-panel-card">
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 18px 0' }}>Application processing pipeline</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '4px' }}>
                    {[
                      { name: 'Total Inquiries', value: statsData.totalEnquiries || 14, total: Math.max(1, statsData.totalEnquiries || 14) },
                      { name: 'In Verification', value: statsData.underProcess || 6, total: Math.max(1, statsData.totalEnquiries || 14) },
                      { name: 'Docs Pending', value: statsData.docsPending || 4, total: Math.max(1, statsData.totalEnquiries || 14) },
                      { name: 'Approved Files', value: statsData.approved || 4, total: Math.max(1, statsData.totalEnquiries || 14) }
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                          <span>{item.name}</span>
                          <strong style={{ color: '#0f172a', fontWeight: 700 }}>{item.value}</strong>
                        </div>
                        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(3, (item.value / item.total) * 100))}%`,
                              height: '100%',
                              background: '#8b5cf6',
                              borderRadius: '4px',
                              transition: 'width 0.4s ease'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Applications Processed This Week (BarChart) */}
                <div className="cs-panel-card">
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px 0' }}>Applications processed this week</h3>
                  <div style={{ height: 180, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { day: 'Mon', count: Math.max(1, Math.round((statsData.totalEnquiries || 10) * 0.15)) },
                          { day: 'Tue', count: Math.max(3, Math.round((statsData.totalEnquiries || 10) * 0.25)) },
                          { day: 'Wed', count: Math.max(2, Math.round((statsData.totalEnquiries || 10) * 0.20)) },
                          { day: 'Thu', count: Math.max(4, Math.round((statsData.totalEnquiries || 10) * 0.30)) },
                          { day: 'Fri', count: Math.max(2, Math.round((statsData.totalEnquiries || 10) * 0.10)) }
                        ]}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      >
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="count" fill="#8b5cf6" barSize={26} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Product Breakdown Donut Chart */}
                <div className="cs-panel-card">
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px 0' }}>Product distribution</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 180 }}>
                    <div style={{ position: 'relative', width: 140, height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statsData?.productData?.length > 0 ? statsData.productData : [
                              { name: 'Personal Loans', value: statsData.totalLoans || 8 },
                              { name: 'Credit Cards', value: statsData.totalCards || 4 }
                            ]}
                            cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value"
                          >
                            {(statsData?.productData?.length > 0 ? statsData.productData : [
                              { name: 'Personal Loans', value: 8 },
                              { name: 'Credit Cards', value: 4 }
                            ]).map((entry, index) => (
                              <Cell key={`fc-${index}`} fill={['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8b5cf6' }} />
                        <span>Loans ({statsData.totalLoans})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />
                        <span>Cards ({statsData.totalCards})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                        <span>Approved ({statsData.approved})</span>
                      </div>
                    </div>
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
              <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                  <svg
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}
                    width="15"
                    height="15"
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
                    placeholder="Search by applicant, phone, or city..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setAppPage(1); }}
                    style={{
                      width: '100%',
                      padding: '9px 32px 9px 36px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13.5,
                      background: '#ffffff',
                      outline: 'none',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setAppPage(1); }}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: 'none',
                        background: '#e2e8f0',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#64748b',
                        fontSize: 11
                      }}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setAppPage(1); }}
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
                  onChange={(e) => { setTypeFilter(e.target.value); setAppPage(1); }}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: '#fff' }}
                >
                  <option value="ALL">All Types (Loans & Cards)</option>
                  <option value="LOANS">Loans Only</option>
                  <option value="CARDS">Credit Cards Only</option>
                </select>
              </div>

              <div className="panel-card" style={{ marginTop: 15 }}>
                <div className="panel-title">
                  <span>Applications List ({allApplications.length})</span>
                </div>
                {allApplications.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 35 }}>No applications found matching criteria.</p>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr><th>Applicant</th><th>Type</th><th>Amount / Income</th><th>City</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {currentApps.map(item => (
                        <tr key={`${item.appType}-${item.id}`}>
                          <td>
                            <strong
                              onClick={() => setViewApp(item)}
                              style={{ fontSize: 14, color: '#1e40af', cursor: 'pointer', textDecoration: 'underline' }}
                              title="Click to view application details"
                            >
                              {item.displayTitle}
                            </strong>
                            <div style={{ fontSize: 12, color: '#64748b' }}>{item.displaySub}</div>
                          </td>
                          <td>
                            <span style={{ background: item.typeBadgeBg, color: item.typeBadgeColor, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                              {item.typeIcon} {item.displayType}
                            </span>
                          </td>
                          <td>{item.displayAmount}</td>
                          <td>{item.city || '—'}</td>
                          <td>{getStatusBadge(item.status)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button
                                onClick={() => setViewApp(item)}
                                title="View details"
                                style={{ padding: '5px 9px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                              >
                                View
                              </button>
                              <select
                                value={item.status}
                                onChange={(e) => handleStatusChange(item.appType === 'Loan' ? 'loan' : 'card', item.id, e.target.value)}
                                style={{ padding: '5px', borderRadius: '5px', fontSize: '12px' }}
                              >
                                {['New', 'Documents Pending', 'Submitted', 'Under Process', 'Approved', 'Rejected', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button
                                onClick={() => openUploadForApp(item.appType === 'Loan' ? 'loan' : 'card', item.id)}
                                title="Upload KYC Document"
                                style={{ padding: '5px 9px', background: item.appType === 'Loan' ? '#7c3aed' : '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', fontWeight: 600 }}
                              >
                                📤 Doc
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* PAGINATION CONTROLS */}
                {allApplications.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 10 }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      Showing <strong>{indexOfFirstApp + 1}</strong> to <strong>{Math.min(indexOfLastApp, allApplications.length)}</strong> of <strong>{allApplications.length}</strong> applications
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={() => setAppPage(prev => Math.max(prev - 1, 1))}
                        disabled={appPage === 1}
                        style={{ padding: '5px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: appPage === 1 ? '#f8fafc' : '#fff', color: appPage === 1 ? '#94a3b8' : '#334155', cursor: appPage === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
                      >
                        ← Prev
                      </button>

                      {Array.from({ length: totalAppPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setAppPage(page)}
                          style={{ padding: '5px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: appPage === page ? '#2563eb' : '#fff', color: appPage === page ? '#fff' : '#334155', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setAppPage(prev => Math.min(prev + 1, totalAppPages))}
                        disabled={appPage === totalAppPages || totalAppPages === 0}
                        style={{ padding: '5px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: appPage === totalAppPages || totalAppPages === 0 ? '#f8fafc' : '#fff', color: appPage === totalAppPages || totalAppPages === 0 ? '#94a3b8' : '#334155', cursor: appPage === totalAppPages || totalAppPages === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
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
                        <td>
                          <strong
                            onClick={() => setViewApp({ ...l, appType: 'Loan', displayTitle: l.applicant_name, displaySub: l.contact_details, displayType: l.loan_type, displayAmount: `₹${parseFloat(l.loan_amount_requested || 0).toLocaleString('en-IN')}`, typeBadgeBg: '#dbeafe', typeBadgeColor: '#1e40af', typeIcon: '🏦' })}
                            style={{ cursor: 'pointer', color: '#1e40af', textDecoration: 'underline' }}
                            title="Click to view details"
                          >
                            {l.applicant_name}
                          </strong>
                        </td>
                        <td>🏦 {l.loan_type}</td>
                        <td>{l.contact_details}</td>
                        <td>{getStatusBadge(l.status)}</td>
                      </tr>
                    ))}
                    {cards.filter(c => c.status === 'New').map(c => (
                      <tr key={c.id}>
                        <td>
                          <strong
                            onClick={() => setViewApp({ ...c, appType: 'CreditCard', displayTitle: c.applicant_name, displaySub: c.mobile_number, displayType: c.required_product, displayAmount: `₹${parseFloat(c.monthly_income || 0).toLocaleString('en-IN')} (Income)`, typeBadgeBg: '#f3e8ff', typeBadgeColor: '#7e22ce', typeIcon: '💳' })}
                            style={{ cursor: 'pointer', color: '#1e40af', textDecoration: 'underline' }}
                            title="Click to view details"
                          >
                            {c.applicant_name}
                          </strong>
                        </td>
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

      {/* ================= APPLICATION DETAILS MODAL ================= */}
      {viewApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '540px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>{viewApp.typeIcon || '📄'} {viewApp.applicant_name}</h2>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13.5px' }}>
                  {viewApp.appType === 'Loan' ? `Loan Application #${viewApp.id}` : `Credit Card Application #${viewApp.id}`}
                </p>
              </div>
              <button onClick={() => setViewApp(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '18px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>PRODUCT / CATEGORY</label>
                <p style={{ margin: '4px 0 0', fontWeight: '600', color: '#1e40af' }}>{viewApp.displayType || viewApp.loan_type || viewApp.required_product}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>APPLICATION STATUS</label>
                <div style={{ marginTop: '4px' }}>{getStatusBadge(viewApp.status)}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>CONTACT NUMBER</label>
                <p style={{ margin: '4px 0 0', fontWeight: '600' }}>📞 {viewApp.contact_details || viewApp.mobile_number || 'N/A'}</p>
                {viewApp.email && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>📧 {viewApp.email}</p>}
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>CITY & REGION</label>
                <p style={{ margin: '4px 0 0', fontWeight: '600' }}>📍 {viewApp.city || 'N/A'}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>EMPLOYMENT TYPE</label>
                <p style={{ margin: '4px 0 0', fontWeight: '600' }}>💼 {viewApp.employment_type || 'Salaried'}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>{viewApp.appType === 'Loan' ? 'REQUESTED AMOUNT' : 'MONTHLY INCOME'}</label>
                <p style={{ margin: '4px 0 0', fontWeight: '700', color: '#059669', fontSize: '15px' }}>{viewApp.displayAmount || (viewApp.loan_amount_requested ? `₹${parseFloat(viewApp.loan_amount_requested).toLocaleString('en-IN')}` : viewApp.monthly_income ? `₹${parseFloat(viewApp.monthly_income).toLocaleString('en-IN')}` : 'N/A')}</p>
              </div>
            </div>

            {viewApp.purpose && (
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>LOAN PURPOSE</label>
                <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#334155' }}>{viewApp.purpose}</p>
              </div>
            )}

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>REQUIRED / SUBMITTED DOCUMENTS</label>
              <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#334155' }}>{viewApp.required_documents || 'Standard KYC documentation (PAN Card, Aadhaar Card, Income Statement)'}</p>
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  const target = viewApp;
                  setViewApp(null);
                  openUploadForApp(target.appType === 'Loan' ? 'loan' : 'card', target.id);
                }}
                style={{ padding: '10px 18px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
              >
                📤 Upload KYC Document
              </button>
              <button
                type="button"
                onClick={() => setViewApp(null)}
                style={{ padding: '10px 22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}