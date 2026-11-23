import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const QUICK_TEMPLATES = {
  IT: [
    { title: 'Database Performance & Optimization', desc: 'Inspect slow queries, optimize connection pooling, and monitor memory consumption.' },
    { title: 'Server Health & System Audit', desc: 'Check CPU/RAM usage, firewall configurations, and server uptime metrics.' },
    { title: 'Frontend Build & Bug Verification', desc: 'Run build diagnostics, verify cross-browser compatibility, and fix console warnings.' },
    { title: 'API Integration & Service Deploy', desc: 'Deploy latest endpoint updates, test API response schemas, and verify JWT authentication.' }
  ],
  Financial: [
    { title: 'Verify KYC Documents for Loan Applicant', desc: 'Audit submitted PAN Card, Aadhaar, and 6-month bank statements for verification.' },
    { title: 'Credit Card Application Underwriting', desc: 'Evaluate monthly income, employment stability, and CIBIL score for card issuance.' },
    { title: 'Loan Sanction & Disbursal Clearance', desc: 'Review approval checklists and clear files for final loan sanction and disbursal.' },
    { title: 'Customer KYC Follow-up & Resolution', desc: 'Reach out to customer regarding pending address proof or bank statement updates.' }
  ],
  Recruitment: [
    { title: 'Screen 20 Shortlisted Resumes', desc: 'Review candidate applications against key technical qualifications and experience.' },
    { title: 'Schedule Technical Interview Rounds', desc: 'Coordinate time slots with interviewers and send Google Meet invites to candidates.' },
    { title: 'Update Interview Evaluation Records', desc: 'Collate interviewer feedback, calculate scorecards, and update hiring pipeline status.' },
    { title: 'Candidate Offer Letter & Onboarding', desc: 'Prepare offer letters, verify educational credentials, and schedule orientation.' }
  ],
  Business: [
    { title: 'Follow Up on Enterprise Client Proposal', desc: 'Contact decision-maker, address commercial terms, and coordinate contract signing.' },
    { title: 'Qualify 10 Inbound Website Leads', desc: 'Call incoming leads, understand project scope, budget allocation, and target launch.' },
    { title: 'Prepare Client Presentation & Scope', desc: 'Draft BPM solutions presentation, client deliverables outline, and pricing tier.' },
    { title: 'Update CRM Meeting Logs & Action Items', desc: 'Log recent client consultation notes, schedule follow-up dates, and notify account team.' }
  ]
};

export default function AssignTask() {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    module: 'Recruitment',
    assigned_to: '',
    priority: 'Medium',
    due_date: ''
  });
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [filterModule, setFilterModule] = useState('ALL');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data } = await api.get('/admin/live-employees');
        // Exclude Admin from assignable employees list
        const emps = Array.isArray(data) ? data.filter(e => e.role !== 'Admin') : [];
        setEmployees(emps);
      } catch (err) {
        console.error('Error fetching employees:', err);
      }
    };
    fetchEmployees();
  }, []);

  // Filtered employees according to selected module filter or form module
  const displayedEmployees = employees.filter(emp => {
    if (filterModule === 'ALL') return true;
    return emp.module === filterModule;
  });

  const handleModuleChange = (e) => {
    const newModule = e.target.value;
    setFilterModule(newModule);
    setFormData(prev => {
      // Check if current assigned_to matches the new module
      const currentEmp = employees.find(emp => emp.id.toString() === prev.assigned_to);
      let newAssignedTo = prev.assigned_to;
      let newSelectedEmp = currentEmp;

      if (currentEmp && currentEmp.module && currentEmp.module !== newModule) {
        // Find an employee in the new module
        const matchingEmp = employees.find(emp => emp.module === newModule);
        newAssignedTo = matchingEmp ? matchingEmp.id.toString() : '';
        newSelectedEmp = matchingEmp || null;
      }
      setSelectedEmp(newSelectedEmp);
      return { ...prev, module: newModule, assigned_to: newAssignedTo };
    });
  };

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    const emp = employees.find(e => e.id.toString() === empId);
    setSelectedEmp(emp || null);
    setFormData(prev => ({
      ...prev,
      assigned_to: empId,
      // Auto-set module to employee's department if available
      module: emp?.module || prev.module
    }));
    if (emp?.module) {
      setFilterModule(emp.module);
    }
  };

  const applyTemplate = (tpl) => {
    setFormData(prev => ({
      ...prev,
      title: tpl.title,
      description: tpl.desc
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assigned_to) {
      setMessage('❌ Please select an employee to assign this task');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/tasks', formData);
      setMessage('✅ Task assigned successfully! Employee dashboard will update immediately.');
      setTimeout(() => navigate('/admin/dashboard'), 1500);
    } catch (err) {
      setMessage(`❌ Failed to assign task: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getModuleBadgeStyle = (mod) => {
    switch (mod) {
      case 'IT': return { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' };
      case 'Financial': return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' };
      case 'Business': return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
      case 'Recruitment': return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  return (
    <div style={{ display: 'flex', padding: '30px', gap: '30px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* LEFT: TASK ASSIGNMENT FORM */}
      <div style={{ flex: 2, background: '#fff', padding: '32px', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '24px', fontWeight: 700 }}>Assign Department Task</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Assign work directly to an employee. It appears live on their dashboard instantly.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
          >
            ← Back to Admin
          </button>
        </div>

        {message && (
          <div style={{
            padding: '14px 18px', marginBottom: '22px',
            background: message.includes('✅') ? '#dcfce7' : '#fee2e2',
            color: message.includes('✅') ? '#166534' : '#991b1b',
            borderRadius: '10px', fontWeight: '600', fontSize: '14px',
            border: message.includes('✅') ? '1px solid #86efac' : '1px solid #fca5a5'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* ROW 1: DEPARTMENT & EMPLOYEE SELECTION */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
                Department / Module *
              </label>
              <select
                name="module"
                value={formData.module}
                onChange={handleModuleChange}
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px', background: '#fff', fontWeight: 600, color: '#0f172a' }}
              >
                <option value="Recruitment">Recruitment (HR)</option>
                <option value="Business">Business / CRM</option>
                <option value="Financial">Financial Advisory</option>
                <option value="IT">IT Engineering</option>
              </select>
            </div>

            <div style={{ flex: 1.3, minWidth: '260px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontWeight: 600, fontSize: '13.5px', color: '#334155' }}>
                  Assign To Employee *
                </label>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Showing {filterModule === 'ALL' ? 'All' : filterModule} ({displayedEmployees.length})
                </span>
              </div>
              <select
                required
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleEmployeeChange}
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px', background: '#fff', color: '#0f172a', fontWeight: 500 }}
              >
                <option value="">-- Select Employee --</option>
                {displayedEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — [{emp.module || 'General'}] ({emp.session_status === 'Working' ? '🟢 Online' : emp.session_status === 'Break' ? '☕ On Break' : '⚪ Offline'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* QUICK TEMPLATES PILLS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: 600, fontSize: '12.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚡ Quick {formData.module} Templates (Click to fill)
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(QUICK_TEMPLATES[formData.module] || []).map((tpl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => applyTemplate(tpl)}
                  style={{
                    padding: '6px 12px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '20px',
                    fontSize: '12px',
                    color: '#334155',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                >
                  + {tpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* ROW 2: TASK TITLE */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
              Task Title *
            </label>
            <input
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
              placeholder={`e.g. ${formData.module === 'IT' ? 'Optimize MySQL connection pool' : formData.module === 'Financial' ? 'Verify loan documents for applicant' : 'Screen candidate resumes'}`}
            />
          </div>

          {/* ROW 3: DESCRIPTION */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
              Detailed Description & Specifications
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
              placeholder="Provide specific guidelines, verification criteria, or deliverables expected..."
            />
          </div>

          {/* ROW 4: PRIORITY & DUE DATE */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
                Priority Level
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px', background: '#fff' }}
              >
                <option value="High">🔴 High Priority (Immediate)</option>
                <option value="Medium">🟡 Medium Priority (Standard)</option>
                <option value="Low">🟢 Low Priority (Routine)</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: '15px', marginTop: '12px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1.5,
                padding: '14px',
                background: submitting ? '#94a3b8' : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '15px',
                boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
              }}
            >
              {submitting ? 'Assigning Task...' : '🚀 Assign Task to Employee'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              style={{
                flex: 1,
                padding: '14px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT SIDE: EMPLOYEE WORKLOAD & REAL-TIME PREVIEW */}
      <div style={{ flex: 1, background: '#fff', padding: '26px', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', height: 'fit-content' }}>
        <h3 style={{ color: '#0f172a', margin: '0 0 16px 0', fontSize: '17px', fontWeight: 700 }}>
          {selectedEmp ? 'Employee Workload Profile' : 'Workload Preview'}
        </h3>

        {selectedEmp ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9', marginBottom: '16px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px' }}>
                {selectedEmp.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{selectedEmp.name}</h4>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{
                    ...getModuleBadgeStyle(selectedEmp.module),
                    padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: `1px solid ${getModuleBadgeStyle(selectedEmp.module).border}`
                  }}>
                    {selectedEmp.module || 'General'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{selectedEmp.email}</span>
                </div>
              </div>
            </div>

            {/* LIVE KPI STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #f59e0b', textAlign: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: 700 }}>
                  {Math.max(0, (selectedEmp.tasks_total || 0) - (selectedEmp.tasks_done || 0))}
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Active</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #10b981', textAlign: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: 700 }}>
                  {selectedEmp.tasks_done || 0}
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Done</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #3b82f6', textAlign: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: 700 }}>
                  {selectedEmp.tasks_total || 0}
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Total</p>
              </div>
            </div>

            {/* LIVE ACTIVITY STATUS */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>Session Status</span>
                <span style={{
                  padding: '3px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                  background: selectedEmp.session_status === 'Working' ? '#dcfce7' : selectedEmp.session_status === 'Break' ? '#fef3c7' : '#f1f5f9',
                  color: selectedEmp.session_status === 'Working' ? '#166534' : selectedEmp.session_status === 'Break' ? '#b45309' : '#64748b'
                }}>
                  ● {selectedEmp.session_status || 'Offline'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#475569' }}>
                <strong>Today's Working Time:</strong> {Math.floor((selectedEmp.working_minutes || 0) / 60)}h {(selectedEmp.working_minutes || 0) % 60}m
              </div>
            </div>

            {/* CURRENT TASK */}
            <div style={{ background: '#eff6ff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', marginBottom: '4px' }}>
                Currently Working On
              </div>
              <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>
                {selectedEmp.current_task || 'No active task currently running'}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>👤</div>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>Select an employee to inspect their active workload and current status.</p>
          </div>
        )}
      </div>
    </div>
  );
}
