import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DailyReportModal from './DailyReportModal';

export default function EmployeeHeader({ user, session, stats, onBreakChange, moduleBadgeColor = 'blue' }) {
  const [workingMins, setWorkingMins] = useState(session?.workingMinutes || 0);
  const [breakMins, setBreakMins] = useState(session?.breakMinutes || 0);
  const [isBreak, setIsBreak] = useState(session?.status === 'Break');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loadingBreak, setLoadingBreak] = useState(false);
  const navigate = useNavigate();

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
    : '09:00 AM';

  const getInitials = (name) => {
    if (!name) return 'E';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

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

