import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DailyReportModal from './DailyReportModal';
import { toast } from 'react-toastify';

export default function EmployeeHeader({
  user,
  session,
  stats,
  onBreakChange,
  moduleBadgeColor = 'blue',
  variant = 'standard',
  departmentSubtitle = 'Recruitment team',
  showGreeting = false,
  searchData = { candidates: [], jobs: [] },
  onSelectSearchItem = null
}) {
  const [workingMins, setWorkingMins] = useState(session?.workingMinutes || 0);
  const [breakMins, setBreakMins] = useState(session?.breakMinutes || 0);
  const [isBreak, setIsBreak] = useState(session?.status === 'Break');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loadingBreak, setLoadingBreak] = useState(false);
  const navigate = useNavigate();

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchDropdownRef = useRef(null);

  // WFH State & Handler
  const [wfhStatus, setWfhStatus] = useState(null);
  const [showWfhModal, setShowWfhModal] = useState(false);
  const [wfhForm, setWfhForm] = useState({ start_date: '', end_date: '', reason: '' });
  const [submittingWfh, setSubmittingWfh] = useState(false);

  const fetchWfhStatus = async () => {
    try {
      const res = await api.get('/employee/my-wfh-status');
      setWfhStatus(res.data);
    } catch (err) {
      console.error('Error fetching WFH status:', err);
    }
  };

  useEffect(() => {
    fetchWfhStatus();
  }, []);

  const handleApplyWfh = async (e) => {
    e.preventDefault();
    setSubmittingWfh(true);
    try {
      await api.post('/employee/apply-wfh', wfhForm);
      toast.success('WFH application submitted to Admin!');
      setShowWfhModal(false);
      setWfhForm({ start_date: '', end_date: '', reason: '' });
      fetchWfhStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply for WFH');
    } finally {
      setSubmittingWfh(false);
    }
  };

  const renderWfhModal = () => {
    if (!showWfhModal) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
        <div style={{ background: '#fff', padding: '28px', borderRadius: '14px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>🏠 Apply for Work From Home</h3>
            <button type="button" onClick={() => setShowWfhModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>
          </div>
          
          <form onSubmit={handleApplyWfh} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Start Date</label>
                <input 
                  required 
                  type="date" 
                  value={wfhForm.start_date} 
                  onChange={e => setWfhForm({...wfhForm, start_date: e.target.value})} 
                  style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: 13 }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>End Date</label>
                <input 
                  required 
                  type="date" 
                  value={wfhForm.end_date} 
                  onChange={e => setWfhForm({...wfhForm, end_date: e.target.value})} 
                  style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: 13 }} 
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Reason & Justification</label>
              <textarea 
                required 
                rows="3" 
                placeholder="Explain reason (e.g. personal health, broadband setup, travel)..." 
                value={wfhForm.reason} 
                onChange={e => setWfhForm({...wfhForm, reason: e.target.value})} 
                style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: 13, resize: 'vertical' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button 
                type="submit" 
                disabled={submittingWfh}
                style={{ flex: 1, padding: '11px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                {submittingWfh ? 'Submitting...' : 'Submit to Admin'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowWfhModal(false)} 
                style={{ flex: 1, padding: '11px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Sync state with prop updates
  useEffect(() => {
    if (session) {
      setWorkingMins(session.workingMinutes || 0);
      setBreakMins(session.breakMinutes || 0);
      setIsBreak(session.status === 'Break');
    }
  }, [session]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time ticking counter (every 60 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isBreak) {
        setBreakMins(prev => prev + 1);
      } else {
        setWorkingMins(prev => prev + 1);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [isBreak]);

  // Handle Break Toggle
  const handleBreakToggle = async () => {
    setLoadingBreak(true);
    try {
      if (isBreak) {
        // Resume Work
        await api.post('/employee/break/end');
        setIsBreak(false);
        if (onBreakChange) onBreakChange('Working');
      } else {
        // Start Break
        await api.post('/employee/break/start');
        setIsBreak(true);
        if (onBreakChange) onBreakChange('Break');
      }
    } catch (err) {
      console.error('Break toggle error:', err);
    } finally {
      setLoadingBreak(false);
    }
  };

  const formatHours = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  };

  const loginTimeStr = session?.loginTime
    ? new Date(session.loginTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '09:02 AM';

  const getInitials = (name) => {
    if (!name) return 'P';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const todayDateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Filter global search results
  const q = searchQuery.toLowerCase().trim();
  const matchedCandidates = q ? (searchData.candidates || []).filter(c =>
    (c.name && c.name.toLowerCase().includes(q)) ||
    (c.email && c.email.toLowerCase().includes(q)) ||
    (c.skills && c.skills.toLowerCase().includes(q)) ||
    (c.job_title && c.job_title.toLowerCase().includes(q))
  ).slice(0, 5) : [];

  const matchedJobs = q ? (searchData.jobs || []).filter(j =>
    (j.title && j.title.toLowerCase().includes(q)) ||
    (j.department && j.department.toLowerCase().includes(q))
  ).slice(0, 5) : [];

  const handleItemClick = (type, item) => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    if (onSelectSearchItem) {
      onSelectSearchItem(type, item);
    } else {
      if (type === 'candidate') {
        navigate(`/employee/candidate/${item.id}`);
      }
    }
  };

  if (variant === 'case-study') {
    return (
      <>
        {/* CASE STUDY TOPBAR */}
        <header className="dash-topbar case-study">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className={`module-badge ${moduleBadgeColor}`}>
              {user?.module || 'Recruitment'}
            </span>
            <span className={`status-indicator ${isBreak ? 'break' : 'working'}`}>
              ● {isBreak ? 'On break' : 'Working'}
            </span>

            {/* WFH STATUS BADGE */}
            {wfhStatus && wfhStatus.status === 'Approved' ? (
              <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                🏠 WFH Approved
              </span>
            ) : wfhStatus && wfhStatus.status === 'Pending' ? (
              <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                ⏳ WFH Pending
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => setShowWfhModal(true)}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              🏠 Apply WFH
            </button>
          </div>

          {/* GLOBAL SEARCH BAR */}
          <div className="topbar-global-search" ref={searchDropdownRef} style={{ position: 'relative', width: 340 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Search candidates, jobs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                style={{
                  width: '100%',
                  padding: '7px 28px 7px 32px',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                  color: '#0f172a'
                }}
              />
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8' }}>🔍</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* FLOATING AUTOCOMPLETE DROPDOWN */}
            {showSearchDropdown && searchQuery.trim().length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                  maxHeight: 320,
                  overflowY: 'auto',
                  zIndex: 2000,
                  padding: '8px 0'
                }}
              >
                {matchedCandidates.length === 0 && matchedJobs.length === 0 ? (
                  <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12.5, textAlign: 'center' }}>
                    No candidates or jobs matching "{searchQuery}"
                  </div>
                ) : (
                  <>
                    {/* CANDIDATES MATCHES */}
                    {matchedCandidates.length > 0 && (
                      <div>
                        <div style={{ padding: '6px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', background: '#f8fafc', textTransform: 'uppercase' }}>
                          👤 Candidates ({matchedCandidates.length})
                        </div>
                        {matchedCandidates.map(c => (
                          <div
                            key={`cand-${c.id}`}
                            onClick={() => handleItemClick('candidate', c)}
                            style={{
                              padding: '8px 14px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div>
                              <strong style={{ fontSize: 13, color: '#0f172a' }}>{c.name}</strong>
                              <span style={{ fontSize: 11.5, color: '#64748b', marginLeft: 6 }}>({c.job_title || 'Candidate'})</span>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.email}</div>
                            </div>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: '#e0e7ff', color: '#4338ca', fontWeight: 600 }}>
                              {c.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* JOBS MATCHES */}
                    {matchedJobs.length > 0 && (
                      <div>
                        <div style={{ padding: '6px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', background: '#f8fafc', textTransform: 'uppercase' }}>
                          💼 Job Openings ({matchedJobs.length})
                        </div>
                        {matchedJobs.map(j => (
                          <div
                            key={`job-${j.id}`}
                            onClick={() => handleItemClick('job', j)}
                            style={{
                              padding: '8px 14px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div>
                              <strong style={{ fontSize: 13, color: '#0f172a' }}>{j.title}</strong>
                              <span style={{ fontSize: 11.5, color: '#64748b', marginLeft: 6 }}>({j.department})</span>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{j.location} · {j.salary_range}</div>
                            </div>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: j.status === 'Active' ? '#f0fdf4' : '#fef2f2', color: j.status === 'Active' ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                              {j.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="topbar-right-user">
            <div className="user-avatar-small">{getInitials(user?.name)}</div>
            <div className="profile-info">
              <strong>{user?.name || 'Priya Singh'}</strong>
              <span>{user?.role || 'HR Executive'}</span>
            </div>
            <button onClick={() => setShowLogoutModal(true)} className="btn-topbar-logout">
              Logout
            </button>
          </div>
        </header>

        {/* CASE STUDY GREETING & TIMERS CARD (Only on Dashboard Tab) */}
        {showGreeting && (
          <div style={{ padding: '20px 30px 0 30px' }}>
            <div className="greeting-card" style={{ marginBottom: 0 }}>
              <div>
                <h1>Good morning, {user?.name?.split(' ')[0] || 'Priya'}!</h1>
                <p>{todayDateStr} · {departmentSubtitle}</p>
              </div>

              <div className="greeting-card-timers">
                <div className="timer-item">
                  <span>Logged in</span>
                  <strong>{loginTimeStr}</strong>
                </div>

                <div className="timer-item">
                  <span>Working time</span>
                  <strong>{formatHours(workingMins)}</strong>
                </div>

                <div className="timer-item">
                  <span>Break</span>
                  <strong>{formatHours(breakMins)}</strong>
                </div>

                <button
                  onClick={handleBreakToggle}
                  className={`btn-break-card ${isBreak ? 'active-break' : ''}`}
                  disabled={loadingBreak}
                >
                  {isBreak ? '▶ Resume Work' : '☕ Start break'}
                </button>

                <button onClick={() => setShowLogoutModal(true)} className="btn-logout-card">
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mandatory Logout Report Modal */}
        <DailyReportModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          session={{ ...session, workingMinutes: workingMins }}
          stats={stats}
          onLogoutSuccess={() => navigate('/login')}
        />

        {/* Apply WFH Modal */}
        {renderWfhModal()}
      </>
    );
  }

  // STANDARD TOPBAR (Backwards compatible for all other modules)
  return (
    <>
      <header className="dash-topbar">
        {/* Module & Status */}
        <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className={`module-badge ${moduleBadgeColor}`}>
            {user?.module || 'Employee'}
          </span>
          <span className={`status-indicator ${isBreak ? 'break' : 'working'}`}>
            ● {isBreak ? 'On break' : 'Working'}
          </span>

          {/* WFH STATUS BADGE */}
          {wfhStatus && wfhStatus.status === 'Approved' ? (
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              🏠 WFH Approved
            </span>
          ) : wfhStatus && wfhStatus.status === 'Pending' ? (
            <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              ⏳ WFH Pending
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => setShowWfhModal(true)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            🏠 Apply WFH
          </button>
        </div>

        {/* Timers & Actions */}
        <div className="topbar-center-timers">
          <div className="timer-item">
            Logged in
            <strong>{loginTimeStr}</strong>
          </div>

          <div className="timer-item">
            Working time
            <strong>{formatHours(workingMins)}</strong>
          </div>

          <div className="timer-item">
            Break
            <strong>{formatHours(breakMins)}</strong>
          </div>

          <button
            onClick={handleBreakToggle}
            className={`btn-break ${isBreak ? 'active-break' : ''}`}
            disabled={loadingBreak}
          >
            {isBreak ? '▶ Resume Work' : '☕ Start break'}
          </button>

          <button onClick={() => setShowLogoutModal(true)} className="btn-logout">
            Logout
          </button>
        </div>

        {/* User Info */}
        <div className="topbar-right-user">
          <div className="user-avatar-small">{getInitials(user?.name)}</div>
          <div className="profile-info">
            <strong>{user?.name || 'Staff User'}</strong>
            <span>{user?.role}</span>
          </div>
        </div>
      </header>

      {/* Mandatory Logout Report Modal */}
      <DailyReportModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        session={{ ...session, workingMinutes: workingMins }}
        stats={stats}
        onLogoutSuccess={() => navigate('/login')}
      />

      {/* Apply WFH Modal */}
      {renderWfhModal()}
    </>
  );
}
