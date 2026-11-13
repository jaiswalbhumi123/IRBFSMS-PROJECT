import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/select_work_area.css';

export default function SelectWorkArea() {
  const [loadingModule, setLoadingModule] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSelect = async (moduleName, targetRoute) => {
    setLoadingModule(moduleName);
    try {
      await api.put('/employee/select-module', { module: moduleName });
      const updatedUser = { ...user, module: moduleName };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      navigate(targetRoute);
    } catch (err) {
      console.error('Failed to select module:', err);
      navigate(targetRoute); // Graceful fallback
    } finally {
      setLoadingModule(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'E';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="select-area-page">
      {/* TOPBAR */}
      <header className="select-topbar">
        <div className="brand-section">
          <div className="brand-badge-icon">B</div>
          <span>Benefit Business Solutions</span>
        </div>

        <div className="employee-profile-pill">
          <div className="avatar-circle">{getInitials(user.name)}</div>
          <div className="profile-info">
            <strong>{user.name || 'Employee User'}</strong>
            <span>{user.role}</span>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="select-content">
        <div className="select-title-box">
          <h1>Select Your Department Workspace</h1>
          <p>Choose the operational module for your current work session. All active timers and task activity will be tracked accordingly.</p>
        </div>

        <div className="cards-grid">
          {/* 1. RECRUITMENT */}
          <div className="work-card recruitment">
            <div className="card-icon-box">👥</div>
            <h3>Recruitment Operations</h3>
            <ul className="bullet-points">
              <li>Job postings & vacancy management</li>
              <li>Candidate pipeline & resume screening</li>
              <li>Interview scheduling & evaluation</li>
            </ul>
            <div className="workflow-tagline">
              Sourcing → Screening → Interview → Selection
            </div>
            <button
              onClick={() => handleSelect('Recruitment', '/employee/recruitment-dashboard')}
              className="continue-btn"
              disabled={loadingModule === 'Recruitment'}
            >
              {loadingModule === 'Recruitment' ? 'Accessing Workspace...' : 'Enter Workspace →'}
            </button>
          </div>

          {/* 2. BUSINESS / CRM */}
          <div className="work-card crm">
            <div className="card-icon-box">💼</div>
            <h3>Business & CRM Solutions</h3>
            <ul className="bullet-points">
              <li>Corporate clients & accounts directory</li>
              <li>Sales leads & pipeline tracking</li>
              <li>Client follow-ups & deal closing</li>
            </ul>
            <div className="workflow-tagline">
              Prospect → Pipeline → Follow-up → Deal Closed
            </div>
            <button
              onClick={() => handleSelect('Business', '/employee/crm-dashboard')}
              className="continue-btn"
              disabled={loadingModule === 'Business'}
            >
              {loadingModule === 'Business' ? 'Accessing Workspace...' : 'Enter Workspace →'}
            </button>
          </div>

          {/* 3. FINANCIAL SERVICES */}
          <div className="work-card financial">
            <div className="card-icon-box">💳</div>
            <h3>Financial Services & Lending</h3>
            <ul className="bullet-points">
              <li>Personal & business loan applications</li>
              <li>Credit card inquiries & KYC review</li>
              <li>Document verification & underwriting</li>
            </ul>
            <div className="workflow-tagline">
              Application → KYC Verification → Processing → Approval
            </div>
            <button
              onClick={() => handleSelect('Financial', '/employee/financial-dashboard')}
              className="continue-btn"
              disabled={loadingModule === 'Financial'}
            >
              {loadingModule === 'Financial' ? 'Accessing Workspace...' : 'Enter Workspace →'}
            </button>
          </div>

          {/* 4. IT OPERATIONS */}
          <div className="work-card it">
            <div className="card-icon-box">💻</div>
            <h3>IT & Technical Operations</h3>
            <ul className="bullet-points">
              <li>Infrastructure health & system uptime</li>
              <li>Incident management & bug resolution</li>
              <li>Deployment pipelines & technical tasks</li>
            </ul>
            <div className="workflow-tagline">
              Incident → Diagnosis → Resolution → Deployment
            </div>
            <button
              onClick={() => handleSelect('IT', '/employee/it-dashboard')}
              className="continue-btn"
              disabled={loadingModule === 'IT'}
            >
              {loadingModule === 'IT' ? 'Accessing Workspace...' : 'Enter Workspace →'}
            </button>
          </div>
        </div>

        <p className="select-footer-note">
          Work hours and activity logging commence upon workspace selection and conclude upon logout.
        </p>
      </main>
    </div>
  );
}

