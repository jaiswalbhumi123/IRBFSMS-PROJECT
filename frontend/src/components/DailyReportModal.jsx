import { useState } from 'react';
import api from '../services/api';
import '../styles/modal.css';

export default function DailyReportModal({ isOpen, onClose, session, stats, onLogoutSuccess }) {
  const [summary, setSummary] = useState('');
  const [pendingReason, setPendingReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!summary.trim()) {
      setError('Daily work summary is compulsory before logout.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/employee/daily-report', {
        summary: summary.trim(),
        pendingReason: pendingReason.trim()
      });
      localStorage.clear();
      if (onLogoutSuccess) onLogoutSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
      setLoading(false);
    }
  };

  const loginTimeStr = session?.loginTime
    ? new Date(session.loginTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const logoutTimeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const workingHoursStr = `${Math.floor((session?.workingMinutes || 0) / 60)}h ${(session?.workingMinutes || 0) % 60}m`;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>End your day</h3>
          <p>Review today's work before you log out.</p>
        </div>

        {/* Time Snapshot */}
        <div className="time-snapshot-row">
          <div className="time-box">
            <span className="label">Login</span>
            <span className="value">{loginTimeStr}</span>
          </div>
          <div className="time-box">
            <span className="label">Logout</span>
            <span className="value">{logoutTimeStr}</span>
          </div>
          <div className="time-box highlight">
            <span className="label">Total hours</span>
            <span className="value">{workingHoursStr}</span>
          </div>
        </div>

        {/* Task Counter Badges */}
        <div className="badge-summary-row">
          <span className="pill pill-green">{stats?.completed || 0} tasks completed</span>
          <span className="pill pill-amber">{stats?.inProgress || 0} in progress</span>
          <span className="pill pill-red">{stats?.overdue || 0} overdue</span>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>Reason for pending tasks</label>
          <input
            type="text"
            placeholder="e.g. Candidate did not respond; will continue tomorrow"
            value={pendingReason}
            onChange={(e) => setPendingReason(e.target.value)}
          />

          <label>Daily work summary *</label>
          <textarea
            rows="4"
            required
            placeholder="Describe what you worked on today (e.g. Screened 10 resumes, scheduled 3 interviews, fixed login page CSS)..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit-logout" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit report & Logout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

