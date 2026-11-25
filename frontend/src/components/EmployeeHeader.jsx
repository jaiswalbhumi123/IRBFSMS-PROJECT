import { useState, useEffect } from 'react';
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
  showGreeting = false
}) {
  const [workingMins, setWorkingMins] = useState(session?.workingMinutes || 0);
  const [breakMins, setBreakMins] = useState(session?.breakMinutes || 0);
  const [isBreak, setIsBreak] = useState(session?.status === 'Break');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loadingBreak, setLoadingBreak] = useState(false);
  const navigate = useNavigate();

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
    const interval = setInterval(fetchWfhStatus, 8000);
    return () => clearInterval(interval);
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
            {wfhStatus && (wfhStatus.status === 'Approved' || wfhStatus.details?.status === 'Approved') ? (
              <span
                style={{ background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'default' }}
                title={`WFH Approved: ${wfhStatus.start_date ? new Date(wfhStatus.start_date).toLocaleDateString('en-IN') : ''} to ${wfhStatus.end_date ? new Date(wfhStatus.end_date).toLocaleDateString('en-IN') : ''}. ${wfhStatus.admin_remarks ? `Admin Remarks: "${wfhStatus.admin_remarks}"` : ''}`}
              >
                🏠 WFH Approved
              </span>
            ) : wfhStatus && (wfhStatus.status === 'Pending' || wfhStatus.details?.status === 'Pending') ? (
              <span
                style={{ background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'default' }}
                title="WFH application submitted and currently pending Admin review"
              >
                ⏳ WFH Pending
              </span>
            ) : wfhStatus && (wfhStatus.status === 'Rejected' || wfhStatus.details?.status === 'Rejected') ? (
              <span
                style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'default' }}
                title={wfhStatus.admin_remarks ? `Rejected: ${wfhStatus.admin_remarks}` : 'WFH request was not approved'}
              >
                ❌ WFH Rejected
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
          {wfhStatus && (wfhStatus.status === 'Approved' || wfhStatus.details?.status === 'Approved') ? (
            <span
              style={{ background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'default' }}
              title={`WFH Approved: ${wfhStatus.start_date ? new Date(wfhStatus.start_date).toLocaleDateString('en-IN') : ''} to ${wfhStatus.end_date ? new Date(wfhStatus.end_date).toLocaleDateString('en-IN') : ''}. ${wfhStatus.admin_remarks ? `Admin Remarks: "${wfhStatus.admin_remarks}"` : ''}`}
            >
              🏠 WFH Approved
            </span>
          ) : wfhStatus && (wfhStatus.status === 'Pending' || wfhStatus.details?.status === 'Pending') ? (
            <span
              style={{ background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'default' }}
              title="WFH application submitted and currently pending Admin review"
            >
              ⏳ WFH Pending
            </span>
          ) : wfhStatus && (wfhStatus.status === 'Rejected' || wfhStatus.details?.status === 'Rejected') ? (
            <span
              style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'default' }}
              title={wfhStatus.admin_remarks ? `Rejected: ${wfhStatus.admin_remarks}` : 'WFH request was not approved'}
            >
              ❌ WFH Rejected
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
