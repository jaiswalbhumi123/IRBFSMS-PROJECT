import { useEffect, useState } from 'react';
import api from '../../services/api';
import EmployeeHeader from '../../components/EmployeeHeader';
import '../../styles/dashboard.css';

export default function ItDashboard() {
  // TAB NAVIGATION: 'dashboard' | 'tasks' | 'worklog' | 'health' | 'bugs' | 'deployments'
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
      console.error('Failed to load IT dashboard:', err);
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
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading IT Operations Dashboard...</div>;
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
          <div className="dash-logo-icon" style={{ background: '#4f46e5' }}>IT</div>
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

          <p className="nav-section-title">IT OPERATIONS</p>
          <a
            className={activeTab === 'health' ? 'active' : ''}
            onClick={() => setActiveTab('health')}
          >
            💻 System Health
          </a>
          <a
            className={activeTab === 'bugs' ? 'active' : ''}
            onClick={() => setActiveTab('bugs')}
          >
            🐞 Bug Tracker
          </a>
          <a
            className={activeTab === 'deployments' ? 'active' : ''}
            onClick={() => setActiveTab('deployments')}
          >
            🚀 Deployments
          </a>
        </nav>
      </aside>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="dash-main">
        <EmployeeHeader
          user={user}
          session={session}
          stats={stats}
          moduleBadgeColor="orange"
          onBreakChange={() => fetchDashboard()}
        />

        <div className="dash-content">
          
          {/* ================= VIEW 1: DASHBOARD OVERVIEW ================= */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="greeting-header">
                <h1>Good morning, {user?.name?.split(' ')[0] || 'Aman'}!</h1>
                <p>Monday, 19 October 2026 · IT & Systems Engineering Team</p>
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

              {/* ROW 2: IT OPERATIONS METRICS */}
              <div className="cards-row-tasks">
                <div className="kpi-card purple" onClick={() => setActiveTab('bugs')} style={{ cursor: 'pointer' }}>
                  <h2>12</h2>
                  <p>Total IT Tickets →</p>
                </div>
                <div className="kpi-card amber" onClick={() => setActiveTab('bugs')} style={{ cursor: 'pointer' }}>
                  <h2>2</h2>
                  <p>Active Issues / Bugs →</p>
                </div>
                <div className="kpi-card green" onClick={() => setActiveTab('deployments')} style={{ cursor: 'pointer' }}>
                  <h2>4</h2>
                  <p>Deployments Done →</p>
                </div>
                <div className="kpi-card blue" onClick={() => setActiveTab('health')} style={{ cursor: 'pointer' }}>
                  <h2>99.9%</h2>
                  <p>System Uptime →</p>
                </div>
              </div>

              {/* 2-COLUMN SECTION: TASKS PREVIEW & SYSTEM HEALTH PREVIEW */}
              <div className="dashboard-grid-2col">
                <div className="panel-card">
                  <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Pending IT Tasks</span>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                    >
                      View All →
                    </button>
                  </div>

                  {tasks.length === 0 ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>No tasks assigned for today.</p>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="panel-card">
                    <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🖥️ Quick System Health</span>
                      <button onClick={() => setActiveTab('health')} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Details →</button>
                    </div>
                    <div className="health-widget">
                      <div className="health-item">
                        <span>Node.js Server</span>
                        <span className="health-badge">● Port 5000 (Active)</span>
                      </div>
                      <div className="health-item">
                        <span>MySQL DB</span>
                        <span className="health-badge">● benefit_bbs (Connected)</span>
                      </div>
                      <div className="health-item">
                        <span>Vite Frontend</span>
                        <span className="health-badge">● Port 5173 (Ready)</span>
                      </div>
                    </div>
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
            </div>
          )}

          {/* ================= VIEW 2: MY TASKS DEDICATED PAGE ================= */}
          {activeTab === 'tasks' && (
            <div>
              <div className="greeting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0 }}>📋 IT Tasks Management</h1>
                  <p style={{ margin: 0, color: '#64748b' }}>Manage and resolve technical infrastructure tasks assigned by Admin</p>
                </div>
                <div style={{ display: 'flex', gap: 8, background: '#e2e8f0', padding: 4, borderRadius: 8 }}>
                  {['ALL', 'In Progress', 'Assigned', 'Completed'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setTaskFilter(tab)}
                      style={{
                        padding: '6px 14px', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                        background: taskFilter === tab ? '#4f46e5' : 'transparent',
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

          {/* ================= VIEW 3: SYSTEM HEALTH DEDICATED PAGE ================= */}
          {activeTab === 'health' && (
            <div>
              <div className="greeting-header">
                <h1 style={{ margin: 0 }}>💻 System Health & Infrastructure</h1>
                <p style={{ margin: 0, color: '#64748b' }}>Real-time server status, database connections, and microservices telemetry</p>
              </div>

              <div className="cards-row-tasks">
                <div className="kpi-card green"><h2>99.9%</h2><p>Overall Uptime</p></div>
                <div className="kpi-card blue"><h2>18 ms</h2><p>Average API Latency</p></div>
                <div className="kpi-card indigo"><h2>0</h2><p>Failed DB Queries</p></div>
                <div className="kpi-card purple"><h2>100%</h2><p>SSL & Auth Guard</p></div>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Infrastructure Nodes</span></div>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Service Node</th>
                      <th>Port / Binding</th>
                      <th>Protocol</th>
                      <th>Health Status</th>
                      <th>Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Backend API Core (Node.js Express)</strong></td>
                      <td><code>localhost:5000</code></td>
                      <td>HTTP/REST</td>
                      <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>● Operational</span></td>
                      <td>12 ms</td>
                    </tr>
                    <tr>
                      <td><strong>Database Engine (MySQL Server)</strong></td>
                      <td><code>localhost:3306 (benefit_bbs)</code></td>
                      <td>TCP / SQL</td>
                      <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>● Connected (10 Pool)</span></td>
                      <td>4 ms</td>
                    </tr>
                    <tr>
                      <td><strong>Frontend Client (React + Vite)</strong></td>
                      <td><code>localhost:5173</code></td>
                      <td>HMR / WebSocket</td>
                      <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>● Active</span></td>
                      <td>8 ms</td>
                    </tr>
                    <tr>
                      <td><strong>JWT Token Session Guard</strong></td>
                      <td><code>Bearer Header</code></td>
                      <td>Crypto / SHA256</td>
                      <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>● Valid (24h Window)</span></td>
                      <td>1 ms</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 4: BUG TRACKER DEDICATED PAGE ================= */}
          {activeTab === 'bugs' && (
            <div>
              <div className="greeting-header">
                <h1 style={{ margin: 0 }}>🐞 Bug Tracker & Technical Tickets</h1>
                <p style={{ margin: 0, color: '#64748b' }}>Internal technical bug reports, exceptions, and system tickets</p>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Active Bug Tickets</span></div>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Title</th>
                      <th>Module Affected</th>
                      <th>Severity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>#IT-104</code></td>
                      <td><strong>Audit duplicate session cleanup on user relogin</strong></td>
                      <td>Authentication</td>
                      <td><span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>HIGH</span></td>
                      <td><span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Resolved</span></td>
                    </tr>
                    <tr>
                      <td><code>#IT-105</code></td>
                      <td><strong>Optimize Vite HMR transform cache for Windows path spaces</strong></td>
                      <td>Frontend Build</td>
                      <td><span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>MEDIUM</span></td>
                      <td><span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Resolved</span></td>
                    </tr>
                    <tr>
                      <td><code>#IT-106</code></td>
                      <td><strong>Add PDF / Excel export utility for daily employee reports</strong></td>
                      <td>Reporting</td>
                      <td><span style={{ background: '#e0e7ff', color: '#4338ca', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>FEATURE</span></td>
                      <td><span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: 12, fontSize: 11 }}>In Backlog</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 5: DEPLOYMENTS DEDICATED PAGE ================= */}
          {activeTab === 'deployments' && (
            <div>
              <div className="greeting-header">
                <h1 style={{ margin: 0 }}>🚀 Deployment History & Version Logs</h1>
                <p style={{ margin: 0, color: '#64748b' }}>Continuous integration logs and local release builds</p>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Build Releases</span></div>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Release Tag</th>
                      <th>Commit Details</th>
                      <th>Target Environment</th>
                      <th>Build Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>v1.0.2-prod</code></td>
                      <td>Jobs module table integration & tab navigation router</td>
                      <td>Benefit BBS Local Host</td>
                      <td>Today, 5:45 PM</td>
                      <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Deployed</span></td>
                    </tr>
                    <tr>
                      <td><code>v1.0.1-prod</code></td>
                      <td>Smart direct routing by employee module (IT, HR, CRM, Finance)</td>
                      <td>Benefit BBS Local Host</td>
                      <td>Yesterday</td>
                      <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Deployed</span></td>
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
