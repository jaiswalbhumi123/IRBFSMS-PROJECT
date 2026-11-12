import { useEffect, useState } from 'react';
import api from '../../services/api';
import EmployeeHeader from '../../components/EmployeeHeader';
import '../../styles/dashboard.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'react-toastify';

export default function CrmDashboard() {
  // ACTIVE VIEW TAB: 'dashboard' | 'leads' | 'clients' | 'followups' | 'tasks' | 'worklog'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [followUpFilter, setFollowUpFilter] = useState('pending'); // 'pending' | 'upcoming' | 'completed'

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. CLIENTS STATE & FILTERS
  const [clients, setClients] = useState([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [submittingClient, setSubmittingClient] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('ALL');
  const [clientForm, setClientForm] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    business_requirements: '',
    status: 'Active'
  });
  // CRM Dashboard Stats ke liye state
  const [crmStats, setCrmStats] = useState({
    kpi: { totalLeads: 0, activeLeads: 0, convertedLeads: 0, pendingFollowups: 0, totalClients: 0 },
    funnelData: [],
    sourceData: []
  });
  // 2. LEADS STATE & FILTERS
  const [leads, setLeads] = useState([]);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('ALL');
  const [leadSourceFilter, setLeadSourceFilter] = useState('ALL');
  const [leadForm, setLeadForm] = useState({
    lead_title: '',
    source: 'Website',
    service_required: '',
    follow_up_date: '',
    remarks: ''
  });

  // RESCHEDULE MODAL
  const [rescheduleLead, setRescheduleLead] = useState(null);
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [newRemarks, setNewRemarks] = useState('');

  // TASKS & WORK LOG
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [workLogs, setWorkLogs] = useState([]);

  // DOCUMENTS STATE
  const [documentsList, setDocumentsList] = useState([]);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [uploadDocSubmitting, setUploadDocSubmitting] = useState(false);
  const [uploadDocFile, setUploadDocFile] = useState(null);
  const [uploadDocForm, setUploadDocForm] = useState({
    reference_type: 'Client',
    reference_id: '',
    document_type: 'Contract / Agreement'
  });
  // --- PAGINATION & MODAL STATES ---
  const [viewLead, setViewLead] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = 6;

  // Safe Date Helpers
  const formatDate = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN');
    } catch {
      return '—';
    }
  };

  const formatTime = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  const getDocumentUrl = (path) => {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${base}${path}`;
  };

  // --- FETCH CALLS ---
  const fetchDashboard = async () => {
    try {
      const res = await api.get('/employee/dashboard-data');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load CRM dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/leads/stats');
      setCrmStats(res.data);
    } catch (err) {
      console.error('Error fetching CRM stats:', err);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads');
      setLeads(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setLeads([]);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setClients([]);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents?module=Business');
      setDocumentsList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching CRM documents:', err);
      setDocumentsList([]);
    }
  };

  const fetchWorkLog = async () => {
    try {
      const res = await api.get('/employee/work-log');
      setWorkLogs(Array.isArray(res.data?.sessions) ? res.data.sessions : []);
    } catch (err) {
      console.error('Failed to load work logs:', err);
      setWorkLogs([]);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchStats();
    fetchLeads();
    fetchClients();
    fetchDocuments();
    fetchWorkLog();

    const interval = setInterval(() => {
      fetchDashboard();
      fetchStats();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const openUploadForClient = (clientId) => {
    setUploadDocForm({
      reference_type: 'Client',
      reference_id: clientId,
      document_type: 'Contract / Agreement'
    });
    setUploadDocFile(null);
    setShowUploadDocModal(true);
  };

  const handleUploadCrmDoc = async (e) => {
    e.preventDefault();
    if (!uploadDocFile) return alert('Kripya document file select karein!');
    if (!uploadDocForm.reference_id) return alert('Kripya client select karein!');

    const formData = new FormData();
    formData.append('file', uploadDocFile);
    formData.append('reference_id', uploadDocForm.reference_id);
    formData.append('reference_type', uploadDocForm.reference_type);
    formData.append('document_type', uploadDocForm.document_type);

    try {
      setUploadDocSubmitting(true);
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('✅ Document successfully upload ho gaya!');
      setShowUploadDocModal(false);
      setUploadDocFile(null);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error uploading document');
    } finally {
      setUploadDocSubmitting(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm('Kya aap is document ko delete karna chahte hain?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
      alert('Document delete ho gaya!');
    } catch (err) {
      alert('Error deleting document');
    }
  };

  // --- ACTION HANDLERS ---
  const handleTaskAction = async (taskId, newStatus) => {
    try {
      await api.put(`/employee/tasks/${taskId}/status`, { status: newStatus });
      fetchDashboard();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setSubmittingLead(true);
    try {
      await api.post('/leads', leadForm);
      setShowLeadModal(false);
      setLeadForm({ lead_title: '', source: 'Website', service_required: '', follow_up_date: '', remarks: '' });
      fetchLeads();
      fetchStats();
      alert('✅ Lead added successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add lead');
    } finally {
      setSubmittingLead(false);
    }
  };

  const handleLeadStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/leads/${id}/status`, { status: newStatus });
      fetchLeads();
      fetchStats();
    } catch (err) {
      alert('Error updating lead status');
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setSubmittingClient(true);
    try {
      await api.post('/clients', clientForm);
      setShowClientModal(false);
      setClientForm({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        business_requirements: '',
        status: 'Active'
      });
      fetchClients();
      fetchStats();
      alert('✅ Client registered successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register client');
    } finally {
      setSubmittingClient(false);
    }
  };

  const handleClientStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/clients/${id}/status`, { status: newStatus });
      fetchClients();
      fetchStats();
    } catch (err) {
      alert('Error updating client status');
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleLead || !newFollowUpDate) return;
    try {
      await api.put(`/leads/${rescheduleLead.id}/follow-up`, {
        follow_up_date: newFollowUpDate,
        remarks: newRemarks || rescheduleLead.remarks
      });
      setRescheduleLead(null);
      setNewFollowUpDate('');
      setNewRemarks('');
      fetchLeads();
      fetchStats();
      alert('✅ Next follow-up date updated!');
    } catch (err) {
      alert('Failed to update follow-up');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontWeight: 600, fontSize: '15px' }}>Loading Financial & CRM Management...</p>
        </div>
      </div>
    );
  }

  const { user, session, stats, tasks = [], timeline = [] } = data || {};

  // Safe Arrays
  const safeLeads = leads || [];
  const safeClients = clients || [];
  const safeWorkLogs = workLogs || [];

  // Dynamic 5 KPI Metrics (Database Synced with Fallback)
  const totalLeadsCount = crmStats?.totalLeads ?? safeLeads.length;
  const activeLeadsCount = crmStats?.activeLeads ?? safeLeads.filter(l => ['Open', 'In Progress'].includes(l.status)).length;
  const convertedLeadsCount = crmStats?.convertedLeads ?? safeLeads.filter(l => l.status === 'Converted').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingFollowUpsCount = crmStats?.pendingFollowUps ?? safeLeads.filter(l => l.follow_up_date && l.follow_up_date <= todayStr && l.status !== 'Converted').length;
  const activeClientsCount = crmStats?.activeClients ?? safeClients.filter(c => c.status === 'Active').length;

  // Filtered Leads
  const filteredLeads = safeLeads.filter(l => {
    const term = leadSearch.toLowerCase().trim();
    const matchesSearch = !term ||
      (l.lead_title && l.lead_title.toLowerCase().includes(term)) ||
      (l.service_required && l.service_required.toLowerCase().includes(term)) ||
      (l.remarks && l.remarks.toLowerCase().includes(term));

    const matchesStatus = leadStatusFilter === 'ALL' || l.status === leadStatusFilter;
    const matchesSource = leadSourceFilter === 'ALL' || l.source === leadSourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  //pagination calaculation
  const indexOfLastLead = currentpage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
  //if there are not filteredLeas then use safeleads 
  const totalpages = Math.ceil(filteredLeads.length / leadsPerPage);

  // Filtered Clients
  const filteredClients = safeClients.filter(c => {
    const term = clientSearch.toLowerCase().trim();
    const matchesSearch = !term ||
      (c.company_name && c.company_name.toLowerCase().includes(term)) ||
      (c.contact_person && c.contact_person.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.business_requirements && c.business_requirements.toLowerCase().includes(term));

    const matchesStatus = clientStatusFilter === 'ALL' || c.status === clientStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Categorized Follow-ups
  const upcomingFollowUps = safeLeads.filter(l => l.follow_up_date && l.follow_up_date > todayStr && l.status !== 'Converted' && l.status !== 'Lost');
  const pendingFollowUpsList = safeLeads.filter(l => l.follow_up_date && l.follow_up_date <= todayStr && l.status !== 'Converted');
  const completedFollowUps = safeLeads.filter(l => l.status === 'Converted' || (l.follow_up_date && l.follow_up_date < todayStr && l.status === 'Lost'));

  // Filtered Tasks
  const filteredTasks = (tasks || []).filter(t => taskFilter === 'ALL' || t.status === taskFilter);

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="dashboard-layout">

      {/* ================= 1. SIDEBAR ================= */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <div className="dash-logo-icon" style={{ background: '#059669' }}>CRM</div>
          <span>Benefit Business<br />Solutions</span>
        </div>

        <nav className="dash-nav">
          <p className="nav-section-title">FINANCIAL & CRM</p>
          <a
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => { setActiveTab('dashboard'); fetchStats(); }}
          >
            📊 CRM Dashboard
          </a>
          <a
            className={activeTab === 'leads' ? 'active' : ''}
            onClick={() => { setActiveTab('leads'); fetchLeads(); }}
          >
            🎯 Business Leads ({totalLeadsCount})
          </a>
          <a
            className={activeTab === 'clients' ? 'active' : ''}
            onClick={() => { setActiveTab('clients'); fetchClients(); }}
          >
            🏢 Client Directory ({safeClients.length})
          </a>
          <a
            className={activeTab === 'followups' ? 'active' : ''}
            onClick={() => setActiveTab('followups')}
          >
            🔔 Follow-ups ({pendingFollowUpsCount})
          </a>
          <a
            className={activeTab === 'documents' ? 'active' : ''}
            onClick={() => { setActiveTab('documents'); fetchDocuments(); }}
          >
            📁 Business Documents ({documentsList.length})
          </a>

          <p className="nav-section-title">MY WORK</p>
          <a
            className={activeTab === 'tasks' ? 'active' : ''}
            onClick={() => setActiveTab('tasks')}
          >
            📋 My Tasks ({stats?.assignedToday || 0})
          </a>
          <a
            className={activeTab === 'worklog' ? 'active' : ''}
            onClick={() => { setActiveTab('worklog'); fetchWorkLog(); }}
          >
            ⏱️ Work Log
          </a>
        </nav>
      </aside>

      {/* ================= 2. MAIN CONTENT ================= */}
      <main className="dash-main">
        <EmployeeHeader
          user={user}
          session={session}
          stats={stats}
          moduleBadgeColor="green"
          onBreakChange={() => fetchDashboard()}
        />

        <div className="dash-content">

          {/* ================= VIEW 1: CRM DASHBOARD (CASE STUDY SPEC) ================= */}
                   {/* ================= VIEW 1: DASHBOARD OVERVIEW ================= */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="greeting-header">
                <h1>Good morning, {user?.name?.split(' ')[0] || 'Rahul'}!</h1>
                <p>Business / CRM Team Dashboard Overview</p>
              </div>

              {/* 5 KPI CARDS (PDF MATCH) */}
              <div className="cards-row-tasks" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <div className="kpi-card blue" onClick={() => setActiveTab('leads')} style={{ cursor: 'pointer' }}>
                  <h2>{crmStats?.kpi?.totalLeads ?? totalLeadsCount}</h2>
                  <p>Total Leads →</p>
                </div>
                <div className="kpi-card indigo" onClick={() => setActiveTab('leads')} style={{ cursor: 'pointer' }}>
                  <h2>{crmStats?.kpi?.activeLeads ?? activeLeadsCount}</h2>
                  <p>Active Leads →</p>
                </div>
                <div className="kpi-card green" onClick={() => setActiveTab('leads')} style={{ cursor: 'pointer' }}>
                  <h2>{crmStats?.kpi?.convertedLeads ?? convertedLeadsCount}</h2>
                  <p>Converted Leads</p>
                </div>
                <div className="kpi-card red" onClick={() => setActiveTab('followups')} style={{ cursor: 'pointer' }}>
                  <h2>{crmStats?.kpi?.pendingFollowups ?? pendingFollowUpsCount}</h2>
                  <p>Pending Follow-ups</p>
                </div>
                <div className="kpi-card purple" onClick={() => setActiveTab('clients')} style={{ cursor: 'pointer' }}>
                  <h2>{crmStats?.kpi?.totalClients ?? safeClients.length}</h2>
                  <p>Total Clients →</p>
                </div>
              </div>

              {/* 2 CHARTS SECTION */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                
                {/* Chart 1: Lead Conversion Funnel */}
                <div className="panel-card" style={{ height: '320px' }}>
                  <div className="panel-title"><span>Lead Conversion Funnel</span></div>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={crmStats?.funnelData || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="value" fill="#10b981" barSize={40} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Chart 2: Leads by Source (Donut) */}
                <div className="panel-card" style={{ height: '320px' }}>
                  <div className="panel-title"><span>Leads by Source</span></div>
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie 
                        data={crmStats?.sourceData || []} 
                        cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value"
                      >
                        {(crmStats?.sourceData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

              </div>

              {/* Quick Action Buttons */}
              <div className="panel-card" style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => setActiveTab('leads')} style={{ flex: 1, padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  + Add New Lead
                </button>
                <button onClick={() => setActiveTab('clients')} style={{ flex: 1, padding: '12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  + Register Client
                </button>
              </div>

            </div>
          )}

          {/* ================= VIEW 2: LEAD MANAGEMENT ================= */}
          {activeTab === 'leads' && (
            <div>
              <div className="greeting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0 }}>🎯 Lead Management</h1>
                  <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                    Add leads, track sources, services, assigned executives, follow-up dates, and status
                  </p>
                </div>
                <button
                  onClick={() => setShowLeadModal(true)}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)' }}
                >
                  + Add New Lead
                </button>
              </div>

              {/* Lead Search & Filter Toolbar */}
              <div style={{ display: 'flex', gap: 12, margin: '16px 0', background: '#fff', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Search leads by title, service, or remarks..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                />
                <select value={leadSourceFilter} onChange={(e) => setLeadSourceFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
                  <option value="ALL">All Sources</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Cold Call">Cold Call</option>
                </select>
                <select value={leadStatusFilter} onChange={(e) => setLeadStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
                  <option value="ALL">All Status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Leads Pipeline ({filteredLeads.length})</span></div>
                {filteredLeads.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 35 }}>No leads match the selected criteria.</p>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Lead Title & Remarks</th>
                        <th>Source</th>
                        <th>Product / Service</th>
                        <th>Assigned Executive</th>
                        <th>Follow-up Date</th>
                        <th>Lead Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentLeads.map(l => (
                        <tr key={l.id}>
                          <td>
                            <strong style={{ fontSize: 14, color: '#0f172a' }}>{l.lead_title}</strong>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{l.remarks || 'No remarks provided'}</div>
                          </td>
                          <td><span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{l.source}</span></td>
                          <td>{l.service_required || 'Financial / IT'}</td>
                          <td><span style={{ fontSize: 12.5, color: '#334155' }}>👤 {l.assigned_to_name || 'Rahul Verma'}</span></td>
                          <td><strong style={{ color: '#1e40af', fontSize: 12.5 }}>{formatDate(l.follow_up_date)}</strong></td>
                          <td>
                            <select
                              value={l.status}
                              onChange={(e) => handleLeadStatusChange(l.id, e.target.value)}
                              style={{
                                padding: '6px 8px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: 12, fontWeight: 600,
                                background: l.status === 'Converted' ? '#f0fdf4' : l.status === 'Lost' ? '#fef2f2' : l.status === 'In Progress' ? '#fefce8' : '#eef2ff',
                                color: l.status === 'Converted' ? '#15803d' : l.status === 'Lost' ? '#b91c1c' : l.status === 'In Progress' ? '#b45309' : '#4338ca'
                              }}
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Converted">Converted</option>
                              <option value="Lost">Lost</option>
                            </select>
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                setRescheduleLead(l);
                                setNewFollowUpDate(l.follow_up_date ? l.follow_up_date.split('T')[0] : '');
                                setNewRemarks(l.remarks || '');
                              }}
                              style={{ padding: '5px 10px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            >
                              🔔 Reschedule
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
          {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      Showing {indexOfFirstLead + 1} to {Math.min(indexOfLastLead, filteredLeads.length)} of {filteredLeads.length} leads
                    </span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} style={{ padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button key={i} onClick={() => setCurrentPage(i + 1)} style={{ padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', background: currentPage === i + 1 ? '#2563eb' : '#fff', color: currentPage === i + 1 ? '#fff' : '#000', cursor: 'pointer' }}>{i + 1}</button>
                      ))}
                      <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ================= VIEW 3: CLIENT MANAGEMENT ================= */}
          {activeTab === 'clients' && (
            <div>
              <div className="greeting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0 }}>🏢 Client Management Directory</h1>
                  <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                    Client registration, company details, contact person, and business requirements
                  </p>
                </div>
                <button
                  onClick={() => setShowClientModal(true)}
                  style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)' }}
                >
                  + Register Client
                </button>
              </div>

              {/* Search & Filter Toolbar */}
              <div style={{ display: 'flex', gap: 12, margin: '16px 0', background: '#fff', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Search clients by company, contact person, email, or phone..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                />
                <select value={clientStatusFilter} onChange={(e) => setClientStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
                  <option value="ALL">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Registered Corporate Clients ({filteredClients.length})</span></div>
                {filteredClients.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 35 }}>No clients found.</p>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Company Details</th>
                        <th>Contact Person</th>
                        <th>Contact Information</th>
                        <th>Business Requirements</th>
                        <th>Client Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map(c => (
                        <tr key={c.id}>
                          <td><strong style={{ fontSize: 14, color: '#0f172a' }}>{c.company_name}</strong></td>
                          <td><span style={{ fontWeight: 600, color: '#334155' }}>👤 {c.contact_person}</span></td>
                          <td>
                            <div style={{ fontSize: 12 }}>📧 {c.email || 'No email'}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>📞 {c.phone || 'No phone'}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: 12.5, color: '#475569', maxWidth: 260 }}>{c.business_requirements || 'Standard corporate services'}</div>
                          </td>
                          <td>
                            <span style={{
                              background: c.status === 'Active' ? '#dcfce7' : '#fee2e2',
                              color: c.status === 'Active' ? '#15803d' : '#b91c1c',
                              padding: '3px 9px', borderRadius: 10, fontSize: 12, fontWeight: 700
                            }}>
                              ● {c.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button
                                onClick={() => handleClientStatusChange(c.id, c.status === 'Active' ? 'Inactive' : 'Active')}
                                style={{
                                  padding: '5px 10px', fontSize: 11.5,
                                  background: c.status === 'Active' ? '#fef2f2' : '#f0fdf4',
                                  border: `1px solid ${c.status === 'Active' ? '#fecaca' : '#bbf7d0'}`,
                                  color: c.status === 'Active' ? '#dc2626' : '#16a34a',
                                  borderRadius: 6, cursor: 'pointer', fontWeight: 600
                                }}
                              >
                                {c.status === 'Active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => openUploadForClient(c.id)}
                                title="Upload Contract / Proposal"
                                style={{
                                  padding: '5px 10px', fontSize: 11.5,
                                  background: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  color: '#2563eb',
                                  borderRadius: 6, cursor: 'pointer', fontWeight: 600
                                }}
                              >
                                📁 Upload Doc
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ================= VIEW 4: FOLLOW-UP MANAGEMENT ================= */}
          {activeTab === 'followups' && (
            <div>
              <div className="greeting-header">
                <h1 style={{ margin: 0 }}>🔔 Follow-up Management</h1>
                <p style={{ margin: '4px 0 0', color: '#64748b' }}>Track upcoming calls, overdue client reminders, and completed follow-ups</p>
              </div>

              {/* Follow-up Sub-tab Controls */}
              <div style={{ display: 'flex', gap: 10, margin: '16px 0', background: '#fff', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Select View:</span>
                <button
                  onClick={() => setFollowUpFilter('pending')}
                  style={{
                    padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    background: followUpFilter === 'pending' ? '#dc2626' : '#f1f5f9', color: followUpFilter === 'pending' ? '#fff' : '#475569'
                  }}
                >
                  ⏳ Pending Follow-ups ({pendingFollowUpsList.length})
                </button>
                <button
                  onClick={() => setFollowUpFilter('upcoming')}
                  style={{
                    padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    background: followUpFilter === 'upcoming' ? '#2563eb' : '#f1f5f9', color: followUpFilter === 'upcoming' ? '#fff' : '#475569'
                  }}
                >
                  ⏰ Upcoming Follow-ups ({upcomingFollowUps.length})
                </button>
                <button
                  onClick={() => setFollowUpFilter('completed')}
                  style={{
                    padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    background: followUpFilter === 'completed' ? '#16a34a' : '#f1f5f9', color: followUpFilter === 'completed' ? '#fff' : '#475569'
                  }}
                >
                  ✅ Completed / Converted ({completedFollowUps.length})
                </button>
              </div>

              <div className="panel-card">
                <div className="panel-title">
                  <span>
                    {followUpFilter === 'pending' && '⚠️ Pending & Overdue Follow-ups'}
                    {followUpFilter === 'upcoming' && '⏰ Scheduled Upcoming Client Calls'}
                    {followUpFilter === 'completed' && '✅ Completed Follow-ups & Deals'}
                  </span>
                </div>

                {(() => {
                  const list = followUpFilter === 'pending' ? pendingFollowUpsList : followUpFilter === 'upcoming' ? upcomingFollowUps : completedFollowUps;
                  if (list.length === 0) {
                    return <p style={{ color: '#94a3b8', textAlign: 'center', padding: 35 }}>No records found in this view.</p>;
                  }
                  return (
                    <table className="dash-table">
                      <thead>
                        <tr><th>Lead / Prospect</th><th>Service Required</th><th>Assigned Executive</th><th>Follow-up Date</th><th>Remarks</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {list.map(l => (
                          <tr key={l.id}>
                            <td><strong>{l.lead_title}</strong><div style={{ fontSize: 11.5, color: '#64748b' }}>Source: {l.source}</div></td>
                            <td>{l.service_required || 'Standard'}</td>
                            <td>👤 {l.assigned_to_name || 'Rahul Verma'}</td>
                            <td><strong style={{ color: followUpFilter === 'pending' ? '#dc2626' : '#2563eb' }}>{formatDate(l.follow_up_date)}</strong></td>
                            <td style={{ fontSize: 12.5, color: '#475569' }}>{l.remarks || 'No remarks recorded'}</td>
                            <td>
                              <button
                                onClick={() => {
                                  setRescheduleLead(l);
                                  setNewFollowUpDate(l.follow_up_date ? l.follow_up_date.split('T')[0] : '');
                                  setNewRemarks(l.remarks || '');
                                }}
                                style={{ padding: '5px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                              >
                                📅 Next Date
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ================= VIEW 5: MY TASKS ================= */}
          {activeTab === 'tasks' && (
            <div>
              <div className="greeting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0 }}>📋 My CRM Tasks</h1>
                  <p style={{ margin: '4px 0 0', color: '#64748b' }}>Assigned tasks from Admin</p>
                </div>
                <div style={{ display: 'flex', gap: 8, background: '#e2e8f0', padding: 4, borderRadius: 8 }}>
                  {['ALL', 'In Progress', 'Assigned', 'Completed'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setTaskFilter(tab)}
                      style={{ padding: '6px 14px', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: taskFilter === tab ? '#059669' : 'transparent', color: taskFilter === tab ? '#ffffff' : '#475569' }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Tasks List ({filteredTasks.length})</span></div>
                {filteredTasks.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 35 }}>No tasks found in "{taskFilter}".</p>
                ) : (
                  <table className="dash-table">
                    <thead><tr><th>Task Name</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {filteredTasks.map(t => (
                        <tr key={t.id}>
                          <td><strong>{t.title}</strong><div style={{ fontSize: 12, color: '#64748b' }}>{t.description}</div></td>
                          <td><span className={`priority-badge ${(t.priority || 'medium').toLowerCase()}`}>{t.priority}</span></td>
                          <td><span className={`task-status-badge ${(t.status || 'Assigned').toLowerCase().replace(' ', '-')}`}>{t.status}</span></td>
                          <td>
                            {t.status === 'Assigned' && <button onClick={() => handleTaskAction(t.id, 'In Progress')} className="btn-action-task start">Start</button>}
                            {t.status === 'In Progress' && <button onClick={() => handleTaskAction(t.id, 'Completed')} className="btn-action-task complete">Complete</button>}
                            {t.status === 'Completed' && <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Done</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
                {/* ================= LEAD DETAILS MODAL ================= */}
      {viewLead && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a' }}>{viewLead.lead_title}</h2>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Lead Details & Follow-up Info</p>
              </div>
              <button onClick={() => setViewLead(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>SOURCE</label>
                <p style={{ margin: '4px 0 0', fontWeight: '600' }}>{viewLead.source}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>SERVICE REQUIRED</label>
                <p style={{ margin: '4px 0 0', fontWeight: '600' }}>{viewLead.service_required || 'N/A'}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>FOLLOW-UP DATE</label>
                <p style={{ margin: '4px 0 0', fontWeight: '600', color: '#2563eb' }}>{viewLead.follow_up_date ? new Date(viewLead.follow_up_date).toLocaleDateString('en-IN') : 'Not set'}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>STATUS</label>
                <p style={{ margin: '4px 0 0', fontWeight: '600' }}>{viewLead.status}</p>
              </div>
            </div>

            <div style={{ background: '#fffbeb', padding: '15px', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <label style={{ fontSize: '11px', color: '#b45309', fontWeight: 'bold' }}>REMARKS / NOTES</label>
              <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#92400e' }}>{viewLead.remarks || 'No additional notes provided.'}</p>
            </div>

            <div style={{ marginTop: '25px', textAlign: 'right' }}>
              <button onClick={() => setViewLead(null)} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}


          {/* ================= VIEW 6: WORK LOG ================= */}
          {activeTab === 'worklog' && (
            <div>
              <div className="greeting-header">
                <h1>⏱️ My Work Log History</h1>
                <p>Recorded sessions and break times</p>
              </div>
              <div className="panel-card">
                <div className="panel-title"><span>Session Records</span></div>
                {safeWorkLogs.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 35 }}>No past sessions found.</p>
                ) : (
                  <table className="dash-table">
                    <thead><tr><th>Date</th><th>Login Time</th><th>Logout Time</th><th>Break Minutes</th><th>Status</th></tr></thead>
                    <tbody>
                      {safeWorkLogs.map(log => (
                        <tr key={log.id}>
                          <td><strong>{formatDate(log.login_time)}</strong></td>
                          <td>{formatTime(log.login_time)}</td>
                          <td>{log.logout_time ? formatTime(log.logout_time) : 'In Progress'}</td>
                          <td>{log.break_minutes || 0} mins</td>
                          <td><span style={{ background: log.status === 'Working' ? '#dcfce7' : '#f1f5f9', color: log.status === 'Working' ? '#15803d' : '#64748b', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{log.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ================= VIEW 7: BUSINESS & CLIENT DOCUMENTS ================= */}
          {activeTab === 'documents' && (
            <div>
              <div className="greeting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0 }}>📁 Business & Client Documents</h1>
                  <p style={{ margin: 0, color: '#64748b' }}>Manage contracts, client agreements, business proposals, and specifications</p>
                </div>
                <button
                  onClick={() => {
                    setUploadDocFile(null);
                    setShowUploadDocModal(true);
                  }}
                  style={{ background: '#059669', color: '#fff', padding: '10px 18px', borderRadius: 8, border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  📤 Upload Document
                </button>
              </div>

              <div className="panel-card" style={{ marginTop: 20 }}>
                <div className="panel-title">
                  <span>Repository Files ({documentsList.length})</span>
                </div>
                {documentsList.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 35 }}>No documents uploaded yet. Click "+ Upload Document" to attach business records.</p>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Client / Entity Name</th>
                        <th>Document Type</th>
                        <th>Uploaded On</th>
                        <th>Uploaded By</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentsList.map(doc => (
                        <tr key={doc.id}>
                          <td><strong style={{ fontSize: 13.5, color: '#0f172a' }}>{doc.entity_name || 'Corporate Client'}</strong></td>
                          <td>
                            <span style={{ background: '#ecfdf5', color: '#065f46', padding: '3px 9px', borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>
                              📄 {doc.document_type}
                            </span>
                          </td>
                          <td>{new Date(doc.uploaded_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td>{doc.uploader_name || 'Executive'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <a
                                href={getDocumentUrl(doc.file_path)}
                                target="_blank"
                                rel="noreferrer"
                                style={{ padding: '5px 10px', background: '#059669', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
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
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ================= MODAL 1: ADD NEW LEAD ================= */}
      {showLeadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: '#0f172a' }}>🎯 Add New Business Lead</h2>
                <small style={{ color: '#64748b', fontSize: 12.5 }}>Track prospect and service requirements</small>
              </div>
              <button type="button" onClick={() => setShowLeadModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={handleCreateLead}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Lead Title *</label>
                <input required type="text" placeholder="e.g. ERP System Consulting" value={leadForm.lead_title} onChange={(e) => setLeadForm({ ...leadForm, lead_title: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Lead Source *</label>
                  <select value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}>
                    <option value="Website">Website</option><option value="Referral">Referral</option><option value="Social Media">Social Media</option><option value="Cold Call">Cold Call</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Product / Service Required *</label>
                  <input required type="text" placeholder="e.g. Accounting Audit" value={leadForm.service_required} onChange={(e) => setLeadForm({ ...leadForm, service_required: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Follow-up Date</label>
                <input type="date" value={leadForm.follow_up_date} onChange={(e) => setLeadForm({ ...leadForm, follow_up_date: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Remarks & Discussion Notes</label>
                <textarea rows="3" placeholder="Client budget, expectations, timeline..." value={leadForm.remarks} onChange={(e) => setLeadForm({ ...leadForm, remarks: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowLeadModal(false)} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submittingLead} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{submittingLead ? 'Saving...' : 'Add Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: REGISTER CLIENT ================= */}
      {showClientModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: '#0f172a' }}>🏢 Register New Client</h2>
                <small style={{ color: '#64748b', fontSize: 12.5 }}>Client Management & Business Relations</small>
              </div>
              <button type="button" onClick={() => setShowClientModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={handleCreateClient}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Company Name *</label>
                <input required type="text" placeholder="e.g. Apex Financial Solutions Ltd." value={clientForm.company_name} onChange={(e) => setClientForm({ ...clientForm, company_name: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Contact Person *</label>
                <input required type="text" placeholder="e.g. Mr. Sunil Deshmukh" value={clientForm.contact_person} onChange={(e) => setClientForm({ ...clientForm, contact_person: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Contact Email</label>
                  <input type="email" placeholder="contact@company.com" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Contact Phone</label>
                  <input type="text" placeholder="+91 9876543210" value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Business Requirements *</label>
                <textarea rows="3" required placeholder="Specify tax consultancy, audit, recruitment needs, IT consulting..." value={clientForm.business_requirements} onChange={(e) => setClientForm({ ...clientForm, business_requirements: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Client Status</label>
                <select value={clientForm.status} onChange={(e) => setClientForm({ ...clientForm, status: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowClientModal(false)} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submittingClient} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{submittingClient ? 'Saving...' : 'Register Client'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: RESCHEDULE FOLLOW-UP ================= */}
      {rescheduleLead && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, padding: 26, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18, color: '#0f172a' }}>📅 Next Follow-up Date</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>For: <strong>{rescheduleLead.lead_title}</strong></p>
            <form onSubmit={handleRescheduleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Next Follow-up Date *</label>
                <input required type="date" value={newFollowUpDate} onChange={(e) => setNewFollowUpDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Updated Remarks</label>
                <textarea rows="2" placeholder="Discussion summary / call notes..." value={newRemarks} onChange={(e) => setNewRemarks(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setRescheduleLead(null)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Update Follow-up</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: UPLOAD BUSINESS DOCUMENT ================= */}
      {showUploadDocModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: '#0f172a' }}>📤 Upload Business Document</h2>
                <small style={{ color: '#64748b', fontSize: 12.5 }}>Attach contracts, agreements, proposals or client requirements</small>
              </div>
              <button type="button" onClick={() => setShowUploadDocModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={handleUploadCrmDoc}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Select Client / Company *</label>
                <select
                  required
                  value={uploadDocForm.reference_id}
                  onChange={(e) => setUploadDocForm({ ...uploadDocForm, reference_id: e.target.value, reference_type: 'Client' })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5, background: '#fff' }}
                >
                  <option value="">-- Choose Client --</option>
                  {safeClients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.contact_person})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Document Type *</label>
                <select
                  value={uploadDocForm.document_type}
                  onChange={(e) => setUploadDocForm({ ...uploadDocForm, document_type: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5, background: '#fff' }}
                >
                  <option value="Client Service Agreement / Contract">Client Service Agreement / Contract</option>
                  <option value="Commercial Business Proposal">Commercial Business Proposal</option>
                  <option value="Non-Disclosure Agreement (NDA)">Non-Disclosure Agreement (NDA)</option>
                  <option value="Business Requirement Specification (BRD)">Business Requirement Specification (BRD)</option>
                  <option value="MoU / Partnership Deed">MoU / Partnership Deed</option>
                  <option value="Company Registration / Tax Proof">Company Registration / Tax Proof</option>
                  <option value="Other Business Document">Other Business Document</option>
                </select>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Choose File (PDF, Word, or Image) *</label>
                <input
                  required
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => setUploadDocFile(e.target.files[0])}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px dashed #059669', borderRadius: 8, fontSize: 13, background: '#f0fdf4' }}
                />
                {uploadDocFile && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#065f46' }}>
                    Selected: <strong>{uploadDocFile.name}</strong> ({(uploadDocFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(false)}
                  style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadDocSubmitting}
                  style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#059669', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {uploadDocSubmitting ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
