import { useEffect, useState } from 'react';
import api from '../../services/api';
import EmployeeHeader from '../../components/EmployeeHeader';
import '../../styles/dashboard.css';

export default function FinancialDashboard() {
  // TAB NAVIGATION: 'dashboard' | 'tasks' | 'worklog' | 'applications' | 'enquiries' | 'documents'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // TASKS FILTER STATE
  const [taskFilter, setTaskFilter] = useState('ALL');

  // WORK LOG STATE
  const [workLogs, setWorkLogs] = useState([]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/employee/dashboard-data');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load Financial dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkLog = async () => {
    try {
      const res = await api.get('/employee/work-log');
      setWorkLogs(res.data.sessions || []);
    } catch (err) {
      console.error('Failed to load work logs:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchWorkLog();
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleTaskAction = async (taskId, newStatus) => {
    try {
      await api.put(`/employee/tasks/${taskId}/status`, { status: newStatus });
      fetchDashboard();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading Financial Services Dashboard...</div>;
  }

  const { user, session, stats, tasks = [], timeline = [] } = data || {};

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'ALL') return true;
    return t.status === taskFilter;
  });

  return (
    <div className="dashboard-layout">
      {/* ================= SIDEBAR ================= */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <div className="dash-logo-icon" style={{ background: '#7c3aed' }}>FIN</div>
          <span>Benefit Business<br />Solutions</span>
        </div>

        <nav className="dash-nav">
          <p className="nav-section-title">MY WORK</p>
          <a
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </a>
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

          <p className="nav-section-title">FINANCIAL SERVICES</p>
          <a
            className={activeTab === 'applications' ? 'active' : ''}
            onClick={() => setActiveTab('applications')}
          >
            💳 Loan Applications
          </a>
          <a
            className={activeTab === 'enquiries' ? 'active' : ''}
            onClick={() => setActiveTab('enquiries')}
          >
            📄 Customer Enquiries
          </a>
          <a
            className={activeTab === 'documents' ? 'active' : ''}
            onClick={() => setActiveTab('documents')}
          >
            📁 KYC Documents
          </a>
        </nav>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="dash-main">
        <EmployeeHeader
          user={user}
          session={session}
          stats={stats}
          moduleBadgeColor="purple"
          onBreakChange={() => fetchDashboard()}
        />

        <div className="dash-content">
          
          {/* ================= VIEW 1: DASHBOARD OVERVIEW ================= */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="greeting-header">
                <h1>Good morning, {user?.name?.split(' ')[0] || 'Neha'}!</h1>
                <p>Monday, 19 October 2026 · Financial Advisory & Loan Processing Team</p>
              </div>

              {/* ROW 1: TASK SUMMARY CARDS */}
              <div className="cards-row-tasks">
                <div className="kpi-card blue" onClick={() => setActiveTab('tasks')} style={{ cursor: 'pointer' }}>
                  <h2>{stats?.assignedToday || 0}</h2>
                  <p>Tasks assigned today →</p>
                </div>
                <div className="kpi-card indigo" onClick={() => setActiveTab('tasks')} style={{ cursor: 'pointer' }}>
                  <h2>{stats?.inProgress || 0}</h2>
                  <p>In progress →</p>
                </div>
                <div className="kpi-card green">
                  <h2>{stats?.completed || 0}</h2>
                  <p>Completed</p>
                </div>
                <div className="kpi-card red">
                  <h2>{stats?.overdue || 0}</h2>
                  <p>Overdue</p>
                </div>
              </div>

              {/* ROW 2: FINANCIAL SPECIFIC METRICS */}
              <div className="cards-row-tasks">
                <div className="kpi-card purple" onClick={() => setActiveTab('applications')} style={{ cursor: 'pointer' }}>
                  <h2>32</h2>
                  <p>Active Loan Files →</p>
                </div>
                <div className="kpi-card green" onClick={() => setActiveTab('applications')} style={{ cursor: 'pointer' }}>
                  <h2>₹1.25 Cr</h2>
                  <p>Disbursed This Month →</p>
                </div>
                <div className="kpi-card amber" onClick={() => setActiveTab('documents')} style={{ cursor: 'pointer' }}>
                  <h2>6</h2>
                  <p>Pending KYC Approvals →</p>
                </div>
                <div className="kpi-card blue" onClick={() => setActiveTab('enquiries')} style={{ cursor: 'pointer' }}>
                  <h2>19</h2>
                  <p>New Inquiries Today →</p>
                </div>
              </div>

              {/* 2-COLUMN SECTION: TASKS & TIMELINE */}
              <div className="dashboard-grid-2col">
                <div className="panel-card">
                  <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Pending Tasks Today</span>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                    >
                      View All →
                    </button>
                  </div>

                  {tasks.length === 0 ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: 25 }}>No pending tasks.</p>
                  ) : (
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Task Title</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.slice(0, 4).map(t => (
                          <tr key={t.id}>
                            <td><strong>{t.title}</strong></td>
                            <td><span className={`priority-badge ${(t.priority || 'medium').toLowerCase()}`}>{t.priority}</span></td>
                            <td><span className={`task-status-badge ${t.status.toLowerCase().replace(' ', '-')}`}>{t.status}</span></td>
                            <td>
                              {t.status === 'Assigned' && (
                                <button onClick={() => handleTaskAction(t.id, 'In Progress')} className="btn-action-task start">Start</button>
                              )}
                              {t.status === 'In Progress' && (
                                <button onClick={() => handleTaskAction(t.id, 'Completed')} className="btn-action-task complete">Complete</button>
                              )}
                              {t.status === 'Completed' && <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Done</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="panel-card">
                  <div className="panel-title">
                    <span>Today's Activity</span>
                    <span style={{ fontSize: 11, color: '#2563eb' }}>● Live</span>
                  </div>
                  <div className="activity-timeline">
                    {timeline.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: 13 }}>No activities recorded yet.</p>
                    ) : (
                      timeline.map((act, idx) => (
                        <div key={idx} className="timeline-entry">
                          <div className="timeline-dot" />
                          <span className="timeline-time">{new Date(act.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="timeline-desc">{act.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: MY TASKS DEDICATED PAGE ================= */}
          {activeTab === 'tasks' && (
            <div>
              <div className="greeting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0 }}>📋 Financial Tasks Management</h1>
                  <p style={{ margin: 0, color: '#64748b' }}>Manage loan verification files, KYC checks, and tasks assigned by Admin</p>
                </div>
                <div style={{ display: 'flex', gap: 8, background: '#e2e8f0', padding: 4, borderRadius: 8 }}>
                  {['ALL', 'In Progress', 'Assigned', 'Completed'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setTaskFilter(tab)}
                      style={{
                        padding: '6px 14px', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                        background: taskFilter === tab ? '#7c3aed' : 'transparent',
                        color: taskFilter === tab ? '#ffffff' : '#475569'
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Tasks List ({filteredTasks.length})</span></div>
                {filteredTasks.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 35 }}>No tasks found in "{taskFilter}"</p>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Task Name & Specifications</th>
                        <th>Assigned By</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map(t => (
                        <tr key={t.id}>
                          <td>
                            <strong style={{ fontSize: 14, color: '#0f172a' }}>{t.title}</strong>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{t.description || 'No description provided'}</div>
                          </td>
                          <td>{t.assigned_by_name || 'Admin'}</td>
                          <td><span className={`priority-badge ${(t.priority || 'medium').toLowerCase()}`}>{t.priority}</span></td>
                          <td><span className={`task-status-badge ${t.status.toLowerCase().replace(' ', '-')}`}>{t.status}</span></td>
                          <td>
                            {t.status === 'Assigned' && (
                              <button onClick={() => handleTaskAction(t.id, 'In Progress')} className="btn-action-task start">Start</button>
                            )}
                            {t.status === 'In Progress' && (
                              <button onClick={() => handleTaskAction(t.id, 'Completed')} className="btn-action-task complete">Complete</button>
                            )}
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

          {/* ================= VIEW 3: LOAN APPLICATIONS DEDICATED PAGE ================= */}
          {activeTab === 'applications' && (
            <div>
              <div className="greeting-header">
                <h1 style={{ margin: 0 }}>💳 Loan & Credit Applications</h1>
                <p style={{ margin: 0, color: '#64748b' }}>Customer loan files, bank approvals, and credit disbursements</p>
              </div>

              <div className="cards-row-tasks">
                <div className="kpi-card blue"><h2>32</h2><p>Total Files</p></div>
                <div className="kpi-card amber"><h2>11</h2><p>Bank Verification</p></div>
                <div className="kpi-card green"><h2>16</h2><p>Approved & Disbursed</p></div>
                <div className="kpi-card red"><h2>5</h2><p>Rejected / Resubmit</p></div>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Active Applications</span></div>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Applicant Name</th>
                      <th>Loan Category</th>
                      <th>Requested Amount</th>
                      <th>Partner Bank</th>
                      <th>CIBIL Score</th>
                      <th>File Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Rajesh Kulkarni</strong><div style={{ fontSize: 12, color: '#64748b' }}>rajesh.k@gmail.com</div></td>
                      <td>Home Loan</td>
                      <td><strong>₹45,00,000</strong></td>
                      <td>HDFC Bank</td>
                      <td><span style={{ color: '#16a34a', fontWeight: 700 }}>780 (Excellent)</span></td>
                      <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Sanctioned</span></td>
                    </tr>
                    <tr>
                      <td><strong>Pooja Deshpande</strong><div style={{ fontSize: 12, color: '#64748b' }}>pooja.d@yahoo.com</div></td>
                      <td>Personal Loan</td>
                      <td><strong>₹6,00,000</strong></td>
                      <td>ICICI Bank</td>
                      <td><span style={{ color: '#2563eb', fontWeight: 700 }}>740 (Good)</span></td>
                      <td><span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Document Review</span></td>
                    </tr>
                    <tr>
                      <td><strong>Omkar Trading Co.</strong><div style={{ fontSize: 12, color: '#64748b' }}>omkar@traders.in</div></td>
                      <td>Business MSME Loan</td>
                      <td><strong>₹25,00,000</strong></td>
                      <td>State Bank of India</td>
                      <td><span style={{ color: '#16a34a', fontWeight: 700 }}>765 (Excellent)</span></td>
                      <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Disbursed</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 4: CUSTOMER ENQUIRIES DEDICATED PAGE ================= */}
          {activeTab === 'enquiries' && (
            <div>
              <div className="greeting-header">
                <h1 style={{ margin: 0 }}>📄 Customer Financial Enquiries</h1>
                <p style={{ margin: 0, color: '#64748b' }}>Incoming customer loan eligibility requests and credit card inquiries</p>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Recent Inquiries</span></div>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Product Inquired</th>
                      <th>Monthly Income</th>
                      <th>Location</th>
                      <th>Follow-up Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Suresh Nair</strong></td>
                      <td>Pre-Approved Credit Card</td>
                      <td>₹85,000 / month</td>
                      <td>Pune</td>
                      <td><span style={{ color: '#16a34a', fontWeight: 600 }}>Card Dispatched</span></td>
                    </tr>
                    <tr>
                      <td><strong>Sunita Jadhav</strong></td>
                      <td>Car Loan Eligibility</td>
                      <td>₹55,000 / month</td>
                      <td>Mumbai</td>
                      <td><span style={{ color: '#d97706', fontWeight: 600 }}>Call Back Today 4 PM</span></td>
                    </tr>
                    <tr>
                      <td><strong>Harish Patel</strong></td>
                      <td>Education Loan (Abroad)</td>
                      <td>₹1,20,000 / month (Co-borrower)</td>
                      <td>Nashik</td>
                      <td><span style={{ color: '#2563eb', fontWeight: 600 }}>Documents Collected</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 5: KYC DOCUMENTS DEDICATED PAGE ================= */}
          {activeTab === 'documents' && (
            <div>
              <div className="greeting-header">
                <h1 style={{ margin: 0 }}>📁 KYC Verification & Document Vault</h1>
                <p style={{ margin: 0, color: '#64748b' }}>Identity verification, PAN/Aadhaar verification, and 6-month bank statements</p>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Document Queue</span></div>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Document Type</th>
                      <th>Upload Date</th>
                      <th>Verification Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Rajesh Kulkarni</strong></td>
                      <td>PAN, Aadhaar, ITR V (3 Years)</td>
                      <td>Yesterday</td>
                      <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>✓ Verified</span></td>
                      <td><button style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1', cursor: 'pointer' }}>View Files</button></td>
                    </tr>
                    <tr>
                      <td><strong>Pooja Deshpande</strong></td>
                      <td>Salary Slips (Last 3 Months) + Bank Statement</td>
                      <td>Today, 10:15 AM</td>
                      <td><span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>⏳ Under Review</span></td>
                      <td><button style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1', cursor: 'pointer' }}>Verify Now</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 6: WORK LOG DEDICATED PAGE ================= */}
          {activeTab === 'worklog' && (
            <div>
              <div className="greeting-header">
                <h1 style={{ margin: 0 }}>⏱️ My Work Log History</h1>
                <p style={{ margin: 0, color: '#64748b' }}>Your recorded work hours, break times, and completed tasks</p>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Session Records</span></div>
                {workLogs.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 25 }}>No past sessions found.</p>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Login Time</th>
                        <th>Logout Time</th>
                        <th>Break Minutes</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workLogs.map(log => (
                        <tr key={log.id}>
                          <td><strong>{new Date(log.login_time).toLocaleDateString('en-IN')}</strong></td>
                          <td>{new Date(log.login_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td>{log.logout_time ? new Date(log.logout_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}</td>
                          <td>{log.break_minutes || 0} mins</td>
                          <td>
                            <span style={{
                              background: log.status === 'Working' ? '#dcfce7' : '#f1f5f9',
                              color: log.status === 'Working' ? '#15803d' : '#64748b',
                              padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600
                            }}>
                              {log.status}
                            </span>
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
    </div>
  );
}
