import { useEffect, useState } from 'react';
import api from '../../services/api';
import EmployeeHeader from '../../components/EmployeeHeader';
import '../../styles/dashboard.css';

export default function RecruitmentDashboard() {
  // ACTIVE VIEW TAB STATE: 'dashboard' | 'tasks' | 'jobs' | 'candidates' | 'worklog'
  const [activeTab, setActiveTab] = useState('dashboard');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // JOBS STATE (With full Case Study attributes)
  const [jobs, setJobs] = useState([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [viewJob, setViewJob] = useState(null); // Selected job for detailed drawer
  const [submittingJob, setSubmittingJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    department: 'IT',
    location: 'Pune (Hybrid)',
    openings: 1,
    qualification: 'B.Tech / MCA / Any Graduate',
    experience_required: '1-3 Years',
    salary_range: '₹4.0 - 6.5 LPA',
    status: 'Active'
  });

  // TASKS FILTER STATE
  const [taskFilter, setTaskFilter] = useState('ALL');

  // WORK LOG STATE
  const [workLogs, setWorkLogs] = useState([]);

  // Fetch Core Dashboard Data
  const fetchDashboard = async () => {
    try {
      const res = await api.get('/employee/dashboard-data');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load Recruitment dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Jobs
  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  // Fetch Work Log
  const fetchWorkLog = async () => {
    try {
      const res = await api.get('/employee/work-log');
      setWorkLogs(res.data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch work logs:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchJobs();
    fetchWorkLog();
    const interval = setInterval(() => {
      fetchDashboard();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Update Task Status
  const handleTaskAction = async (taskId, newStatus) => {
    try {
      await api.put(`/employee/tasks/${taskId}/status`, { status: newStatus });
      fetchDashboard();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Post New Job (Full Attributes)
  const handleCreateJob = async (e) => {
    e.preventDefault();
    setSubmittingJob(true);
    try {
      await api.post('/jobs', jobForm);
      setShowJobModal(false);
      setJobForm({
        title: '',
        description: '',
        department: 'IT',
        location: 'Pune (Hybrid)',
        openings: 1,
        qualification: 'B.Tech / MCA / Any Graduate',
        experience_required: '1-3 Years',
        salary_range: '₹4.0 - 6.5 LPA',
        status: 'Active'
      });
      fetchJobs();
      alert('✅ Job vacancy created successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post job');
    } finally {
      setSubmittingJob(false);
    }
  };

  // Toggle Job Status (Active <-> Closed)
  const handleToggleJobStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Closed' : 'Active';
    try {
      await api.put(`/jobs/${jobId}/status`, { status: newStatus });
      fetchJobs();
    } catch (err) {
      alert('Failed to update job status');
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading Recruitment Dashboard...</div>;
  }

  const { user, session, stats, tasks = [], timeline = [] } = data || {};

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'ALL') return true;
    return t.status === taskFilter;
  });

  return (
    <div className="dashboard-layout">
      
      {/* ================= 1. SIDEBAR (TAB SWITCHER) ================= */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <div className="dash-logo-icon">B</div>
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

          <p className="nav-section-title">RECRUITMENT</p>
          <a
            className={activeTab === 'jobs' ? 'active' : ''}
            onClick={() => { setActiveTab('jobs'); fetchJobs(); }}
          >
            💼 Jobs ({jobs.length})
          </a>
          <a
            className={activeTab === 'candidates' ? 'active' : ''}
            onClick={() => setActiveTab('candidates')}
          >
            👤 Candidates
          </a>
        </nav>
      </aside>

      {/* ================= 2. MAIN CONTENT ================= */}
      <main className="dash-main">
        <EmployeeHeader
          user={user}
          session={session}
          stats={stats}
          moduleBadgeColor="blue"
          onBreakChange={() => fetchDashboard()}
        />

        <div className="dash-content">

          {/* ================= VIEW 1: DASHBOARD OVERVIEW ================= */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="greeting-header">
                <h1>Good morning, {user?.name?.split(' ')[0] || 'Priya'}!</h1>
                <p>Monday, 19 October 2026 · Recruitment Team Dashboard Overview</p>
              </div>

              {/* KPI Summary Cards */}
              <div className="cards-row-tasks">
                <div className="kpi-card blue" onClick={() => setActiveTab('tasks')} style={{ cursor: 'pointer' }}>
                  <h2>{stats?.assignedToday || 0}</h2>
                  <p>Tasks assigned today →</p>
                </div>
                <div className="kpi-card indigo" onClick={() => setActiveTab('tasks')} style={{ cursor: 'pointer' }}>
                  <h2>{stats?.inProgress || 0}</h2>
                  <p>Tasks in progress →</p>
                </div>
                <div className="kpi-card purple" onClick={() => setActiveTab('jobs')} style={{ cursor: 'pointer' }}>
                  <h2>{jobs.length}</h2>
                  <p>Active Job Openings →</p>
                </div>
                <div className="kpi-card green">
                  <h2>{stats?.completed || 0}</h2>
                  <p>Tasks Completed</p>
                </div>
              </div>

              {/* 2 COLUMNS: Tasks Preview & Activity Timeline */}
              <div className="dashboard-grid-2col">
                <div className="panel-card">
                  <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Pending Tasks Today</span>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                    >
                      View All Tasks →
                    </button>
                  </div>

                  {tasks.length === 0 ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: 25 }}>No pending tasks.</p>
                  ) : (
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Task</th>
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
                  <h1 style={{ margin: 0 }}>📋 My Tasks Management</h1>
                  <p style={{ margin: 0, color: '#64748b' }}>Manage and update all tasks assigned to you by Admin</p>
                </div>
                <div style={{ display: 'flex', gap: 8, background: '#e2e8f0', padding: 4, borderRadius: 8 }}>
                  {['ALL', 'In Progress', 'Assigned', 'Completed'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setTaskFilter(tab)}
                      style={{
                        padding: '6px 14px',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: taskFilter === tab ? '#2563eb' : 'transparent',
                        color: taskFilter === tab ? '#ffffff' : '#475569'
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-title">
                  <span>Tasks List ({filteredTasks.length})</span>
                </div>

                {filteredTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <p style={{ fontSize: 16, fontWeight: 600 }}>No tasks found in "{taskFilter}"</p>
                  </div>
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
                          <td>
                            <span className={`priority-badge ${(t.priority || 'medium').toLowerCase()}`}>
                              {t.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`task-status-badge ${t.status.toLowerCase().replace(' ', '-')}`}>
                              {t.status}
                            </span>
                          </td>
                          <td>
                            {t.status === 'Assigned' && (
                              <button onClick={() => handleTaskAction(t.id, 'In Progress')} className="btn-action-task start">
                                Start Working
                              </button>
                            )}
                            {t.status === 'In Progress' && (
                              <button onClick={() => handleTaskAction(t.id, 'Completed')} className="btn-action-task complete">
                                Mark Completed
                              </button>
                            )}
                            {t.status === 'Completed' && (
                              <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>✓ Done</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ================= VIEW 3: JOBS DEDICATED PAGE (MODULE 1 CASE STUDY) ================= */}
          {activeTab === 'jobs' && (
            <div>
              <div className="greeting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0 }}>💼 Job Vacancies & Description Management</h1>
                  <p style={{ margin: 0, color: '#64748b' }}>Post vacancies, define required qualifications, experience, and salary brackets</p>
                </div>
                <button
                  onClick={() => setShowJobModal(true)}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 18px',
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  + Add New Job Vacancy
                </button>
              </div>

              <div className="panel-card">
                <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Published Vacancies ({jobs.length})</span>
                  <small style={{ color: '#64748b', fontSize: 12 }}>Click any job title to view full description</small>
                </div>

                {jobs.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>No job openings found. Click "+ Add New Job Vacancy" to post one.</p>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Job Title & Description</th>
                        <th>Department</th>
                        <th>Required Qualification</th>
                        <th>Experience</th>
                        <th>Openings</th>
                        <th>Salary Range</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map(job => (
                        <tr key={job.id}>
                          <td>
                            <strong 
                              style={{ color: '#2563eb', cursor: 'pointer', fontSize: 14 }}
                              onClick={() => setViewJob(job)}
                              title="Click to view full job specification"
                            >
                              {job.title} 🔍
                            </strong>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {job.description || 'No description added'}
                            </div>
                          </td>
                          <td>
                            <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                              {job.department}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: '#334155', fontSize: 12.5, fontWeight: 500 }}>
                              🎓 {job.qualification || 'Graduate'}
                            </span>
                          </td>
                          <td>{job.experience_required}</td>
                          <td><strong style={{ color: '#0f172a' }}>{job.openings}</strong></td>
                          <td><strong style={{ color: '#16a34a', fontSize: 12.5 }}>{job.salary_range}</strong></td>
                          <td>
                            <span style={{
                              background: job.status === 'Active' ? '#dcfce7' : job.status === 'Draft' ? '#fef3c7' : '#fee2e2',
                              color: job.status === 'Active' ? '#16a34a' : job.status === 'Draft' ? '#b45309' : '#dc2626',
                              padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700
                            }}>
                              ● {job.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => setViewJob(job)}
                                style={{ padding: '4px 8px', fontSize: 11.5, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleToggleJobStatus(job.id, job.status)}
                                style={{
                                  padding: '4px 8px', fontSize: 11.5,
                                  background: job.status === 'Active' ? '#fef2f2' : '#f0fdf4',
                                  border: `1px solid ${job.status === 'Active' ? '#fecaca' : '#bbf7d0'}`,
                                  color: job.status === 'Active' ? '#dc2626' : '#16a34a',
                                  borderRadius: 6, cursor: 'pointer', fontWeight: 600
                                }}
                              >
                                {job.status === 'Active' ? 'Close' : 'Activate'}
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

          {/* ================= VIEW 4: CANDIDATES DEDICATED PAGE ================= */}
          {activeTab === 'candidates' && (
            <div>
              <div className="greeting-header">
                <h1>👤 Candidates Pipeline</h1>
                <p>Track job applicants and interview statuses</p>
              </div>

              <div className="cards-row-tasks">
                <div className="kpi-card blue"><h2>186</h2><p>Total Applied</p></div>
                <div className="kpi-card indigo"><h2>42</h2><p>Shortlisted</p></div>
                <div className="kpi-card purple"><h2>14</h2><p>Interviews Scheduled</p></div>
                <div className="kpi-card green"><h2>9</h2><p>Selected</p></div>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Recent Applicants</span></div>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Applied Position</th>
                      <th>Experience</th>
                      <th>Interview Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Rohit Sharma</strong><div style={{ fontSize: 12, color: '#64748b' }}>rohit@gmail.com</div></td>
                      <td>Full Stack Web Developer</td>
                      <td>3 Years</td>
                      <td><span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Technical Round 2</span></td>
                    </tr>
                    <tr>
                      <td><strong>Anjali Verma</strong><div style={{ fontSize: 12, color: '#64748b' }}>anjali@gmail.com</div></td>
                      <td>HR Talent Acquisition Specialist</td>
                      <td>2 Years</td>
                      <td><span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>HR Interview</span></td>
                    </tr>
                    <tr>
                      <td><strong>Vikas Mehta</strong><div style={{ fontSize: 12, color: '#64748b' }}>vikas@gmail.com</div></td>
                      <td>Business Development Executive</td>
                      <td>1 Year</td>
                      <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Selected / Offer Sent</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 5: WORK LOG DEDICATED PAGE ================= */}
          {activeTab === 'worklog' && (
            <div>
              <div className="greeting-header">
                <h1>⏱️ My Work Log History</h1>
                <p>Your recorded work hours, break times, and completed tasks</p>
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

      {/* ================= MODAL 1: ADD NEW JOB VACANCY (CASE STUDY COMPLETE) ================= */}
      {showJobModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh',
            overflowY: 'auto', padding: 28, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: '#0f172a' }}>💼 Add New Job Vacancy</h2>
                <small style={{ color: '#64748b', fontSize: 12.5 }}>Fill complete specification per Case Study</small>
              </div>
              <button type="button" onClick={() => setShowJobModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleCreateJob}>
              {/* Job Title */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Job Title *</label>
                <input
                  type="text" required placeholder="e.g. Senior Full Stack Developer"
                  value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                />
              </div>

              {/* Department & Openings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Department *</label>
                  <select
                    value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                  >
                    <option value="IT">IT</option>
                    <option value="Recruitment">Recruitment</option>
                    <option value="Business">Business</option>
                    <option value="Financial">Financial</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Openings (Count) *</label>
                  <input
                    type="number" min="1" required value={jobForm.openings}
                    onChange={(e) => setJobForm({ ...jobForm, openings: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                  />
                </div>
              </div>

              {/* Qualification & Experience */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Required Qualification *</label>
                  <input
                    type="text" required placeholder="e.g. B.Tech / MCA / MBA / Any Graduate"
                    value={jobForm.qualification} onChange={(e) => setJobForm({ ...jobForm, qualification: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Experience *</label>
                  <input
                    type="text" placeholder="e.g. 2-4 Years" value={jobForm.experience_required}
                    onChange={(e) => setJobForm({ ...jobForm, experience_required: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                  />
                </div>
              </div>

              {/* Location & Salary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Location</label>
                  <input
                    type="text" placeholder="e.g. Pune (Hybrid)" value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Salary Package (CTC)</label>
                  <input
                    type="text" placeholder="e.g. ₹5.0 - 7.5 LPA" value={jobForm.salary_range}
                    onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                  />
                </div>
              </div>

              {/* Status */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Initial Job Status</label>
                <select
                  value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                >
                  <option value="Active">Active (Live for candidates)</option>
                  <option value="Draft">Draft (Internal review only)</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Detailed Description */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Job Description & Key Responsibilities *
                </label>
                <textarea
                  rows="3" required
                  placeholder="Detail the daily responsibilities, mandatory technical or business skills, deliverables..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowJobModal(false)} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submittingJob} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}>
                  {submittingJob ? 'Publishing...' : 'Publish Job Vacancy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: FULL JOB SPECIFICATION DRAWER ================= */}
      {viewJob && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 540, padding: 28,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                  {viewJob.department}
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '6px 0 0', color: '#0f172a' }}>{viewJob.title}</h2>
              </div>
              <button onClick={() => setViewJob(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, background: '#f8fafc', padding: 14, borderRadius: 10 }}>
              <div><strong>Openings:</strong> {viewJob.openings} Seats</div>
              <div><strong>Location:</strong> {viewJob.location}</div>
              <div><strong>Experience:</strong> {viewJob.experience_required}</div>
              <div><strong>Package:</strong> {viewJob.salary_range}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Qualification:</strong> 🎓 {viewJob.qualification || 'Graduate'}</div>
              <div>
                <strong>Status:</strong>{' '}
                <span style={{ color: viewJob.status === 'Active' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                  ● {viewJob.status}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <strong style={{ display: 'block', fontSize: 13.5, color: '#334155', marginBottom: 6 }}>
                📝 Job Description & Responsibilities:
              </strong>
              <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, background: '#fff', border: '1px solid #e2e8f0', padding: 14, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
                {viewJob.description || 'No detailed description provided.'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setViewJob(null)}
                style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                Close Specification
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
