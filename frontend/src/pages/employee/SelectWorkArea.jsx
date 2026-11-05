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
          <h1>Select your work area</h1>
          <p>Choose the module you are working in today. Your login time and all tasks will be saved under it.</p>
        </div>

        <div className="cards-grid">
          {/* 1. RECRUITMENT */}
          <div className="work-card recruitment">
            <div className="card-icon-box">👥</div>
            <h3>Recruitment Management</h3>
            <ul className="bullet-points">
              <li>Jobs and vacancies</li>
              <li>Candidates and resumes</li>
              <li>Interview scheduling</li>
            </ul>
            <div className="workflow-tagline">
              Candidate → Job → Interview → Selection
            </div>
            <button
              onClick={() => handleSelect('Recruitment', '/employee/recruitment-dashboard')}
              className="continue-btn"
              disabled={loadingModule === 'Recruitment'}
            >
              {loadingModule === 'Recruitment' ? 'Loading...' : 'Continue →'}
            </button>
          </div>

          {/* 2. BUSINESS / CRM */}
          <div className="work-card crm">
            <div className="card-icon-box">🤝</div>
            <h3>Business / CRM Management</h3>
            <ul className="bullet-points">
              <li>Clients and companies</li>
              <li>Business leads</li>
              <li>Follow-ups and conversion</li>
            </ul>
            <div className="workflow-tagline">
              Lead → Follow-up → Client → Conversion
            </div>
            <button
              onClick={() => handleSelect('Business', '/employee/crm-dashboard')}
              className="continue-btn"
              disabled={loadingModule === 'Business'}
            >
              {loadingModule === 'Business' ? 'Loading...' : 'Continue →'}
            </button>
          </div>

          {/* 3. FINANCIAL SERVICES */}
          <div className="work-card financial">
            <div className="card-icon-box">💳</div>
            <h3>Financial Services Management</h3>
            <ul className="bullet-points">
              <li>Credit card & loan enquiries</li>
              <li>Document collection</li>
              <li>Application status tracking</li>
            </ul>
            <div className="workflow-tagline">
              Customer → Enquiry → Application → Verification → Status
            </div>
            <button
              onClick={() => handleSelect('Financial', '/employee/financial-dashboard')}
              className="continue-btn"
              disabled={loadingModule === 'Financial'}
            >
              {loadingModule === 'Financial' ? 'Loading...' : 'Continue →'}
            </button>
          </div>
        </div>

        <p className="select-footer-note">
          ⏱️ Your work session starts when you choose a module and ends when you log out.
        </p>
      </main>
    </div>
  );
}

