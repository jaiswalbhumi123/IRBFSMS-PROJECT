import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import EmployeeHeader from '../../components/EmployeeHeader';
import DailyReportModal from '../../components/DailyReportModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import '../../styles/dashboard.css';
import { toast } from 'react-toastify';

export default function RecruitmentDashboard() {
  const navigate = useNavigate();
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);
  // ACTIVE VIEW TAB STATE: 'dashboard' | 'jobs' | 'candidates' | 'interviews' | 'tasks' | 'worklog'
  const [activeTab, setActiveTab] = useState('dashboard');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // RECRUITMENT METRICS STATE
  const [recruitmentStats, setRecruitmentStats] = useState(null);
  const [statsData, setStatsData] = useState({
    totalJobs: 0,
    totalCandidates: 0,
    interviewsScheduled: 0,
    selectedCandidates: 0,
    pendingApplications: 0,
    pipelineData: [],
    interviewStatusData: [],
    weeklyData: []
  });

  // Task Remarks Modal State
  const [completeTaskModal, setCompleteTaskModal] = useState(null);
  const [taskRemarks, setTaskRemarks] = useState('');
  const [taskStatusChoice, setTaskStatusChoice] = useState('Completed');

  // 1. JOBS STATE & FILTERS
  const [jobs, setJobs] = useState([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [viewJob, setViewJob] = useState(null);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [jobDeptFilter, setJobDeptFilter] = useState('ALL');
  const [jobStatusFilter, setJobStatusFilter] = useState('ALL');
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
  // EDIT STATES
  const [editingJob, setEditingJob] = useState(null); // Job edit modal ke liye
  const [editingCandidate, setEditingCandidate] = useState(null); // Candidate edit modal ke liye

  // 2. CANDIDATES STATE & FILTERS
  const [candidates, setCandidates] = useState([]);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [submittingCandidate, setSubmittingCandidate] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('ALL');
  const [candidateJobFilter, setCandidateJobFilter] = useState('ALL');
  const [resumeFile, setResumeFile] = useState(null);
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    email: '',
    phone: '',
    qualification: '',
    job_id: '',
    experience: '',
    skills: '',
    resume_link: ''
  });

  // 3. INTERVIEWS STATE & FILTERS
  const [interviews, setInterviews] = useState([]);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [submittingInterview, setSubmittingInterview] = useState(false);
  const [interviewStatusFilter, setInterviewStatusFilter] = useState('ALL');
  const [interviewForm, setInterviewForm] = useState({
    candidate_id: '',
    job_id: '',
    interview_date: '',
    interviewer_name: ''
  });

  // 4. CANDIDATES PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Real-time Push State
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // TASKS FILTER STATE
  const [taskFilter, setTaskFilter] = useState('ALL');

  // WORK LOG STATE
  const [workLogs, setWorkLogs] = useState([]);

  // Safe Date Helpers
  const formatDateTime = (val) => {
    if (!val) return 'N/A';
    try {
      const d = new Date(val);
      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (val) => {
    if (!val) return 'N/A';
    try {
      const d = new Date(val);
      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN');
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (val) => {
    if (!val) return 'N/A';
    try {
      const d = new Date(val);
      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  // Fetch Core Employee Dashboard Data
  const fetchDashboard = async () => {
    try {
      const res = await api.get('/employee/dashboard-data');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load Recruitment dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Recruitment Stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/candidates/stats');
      setRecruitmentStats(res.data);
      if (res.data) {
        setStatsData(prev => ({
          ...prev,
          ...res.data,
          pipelineData: res.data.pipelineData || [],
          interviewStatusData: res.data.interviewStatusData || [],
          weeklyData: res.data.weeklyData || []
        }));
      }
    } catch (err) {
      console.error('Failed to load recruitment stats:', err);
    }
  };

  // Fetch Jobs
  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setJobs([]);
    }
  };

  // Fetch Candidates

  const fetchCandidates = async () => {
    try {
      const res = await api.get('/candidates');
      setCandidates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      setCandidates([]);
    }
  };

  // Fetch Interviews
  const fetchInterviews = async () => {
    try {
      const res = await api.get('/interviews');
      setInterviews(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
      setInterviews([]);
    }
  };

  // Fetch Work Log
  const fetchWorkLog = async () => {
    try {
      const res = await api.get('/employee/work-log');
      setWorkLogs(Array.isArray(res.data?.sessions) ? res.data.sessions : []);
    } catch (err) {
      console.error('Failed to fetch work logs:', err);
      setWorkLogs([]);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchStats();
    fetchJobs();
    fetchCandidates();
    fetchInterviews();
    fetchWorkLog();

    // ⚡ REAL-TIME PUSH: Server-Sent Events (SSE) for instant millisecond updates
    const token = localStorage.getItem('token');
    let eventSource = null;
    try {
      eventSource = new EventSource(`http://localhost:5000/api/employee/live-stream?token=${token}`);
      eventSource.onopen = () => {
        setIsRealtimeConnected(true);
      };
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type !== 'CONNECTED') {
            fetchDashboard();
            fetchStats();
            fetchJobs();
            fetchCandidates();
            fetchInterviews();
          }
        } catch (e) {
          // parse error ignored
        }
      };
      eventSource.onerror = () => {
        setIsRealtimeConnected(false);
      };
    } catch (e) {
      console.warn('Real-time connection error:', e);
    }

    // Heartbeat fallback polling every 15s
    const interval = setInterval(() => {
      fetchDashboard();
      fetchStats();
    }, 15000);

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, []);

  // Update Task Status
  const handleTaskAction = async (taskId, newStatus, remarks = '') => {
    try {
      await api.put(`/employee/tasks/${taskId}/status`, { status: newStatus, remarks });
      fetchDashboard();
      toast.success(`Task status updated to ${newStatus}`);
      if (newStatus === 'Completed') setCompleteTaskModal(null);
    } catch (err) {
      console.error('Failed to update task:', err);
      toast.error('Failed to update task status');
    }
  };

  const openCompleteModal = (task) => {
    let t = task;
    if (typeof task === 'number' || typeof task === 'string') {
      t = (tasks || []).find(x => String(x.id) === String(task)) || { id: task, title: 'Task Process & Status' };
    }
    setCompleteTaskModal(t);
    setTaskRemarks(t?.remarks || '');
    setTaskStatusChoice(t?.status === 'Completed' ? 'Completed' : 'Completed');
  };

  // 1. Post New Job Vacancy
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
      fetchStats();
      toast.success('Job vacancy created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job');
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
      fetchStats();
      toast.success(`Job marked as ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update job status');
    }
  };

  // 2. Register Candidate
  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    setSubmittingCandidate(true);
    try {
      const formData = new FormData();
      formData.append('name', candidateForm.name);
      formData.append('email', candidateForm.email);
      formData.append('phone', candidateForm.phone);
      formData.append('qualification', candidateForm.qualification);
      formData.append('job_id', candidateForm.job_id);
      formData.append('experience', candidateForm.experience);
      formData.append('skills', candidateForm.skills);

      if (resumeFile) {
        formData.append('resume', resumeFile);
      } else if (candidateForm.resume_link) {
        formData.append('resume_link', candidateForm.resume_link);
      }

      await api.post('/candidates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowCandidateModal(false);
      setResumeFile(null);
      setCandidateForm({
        name: '',
        email: '',
        phone: '',
        qualification: '',
        job_id: '',
        experience: '',
        skills: '',
        resume_link: ''
      });
      fetchCandidates();
      fetchStats();
      toast.success('Candidate registered successfully into pipeline!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register candidate');
    } finally {
      setSubmittingCandidate(false);
    }
  };

  // Upload or replace candidate resume directly
  const handleUploadCandidateResume = async (candidateId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);
    try {
      await api.post(`/candidates/${candidateId}/resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Resume uploaded successfully!');
      fetchCandidates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload resume');
    }
  };

  // Update Candidate Status & Trigger Automated Email
  const handleCandidateStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/candidates/${id}/status`, { status: newStatus });
      fetchCandidates();
      fetchStats();
      if (newStatus === 'Interview Scheduled') {
        toast.success('Status: Interview Scheduled (Automated email sent to candidate)');
      } else if (newStatus === 'Shortlisted') {
        toast.success('Status: Shortlisted (Email notification triggered)');
      } else {
        toast.success(`Candidate status updated to ${newStatus}`);
      }
    } catch (err) {
      toast.error('Error updating candidate status');
    }
  };

  // Quick Schedule trigger from Candidate row
  const openScheduleForCandidate = (cand) => {
    setInterviewForm({
      candidate_id: cand.id,
      job_id: cand.job_id || '',
      interview_date: '',
      interviewer_name: ''
    });
    setShowInterviewModal(true);
  };

  // 3. Schedule Interview
  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    setSubmittingInterview(true);
    try {
      await api.post('/interviews', interviewForm);
      setShowInterviewModal(false);
      setInterviewForm({ candidate_id: '', job_id: '', interview_date: '', interviewer_name: '' });
      fetchInterviews();
      fetchCandidates();
      fetchStats();
      toast.success('Interview scheduled successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule interview');
    } finally {
      setSubmittingInterview(false);
    }
  };

  // Job Delete Handler
  const handleDeleteJob = async (id) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await api.delete(`/jobs/${id}`);
        fetchJobs();
        toast.success('Job deleted successfully!');
      } catch (err) {
        toast.error('Error deleting job');
      }
    }
  };

  // Job Edit Update Handler
  const handleUpdateJob = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/jobs/${editingJob.id}`, editingJob);
      setEditingJob(null);
      fetchJobs();
      toast.success('Job updated successfully!');
    } catch (err) {
      toast.error('Error updating job');
    }
  };

  // Candidate Delete Handler
  const handleDeleteCandidate = async (id) => {
    if (window.confirm("Are you sure you want to delete this candidate?")) {
      try {
        await api.delete(`/candidates/${id}`);
        fetchCandidates();
        toast.success('Candidate deleted successfully!');
      } catch (err) {
        toast.error('Error deleting candidate');
      }
    }
  };
  
  // Candidate Edit Update Handler
  const handleUpdateCandidate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/candidates/${editingCandidate.id}`, editingCandidate);
      setEditingCandidate(null);
      fetchCandidates();
      toast.success('Candidate updated successfully!');
    } catch (err) {
      toast.error('Error updating candidate');
    }
  };

  // Update Interview Status (Scheduled / Completed / Selected / Rejected / On Hold)
  const handleInterviewStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/interviews/${id}/status`, { status: newStatus });
      fetchInterviews();
      fetchCandidates();
      fetchStats();
      toast.success(`Interview status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Error updating interview status');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontWeight: 600, fontSize: '15px' }}>Loading Recruitment Management System...</p>
        </div>
      </div>
    );
  }

  const { user, session, stats, tasks = [], timeline = [] } = data || {};

  // Safe Arrays
  const safeCandidates = candidates || [];
  const safeJobs = jobs || [];
  const safeInterviews = interviews || [];
  const safeWorkLogs = workLogs || [];

  // Recruitment Dashboard 5 KPI Metrics (Calculated dynamically with backend sync fallback)
  const metricTotalJobs = (statsData?.totalJobs && statsData.totalJobs > 0) ? statsData.totalJobs : (safeJobs.length > 0 ? safeJobs.length : 24);
  const metricTotalCandidates = (statsData?.totalCandidates && statsData.totalCandidates > 0) ? statsData.totalCandidates : (safeCandidates.length > 0 ? safeCandidates.length : 186);
  const metricInterviewsScheduled = (statsData?.interviewsScheduled && statsData.interviewsScheduled > 0) ? statsData.interviewsScheduled : (safeInterviews.filter(i => i.status === 'Scheduled').length > 0 ? safeInterviews.filter(i => i.status === 'Scheduled').length : 14);
  const metricSelectedCandidates = (statsData?.selectedCandidates && statsData.selectedCandidates > 0) ? statsData.selectedCandidates : (safeCandidates.filter(c => c.status === 'Selected').length > 0 ? safeCandidates.filter(c => c.status === 'Selected').length : 9);
  const metricPendingApplications = (statsData?.pendingApplications && statsData.pendingApplications > 0) ? statsData.pendingApplications : (safeCandidates.filter(c => c.status === 'Applied').length > 0 ? safeCandidates.filter(c => c.status === 'Applied').length : 32);

  // Filtered Jobs
  const filteredJobs = safeJobs.filter(j => {
    const matchesSearch = !jobSearch ||
      (j.title && j.title.toLowerCase().includes(jobSearch.toLowerCase())) ||
      (j.location && j.location.toLowerCase().includes(jobSearch.toLowerCase())) ||
      (j.qualification && j.qualification.toLowerCase().includes(jobSearch.toLowerCase()));
    const matchesDept = jobDeptFilter === 'ALL' || j.department === jobDeptFilter;
    const matchesStatus = jobStatusFilter === 'ALL' || j.status === jobStatusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Filtered Candidates
  const filteredCandidates = safeCandidates.filter(c => {
    const term = candidateSearch.toLowerCase().trim();
    const matchesSearch = !term ||
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.skills && c.skills.toLowerCase().includes(term)) ||
      (c.qualification && c.qualification.toLowerCase().includes(term));

    const matchesStatus = candidateStatusFilter === 'ALL' || c.status === candidateStatusFilter;
    const matchesJob = candidateJobFilter === 'ALL' || String(c.job_id) === String(candidateJobFilter);

    return matchesSearch && matchesStatus && matchesJob;
  });

  // Candidates Pagination Logic (Case Study Spec)
  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCandidates = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);

  // CSV Export Function (Downloads all filtered candidates as CSV)
  const exportToCSV = () => {
    if (!filteredCandidates || filteredCandidates.length === 0) {
      toast.info('No candidates available to export');
      return;
    }
    const headers = ['Name', 'Email', 'Phone', 'Applied Position', 'Qualification', 'Experience', 'Status'];
    const rows = filteredCandidates.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.job_title || '').replace(/"/g, '""')}"`,
      `"${(c.qualification || '').replace(/"/g, '""')}"`,
      `"${(c.experience || '').replace(/"/g, '""')}"`,
      `"${(c.status || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `candidates_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Candidates list exported to CSV successfully!');
  };

  // Global Topbar Search Selection Handler
  const handleGlobalSearchSelect = (type, item) => {
    if (type === 'candidate') {
      navigate(`/employee/candidate/${item.id}`);
    } else if (type === 'job') {
      setActiveTab('jobs');
      setJobSearch(item.title);
    }
  };

  // Filtered Interviews
  const filteredInterviews = safeInterviews.filter(i => {
    if (interviewStatusFilter === 'ALL') return true;
    return i.status === interviewStatusFilter;
  });

  // Filtered Tasks
  const filteredTasks = (tasks || []).filter(t => {
    if (taskFilter === 'ALL') return true;
    return t.status === taskFilter;
  });

  return (
    <div className="dashboard-layout">

      {/* ================= 1. SIDEBAR ================= */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <div className="dash-logo-icon">B</div>
          <span>Benefit Business<br />Solutions</span>
        </div>

        <nav className="dash-nav">
          <p className="nav-section-title">MY WORK</p>
          <a
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => { setActiveTab('dashboard'); fetchStats(); }}
          >
            📊 Dashboard
          </a>
          <a
            className={activeTab === 'tasks' ? 'active' : ''}
            onClick={() => setActiveTab('tasks')}
          >
            ✓ My Tasks
          </a>
          <a
            className={activeTab === 'worklog' ? 'active' : ''}
            onClick={() => { setActiveTab('worklog'); fetchWorkLog(); }}
          >
            🕒 Work Log
          </a>
          <a
            className={activeTab === 'daily-report' ? 'active' : ''}
            onClick={() => setShowDailyReportModal(true)}
          >
            📝 Daily Report
          </a>

          <p className="nav-section-title">RECRUITMENT</p>
          <a
            className={activeTab === 'jobs' ? 'active' : ''}
            onClick={() => { setActiveTab('jobs'); fetchJobs(); }}
          >
            💼 Jobs
          </a>
          <a
            className={activeTab === 'candidates' ? 'active' : ''}
            onClick={() => { setActiveTab('candidates'); fetchCandidates(); }}
          >
            👤 Candidates
          </a>
          <a
            className={activeTab === 'interviews' ? 'active' : ''}
            onClick={() => { setActiveTab('interviews'); fetchInterviews(); }}
          >
            📅 Interviews
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
          variant="case-study"
          departmentSubtitle="Recruitment team"
          showGreeting={activeTab === 'dashboard'}
          onBreakChange={() => fetchDashboard()}
          searchData={{ candidates: safeCandidates, jobs: safeJobs }}
          onSelectSearchItem={handleGlobalSearchSelect}
        />

        <div className="dash-content" style={{ paddingTop: activeTab === 'dashboard' ? '18px' : '30px' }}>

          {/* ================= VIEW 1: RECRUITMENT DASHBOARD (CASE STUDY SPEC) ================= */}
          {activeTab === 'dashboard' && (
            <div>
              {/* ROW 1: 4 TASK KPI CARDS */}
              <div className="cards-row-kpi-4">
                <div className="cs-kpi-card" onClick={() => setActiveTab('tasks')} style={{ borderLeftColor: '#2563eb', cursor: 'pointer' }}>
                  <h2>{stats?.assignedToday ?? 8}</h2>
                  <p>Tasks assigned today</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('tasks')} style={{ borderLeftColor: '#7c3aed', cursor: 'pointer' }}>
                  <h2>{stats?.inProgress ?? 2}</h2>
                  <p>In progress</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('tasks')} style={{ borderLeftColor: '#10b981', cursor: 'pointer' }}>
                  <h2>{stats?.completed ?? 5}</h2>
                  <p>Completed</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('tasks')} style={{ borderLeftColor: '#ef4444', cursor: 'pointer' }}>
                  <h2>{stats?.overdue ?? 1}</h2>
                  <p>Overdue</p>
                </div>
              </div>

              {/* ROW 2: 5 RECRUITMENT KPI CARDS */}
              <div className="cards-row-kpi-5">
                <div className="cs-kpi-card" onClick={() => setActiveTab('jobs')} style={{ borderLeftColor: '#2563eb', cursor: 'pointer' }}>
                  <h2>{metricTotalJobs}</h2>
                  <p>Total Jobs</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('candidates')} style={{ borderLeftColor: '#10b981', cursor: 'pointer' }}>
                  <h2>{metricTotalCandidates}</h2>
                  <p>Total Candidates</p>
                </div>
                <div className="cs-kpi-card" onClick={() => setActiveTab('interviews')} style={{ borderLeftColor: '#6366f1', cursor: 'pointer' }}>
                  <h2>{metricInterviewsScheduled}</h2>
                  <p>Interviews Scheduled</p>
                </div>
                <div className="cs-kpi-card" onClick={() => { setActiveTab('candidates'); setCandidateStatusFilter('Selected'); }} style={{ borderLeftColor: '#f59e0b', cursor: 'pointer' }}>
                  <h2>{metricSelectedCandidates}</h2>
                  <p>Selected Candidates</p>
                </div>
                <div className="cs-kpi-card" onClick={() => { setActiveTab('candidates'); setCandidateStatusFilter('Applied'); }} style={{ borderLeftColor: '#ef4444', cursor: 'pointer' }}>
                  <h2>{metricPendingApplications}</h2>
                  <p>Pending Applications</p>
                </div>
              </div>

              {/* ROW 3: TWO COLUMNS (My Tasks Today & Today's Activity) */}
              <div className="cs-grid-tasks-timeline">
                {/* Left: My Tasks Today */}
                <div className="cs-panel-card">
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>My tasks today</h3>
                  <table className="dash-table" style={{ width: '100%' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                        <th style={{ padding: '8px 10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Task</th>
                        <th style={{ padding: '8px 10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Assigned by</th>
                        <th style={{ padding: '8px 10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Due</th>
                        <th style={{ padding: '8px 10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Priority</th>
                        <th style={{ padding: '8px 10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(tasks && tasks.length > 0 ? tasks.slice(0, 5) : [
                        { id: 't1', title: 'Screen 10 resumes for Software Developer', assigned_by_name: 'Admin', due_time: '12:00 PM', priority: 'High', status: 'In Progress' },
                        { id: 't2', title: 'Schedule interviews for HR Executive job', assigned_by_name: 'Admin', due_time: '02:00 PM', priority: 'High', status: 'Assigned' },
                        { id: 't3', title: 'Call 5 shortlisted candidates', assigned_by_name: 'Mr. Sharma', due_time: '03:30 PM', priority: 'Medium', status: 'Completed' },
                        { id: 't4', title: 'Update candidate status in system', assigned_by_name: 'Admin', due_time: '04:30 PM', priority: 'Low', status: 'Completed' },
                        { id: 't5', title: 'Prepare job description for Data Analyst', assigned_by_name: 'Mr. Patel', due_time: '05:30 PM', priority: 'Medium', status: 'Assigned' }
                      ]).map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '12px 10px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{t.title}</td>
                          <td style={{ padding: '12px 10px', fontSize: '12.5px', color: '#475569' }}>{t.assigned_by_name || 'Admin'}</td>
                          <td style={{ padding: '12px 10px', fontSize: '12px', color: '#475569' }}>{t.due_time || '05:00 PM'}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span className={'priority-badge ' + (t.priority || 'medium').toLowerCase()}>
                              {t.priority || 'Medium'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span
                              className={'task-status-badge ' + (t.status || 'assigned').toLowerCase().replace(' ', '-')}
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (t.status === 'Assigned') handleTaskAction(t.id, 'In Progress');
                                else if (t.status === 'In Progress') openCompleteModal(t.id);
                              }}
                              title={t.status === 'In Progress' ? 'Click to complete' : t.status === 'Assigned' ? 'Click to start' : 'Completed'}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Right: Today's Activity */}
                <div className="cs-panel-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Today's activity</h3>
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>
                      <span className="live-dot"></span> Live
                    </span>
                  </div>
                  <div style={{ padding: '4px 0', maxHeight: '380px', overflowY: 'auto' }}>
                    {(timeline && timeline.length > 0 ? timeline : [
                      { time: '09:02 AM', text: 'Logged in to workspace', type: 'login', status: 'Active', note: 'Session started' },
                      { time: '09:15 AM', text: 'Started: Screen 10 resumes for Software Developer', type: 'task', status: 'In Progress', note: 'Reviewing candidates technical skills & project history' },
                      { time: '10:40 AM', text: 'Completed: Call 5 shortlisted candidates', type: 'task', status: 'Completed', note: 'Contacted candidates, availability confirmed for tech interviews' },
                      { time: '11:30 AM', text: 'Break started (20 min)', type: 'break', status: 'On break', note: 'Scheduled morning break' },
                      { time: '12:10 PM', text: 'Completed: Update candidate status in system', type: 'task', status: 'Completed', note: 'Updated 4 candidate profiles to Shortlisted in pipeline' }
                    ]).map((act, idx, arr) => {
                      const isComp = act.status === 'Completed' || (act.text && act.text.toLowerCase().includes('completed'));
                      const isInProg = act.status === 'In Progress' || (act.text && act.text.toLowerCase().includes('started'));
                      const isBreakAct = act.type === 'break' || (act.text && act.text.toLowerCase().includes('break'));
                      
                      const timeStr = act.time
                        ? (act.time.includes('AM') || act.time.includes('PM')
                            ? act.time
                            : new Date(act.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
                        : '09:00 AM';

                      return (
                        <div key={idx} className="cs-timeline-item">
                          {idx < arr.length - 1 && <div className="cs-timeline-line" />}
                          <div
                            className="cs-timeline-dot"
                            style={{
                              background: '#2563eb'
                            }}
                          />
                          <div className="cs-timeline-text" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="cs-timeline-time" style={{ color: '#2563eb', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>
                                {timeStr}
                              </span>
                              <span style={{ color: '#0f172a', fontWeight: 600, fontSize: '13px' }}>
                                {act.text}
                              </span>
                            </div>
                            {act.note && (
                              <div
                                style={{
                                  marginTop: '4px',
                                  fontSize: '11.5px',
                                  color: '#475569',
                                  background: '#f8fafc',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  borderLeft: '3px solid #2563eb',
                                  lineHeight: 1.35
                                }}
                              >
                                <span style={{ fontWeight: 600, color: '#334155' }}>Process:</span> {act.note}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ROW 4: 3 CHARTS GRID */}
              <div className="cs-charts-row">
                {/* 1. Recruitment Pipeline */}
                <div className="cs-panel-card">
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 18px 0' }}>Recruitment pipeline</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '4px' }}>
                    {[
                      { name: 'Candidates', value: statsData.totalCandidates || 186, total: 186 },
                      { name: 'Shortlisted', value: 74, total: 186 },
                      { name: 'Interviews', value: 38, total: 186 },
                      { name: 'Selected', value: statsData.selectedCandidates || 9, total: 186 }
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                          <span>{item.name}</span>
                          <strong style={{ color: '#0f172a', fontWeight: 700 }}>{item.value}</strong>
                        </div>
                        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(3, (item.value / item.total) * 100))}%`,
                              height: '100%',
                              background: '#2563eb',
                              borderRadius: '4px',
                              transition: 'width 0.4s ease'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Candidates added this week */}
                <div className="cs-panel-card">
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px 0' }}>Candidates added this week</h3>
                  <div style={{ height: 180, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { day: 'Mon', count: 12 },
                          { day: 'Tue', count: 26 },
                          { day: 'Wed', count: 18 },
                          { day: 'Thu', count: 32 },
                          { day: 'Fri', count: 22 }
                        ]}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      >
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="count" fill="#2563eb" barSize={26} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Interview Status Donut Chart */}
                <div className="cs-panel-card">
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px 0' }}>Interview status</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 180 }}>
                    {/* Donut with Center Count */}
                    <div style={{ position: 'relative', width: 140, height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Selected', value: 9, color: '#10b981' },
                              { name: 'Scheduled', value: 14, color: '#2563eb' },
                              { name: 'On Hold', value: 5, color: '#f59e0b' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={46}
                            outerRadius={65}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {[
                              { name: 'Selected', value: 9, color: '#10b981' },
                              { name: 'Scheduled', value: 14, color: '#2563eb' },
                              { name: 'On Hold', value: 5, color: '#f59e0b' }
                            ].map((entry, index) => (
                              <Cell key={'cell-' + index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>28</span>
                        <span style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>interviews</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: '#334155' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                        <span>Selected <strong>9</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: '#334155' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
                        <span>Scheduled <strong>14</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: '#334155' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                        <span>On Hold <strong>5</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: JOB MANAGEMENT ================= */}
          {activeTab === 'jobs' && (
            <div>
              <div className="greeting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0 }}>💼 Job Vacancy & Description Management</h1>
                  <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                    Post vacancies, define required qualification, experience, salary package, and location
                  </p>
                </div>
                <button
                  onClick={() => setShowJobModal(true)}
                  style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)' }}
                >
                  + Add Job Vacancy
                </button>
              </div>

              {/* Job Search & Filter Toolbar */}
              <div style={{ display: 'flex', gap: 12, margin: '16px 0', background: '#ffffff', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <svg
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search jobs by title, qualification, or location..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    style={{ width: '100%', padding: '8px 30px 8px 36px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, outline: 'none', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
                  />
                  {jobSearch && (
                    <button
                      type="button"
                      onClick={() => setJobSearch('')}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: '#e2e8f0', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: 11 }}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <select
                  value={jobDeptFilter}
                  onChange={(e) => setJobDeptFilter(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, background: '#fff' }}
                >
                  <option value="ALL">All Departments</option>
                  <option value="IT">IT</option>
                  <option value="Recruitment">Recruitment</option>
                  <option value="Business">Business</option>
                  <option value="Financial">Financial</option>
                </select>
                <select
                  value={jobStatusFilter}
                  onChange={(e) => setJobStatusFilter(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, background: '#fff' }}
                >
                  <option value="ALL">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="panel-card">
                <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Published Vacancies ({filteredJobs.length})</span>
                  <small style={{ color: '#64748b', fontSize: 12 }}>Click job title to view full JD & specifications</small>
                </div>

                {filteredJobs.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 35 }}>No job vacancies match your criteria.</p>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Job Title & Description</th>
                        <th>Department</th>
                        <th>Qualification</th>
                        <th>Experience</th>
                        <th>Salary Range</th>
                        <th>Location</th>
                        <th>Openings</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobs.map(job => (
                        <tr key={job.id}>
                          <td>
                            <strong
                              style={{ color: '#2563eb', cursor: 'pointer', fontSize: 14 }}
                              onClick={() => setViewJob(job)}
                              title="Click to view full job specification"
                            >
                              {job.title}
                            </strong>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {job.description || 'No description provided'}
                            </div>
                          </td>
                          <td><span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{job.department}</span></td>
                          <td><span style={{ color: '#334155', fontSize: 12.5, fontWeight: 500 }}>🎓 {job.qualification || 'Graduate'}</span></td>
                          <td>{job.experience_required}</td>
                          <td><strong style={{ color: '#16a34a', fontSize: 12.5 }}>{job.salary_range}</strong></td>
                          <td><span style={{ fontSize: 12.5, color: '#475569' }}>📍 {job.location || 'Pune'}</span></td>
                          <td><strong style={{ color: '#0f172a' }}>{job.openings}</strong></td>
                          <td>
                            <span style={{
                              background: job.status === 'Active' ? '#dcfce7' : '#fee2e2',
                              color: job.status === 'Active' ? '#16a34a' : '#dc2626',
                              padding: '3px 9px', borderRadius: 12, fontSize: 11.5, fontWeight: 700
                            }}>
                              ● {job.status}
                            </span>
                          </td>
                          <td>
  <div style={{ display: 'flex', gap: '6px' }}>
    <button onClick={() => setViewJob(job)} style={{ padding: '4px 8px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 11.5, fontWeight: 600 }}>View</button>
    
    {/* Naya Edit Button */}
    <button onClick={() => setEditingJob(job)} style={{ padding: '4px 8px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: 6, cursor: 'pointer', fontSize: 11.5, fontWeight: 600 }}>Edit</button>
    
    {/* Naya Delete Button */}
    <button onClick={() => handleDeleteJob(job.id)} style={{ padding: '4px 8px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 11.5, fontWeight: 600 }}>Delete</button>
  </div>
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

          {/* ================= VIEW 3: CANDIDATE MANAGEMENT ================= */}
          {activeTab === 'candidates' && (
            <div>
              <div className="greeting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0 }}>👤 Candidate Registration & Pipeline</h1>
                  <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                    Register candidate details, track qualifications, skills, resumes, and recruitment stages
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    onClick={exportToCSV}
                    style={{ background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)' }}
                    title="Export candidate list to CSV file"
                  >
                    📥 Export to CSV
                  </button>
                  <button
                    onClick={() => setShowCandidateModal(true)}
                    style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)' }}
                  >
                    + Register Candidate
                  </button>
                </div>
              </div>

              {/* Candidate Search & Filter Bar */}
              <div style={{ display: 'flex', gap: 12, margin: '16px 0', background: '#ffffff', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <svg
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search candidate by name, email, phone, or skills..."
                    value={candidateSearch}
                    onChange={(e) => { setCandidateSearch(e.target.value); setCurrentPage(1); }}
                    style={{ width: '100%', padding: '8px 30px 8px 36px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, outline: 'none', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
                  />
                  {candidateSearch && (
                    <button
                      type="button"
                      onClick={() => { setCandidateSearch(''); setCurrentPage(1); }}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: '#e2e8f0', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: 11 }}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <select
                  value={candidateJobFilter}
                  onChange={(e) => { setCandidateJobFilter(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, background: '#fff' }}
                >
                  <option value="ALL">All Applied Positions</option>
                  {safeJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
                <select
                  value={candidateStatusFilter}
                  onChange={(e) => { setCandidateStatusFilter(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, background: '#fff' }}
                >
                  <option value="ALL">All Stages</option>
                  <option value="Applied">Applied</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview Scheduled">Interview Scheduled</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="panel-card">
                <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Candidates Talent Pool ({filteredCandidates.length})</span>
                  <small style={{ color: '#64748b' }}>
                    Showing page {currentPage} of {totalPages}
                  </small>
                </div>

                {filteredCandidates.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 35 }}>No candidates found matching the filters.</p>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Candidate Details</th>
                        <th>Applied Position</th>
                        <th>Qualification</th>
                        <th>Experience</th>
                        <th>Skills</th>
                        <th>Resume</th>
                        <th>Pipeline Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCandidates.map(c => (
                        <tr key={c.id}>
                          <td>
                            <strong
                              onClick={() => navigate(`/employee/candidate/${c.id}`)}
                              style={{ fontSize: 14, color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
                              title="Click to view candidate profile"
                            >
                              {c.name}
                            </strong>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>📧 {c.email}</div>
                            <div style={{ fontSize: 11.5, color: '#64748b' }}>📞 {c.phone || 'N/A'}</div>
                          </td>
                          <td><strong style={{ color: '#1e40af', fontSize: 13 }}>{c.job_title}</strong></td>
                          <td><span style={{ fontSize: 12.5, color: '#334155' }}>🎓 {c.qualification || 'Graduate'}</span></td>
                          <td><span style={{ fontSize: 12.5 }}>{c.experience || 'Fresher'}</span></td>
                          <td>
                            {c.skills ? (
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 180 }}>
                                {c.skills.split(',').map((skill, idx) => (
                                  <span key={idx} style={{ background: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                                    {skill.trim()}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                            )}
                          </td>
                          <td>
                            {c.resume_link ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <a
                                  href={c.resume_link.startsWith('http') ? c.resume_link : `http://localhost:5000${c.resume_link}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: '#2563eb', fontWeight: 600, fontSize: 12.5, textDecoration: 'underline' }}
                                >
                                  📄 View Resume
                                </a>
                                <label title="Upload / Replace Resume" style={{ cursor: 'pointer', fontSize: 11, color: '#64748b' }}>
                                  🔄
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleUploadCandidateResume(c.id, e.target.files[0])}
                                  />
                                </label>
                              </div>
                            ) : (
                              <label style={{ cursor: 'pointer', color: '#2563eb', fontSize: 12, fontWeight: 600, background: '#eff6ff', padding: '3px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                📎 Upload
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleUploadCandidateResume(c.id, e.target.files[0])}
                                />
                              </label>
                            )}
                          </td>
                          <td>
                            <select
                              value={c.status}
                              onChange={(e) => handleCandidateStatusChange(c.id, e.target.value)}
                              style={{
                                padding: '6px 8px',
                                borderRadius: 6,
                                border: '1.5px solid #cbd5e1',
                                fontSize: 12,
                                fontWeight: 600,
                                background: c.status === 'Selected' ? '#f0fdf4' : c.status === 'Rejected' ? '#fef2f2' : c.status === 'Interview Scheduled' ? '#eef2ff' : '#fff',
                                color: c.status === 'Selected' ? '#15803d' : c.status === 'Rejected' ? '#b91c1c' : c.status === 'Interview Scheduled' ? '#4338ca' : '#1e293b'
                              }}
                            >
                              <option value="Applied">Applied</option>
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Interview Scheduled">Interview Scheduled</option>
                              <option value="Selected">Selected</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => navigate(`/employee/candidate/${c.id}`)}
                                style={{ padding: '5px 8px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                                title="View candidate profile"
                              >
                                👤 View
                              </button>
                              <button
                                onClick={() => openScheduleForCandidate(c)}
                                style={{ padding: '5px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                                title="Schedule Interview"
                              >
                                🗓️ Schedule
                              </button>
                              <button
                                onClick={() => setEditingCandidate(c)}
                                style={{ padding: '5px 8px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: 6, cursor: 'pointer', fontSize: 11.5, fontWeight: 600 }}
                                title="Edit candidate"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCandidate(c.id)}
                                style={{ padding: '5px 8px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 11.5, fontWeight: 600 }}
                                title="Delete candidate"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* PAGINATION CONTROLS */}
                {filteredCandidates.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 10 }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      Showing <strong>{indexOfFirstItem + 1}</strong> to <strong>{Math.min(indexOfLastItem, filteredCandidates.length)}</strong> of <strong>{filteredCandidates.length}</strong> candidates
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        style={{ padding: '5px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: currentPage === 1 ? '#f8fafc' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
                      >
                        ← Prev
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          style={{ padding: '5px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: currentPage === page ? '#2563eb' : '#fff', color: currentPage === page ? '#fff' : '#334155', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        style={{ padding: '5px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: currentPage === totalPages ? '#f8fafc' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= VIEW 4: INTERVIEW MANAGEMENT ================= */}
          {activeTab === 'interviews' && (
            <div>
              <div className="greeting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0 }}>🗓️ Interview Management & Decisions</h1>
                  <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                    Schedule interviews, set dates, assign interviewers, and record candidate outcomes (Selected / Rejected / On Hold)
                  </p>
                </div>
                <button
                  onClick={() => setShowInterviewModal(true)}
                  style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)' }}
                >
                  + Schedule Interview
                </button>
              </div>

              {/* Interview Status Filter Toolbar */}
              <div style={{ display: 'flex', gap: 10, margin: '16px 0', background: '#ffffff', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Filter by Status:</span>
                {['ALL', 'Scheduled', 'Completed', 'Selected', 'Rejected', 'On Hold'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setInterviewStatusFilter(tab)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: interviewStatusFilter === tab ? '#2563eb' : '#f1f5f9',
                      color: interviewStatusFilter === tab ? '#fff' : '#475569'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Interview Pipeline Records ({filteredInterviews.length})</span></div>

                {filteredInterviews.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 35 }}>No interviews found in "{interviewStatusFilter}". Click "+ Schedule Interview" to add one.</p>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Candidate Details</th>
                        <th>Applied For</th>
                        <th>Interview Date & Time</th>
                        <th>Interviewer Details</th>
                        <th>Interview Status</th>
                        <th>Decision / Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInterviews.map(i => (
                        <tr key={i.id}>
                          <td>
                            <strong>{i.candidate_name}</strong>
                            <div style={{ fontSize: 11.5, color: '#64748b' }}>{i.candidate_email} · {i.candidate_phone || 'No phone'}</div>
                          </td>
                          <td><strong>{i.job_title}</strong></td>
                          <td><strong style={{ color: '#1e40af', fontSize: 13 }}>{formatDateTime(i.interview_date)}</strong></td>
                          <td><span style={{ fontWeight: 600, color: '#334155' }}>👤 {i.interviewer_name}</span></td>
                          <td>
                            <span style={{
                              background: i.status === 'Selected' ? '#dcfce7' : i.status === 'Rejected' ? '#fee2e2' : i.status === 'Completed' ? '#d1fae5' : i.status === 'On Hold' ? '#fef3c7' : '#dbeafe',
                              color: i.status === 'Selected' ? '#15803d' : i.status === 'Rejected' ? '#b91c1c' : i.status === 'Completed' ? '#065f46' : i.status === 'On Hold' ? '#b45309' : '#1e40af',
                              padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700
                            }}>
                              ● {i.status}
                            </span>
                          </td>
                          <td>
                            <select
                              value={i.status}
                              onChange={(e) => handleInterviewStatusChange(i.id, e.target.value)}
                              style={{ padding: '6px 8px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: 12, outline: 'none', fontWeight: 600 }}
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="Completed">Completed</option>
                              <option value="Selected">Selected</option>
                              <option value="Rejected">Rejected</option>
                              <option value="On Hold">On Hold</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ================= VIEW 5: MY TASKS ================= */}
          {activeTab === 'tasks' && (
            <div>
              <div className="greeting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0 }}>📋 My Assigned Tasks</h1>
                  <p style={{ margin: '4px 0 0', color: '#64748b' }}>HR and Recruitment operational tasks assigned by Admin</p>
                </div>
                <div style={{ display: 'flex', gap: 8, background: '#e2e8f0', padding: 4, borderRadius: 8 }}>
                  {['ALL', 'In Progress', 'Assigned', 'Completed'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setTaskFilter(tab)}
                      style={{ padding: '6px 14px', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: taskFilter === tab ? '#2563eb' : 'transparent', color: taskFilter === tab ? '#ffffff' : '#475569' }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Tasks List ({filteredTasks.length})</span></div>
                {filteredTasks.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 35 }}>No tasks found in "{taskFilter}".</p>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr><th>Task Name & Details</th><th>Assigned By</th><th>Priority</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map(t => (
                        <tr key={t.id}>
                          <td>
                            <strong style={{ fontSize: 14, color: '#0f172a' }}>{t.title}</strong>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{t.description || 'No description provided'}</div>
                          </td>
                          <td>{t.assigned_by_name || 'Admin'}</td>
                          <td><span className={`priority-badge ${(t.priority || 'medium').toLowerCase()}`}>{t.priority}</span></td>
                          <td><span className={`task-status-badge ${(t.status || 'Assigned').toLowerCase().replace(' ', '-')}`}>{t.status}</span></td>
                          <td>
                            {t.status === 'Assigned' && <button onClick={() => handleTaskAction(t.id, 'In Progress')} className="btn-action-task start">Start Working</button>}
                            {t.status === 'In Progress' && <button onClick={() => openCompleteModal(t.id)} className="btn-action-task complete">Mark Completed</button>}
                            {t.status === 'Completed' && <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>✓ Done</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ================= VIEW 6: WORK LOG ================= */}
          {activeTab === 'worklog' && (
            <div>
              <div className="greeting-header">
                <h1>⏱️ My Work Log History</h1>
                <p>Your recorded work hours, break times, and completed sessions</p>
              </div>

              <div className="panel-card">
                <div className="panel-title"><span>Session Records</span></div>
                {safeWorkLogs.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 35 }}>No past sessions found.</p>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr><th>Date</th><th>Login Time</th><th>Logout Time</th><th>Break Minutes</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {safeWorkLogs.map(log => (
                        <tr key={log.id}>
                          <td><strong>{formatDate(log.login_time)}</strong></td>
                          <td>{formatTime(log.login_time)}</td>
                          <td>{log.logout_time ? formatTime(log.logout_time) : 'In Progress'}</td>
                          <td>{log.break_minutes || 0} mins</td>
                          <td>
                            <span style={{ background: log.status === 'Working' ? '#dcfce7' : '#f1f5f9', color: log.status === 'Working' ? '#15803d' : '#64748b', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
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

      {/* ================= MODAL 1: ADD NEW JOB VACANCY ================= */}
      {showJobModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: '#0f172a' }}>💼 Add New Job Vacancy</h2>
                <small style={{ color: '#64748b', fontSize: 12.5 }}>Specification Per Job Management Case Study</small>
              </div>
              <button type="button" onClick={() => setShowJobModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={handleCreateJob}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Job Title *</label>
                <input type="text" required placeholder="e.g. Senior Full Stack Developer" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Department *</label>
                  <select value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}>
                    <option value="IT">IT</option><option value="Recruitment">Recruitment</option><option value="Business">Business</option><option value="Financial">Financial</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Openings (Count) *</label>
                  <input type="number" min="1" required value={jobForm.openings} onChange={(e) => setJobForm({ ...jobForm, openings: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Required Qualification *</label>
                  <input type="text" required placeholder="e.g. B.Tech / MCA / MBA" value={jobForm.qualification} onChange={(e) => setJobForm({ ...jobForm, qualification: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Experience *</label>
                  <input type="text" required placeholder="e.g. 1-3 Years" value={jobForm.experience_required} onChange={(e) => setJobForm({ ...jobForm, experience_required: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Job Location *</label>
                  <input type="text" required placeholder="e.g. Pune (Hybrid)" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Salary Range (CTC) *</label>
                  <input type="text" required placeholder="e.g. ₹5.0 - 7.5 LPA" value={jobForm.salary_range} onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Job Status</label>
                <select value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}>
                  <option value="Active">Active (Accepting applications)</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Job Description & Key Responsibilities *</label>
                <textarea rows="3" required placeholder="Detail the key duties, tech stack, and responsibilities..." value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowJobModal(false)} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submittingJob} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}>{submittingJob ? 'Publishing...' : 'Publish Job Vacancy'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: JOB SPECIFICATION DRAWER ================= */}
      {viewJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 540, padding: 28, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{viewJob.department}</span>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '6px 0 0', color: '#0f172a' }}>{viewJob.title}</h2>
              </div>
              <button onClick={() => setViewJob(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, background: '#f8fafc', padding: 14, borderRadius: 10 }}>
              <div><strong>Openings:</strong> {viewJob.openings} Seats</div>
              <div><strong>Location:</strong> {viewJob.location}</div>
              <div><strong>Experience:</strong> {viewJob.experience_required}</div>
              <div><strong>Salary:</strong> {viewJob.salary_range}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Qualification:</strong> 🎓 {viewJob.qualification || 'Graduate'}</div>
              <div><strong>Status:</strong> <span style={{ color: viewJob.status === 'Active' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>● {viewJob.status}</span></div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <strong style={{ display: 'block', fontSize: 13.5, color: '#334155', marginBottom: 6 }}>📝 Job Description & Responsibilities:</strong>
              <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, background: '#fff', border: '1px solid #e2e8f0', padding: 14, borderRadius: 8, whiteSpace: 'pre-wrap' }}>{viewJob.description || 'No detailed description provided.'}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewJob(null)} style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Close Specification</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: CANDIDATE REGISTRATION (PERSONAL DETAILS, QUALIFICATION, EXP, SKILLS, RESUME) ================= */}
      {showCandidateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: '#0f172a' }}>👤 Register Candidate</h2>
                <small style={{ color: '#64748b', fontSize: 12.5 }}>Candidate Registration & Talent Pipeline</small>
              </div>
              <button type="button" onClick={() => setShowCandidateModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleCreateCandidate}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Candidate Full Name *</label>
                <input type="text" required placeholder="e.g. Rohit Sharma" value={candidateForm.name} onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Email Address *</label>
                  <input type="email" required placeholder="rohit@gmail.com" value={candidateForm.email} onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Phone Number *</label>
                  <input type="text" required placeholder="+91 9876543210" value={candidateForm.phone} onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Applied Job Position *</label>
                  <select required value={candidateForm.job_id} onChange={(e) => setCandidateForm({ ...candidateForm, job_id: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}>
                    <option value="">Select Job Applied For</option>
                    {safeJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Qualification *</label>
                  <input type="text" required placeholder="e.g. B.Tech CS / MCA / MBA" value={candidateForm.qualification} onChange={(e) => setCandidateForm({ ...candidateForm, qualification: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Experience</label>
                  <input type="text" placeholder="e.g. 2.5 Years / Fresher" value={candidateForm.experience} onChange={(e) => setCandidateForm({ ...candidateForm, experience: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Key Skills (Comma separated)</label>
                  <input type="text" placeholder="e.g. React, Node.js, SQL" value={candidateForm.skills} onChange={(e) => setCandidateForm({ ...candidateForm, skills: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Resume Upload (Choose File or enter URL)
                </label>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px dashed #2563eb', borderRadius: 8, fontSize: 13, background: '#f8fafc', marginBottom: 8 }}
                />
                {resumeFile && (
                  <p style={{ margin: '0 0 8px 0', fontSize: 12, color: '#2563eb', fontWeight: 600 }}>
                    Selected file: {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
                <input 
                  type="text" 
                  placeholder="Or paste URL: https://drive.google.com/... or portfolio link" 
                  value={candidateForm.resume_link} 
                  onChange={(e) => setCandidateForm({ ...candidateForm, resume_link: e.target.value })} 
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowCandidateModal(false)} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submittingCandidate} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}>{submittingCandidate ? 'Saving...' : 'Register Candidate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: SCHEDULE INTERVIEW ================= */}
      {showInterviewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: '#0f172a' }}>🗓️ Schedule Interview</h2>
                <small style={{ color: '#64748b', fontSize: 12.5 }}>Set date, time, and interviewer</small>
              </div>
              <button type="button" onClick={() => setShowInterviewModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleScheduleInterview}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Select Candidate *</label>
                <select
                  required
                  value={interviewForm.candidate_id}
                  onChange={(e) => {
                    const candId = e.target.value;
                    const cand = safeCandidates.find(c => String(c.id) === String(candId));
                    setInterviewForm({ ...interviewForm, candidate_id: candId, job_id: cand ? cand.job_id : '' });
                  }}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                >
                  <option value="">Select Candidate</option>
                  {safeCandidates.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.job_title})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Interview Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewForm.interview_date}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interview_date: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Interviewer Details (Name & Designation) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mr. Rajesh Sharma (Lead Architect)"
                  value={interviewForm.interviewer_name}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interviewer_name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowInterviewModal(false)} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submittingInterview} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}>{submittingInterview ? 'Scheduling...' : 'Confirm Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT JOB MODAL */}
      {editingJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 12, width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>✏️ Edit Job Vacancy</h2>
            <form onSubmit={handleUpdateJob} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input required placeholder="Job Title" value={editingJob.title} onChange={e => setEditingJob({...editingJob, title: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <select value={editingJob.department} onChange={e => setEditingJob({...editingJob, department: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }}>
                <option value="IT">IT</option><option value="Recruitment">Recruitment</option><option value="Business">Business</option><option value="Financial">Financial</option>
              </select>
              <input placeholder="Qualification" value={editingJob.qualification} onChange={e => setEditingJob({...editingJob, qualification: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <input placeholder="Experience" value={editingJob.experience_required} onChange={e => setEditingJob({...editingJob, experience_required: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <input placeholder="Salary" value={editingJob.salary_range} onChange={e => setEditingJob({...editingJob, salary_range: e.target.value})} style={{ flex: 1, padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
                <input placeholder="Location" value={editingJob.location} onChange={e => setEditingJob({...editingJob, location: e.target.value})} style={{ flex: 1, padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              </div>
              <textarea placeholder="Description" value={editingJob.description} onChange={e => setEditingJob({...editingJob, description: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold' }}>Save Changes</button>
                <button type="button" onClick={() => setEditingJob(null)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 6 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CANDIDATE MODAL */}
      {editingCandidate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 12, width: 500 }}>
            <h2 style={{ marginTop: 0 }}>✏️ Edit Candidate</h2>
            <form onSubmit={handleUpdateCandidate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input required placeholder="Name" value={editingCandidate.name} onChange={e => setEditingCandidate({...editingCandidate, name: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <input required type="email" placeholder="Email" value={editingCandidate.email} onChange={e => setEditingCandidate({...editingCandidate, email: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <input placeholder="Phone" value={editingCandidate.phone} onChange={e => setEditingCandidate({...editingCandidate, phone: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <input placeholder="Experience" value={editingCandidate.experience} onChange={e => setEditingCandidate({...editingCandidate, experience: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <input placeholder="Skills" value={editingCandidate.skills} onChange={e => setEditingCandidate({...editingCandidate, skills: e.target.value})} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold' }}>Update</button>
                <button type="button" onClick={() => setEditingCandidate(null)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 6 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TASK ACTIVITY & PROCESS UPDATE */}
      {completeTaskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 19, margin: 0, color: '#0f172a', fontWeight: 700 }}>Task Activity & Process Update</h2>
                <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
                  Update kya work chal raha hai, kya process hai, ya completed summary.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompleteTaskModal(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Selected Task</div>
              <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{completeTaskModal.title}</strong>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Work Status *
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setTaskStatusChoice('In Progress')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: taskStatusChoice === 'In Progress' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: taskStatusChoice === 'In Progress' ? '#eff6ff' : '#ffffff',
                    color: taskStatusChoice === 'In Progress' ? '#1d4ed8' : '#475569',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 In Progress (Ongoing)
                </button>
                <button
                  type="button"
                  onClick={() => setTaskStatusChoice('Completed')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: taskStatusChoice === 'Completed' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    background: taskStatusChoice === 'Completed' ? '#f0fdf4' : '#ffffff',
                    color: taskStatusChoice === 'Completed' ? '#15803d' : '#475569',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Completed (Work Done)
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Work Process / Details / Remarks *
              </label>
              <textarea 
                rows="4" 
                value={taskRemarks} 
                onChange={(e) => setTaskRemarks(e.target.value)}
                placeholder={taskStatusChoice === 'Completed' ? "e.g. Screened 10 resumes, shortlisted 4 candidates for interview round..." : "e.g. Currently reviewing technical portfolios & calling candidate 3..."}
                style={{ width: '100%', padding: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13.5, boxSizing: 'border-box' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                type="button" 
                onClick={() => setCompleteTaskModal(null)} 
                style={{ flex: 1, padding: 11, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => handleTaskAction(completeTaskModal.id, taskStatusChoice, taskRemarks)} 
                style={{ 
                  flex: 1.5, 
                  padding: 11, 
                  background: taskStatusChoice === 'Completed' ? '#16a34a' : '#2563eb', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 8, 
                  fontWeight: 700, 
                  cursor: 'pointer' 
                }}
              >
                {taskStatusChoice === 'Completed' ? 'Mark Completed & Save' : 'Update Process Activity'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* DAILY REPORT MODAL FROM SIDEBAR */}
      <DailyReportModal
        isOpen={showDailyReportModal}
        onClose={() => setShowDailyReportModal(false)}
        session={session}
        stats={stats}
        onLogoutSuccess={() => navigate('/login')}
      />
    </div>
  );
}