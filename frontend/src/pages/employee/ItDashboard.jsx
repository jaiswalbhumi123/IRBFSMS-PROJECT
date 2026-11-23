import { useEffect, useState } from 'react';
import api from '../../services/api';
import EmployeeHeader from '../../components/EmployeeHeader';
import '../../styles/dashboard.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'react-toastify';

export default function ItDashboard() {
  // TAB NAVIGATION: 'dashboard' | 'tasks' | 'worklog' | 'health' | 'bugs' | 'deployments'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // TASKS FILTER STATE & MODAL
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [viewTask, setViewTask] = useState(null);
  const [completeTaskModal, setCompleteTaskModal] = useState(null);
  const [taskRemarks, setTaskRemarks] = useState('');
  const [taskPage, setTaskPage] = useState(1);
  const tasksPerPage = 6;

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

  const handleTaskAction = async (taskId, newStatus, remarks = null) => {
    try {
      await api.put(`/employee/tasks/${taskId}/status`, { status: newStatus, remarks });
      fetchDashboard();
      toast.success(`Task marked as ${newStatus}`);
    } catch (err) {
      console.error('Failed to update task:', err);
      toast.error('Failed to update task status');
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

  const totalTaskPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const indexOfLastTask = taskPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

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
          moduleBadgeColor="indigo"
          variant="case-study"
          departmentSubtitle="IT Engineering & Infrastructure team"
          showGreeting={activeTab === 'dashboard'}
          onBreakChange={() => fetchDashboard()}
        />

        <div className="dash-content" style={{ paddingTop: activeTab === 'dashboard' ? '18px' : '30px' }}>
          
          {/* ================= VIEW 1: DASHBOARD OVERVIEW ================= */}
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

              {/* ROW 2: 5 IT OPERATIONS DOMAIN KPI CARDS */}
              <div className="cards-row-kpi-5">
                <div className="cs-kpi-card" onClick={() => setActiveTab('tasks')} style={{ borderLeftColor: '#2563eb', cursor: 'pointer' }}>
                  <h2>{tasks.length}</h2>
                  <p>Total IT Tickets</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('health')} style={{ borderLeftColor: '#10b981', cursor: 'pointer' }}>
                  <h2>99.9%</h2>
                  <p>System Uptime</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('bugs')} style={{ borderLeftColor: '#ef4444', cursor: 'pointer' }}>
                  <h2>0</h2>
                  <p>Critical Bugs</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('tasks')} style={{ borderLeftColor: '#6366f1', cursor: 'pointer' }}>
                  <h2>{stats?.completed ?? 0}</h2>
                  <p>Resolved Today</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('deployments')} style={{ borderLeftColor: '#8b5cf6', cursor: 'pointer' }}>
                  <h2>3</h2>
                  <p>Active Deployments</p>
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
                      {tasks && tasks.length > 0 ? (
                        tasks.slice(0, 5).map(t => (
                          <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td
                              style={{ padding: '12px 10px', fontSize: '13px', fontWeight: 700, color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => setViewTask(t)}
                              title="Click to view task details"
                            >
                              {t.title}
                            </td>
                            <td style={{ padding: '12px 10px', fontSize: '12.5px', color: '#475569' }}>{t.assigned_by_name || 'Admin'}</td>
                            <td style={{ padding: '12px 10px', fontSize: '12px', color: '#475569' }}>{t.due_time || (t.due_at ? new Date(t.due_at).toLocaleDateString('en-IN') : '05:00 PM')}</td>
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
                                  else if (t.status === 'In Progress') setCompleteTaskModal(t);
                                }}
                                title={t.status === 'In Progress' ? 'Click to complete' : t.status === 'Assigned' ? 'Click to start' : 'Completed'}
                              >
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13.5px' }}>
                            ☕ No IT tasks assigned yet for today. When admin assigns a task, it will appear here in real-time.
                          </td>
                        </tr>
                      )}
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
                    {(timeline && timeline.length > 0 ? timeline : [
                      { time: '09:00 AM', text: 'Logged in to IT workspace', type: 'login', status: 'Active', note: 'Session initiated' },
                      { time: '09:20 AM', text: 'Started: System Health Check & Optimization', type: 'task', status: 'In Progress', note: 'Database queries and CPU memory indexed' },
                      { time: '11:00 AM', text: 'Completed: Configure MySQL pool', type: 'task', status: 'Completed', note: 'Connection pool tuned for concurrency' },
                      { time: '01:15 PM', text: 'Break started (30 min)', type: 'break', status: 'On break', note: 'Afternoon break' },
                      { time: '02:30 PM', text: 'Deployment verified on port 5173', type: 'task', status: 'Completed', note: 'Vite build artifacts loaded' }
                    ]).map((act, idx, arr) => {
                      const timeStr = act.time
                        ? (act.time.includes('AM') || act.time.includes('PM')
                            ? act.time
                            : new Date(act.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
                        : '09:00 AM';

                      return (
                        <div key={idx} className="cs-timeline-item">
                          {idx < arr.length - 1 && <div className="cs-timeline-line" />}
                          <div className="cs-timeline-dot" style={{ background: '#4f46e5' }} />
                          <div className="cs-timeline-text" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="cs-timeline-time" style={{ color: '#4f46e5', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>
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
                                  borderLeft: '3px solid #4f46e5',
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
                {/* 1. IT Sprint Resolution Pipeline */}
                <div className="cs-panel-card">
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 18px 0' }}>Sprint resolution pipeline</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '4px' }}>
                    {[
                      { name: 'Backlog Queue', value: 16, total: 16 },
                      { name: 'In Development', value: 8, total: 16 },
                      { name: 'QA Testing', value: 5, total: 16 },
                      { name: 'Production Deployed', value: 3, total: 16 }
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
                              background: '#4f46e5',
                              borderRadius: '4px',
                              transition: 'width 0.4s ease'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Weekly Resolution Velocity (BarChart) */}
                <div className="cs-panel-card">
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px 0' }}>Tickets resolved this week</h3>
                  <div style={{ height: 180, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { day: 'Mon', count: 4 },
                          { day: 'Tue', count: 7 },
                          { day: 'Wed', count: 5 },
                          { day: 'Thu', count: 9 },
                          { day: 'Fri', count: 6 }
                        ]}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      >
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="count" fill="#4f46e5" barSize={26} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. System Component Health Donut Chart */}
                <div className="cs-panel-card">
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px 0' }}>Services health status</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 180 }}>
                    <div style={{ position: 'relative', width: 140, height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'API Server', value: 100 },
                              { name: 'MySQL DB', value: 100 },
                              { name: 'Vite Frontend', value: 100 }
                            ]}
                            cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value"
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#3b82f6" />
                            <Cell fill="#6366f1" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                        <span>API (Active)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />
                        <span>MySQL (Connected)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366f1' }} />
                        <span>Vite (Ready)</span>
                      </div>
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
                      onClick={() => { setTaskFilter(tab); setTaskPage(1); }}
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
                      {currentTasks.map(t => (
                        <tr key={t.id}>
                          <td>
                            <strong
                              onClick={() => setViewTask(t)}
                              style={{ fontSize: 14, color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline' }}
                              title="Click to view task details"
                            >
                              {t.title}
                            </strong>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{t.description || 'No description provided'}</div>
                          </td>
                          <td>{t.assigned_by_name || 'Admin'}</td>
                          <td><span className={`priority-badge ${(t.priority || 'medium').toLowerCase()}`}>{t.priority}</span></td>
                          <td><span className={`task-status-badge ${t.status.toLowerCase().replace(' ', '-')}`}>{t.status}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button
                                onClick={() => setViewTask(t)}
                                style={{ padding: '5px 10px', background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                              >
                                View
                              </button>
                              {t.status === 'Assigned' && (
                                <button onClick={() => handleTaskAction(t.id, 'In Progress')} className="btn-action-task start">Start</button>
                              )}
                              {t.status === 'In Progress' && (
                                <button onClick={() => setCompleteTaskModal(t)} className="btn-action-task complete">Complete</button>
                              )}
                              {t.status === 'Completed' && <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Done</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* TASKS PAGINATION CONTROLS */}
                {filteredTasks.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 10 }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      Showing <strong>{indexOfFirstTask + 1}</strong> to <strong>{Math.min(indexOfLastTask, filteredTasks.length)}</strong> of <strong>{filteredTasks.length}</strong> tasks
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={() => setTaskPage(prev => Math.max(prev - 1, 1))}
                        disabled={taskPage === 1}
                        style={{ padding: '5px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: taskPage === 1 ? '#f8fafc' : '#fff', color: taskPage === 1 ? '#94a3b8' : '#334155', cursor: taskPage === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
                      >
                        ← Prev
                      </button>

                      {Array.from({ length: totalTaskPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setTaskPage(page)}
                          style={{ padding: '5px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: taskPage === page ? '#4f46e5' : '#fff', color: taskPage === page ? '#fff' : '#334155', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setTaskPage(prev => Math.min(prev + 1, totalTaskPages))}
                        disabled={taskPage === totalTaskPages || totalTaskPages === 0}
                        style={{ padding: '5px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: taskPage === totalTaskPages || totalTaskPages === 0 ? '#f8fafc' : '#fff', color: taskPage === totalTaskPages || totalTaskPages === 0 ? '#94a3b8' : '#334155', cursor: taskPage === totalTaskPages || totalTaskPages === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
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

      {/* ================= IT TASK / TICKET DETAILS MODAL ================= */}
      {viewTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '520px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>🛠️ {viewTask.title}</h2>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13.5px' }}>Task Specification & Tracking #{viewTask.id}</p>
              </div>
              <button onClick={() => setViewTask(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '18px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>ASSIGNED BY</label>
                <p style={{ margin: '4px 0 0', fontWeight: '600', color: '#334155' }}>👤 {viewTask.assigned_by_name || 'Admin'}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>PRIORITY LEVEL</label>
                <div style={{ marginTop: '4px' }}>
                  <span className={`priority-badge ${(viewTask.priority || 'medium').toLowerCase()}`}>{viewTask.priority || 'Medium'}</span>
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>TASK STATUS</label>
                <div style={{ marginTop: '4px' }}>
                  <span className={`task-status-badge ${(viewTask.status || 'assigned').toLowerCase().replace(' ', '-')}`}>{viewTask.status}</span>
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>DUE TIME / DATE</label>
                <p style={{ margin: '4px 0 0', fontWeight: '600', color: '#dc2626' }}>⏰ {viewTask.due_time || viewTask.due_date || 'Today, 05:00 PM'}</p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>TASK DESCRIPTION & REQUIREMENTS</label>
              <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: '#334155', lineHeight: 1.5 }}>
                {viewTask.description || 'No detailed instructions provided. Please follow standard operational guidelines.'}
              </p>
            </div>

            {viewTask.remarks && (
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>ADMIN NOTES / LOG</label>
                <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: '#334155' }}>{viewTask.remarks}</p>
              </div>
            )}

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {viewTask.status === 'Assigned' && (
                  <button
                    onClick={() => {
                      handleTaskAction(viewTask.id, 'In Progress');
                      setViewTask(null);
                    }}
                    style={{ padding: '9px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Start Task
                  </button>
                )}
                {viewTask.status === 'In Progress' && (
                  <button
                    onClick={() => {
                      const t = viewTask;
                      setViewTask(null);
                      setCompleteTaskModal(t);
                    }}
                    style={{ padding: '9px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewTask(null)}
                style={{ padding: '9px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', color: '#334155', cursor: 'pointer', fontSize: '13px' }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= COMPLETE TASK WITH REMARKS MODAL ================= */}
      {completeTaskModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '520px', width: '92%', borderRadius: '14px', padding: '26px', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>Complete IT Ticket / Task</h3>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '13px' }}>
              Add resolution notes or technical logs for: <strong>{completeTaskModal.title}</strong>
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Resolution Summary / System Notes
              </label>
              <textarea
                value={taskRemarks}
                onChange={e => setTaskRemarks(e.target.value)}
                placeholder="e.g. Optimized database connection pool limit, cleared slow query bottlenecks, and tested API response times."
                rows="4"
                style={{ width: '100%', padding: '12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setCompleteTaskModal(null); setTaskRemarks(''); }}
                style={{ padding: '9px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTaskAction(completeTaskModal.id, 'Completed', taskRemarks);
                  setCompleteTaskModal(null);
                  setTaskRemarks('');
                }}
                style={{ padding: '9px 20px', background: '#16a34a', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}
              >
                ✓ Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
