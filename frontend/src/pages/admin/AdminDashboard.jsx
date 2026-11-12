import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import '../../styles/dashboard.css';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Active Tab State: 'overview' (Screen 2) | 'monitor' (Screen 9) | 'wfh' (Screen 11) | 'reports' (Screen 13) | 'users' (Screen 12) | 'departments' | 'tasks'
  const [activeTab, setActiveTab] = useState('overview');

  // Logged-in admin user
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [empDetails, setEmpDetails] = useState(null);

    // Modal Live Update Logic (Har 10 sec mein refresh hoga)
  useEffect(() => {
    let interval;
    if (selectedEmp) {
      const fetchLiveDetails = async (showLoading = false) => {
        if (showLoading) setLoadingDetails(true);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay for skeleton effect
        try {
          const res = await api.get(`/admin/employee/${selectedEmp}`);
          setEmpDetails(res.data);
        } catch (err) {
          if (showLoading) toast.error('Failed to load employee details');
        } finally {
          if (showLoading) setLoadingDetails(false);
        }
      };

      fetchLiveDetails(true); // Pehli baar load hote time skeleton dikhega
      
      // Har 10 second mein background mein update karega
      interval = setInterval(() => fetchLiveDetails(false), 10000); 
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedEmp]);
  

  // ================= 1. LIVE MONITOR & STATS STATE (Screen 9) =================
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ working: 0, onBreak: 0, loggedOut: 0, totalEmployees: 0 });

  // ================= 2. OVERVIEW & RECHARTS STATE (Screen 2) =================
  const [overviewData, setOverviewData] = useState({
    kpis: { totalEmployees: 4, working: 2, onBreak: 1, loggedOut: 1, tasksCompletedToday: 8, pendingWfh: 2 },
    hourlyActivity: [
      { time: '09:00', working: 1, onBreak: 0, offline: 2 },
      { time: '10:00', working: 3, onBreak: 0, offline: 1 },
      { time: '11:00', working: 3, onBreak: 1, offline: 0 },
      { time: '12:00', working: 2, onBreak: 2, offline: 0 },
      { time: '13:00', working: 1, onBreak: 3, offline: 0 },
      { time: '14:00', working: 3, onBreak: 1, offline: 0 },
      { time: '15:00', working: 4, onBreak: 0, offline: 0 },
      { time: '16:00', working: 3, onBreak: 1, offline: 0 },
      { time: '17:00', working: 2, onBreak: 0, offline: 2 },
      { time: '18:00', working: 1, onBreak: 0, offline: 3 }
    ],
    departmentDistribution: [
      { name: 'Recruitment', value: 1 },
      { name: 'IT', value: 1 },
      { name: 'Business', value: 1 },
      { name: 'Financial', value: 1 }
    ],
    weeklyTasks: [
      { day: 'Mon', assigned: 8, completed: 7 },
      { day: 'Tue', assigned: 10, completed: 9 },
      { day: 'Wed', assigned: 12, completed: 11 },
      { day: 'Thu', assigned: 9, completed: 8 },
      { day: 'Fri', assigned: 7, completed: 6 }
    ]
  });

  // ================= 3. WFH REQUESTS STATE (Screen 11) =================
  const [wfhRequests, setWfhRequests] = useState([]);
  const [wfhFilter, setWfhFilter] = useState('ALL');
  const [showWfhModal, setShowWfhModal] = useState(false);
  const [wfhForm, setWfhForm] = useState({ user_id: '', start_date: '', end_date: '', reason: '' });
  const [submittingWfh, setSubmittingWfh] = useState(false);
  const fetchEmployeesForwfh = async () => {
    try {
      const Res = await api.get('/admin/employees');
      setUsersList(Res.data);
    } catch (err) {
      console.error( err);
    }
  };

  // ================= 4. REPORTS & ANALYTICS STATE (Screen 13) =================
  const [reportsData, setReportsData] = useState({
    summaryCards: { totalWorkHours: 194, avgProductivity: '94.8%', totalDeliveredTasks: 42, onTimeRate: '98.0%' },
    departmentSummary: [
      { department: 'Recruitment', headcount: 1, workHours: 38, breakHours: 4, completedTasks: 8, totalTasks: 9, attendanceRate: 98, efficiency: '95%', status: 'Optimal' },
      { department: 'IT', headcount: 1, workHours: 40, breakHours: 3, completedTasks: 6, totalTasks: 6, attendanceRate: 100, efficiency: '100%', status: 'Optimal' },
      { department: 'Business', headcount: 1, workHours: 36, breakHours: 4, completedTasks: 7, totalTasks: 8, attendanceRate: 96, efficiency: '92%', status: 'Optimal' },
      { department: 'Financial', headcount: 1, workHours: 38, breakHours: 5, completedTasks: 9, totalTasks: 10, attendanceRate: 97, efficiency: '93%', status: 'Optimal' }
    ],
    workVsBreak: [
      { name: 'Productive Working', value: 89, color: '#16a34a' },
      { name: 'Official Breaks', value: 11, color: '#f59e0b' }
    ],
    attendanceTrend: [
      { week: 'Week 1', present: 96, wfh: 4 },
      { week: 'Week 2', present: 95, wfh: 5 },
      { week: 'Week 3', present: 98, wfh: 2 },
      { week: 'Week 4', present: 97, wfh: 3 }
    ]
  });
  const [reportDateRange, setReportDateRange] = useState('month');
  const [reportDeptFilter, setReportDeptFilter] = useState('ALL');

  // ================= 5. USERS & ROLES STATE (Screen 12) =================
  const [usersList, setUsersList] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'Employee', module: 'Recruitment' });

  // Colors for Donut / Pie Charts
  const DEPT_COLORS = ['#2563eb', '#6366f1', '#10b981', '#8b5cf6', '#ec4899'];
  const WORK_BREAK_COLORS = ['#16a34a', '#f59e0b'];

  // ================= DATA FETCHERS =================
  const fetchLiveMonitorData = async () => {
    try {
      const [empRes, statsRes] = await Promise.all([
        api.get('/admin/live-employees'),
        api.get('/admin/stats')
      ]);
      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch live monitor:', err);
    }
  };

  const fetchOverviewData = async () => {
    try {
      const res = await api.get('/admin/overview-charts');
      if (res.data) {
        setOverviewData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch overview charts:', err);
    }
  };

  const fetchWfhRequests = async () => {
    try {
      const res = await api.get('/admin/wfh-requests');
      setWfhRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch WFH requests:', err);
    }
  };

  const fetchReportsData = async () => {
    try {
      const res = await api.get('/admin/reports-analytics');
      if (res.data) {
        setReportsData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsersList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  // Switch tabs & trigger data loads
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData();
      fetchLiveMonitorData();
    } else if (activeTab === 'monitor') {
      fetchLiveMonitorData();
      const interval = setInterval(fetchLiveMonitorData, 10000);
      return () => clearInterval(interval);
    } else if (activeTab === 'wfh') {
      fetchWfhRequests();
    } else if (activeTab === 'reports') {
      fetchReportsData();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  // Initial load
  useEffect(() => {
    fetchOverviewData();
    fetchLiveMonitorData();
    fetchUsers();
  }, []);

  // ================= ACTION HANDLERS =================
  // 1. Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', userForm);
      toast.success('User added successfully!');
      setShowUserModal(false);
      setUserForm({ name: '', email: '', password: '', role: 'Employee', module: 'Recruitment' });
      fetchUsers();
      fetchOverviewData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding user');
    }
  };

  // 2. Approve / Reject WFH Request
  const handleWfhDecision = async (id, status) => {
    const remark = window.prompt(`Enter remarks for ${status.toUpperCase()} (optional):`, status === 'Approved' ? 'Approved. Ensure tasks are completed on time.' : 'Rejected due to core team deliverables.');
    if (remark === null) return; // User cancelled prompt

    try {
      await api.put(`/admin/wfh-requests/${id}`, { status, admin_remarks: remark });
      toast.success(`WFH request marked as ${status}!`);
      fetchWfhRequests();
      fetchOverviewData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating WFH status');
    }
  };

  // 3. Create WFH Request (Admin proxy)
  const handleCreateWfh = async (e) => {
    e.preventDefault();
    setSubmittingWfh(true);
    try {
      await api.post('/admin/wfh-requests', wfhForm);
      toast.success('WFH request submitted successfully!');
      setShowWfhModal(false);
      setWfhForm({ user_id: '', start_date: '', end_date: '', reason: '' });
      fetchWfhRequests();
      fetchOverviewData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit WFH request');
    } finally {
      setSubmittingWfh(false);
    }
  };

  // 4. Export Reports to CSV
  const exportReportToCSV = () => {
    if (!reportsData?.departmentSummary || reportsData.departmentSummary.length === 0) {
      toast.info('No report data available to export');
      return;
    }
    const headers = ['Department', 'Headcount', 'Work Hours', 'Break Hours', 'Completed Tasks', 'Total Tasks', 'Attendance Rate', 'Efficiency', 'Status'];
    const rows = reportsData.departmentSummary.map(d => [
      `"${d.department}"`,
      d.headcount,
      d.workHours,
      d.breakHours,
      d.completedTasks,
      d.totalTasks,
      `"${d.attendanceRate}%"`,
      `"${d.efficiency}"`,
      `"${d.status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `executive_workforce_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV successfully!');
  };

  // 5. Print Report / PDF
  const handlePrintReport = () => {
    window.print();
  };

  // 6. Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
  const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  // Filtered WFH requests
  const filteredWfh = (wfhRequests || []).filter(r => {
    if (wfhFilter === 'ALL') return true;
    return r.status === wfhFilter;
  });

  return (
    <div className="dashboard-layout">
      {/* ================= 1. ADMIN DARK BLUE SIDEBAR ================= */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <div className="dash-logo-icon" style={{ background: '#2563eb' }}>B</div>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'block', lineHeight: 1.25 }}>
              Benefit Business<br />Solutions
            </span>
            <span style={{ fontSize: '10.5px', color: '#93c5fd', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginTop: '3px' }}>
              Admin Console
            </span>
          </div>
        </div>

        <nav className="dash-nav">
          <p className="nav-section-title">CORE GOVERNANCE</p>
          <a
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => { setActiveTab('overview'); fetchOverviewData(); }}
          >
            📊 Overview (Screen 2)
          </a>
          <a
            className={activeTab === 'monitor' ? 'active' : ''}
            onClick={() => { setActiveTab('monitor'); fetchLiveMonitorData(); }}
          >
            ● Live Monitor (Screen 9)
          </a>
          <a
            className={activeTab === 'wfh' ? 'active' : ''}
            onClick={() => { setActiveTab('wfh'); fetchWfhRequests(); }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>🏠 WFH Requests (Screen 11)</span>
            {overviewData?.kpis?.pendingWfh > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '10.5px', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                {overviewData.kpis.pendingWfh}
              </span>
            )}
          </a>
          <a
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => { setActiveTab('reports'); fetchReportsAnalytics(); }}
          >
            📈 Reports & Analytics (Screen 13)
          </a>

          <p className="nav-section-title">WORKFORCE MANAGEMENT</p>
          <a
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => { setActiveTab('users'); fetchUsers(); }}
          >
            👥 Users & Roles (Screen 12)
          </a>
          <a
            className={activeTab === 'tasks' ? 'active' : ''}
            onClick={() => setActiveTab('tasks')}
          >
            📋 Staff Tasks & Workloads
          </a>
          <a
            className={activeTab === 'departments' ? 'active' : ''}
            onClick={() => setActiveTab('departments')}
          >
            🗂️ Departments
          </a>

          <p className="nav-section-title">ADMIN SHORTCUTS</p>
          <a
            onClick={() => navigate('/admin/assign-task')}
            style={{ color: '#93c5fd', cursor: 'pointer' }}
          >
            ➕ Delegate Task
          </a>
          <a
            onClick={() => setShowUserModal(true)}
            style={{ color: '#86efac', cursor: 'pointer' }}
          >
            👤 Add New Employee
          </a>
          <a
            onClick={() => setShowWfhModal(true)}
            style={{ color: '#fde047', cursor: 'pointer' }}
          >
            📝 Log WFH Request
          </a>
        </nav>
      </aside>

      {/* ================= 2. MAIN ADMIN CONTENT ================= */}
      <main className="dash-main">
        {/* TOPBAR */}
        <header className="dash-topbar case-study" style={{ padding: '14px 30px' }}>
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="module-badge purple" style={{ background: '#ede9fe', color: '#6d28d9', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
              Administration Console
            </span>
            <span className="status-indicator working" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
              ● Live Telemetry Active
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={() => navigate('/admin/assign-task')} 
              style={{
                padding: '7px 14px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12.5px',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              ➕ Delegate Task
            </button>
            
            <button 
              onClick={() => setShowUserModal(true)} 
              style={{
                padding: '7px 14px',
                background: '#047857',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12.5px',
                boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              👤 Add Employee
            </button>

            <div className="topbar-right-user" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12, borderLeft: '1.5px solid #e2e8f0' }}>
              <div className="user-avatar-small" style={{ background: '#4f46e5', width: 34, height: 34, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="profile-info">
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>{user?.name || 'Administrator'}</strong>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>{user?.role || 'Super Admin'}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="btn-topbar-logout"
                style={{ marginLeft: 6 }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT BODY */}
        <div className="dash-content" style={{ padding: '24px 30px 40px 30px' }}>
          {/* HEADER INTRO BANNER */}
          <div style={{ marginBottom: '22px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Enterprise Operations Management
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13.5px' }}>
              Live workforce telemetry, workload distribution, attendance tracking, and executive analytics
            </p>
          </div>

          {/* ================= TAB NAVIGATION SWITCHER ================= */}
      <div style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '5px', borderRadius: '10px', width: 'fit-content', marginBottom: '22px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'overview' ? '#2563eb' : 'transparent',
            color: activeTab === 'overview' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          📊 Admin Overview (Screen 2)
        </button>

        <button
          onClick={() => setActiveTab('monitor')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'monitor' ? '#2563eb' : 'transparent',
            color: activeTab === 'monitor' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          ● Real-time Live Monitor (Screen 9)
        </button>

        <button
          onClick={() => setActiveTab('wfh')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'wfh' ? '#2563eb' : 'transparent',
            color: activeTab === 'wfh' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          🏠 WFH Requests (Screen 11) {overviewData.kpis.pendingWfh > 0 && <span style={{ background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 10, fontSize: 11, marginLeft: 4 }}>{overviewData.kpis.pendingWfh}</span>}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'reports' ? '#2563eb' : 'transparent',
            color: activeTab === 'reports' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          📈 Reports & Analytics (Screen 13)
        </button>

        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'users' ? '#2563eb' : 'transparent',
            color: activeTab === 'users' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          👥 Users & Roles (Screen 12)
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'departments' ? '#2563eb' : 'transparent',
            color: activeTab === 'departments' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          🗂️ Departments
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'tasks' ? '#2563eb' : 'transparent',
            color: activeTab === 'tasks' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          📋 Staff Tasks & Workloads
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 🔴 A. SCREEN 2: ADMIN OVERVIEW & REAL-TIME INTERACTIVE RECHARTS            */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div>
          {/* 6 EXECUTIVE KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '12px', borderLeft: '4px solid #2563eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: 0, fontSize: '26px', color: '#0f172a', fontWeight: 800 }}>{overviewData.kpis.totalEmployees}</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12.5px', fontWeight: 600 }}>Total Employees</p>
            </div>

            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '12px', borderLeft: '4px solid #16a34a', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: 0, fontSize: '26px', color: '#16a34a', fontWeight: 800 }}>{overviewData.kpis.working}</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12.5px', fontWeight: 600 }}>Active Working Now</p>
            </div>

            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: 0, fontSize: '26px', color: '#f59e0b', fontWeight: 800 }}>{overviewData.kpis.onBreak}</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12.5px', fontWeight: 600 }}>On Official Break</p>
            </div>

            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '12px', borderLeft: '4px solid #ef4444', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: 0, fontSize: '26px', color: '#ef4444', fontWeight: 800 }}>{overviewData.kpis.loggedOut}</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12.5px', fontWeight: 600 }}>Logged Out / Offline</p>
            </div>

            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '12px', borderLeft: '4px solid #4f46e5', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: 0, fontSize: '26px', color: '#4f46e5', fontWeight: 800 }}>{overviewData.kpis.tasksCompletedToday}</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12.5px', fontWeight: 600 }}>Tasks Done Today</p>
            </div>

            <div 
              onClick={() => setActiveTab('wfh')} 
              style={{ background: '#fff', padding: '18px 20px', borderRadius: '12px', borderLeft: '4px solid #9333ea', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'transform 0.15s' }}
              title="Click to view and approve pending WFH requests"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '26px', color: '#9333ea', fontWeight: 800 }}>{overviewData.kpis.pendingWfh}</h3>
                <span style={{ fontSize: '11px', background: '#f3e8ff', color: '#7e22ce', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>Review →</span>
              </div>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12.5px', fontWeight: 600 }}>Pending WFH Requests</p>
            </div>
          </div>

          {/* ROW 1: REAL CHARTS GRID (Line Chart & Donut Chart) */}
          <div style={{ display: 'grid', gridTemplateColumns: '62% 38%', gap: '20px', marginBottom: '24px' }}>
            
            {/* REAL-TIME HOURLY WORKFORCE ACTIVITY (Area & Line Chart) */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>
                    📈 Hourly Workforce Activity Curve (09:00 - 18:00)
                  </h3>
                  <small style={{ color: '#64748b', fontSize: '12px' }}>Real-time employee working hours & break tracking distribution</small>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', padding: '4px 10px', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>Live Hourly Curve</span>
                </div>
              </div>

              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overviewData.hourlyActivity}>
                    <defs>
                      <linearGradient id="colorWorking" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorBreak" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12.5px', fontWeight: 600 }} />
                    <Area type="monotone" dataKey="working" name="Active Staff Working" stroke="#16a34a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWorking)" />
                    <Area type="monotone" dataKey="onBreak" name="Staff on Official Break" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorBreak)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* REAL DEPARTMENT HEADCOUNT DISTRIBUTION (Donut Chart) */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>
                    🍩 Department Headcount Distribution
                  </h3>
                  <small style={{ color: '#64748b', fontSize: '12px' }}>Operational module allocation</small>
                </div>
                <span style={{ fontSize: '12px', background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  4 Modules
                </span>
              </div>

              <div style={{ width: '100%', height: 280, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overviewData.departmentDistribution}
                      cx="50%"
                      cy="46%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {overviewData.departmentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center" 
                      wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: 10 }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* ROW 2: WEEKLY TASKS VELOCITY BAR CHART & QUICK ACTIONS */}
          <div style={{ display: 'grid', gridTemplateColumns: '62% 38%', gap: '20px' }}>
            
            {/* WEEKLY TASKS VELOCITY (Bar Chart) */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>
                    📊 Weekly Tasks Delivery Velocity (Assigned vs Completed)
                  </h3>
                  <small style={{ color: '#64748b', fontSize: '12px' }}>Operational efficiency through Monday to Friday</small>
                </div>
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>
                  94.2% Completion Rate
                </span>
              </div>

              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overviewData.weeklyTasks}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                    <Bar dataKey="assigned" name="Tasks Assigned" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Tasks Completed" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* QUICK ACTIONS HUB */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>⚡ Executive Quick Actions</h3>
                <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '12.5px' }}>Direct shortcuts to core governance and tracking tools</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div 
                    onClick={() => navigate('/admin/assign-task')} 
                    style={{ padding: '12px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ fontSize: 13, color: '#1e293b' }}>➕ Delegate New Operational Task</strong>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>Assign tasks to HR, IT, CRM, or Finance staff</div>
                    </div>
                    <span style={{ fontSize: 16 }}>→</span>
                  </div>

                  <div 
                    onClick={() => setShowUserModal(true)} 
                    style={{ padding: '12px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ fontSize: 13, color: '#1e293b' }}>👤 Register New Staff Account</strong>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>Add employee credentials and assign department</div>
                    </div>
                    <span style={{ fontSize: 16 }}>→</span>
                  </div>

                  <div 
                    onClick={() => setActiveTab('wfh')} 
                    style={{ padding: '12px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ fontSize: 13, color: '#1e293b' }}>🏠 Review Pending WFH Requests</strong>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>Approve or reject remote work applications</div>
                    </div>
                    <span style={{ fontSize: 16 }}>→</span>
                  </div>

                  <div 
                    onClick={() => setActiveTab('reports')} 
                    style={{ padding: '12px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ fontSize: 13, color: '#1e293b' }}>📊 Export Executive Reports</strong>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>Download Excel / CSV workforce analytics</div>
                    </div>
                    <span style={{ fontSize: 16 }}>→</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔴 B. SCREEN 13: REPORTS & ANALYTICS (Full Page With Export & Charts)     */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div>
          {/* HEADER & CONTROLS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', color: '#0f172a', fontWeight: 800 }}>
                📈 Executive Workforce Reports & Analytics (Screen 13)
              </h1>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
                Departmental productivity, logged working hours, break efficiency, and exportable audit records
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select

              
                value={reportDateRange}
                onChange={(e) => setReportDateRange(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, background: '#fff', outline: 'none' }}
              >
                <option value="today">Today's Data</option>
                <option value="week">This Week (Last 7 Days)</option>
                <option value="month">This Month (Last 30 Days)</option>
                <option value="quarter">Quarterly (Q4 2026)</option>
              </select>

              <select
                value={reportDeptFilter}
                onChange={(e) => setReportDeptFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, background: '#fff', outline: 'none' }}
              >
                <option value="ALL">All Departments</option>
                <option value="Recruitment">Recruitment</option>
                <option value="IT">IT Operations</option>
                <option value="Business">Business / CRM</option>
                <option value="Financial">Financial Services</option>
              </select>

              <button
                onClick={exportReportToCSV}
                style={{
                  padding: '9px 16px',
                  background: '#164aa3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
                }}
              >
                📥 Export to CSV / Excel
              </button>

              <button
                onClick={handlePrintReport}
                style={{
                  padding: '9px 16px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                }}
              >
                🖨️ Print / Save PDF
              </button>
            </div>
          </div>

          {/* 4 SUMMARY METRIC TILES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '12px', borderLeft: '4px solid #2563eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: 0, fontSize: '26px', color: '#0f172a', fontWeight: 800 }}>{reportsData.summaryCards.totalWorkHours}h</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12.5px', fontWeight: 600 }}>Total Working Hours Logged</p>
            </div>

            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '12px', borderLeft: '4px solid #16a34a', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: 0, fontSize: '26px', color: '#16a34a', fontWeight: 800 }}>{reportsData.summaryCards.avgProductivity}</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12.5px', fontWeight: 600 }}>Avg Workforce Productivity</p>
            </div>

            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '12px', borderLeft: '4px solid #8b5cf6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: 0, fontSize: '26px', color: '#8b5cf6', fontWeight: 800 }}>{reportsData.summaryCards.totalDeliveredTasks}</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12.5px', fontWeight: 600 }}>Total Tasks Delivered</p>
            </div>

            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '12px', borderLeft: '4px solid #059669', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: 0, fontSize: '26px', color: '#059669', fontWeight: 800 }}>{reportsData.summaryCards.onTimeRate}</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12.5px', fontWeight: 600 }}>On-Time Completion Rate</p>
            </div>
          </div>

          {/* CHARTS ROW (Department Delivery Bar Chart & Productive vs Break Pie) */}
          <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '20px', marginBottom: '24px' }}>
            
            {/* DEPARTMENT TASKS DELIVERY BAR CHART */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>
                📊 Departmental Work Hours & Tasks Delivery
              </h3>
              <small style={{ color: '#64748b', fontSize: '12px' }}>Comparison of logged hours and deliverables completed</small>

              <div style={{ width: '100%', height: 260, marginTop: 14 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsData.departmentSummary}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="department" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                    <Bar dataKey="workHours" name="Working Hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completedTasks" name="Completed Deliverables" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PRODUCTIVE WORK VS BREAK RATIO (Pie Chart) */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>
                🥧 Work Time vs Break Ratio (%)
              </h3>
              <small style={{ color: '#64748b', fontSize: '12px' }}>Actual productivity time vs recorded official breaks</small>

              <div style={{ width: '100%', height: 260, marginTop: 14 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportsData.workVsBreak}
                      cx="50%"
                      cy="46%"
                      outerRadius={85}
                      innerRadius={45}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name.split(' ')[0]} ${value}%`}
                    >
                      {reportsData.workVsBreak.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={WORK_BREAK_COLORS[index % WORK_BREAK_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* DETAILED EXECUTIVE AUDIT TABLE */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>
                  📋 Departmental Performance & Audit Summary Table
                </h3>
                <small style={{ color: '#64748b', fontSize: '12px' }}>Full breakdown of staff, hours, attendance, and efficiency</small>
              </div>
              <button
                onClick={exportReportToCSV}
                style={{ padding: '6px 12px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Download Table (.csv)
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '12.5px' }}>
                  <th style={{ padding: '12px 14px' }}>Department</th>
                  <th style={{ padding: '12px 14px' }}>Staff Count</th>
                  <th style={{ padding: '12px 14px' }}>Total Working Hours</th>
                  <th style={{ padding: '12px 14px' }}>Break Time</th>
                  <th style={{ padding: '12px 14px' }}>Deliverables Done</th>
                  <th style={{ padding: '12px 14px' }}>Attendance Rate</th>
                  <th style={{ padding: '12px 14px' }}>Productivity Efficiency</th>
                  <th style={{ padding: '12px 14px' }}>Audit Status</th>
                </tr>
              </thead>
              <tbody>
                {reportsData.departmentSummary
                  .filter(d => reportDeptFilter === 'ALL' || d.department === reportDeptFilter)
                  .map((dept, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                      <td style={{ padding: '14px' }}>
                        <strong style={{ color: '#0f172a' }}>{dept.department}</strong>
                      </td>
                      <td style={{ padding: '14px' }}>{dept.headcount} Staff</td>
                      <td style={{ padding: '14px', fontWeight: 600, color: '#2563eb' }}>{dept.workHours} Hours</td>
                      <td style={{ padding: '14px', color: '#64748b' }}>{dept.breakHours} Hours</td>
                      <td style={{ padding: '14px', fontWeight: 600, color: '#16a34a' }}>{dept.completedTasks} / {dept.totalTasks}</td>
                      <td style={{ padding: '14px' }}>{dept.attendanceRate}%</td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, maxWidth: 80 }}>
                            <div style={{ width: dept.efficiency, height: '100%', background: '#16a34a', borderRadius: 3 }}></div>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 12 }}>{dept.efficiency}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          background: dept.status === 'Optimal' ? '#dcfce7' : '#fef3c7',
                          color: dept.status === 'Optimal' ? '#15803d' : '#b45309'
                        }}>
                          ● {dept.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔴 C. SCREEN 11: WORK FROM HOME (WFH) REQUESTS MANAGEMENT                 */}
      {/* ========================================================================= */}
      {activeTab === 'wfh' && (
        <div>
          {/* HEADER & ACTIONS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', color: '#0f172a', fontWeight: 800 }}>
                🏠 Work From Home (WFH) Requests (Screen 11)
              </h1>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
                Review employee remote working applications, verify reasons, and Approve or Reject
              </p>
            </div>

            <button
              onClick={() => setShowWfhModal(true)}
              style={{
                padding: '9px 16px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
              }}
            >
              ➕ Log WFH Request
            </button>
          </div>

          {/* FILTER TOOLBAR & MINI TILES */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', background: '#fff', padding: '12px 18px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['ALL', 'Pending', 'Approved', 'Rejected'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setWfhFilter(filter)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: wfhFilter === filter ? '#2563eb' : '#f1f5f9',
                    color: wfhFilter === filter ? '#fff' : '#475569',
                    transition: 'all 0.15s'
                  }}
                >
                  {filter} ({filter === 'ALL' ? wfhRequests.length : wfhRequests.filter(r => r.status === filter).length})
                </button>
              ))}
            </div>

            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              Showing <strong>{filteredWfh.length}</strong> WFH record(s)
            </span>
          </div>

          {/* WFH REQUESTS TABLE */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '12.5px', background: '#f8fafc' }}>
                  <th style={{ padding: '14px 16px' }}>Employee & Department</th>
                  <th style={{ padding: '14px 16px' }}>WFH Schedule (Dates)</th>
                  <th style={{ padding: '14px 16px' }}>Duration</th>
                  <th style={{ padding: '14px 16px' }}>Reason & Justification</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Admin Decision & Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWfh.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                      No WFH requests found matching the "{wfhFilter}" filter.
                    </td>
                  </tr>
                ) : (
                  filteredWfh.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ color: '#0f172a' }}>{req.employee_name || 'Staff Member'}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{req.employee_email}</div>
                        <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1e40af', padding: '1px 6px', borderRadius: 4, fontWeight: 600, display: 'inline-block', marginTop: 2 }}>
                          {req.department || 'General'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          📅 {formatDate(req.start_date)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          to {formatDate(req.end_date)}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 700, color: '#4338ca', background: '#e0e7ff', padding: '3px 8px', borderRadius: 6, fontSize: 12 }}>
                          {req.days_count || 1} Day(s)
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', maxWidth: 300 }}>
                        <div style={{ color: '#334155', lineHeight: 1.4 }}>{req.reason}</div>
                        {req.admin_remarks && (
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: 4, background: '#f8fafc', padding: '4px 8px', borderRadius: 4, borderLeft: '2px solid #cbd5e1' }}>
                            💬 Admin Note: {req.admin_remarks}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: req.status === 'Approved' ? '#dcfce7' : req.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                          color: req.status === 'Approved' ? '#15803d' : req.status === 'Rejected' ? '#b91c1c' : '#b45309'
                        }}>
                          ● {req.status}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {req.status === 'Pending' ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleWfhDecision(req.id, 'Approved')}
                              style={{ padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                              title="Approve WFH Request"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleWfhDecision(req.id, 'Rejected')}
                              style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                              title="Reject WFH Request"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Decision Recorded
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= VIEW: REAL-TIME LIVE MONITOR (Screen 9) ================= */}
      {activeTab === 'monitor' && (
        <div>
          {/* STATS CARDS */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
            <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #16a34a' }}>
              <h3 style={{ margin: 0, fontSize: '26px', color: '#0f172a', fontWeight: 700 }}>{stats.working}</h3>
              <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Active Working Now</p>
            </div>
            <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #f59e0b' }}>
              <h3 style={{ margin: 0, fontSize: '26px', color: '#0f172a', fontWeight: 700 }}>{stats.onBreak}</h3>
              <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '13px', fontWeight: 500 }}>On Official Break</p>
            </div>
            <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #ef4444' }}>
              <h3 style={{ margin: 0, fontSize: '26px', color: '#0f172a', fontWeight: 700 }}>{stats.loggedOut}</h3>
              <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Logged Out / Idle</p>
            </div>
            <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #2563eb' }}>
              <h3 style={{ margin: 0, fontSize: '26px', color: '#0f172a', fontWeight: 700 }}>{stats.totalEmployees}</h3>
              <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Total Registered Staff</p>
            </div>
          </div>

          {/* LIVE EMPLOYEES TABLE */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '17px', fontWeight: 700 }}>Live Workforce Status</h3>
                <small style={{ color: '#64748b', fontSize: '12.5px' }}>Auto-refreshes every 10 seconds via WebSocket/HTTP Polling</small>
              </div>
              <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '12.5px', background: '#dcfce7', padding: '4px 10px', borderRadius: '20px' }}>
                ● Real-time Live
              </span>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '12.5px' }}>
                  <th style={{ padding: '12px 14px' }}>Employee</th>
                  <th style={{ padding: '12px 14px' }}>Department</th>
                  <th style={{ padding: '12px 14px' }}>Current Activity Status</th>
                  <th style={{ padding: '12px 14px' }}>Login Timestamp</th>
                  <th style={{ padding: '12px 14px' }}>Today's Current Task</th>
                </tr>
              </thead>
              <tbody>
                {(employees || []).length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No employees registered</td></tr>
                ) : (
                  (employees || []).map(emp => (
                    <tr 
                      key={emp.id} 
                      onClick={() => setSelectedEmp(emp.id)}
                      title="Click to view live employee telemetry & activity"
                      style={{ 
                        borderBottom: '1px solid #f1f5f9', 
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                            {emp.name?.[0]?.toUpperCase() || 'E'}
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a' }}>{emp.name}</strong>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                          {emp.module || 'General'}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700,
                          background: emp.session_status === 'Working' ? '#dcfce7' : emp.session_status === 'Break' ? '#fef3c7' : '#fee2e2',
                          color: emp.session_status === 'Working' ? '#15803d' : emp.session_status === 'Break' ? '#b45309' : '#b91c1c'
                        }}>
                          ● {emp.session_status || 'Logged Out'}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: '#475569' }}>
                        {emp.login_time ? formatTime(emp.login_time) : '—'}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {emp.current_task ? (
                            <span style={{ color: '#2563eb', fontWeight: 600 }}>{emp.current_task}</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>No active task</span>
                          )}
                          <span style={{ fontSize: 11, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>View ↗</span>
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

      {/* ================= VIEW: USERS & ROLES (Screen 12) ================= */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px' }}>👥 Users & Roles Management (Screen 12)</h1>
              <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '13px' }}>Manage employee accounts, roles, and departmental permissions</p>
            </div>
            <button onClick={() => setShowUserModal(true)} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              + Add New User
            </button>
          </div>

          <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '12.5px' }}>
                  <th style={{ padding: '12px 10px' }}>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Module</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(usersList || []).length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      No users found. Click "+ Add New User" to register a staff account.
                    </td>
                  </tr>
                ) : (
                  (usersList || []).map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                      <td style={{ padding: '12px 10px' }}><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span style={{ background: u.role === 'Admin' ? '#fee2e2' : '#e0e7ff', color: u.role === 'Admin' ? '#b91c1c' : '#4338ca', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                          {u.role}
                        </span>
                      </td>
                      <td>{u.module || '—'}</td>
                      <td><span style={{ color: '#16a34a', fontWeight: 'bold' }}>● {u.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= VIEW: DEPARTMENTS OVERVIEW ================= */}
      {activeTab === 'departments' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 10px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                👥 Recruitment Department
              </h3>
              <p style={{ color: '#64748b', fontSize: '13.5px', margin: '0 0 16px' }}>Lead: Priya Singh · Talent acquisition & interviews</p>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ background: '#eff6ff', padding: '12px 18px', borderRadius: '8px', flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '20px', color: '#1e40af' }}>3</h4>
                  <small style={{ color: '#64748b' }}>Active Job Openings</small>
                </div>
                <div style={{ background: '#eff6ff', padding: '12px 18px', borderRadius: '8px', flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '20px', color: '#1e40af' }}>186</h4>
                  <small style={{ color: '#64748b' }}>Candidate Resumes</small>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 10px', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💻 IT Operations Department
              </h3>
              <p style={{ color: '#64748b', fontSize: '13.5px', margin: '0 0 16px' }}>Lead: Aman Sharma · Systems infrastructure & APIs</p>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ background: '#eef2ff', padding: '12px 18px', borderRadius: '8px', flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '20px', color: '#4f46e5' }}>99.9%</h4>
                  <small style={{ color: '#64748b' }}>Server Uptime</small>
                </div>
                <div style={{ background: '#eef2ff', padding: '12px 18px', borderRadius: '8px', flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '20px', color: '#4f46e5' }}>0</h4>
                  <small style={{ color: '#64748b' }}>Active Server Outages</small>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 10px', color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🤝 Business / CRM Department
              </h3>
              <p style={{ color: '#64748b', fontSize: '13.5px', margin: '0 0 16px' }}>Lead: Rahul Verma · Corporate clients & proposals</p>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ background: '#ecfdf5', padding: '12px 18px', borderRadius: '8px', flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '20px', color: '#047857' }}>48</h4>
                  <small style={{ color: '#64748b' }}>Corporate Clients</small>
                </div>
                <div style={{ background: '#ecfdf5', padding: '12px 18px', borderRadius: '8px', flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '20px', color: '#047857' }}>₹18.4L</h4>
                  <small style={{ color: '#64748b' }}>Pipeline Value</small>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 10px', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💳 Financial Services Department
              </h3>
              <p style={{ color: '#64748b', fontSize: '13.5px', margin: '0 0 16px' }}>Lead: Neha Gupta · Loan sanctioning & bank liaison</p>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ background: '#f5f3ff', padding: '12px 18px', borderRadius: '8px', flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '20px', color: '#6d28d9' }}>32</h4>
                  <small style={{ color: '#64748b' }}>Active Loan Files</small>
                </div>
                <div style={{ background: '#f5f3ff', padding: '12px 18px', borderRadius: '8px', flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '20px', color: '#6d28d9' }}>₹1.25 Cr</h4>
                  <small style={{ color: '#64748b' }}>Disbursed This Month</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW: STAFF TASKS & WORKLOADS ================= */}
      {activeTab === 'tasks' && (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '17px', fontWeight: 700 }}>Employee Task Allocation & Workloads</h3>
              <small style={{ color: '#64748b', fontSize: '12.5px' }}>Monitor tasks assigned, done today, and progress</small>
            </div>
            <button 
              onClick={() => navigate('/admin/assign-task')}
              style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
            >
              + Delegate Task
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '12.5px' }}>
                <th style={{ padding: '12px 14px' }}>Employee</th>
                <th style={{ padding: '12px 14px' }}>Department</th>
                <th style={{ padding: '12px 14px' }}>Current Assigned Task</th>
                <th style={{ padding: '12px 14px' }}>Tasks Completed Today</th>
                <th style={{ padding: '12px 14px' }}>Workload Status</th>
              </tr>
            </thead>
            <tbody>
              {(employees || []).length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No employee task workloads found.
                  </td>
                </tr>
              ) : (
                (employees || []).map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                  <td style={{ padding: '14px' }}>
                    <strong style={{ color: '#0f172a' }}>{emp.name}</strong>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>{emp.email}</div>
                  </td>
                  <td style={{ padding: '14px', color: '#475569' }}>{emp.module || 'General'}</td>
                  <td style={{ padding: '14px' }}>
                    {emp.current_task ? (
                      <strong style={{ color: '#2563eb' }}>{emp.current_task}</strong>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Idle / No task</span>
                    )}
                  </td>
                  <td style={{ padding: '14px', fontWeight: 600, color: '#16a34a' }}>
                    {emp.tasks_done || 0} Tasks Done
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span style={{
                      padding: '3px 9px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 600,
                      background: emp.current_task ? '#e0e7ff' : '#dcfce7',
                      color: emp.current_task ? '#4338ca' : '#15803d'
                    }}>
                      {emp.current_task ? '⚡ Working' : '☕ Available'}
                    </span>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MODAL: ADD NEW EMPLOYEE / USER ================= */}
      {showUserModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 style={{ marginTop: 0, color: '#0f172a' }}>Add New Employee</h2>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input required placeholder="Full Name (e.g. Sunaina)" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              <input required type="email" placeholder="Official Email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              <input required type="password" placeholder="Password (e.g. emp123)" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                </select>
                <select value={userForm.module} onChange={e => setUserForm({...userForm, module: e.target.value})} style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <option value="Recruitment">Recruitment</option>
                  <option value="Business">Business / CRM</option>
                  <option value="Financial">Financial</option>
                  <option value="IT">IT</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Save User</button>
                <button type="button" onClick={() => setShowUserModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SUBMIT WFH REQUEST ================= */}
      {showWfhModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 style={{ marginTop: 0, color: '#0f172a' }}>🏠 Log Work From Home Request</h2>
            <form onSubmit={handleCreateWfh} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Select Employee</label>
                <select 
                  required 
                  value={wfhForm.user_id} 
                  onChange={e => setWfhForm({ ...wfhForm, user_id: e.target.value })} 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13 }}
                >
                  <option value="">-- Choose Employee --</option>
                  {(employees.length > 0 ? employees : usersList).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.module || 'Employee'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Start Date</label>
                  <input 
                    required 
                    type="date" 
                    value={wfhForm.start_date} 
                    onChange={e => setWfhForm({ ...wfhForm, start_date: e.target.value })} 
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13 }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>End Date</label>
                  <input 
                    required 
                    type="date" 
                    value={wfhForm.end_date} 
                    onChange={e => setWfhForm({ ...wfhForm, end_date: e.target.value })} 
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13 }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Reason & Justification</label>
                <textarea 
                  required 
                  rows={3} 
                  placeholder="Explain reason (e.g. personal appointment, broadband setup, health recovery)..." 
                  value={wfhForm.reason} 
                  onChange={e => setWfhForm({ ...wfhForm, reason: e.target.value })} 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13, resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button 
                  type="submit" 
                  disabled={submittingWfh}
                  style={{ flex: 1, padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {submittingWfh ? 'Saving...' : 'Submit WFH Request'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowWfhModal(false)} 
                  style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EMPLOYEE LIVE TELEMETRY & PROFILE ================= */}
      {selectedEmp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>Staff Live Telemetry & Activity</h2>
              <button 
                onClick={() => { setSelectedEmp(null); setEmpDetails(null); }} 
                style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {loadingDetails ? (
              <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Skeleton Header */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div className="skeleton-box" style={{ width: 60, height: 60, borderRadius: '50%' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="skeleton-box" style={{ width: '40%', height: 24, marginBottom: 8 }}></div>
                    <div className="skeleton-box" style={{ width: '25%', height: 16 }}></div>
                  </div>
                </div>
                {/* Skeleton Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  <div className="skeleton-box" style={{ height: 80 }}></div>
                  <div className="skeleton-box" style={{ height: 80 }}></div>
                  <div className="skeleton-box" style={{ height: 80 }}></div>
                </div>
                {/* Skeleton Body */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="skeleton-box" style={{ height: 200 }}></div>
                  <div className="skeleton-box" style={{ height: 200 }}></div>
                </div>
              </div>
            ) : empDetails ? (
              <div>
                {/* Profile header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
                      {empDetails.profile?.name?.[0]?.toUpperCase() || 'E'}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>{empDetails.profile?.name}</h3>
                      <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 13 }}>{empDetails.profile?.email} • {empDetails.profile?.module || 'Employee'}</p>
                    </div>
                  </div>
                  <span style={{ 
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: empDetails.profile?.session_status === 'Working' ? '#dcfce7' : empDetails.profile?.session_status === 'Break' ? '#fef3c7' : '#fee2e2',
                    color: empDetails.profile?.session_status === 'Working' ? '#15803d' : empDetails.profile?.session_status === 'Break' ? '#b45309' : '#b91c1c'
                  }}>
                    ● {empDetails.profile?.session_status || 'Logged Out'}
                  </span>
                </div>

                {/* Quick Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>Login Time</span>
                    <strong style={{ fontSize: 16, color: '#0f172a' }}>{empDetails.profile?.login_time ? formatTime(empDetails.profile.login_time) : '—'}</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>Working Time</span>
                    <strong style={{ fontSize: 16, color: '#2563eb' }}>{Math.floor((empDetails.profile?.working_minutes || 0) / 60)}h {(empDetails.profile?.working_minutes || 0) % 60}m</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>Break Time</span>
                    <strong style={{ fontSize: 16, color: '#d97706' }}>{empDetails.profile?.break_minutes || 0}m</strong>
                  </div>
                </div>

                {/* Tasks & Activity Timeline */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <h4 style={{ margin: '0 0 10px', fontSize: 14, color: '#0f172a' }}>Recent Assigned Tasks</h4>
                    <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(!empDetails.tasks || empDetails.tasks.length === 0) ? (
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>No tasks assigned</p>
                      ) : (
                        empDetails.tasks.map(t => (
                          <div key={t.id} style={{ padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{t.title}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: '#64748b' }}>
                              <span>Priority: {t.priority}</span>
                              <span style={{ color: t.status === 'Completed' ? '#16a34a' : t.status === 'In Progress' ? '#2563eb' : '#d97706', fontWeight: 600 }}>{t.status}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 10px', fontSize: 14, color: '#0f172a' }}>Today's Activity Log</h4>
                    <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(!empDetails.timeline || empDetails.timeline.length === 0) ? (
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>No activity logged yet today</p>
                      ) : (
                        empDetails.timeline.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12 }}>
                            <span style={{ color: '#2563eb', fontWeight: 700, minWidth: 65 }}>{formatTime(item.time)}</span>
                            <span style={{ color: '#334155' }}>{item.text}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

        </div>
      </main>
    </div>
  );
}
