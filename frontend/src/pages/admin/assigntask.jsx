import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AssignTask() {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    title: '', description: '', module: 'Recruitment', assigned_to: '', priority: 'Medium', due_date: ''
  });
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data } = await api.get('/admin/live-employees');
        setEmployees(data);
      } catch (err) { console.error(err); }
    };
    fetchEmployees();
  }, []);

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    setFormData({ ...formData, assigned_to: empId });
    const emp = employees.find(emp => emp.id.toString() === empId);
    setSelectedEmp(emp);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', formData);
      setMessage('✅ Task assigned successfully!');
      setTimeout(() => navigate('/admin/dashboard'), 1500);
    } catch {
      setMessage('❌ Failed to assign task');
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div style={{ display: 'flex', padding: '30px', gap: '30px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ flex: 2, background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginBottom: '5px', color: '#1e293b' }}>Assign Task</h2>
        <p style={{ color: '#64748b', marginBottom: '25px', fontSize: '14px' }}>Give work to an employee. They see it on their dashboard instantly.</p>

        {message && <div style={{ padding: '12px', marginBottom: '20px', background: message.includes('✅') ? '#dcfce7' : '#fee2e2', color: message.includes('✅') ? '#166534' : '#991b1b', borderRadius: '8px', fontWeight: 'bold' }}>{message}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#475569' }}>Module *</label>
              <select name="module" onChange={handleChange} style={{ width: '100%', padding: '12px', marginTop: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}>
                <option value="Recruitment">Recruitment</option>
                <option value="Business">Business / CRM</option>
                <option value="Financial">Financial</option>
                <option value="IT">IT</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#475569' }}>Employee *</label>
              <select required name="assigned_to" onChange={handleEmployeeChange} style={{ width: '100%', padding: '12px', marginTop: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}>
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontWeight: '600', fontSize: '13px', color: '#475569' }}>Task Title *</label>
            <input required name="title" onChange={handleChange} style={{ width: '100%', padding: '12px', marginTop: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }} placeholder="e.g. Screen 10 resumes" />
          </div>

          <div>
            <label style={{ fontWeight: '600', fontSize: '13px', color: '#475569' }}>Description</label>
            <textarea name="description" onChange={handleChange} rows="3" style={{ width: '100%', padding: '12px', marginTop: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}></textarea>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#475569' }}>Priority</label>
              <select name="priority" onChange={handleChange} style={{ width: '100%', padding: '12px', marginTop: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#475569' }}>Due Date</label>
              <input type="date" name="due_date" onChange={handleChange} style={{ width: '100%', padding: '12px', marginTop: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <button type="submit" style={{ flex: 1, padding: '14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Assign Task</button>
            <button type="button" onClick={() => navigate('/admin/dashboard')} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
          </div>
        </form>
      </div>

      {/* RIGHT SIDE: WORKLOAD PANEL */}
      <div style={{ flex: 1, background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', height: 'fit-content' }}>
        <h3 style={{ color: '#1e293b', marginBottom: '20px', fontSize: '18px' }}>
          {selectedEmp ? `${selectedEmp.name}: Workload` : 'Workload Preview'}
        </h3>
        {selectedEmp ? (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                <h4 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>3</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Pending</p>
              </div>
              <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                <h4 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>2</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>In Progress</p>
              </div>
              <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                <h4 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>5</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Done</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '20px' }}>
              Status: <span style={{ color: '#10b981', fontWeight: 'bold' }}>● Working</span>
            </p>
          </div>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>Select an employee to view their workload.</p>
        )}
      </div>
    </div>
  );
}