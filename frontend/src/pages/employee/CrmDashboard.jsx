import { useEffect, useState } from 'react';
import api from '../../services/api';
import EmployeeHeader from '../../components/EmployeeHeader';
import '../../styles/dashboard.css';

export default function CrmDashboard() {
  // TAB NAVIGATION: 'dashboard' | 'tasks' | 'worklog' | 'leads' | 'clients' | 'followups'
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
      console.error('Failed to load CRM dashboard:', err);
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
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading CRM Dashboard...</div>;
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
          <div className="dash-logo-icon" style={{ background: '#059669' }}>CRM</div>
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

          <p className="nav-section-title">BUSINESS / CRM</p>
          <a
            className={activeTab === 'leads' ? 'active' : ''}
            onClick={() => setActiveTab('leads')}
          >
            💼 Sales Leads
          </a>
          <a
            className={activeTab === 'clients' ? 'active' : ''}
            onClick={() => setActiveTab('clients')}
          >
            🏢 Clients Directory
          </a>
          <a
            className={activeTab === 'followups' ? 'active' : ''}
            onClick={() => setActiveTab('followups')}
          >
            🔔 Follow-ups
          </a>
        </nav>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="dash-main">
        <EmployeeHeader
          user={user}
          session={session}
          stats={stats}
          moduleBadgeColor="green"
          onBreakChange={() => fetchDashboard()}
        />

        <div className="dash-content">
          
          {/* ================= VIEW 1: DASHBOARD OVERVIEW ================= */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="greeting-header">
                <h1>Good morning, {user?.name?.split(' ')[0] || 'Rahul'}!</h1>
                <p>Monday, 19 October 2026 · Business & Corporate CRM Team</p>
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

              {/* ROW 2: CRM SPECIFIC METRICS */}
              <div className="cards-row-tasks">
                <div className="kpi-card purple" onClick={() => setActiveTab('clients')} style={{ cursor: 'pointer' }}>
                  <h2>48</h2>
                  <p>Active Clients →</p>
                </div>
                <div className="kpi-card green" onClick={() => setActiveTab('leads')} style={{ cursor: 'pointer' }}>
                  <h2>₹18.4L</h2>
                  <p>Pipeline Value →</p>
                </div>
                <div className="kpi-card amber" onClick={() => setActiveTab('followups')} style={{ cursor: 'pointer' }}>
                  <h2>7</h2>
                  <p>Calls Scheduled Today →</p>
                </div>
                <div className="kpi-card blue" onClick={() => setActiveTab('leads')} style={{ cursor: 'pointer' }}>
                  <h2>14</h2>
                  <p>New Leads This Week →</p>
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
                  <h1 style={{ margin: 0 }}>📋 CRM Tasks Management</h1>
                  <p style={{ margin: 0, color: '#64748b' }}>Manage client follow-ups, proposals, and tasks assigned by Admin</p>
                </div>
                <div style={{ display: 'flex', gap: 8, background: '#e2e8f0', padding: 4, borderRadius: 8 }}>
                  {['ALL', 'In Progress', 'Assigned', 'Completed'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setTaskFilter(tab)}
                      style={{
                        padding: '6px 14px', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                        background: taskFilter === tab ? '#059669' : 'transparent',
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
                        <th>Task Name & Details</th>
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

          {/* ================= VIEW 3: SALES LEADS DEDICATED PAGE ================= */}
          {activeTab === 'leads' && (
            <div>
              <div className="greeting-header">
                <h1 style={{ margin: 0 }}>💼 Sales Leads Pipeline</h1>
                <p style={{ margin: 0, color: '#64748b' }}>Prospects, incoming corporate inquiries, and conversion stages</p>
              </div>

              <div className="cards-row-tasks">
                <div className="kpi-card blue"><h2>14</h2><p>New Inquiries</p></div>
                <div className="kpi-card amber"><h2>8</h2><p>Contacted & Demo</p></div>
                <div className="kpi-card purple"><h2>5</h2><p>Proposal Sent</p></div>
                <div className="kpi-card green"><h2>₹4.2L</h2><p>Closed This Month</p></div>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Leads Pipeline</span></div>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Prospect Company</th>
                      <th>Contact Person</th>
                      <th>Deal Value</th>
                      <th>Stage</th>
                      <th>Next Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>TechCorp Solutions Ltd.</strong></td>
                      <td>Sunil Deshmukh (sunil@techcorp.com)</td>
                      <td><strong>₹3,50,000</strong></td>
                      <td><span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 9px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Proposal Sent</span></td>
                      <td>Follow up call on Thursday</td>
                    </tr>
                    <tr>
                      <td><strong>Apex Financial Advisory</strong></td>
                      <td>Kavita Rao (kavita@apexfin.in)</td>
                      <td><strong>₹2,20,000</strong></td>
                      <td><span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 9px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Demo Scheduled</span></td>
                      <td>Product presentation tomorrow 11 AM</td>
                    </tr>
                    <tr>
                      <td><strong>Zenith Logistics Pvt. Ltd.</strong></td>
                      <td>Amitabh Roy (amitabh@zenith.com)</td>
                      <td><strong>₹5,80,000</strong></td>
                      <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Negotiation / Close</span></td>
                      <td>Send final SLA contract</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 4: CLIENTS DIRECTORY DEDICATED PAGE ================= */}
          {activeTab === 'clients' && (
            <div>
              <div className="greeting-header">
                <h1 style={{ margin: 0 }}>🏢 Corporate Clients Directory</h1>
                <p style={{ margin: 0, color: '#64748b' }}>Active business partners and enrolled corporate accounts</p>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Active Clients (48)</span></div>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Client Name</th>
                      <th>Industry</th>
                      <th>Primary Contact</th>
                      <th>Account Status</th>
                      <th>Relationship Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Global IT Services Pvt. Ltd.</strong></td>
                      <td>Information Technology</td>
                      <td>Manish Agarwal (HR Director)</td>
                      <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>● Active Retainer</span></td>
                      <td>1.5 Years</td>
                    </tr>
                    <tr>
                      <td><strong>FinServe Capital Advisors</strong></td>
                      <td>Banking & Finance</td>
                      <td>Deepak Patil (COO)</td>
                      <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>● Active Retainer</span></td>
                      <td>2 Years</td>
                    </tr>
                    <tr>
                      <td><strong>Nexus Retail Brands</strong></td>
                      <td>FMCG / E-Commerce</td>
                      <td>Pooja Hegde (Procurement)</td>
                      <td><span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 9px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>● Renewal Due</span></td>
                      <td>8 Months</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 5: FOLLOW-UPS DEDICATED PAGE ================= */}
          {activeTab === 'followups' && (
            <div>
              <div className="greeting-header">
                <h1 style={{ margin: 0 }}>🔔 Scheduled Follow-ups & Reminders</h1>
                <p style={{ margin: 0, color: '#64748b' }}>Daily client calls, demo presentations, and quotation follow-ups</p>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Today's Follow-up Agenda</span></div>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Client / Company</th>
                      <th>Discussion Topic</th>
                      <th>Contact Number</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>11:30 AM</strong></td>
                      <td>Sunil Deshmukh (TechCorp)</td>
                      <td>Proposal feedback & SLA review</td>
                      <td>+91 98230 11442</td>
                      <td><span style={{ color: '#d97706', fontWeight: 600 }}>Scheduled</span></td>
                    </tr>
                    <tr>
                      <td><strong>03:00 PM</strong></td>
                      <td>Kavita Rao (Apex Financial)</td>
                      <td>ERP Demo for 5 department leads</td>
                      <td>+91 94220 88219</td>
                      <td><span style={{ color: '#d97706', fontWeight: 600 }}>Scheduled</span></td>
                    </tr>
                    <tr>
                      <td><strong>05:15 PM</strong></td>
                      <td>Nexus Retail Brands</td>
                      <td>Quarterly retainer renewal invoice check</td>
                      <td>+91 91580 33410</td>
                      <td><span style={{ color: '#64748b' }}>Upcoming</span></td>
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
