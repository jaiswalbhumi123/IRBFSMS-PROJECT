import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'departments' | 'tasks'
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ working: 0, onBreak: 0, loggedOut: 0, totalEmployees: 0 });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = async () => {
    try {
      const [empRes, statsRes] = await Promise.all([
        api.get('/admin/live-employees'),
        api.get('/admin/stats')
      ]);
      setEmployees(empRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Auto refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', { sessionId: localStorage.getItem('sessionId') });
    } catch (err) {}
    localStorage.clear();
    navigate('/login');
  };

  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* ================= TOP BAR ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: 700 }}>
            🏢 Benefit Business Solutions — Admin Portal
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13.5px' }}>
            Logged in as <strong>{user.name || 'System Administrator'}</strong> (Master Monitor)
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => navigate('/admin/assign-task')} 
            style={{
              padding: '10px 18px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13.5px',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
            }}
          >
            + Assign New Task
          </button>
          
          <button 
            onClick={handleLogout} 
            style={{
              padding: '10px 18px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13.5px'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ================= TAB NAVIGATION SWITCHER ================= */}
      <div style={{ display: 'flex', gap: '10px', background: '#e2e8f0', padding: '5px', borderRadius: '10px', width: 'fit-content', marginBottom: '22px' }}>
        <button
          onClick={() => setActiveTab('monitor')}
          style={{
            padding: '8px 18px',
            border: 'none',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'monitor' ? '#2563eb' : 'transparent',
            color: activeTab === 'monitor' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          ● Real-time Live Monitor
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          style={{
            padding: '8px 18px',
            border: 'none',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'departments' ? '#2563eb' : 'transparent',
            color: activeTab === 'departments' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          🗂️ Department Overviews
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '8px 18px',
            border: 'none',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'tasks' ? '#2563eb' : 'transparent',
            color: activeTab === 'tasks' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          📋 Staff Tasks & Workloads
        </button>
      </div>

      {/* ================= VIEW 1: REAL-TIME LIVE MONITOR ================= */}
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
                {employees.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No employees registered</td></tr>
                ) : (
                  employees.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                      <td style={{ padding: '14px' }}>
                        <strong style={{ color: '#0f172a' }}>{emp.name}</strong>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>{emp.email}</div>
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
                        {emp.current_task ? (
                          <span style={{ color: '#2563eb', fontWeight: 600 }}>{emp.current_task}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>No active task</span>
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

      {/* ================= VIEW 2: DEPARTMENT OVERVIEWS ================= */}
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

      {/* ================= VIEW 3: STAFF TASKS & WORKLOADS ================= */}
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
              {employees.map(emp => (
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
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}