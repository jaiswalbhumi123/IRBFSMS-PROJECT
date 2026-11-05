import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DailyReportModal from './DailyReportModal';

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
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`module-badge ${moduleBadgeColor}`}>
              {user?.module || 'Recruitment'}
            </span>
            <span className={`status-indicator ${isBreak ? 'break' : 'working'}`}>
              ● {isBreak ? 'On break' : 'Working'}
            </span>
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
          <div style={{ padding: '24px 30px 0 30px' }}>
            <div className="greeting-card">
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
      </>
    );
  }

  // STANDARD TOPBAR (Backwards compatible for all other modules)
  return (
    <>
      <header className="dash-topbar">
        {/* Module & Status */}
        <div className="topbar-left">
          <span className={`module-badge ${moduleBadgeColor}`}>
            {user?.module || 'Employee'}
          </span>
          <span className={`status-indicator ${isBreak ? 'break' : 'working'}`}>
            ● {isBreak ? 'On break' : 'Working'}
          </span>
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
    </>
  );
}
