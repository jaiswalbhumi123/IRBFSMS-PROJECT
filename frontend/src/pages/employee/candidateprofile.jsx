import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const res = await api.get(`/candidates/${id}`);
        setCandidate(res.data);
      } catch {
        toast.error('Failed to load candidate details');
        navigate('/employee/recruitment-dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [id, navigate]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Candidate Profile...</div>;
  if (!candidate) return null;

  return (
    <div style={{ padding: '30px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: 20, padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}
      >
        ← Back to Dashboard
      </button>
      
      <div style={{ background: '#fff', borderRadius: 12, padding: 30, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 20, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, color: '#1e293b' }}>{candidate.name}</h1>
            <p style={{ margin: '5px 0 0', color: '#64748b' }}>Applied for: <strong>{candidate.job_title}</strong></p>
          </div>
          <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '6px 14px', borderRadius: 20, fontSize: 14, fontWeight: 'bold', height: 'fit-content' }}>
            {candidate.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 'bold' }}>EMAIL ADDRESS</label>
            <p style={{ margin: '4px 0', fontSize: 16 }}>{candidate.email}</p>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 'bold' }}>PHONE NUMBER</label>
            <p style={{ margin: '4px 0', fontSize: 16 }}>{candidate.phone || 'N/A'}</p>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 'bold' }}>EXPERIENCE</label>
            <p style={{ margin: '4px 0', fontSize: 16 }}>{candidate.experience || 'Fresher'}</p>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 'bold' }}>QUALIFICATION</label>
            <p style={{ margin: '4px 0', fontSize: 16 }}>{candidate.qualification || 'N/A'}</p>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={{ fontSize: 12, color: '#64748b', fontWeight: 'bold' }}>SKILLS</label>
          <p style={{ margin: '4px 0', fontSize: 16, background: '#f1f5f9', padding: 10, borderRadius: 8 }}>{candidate.skills || 'No skills mentioned'}</p>
        </div>

        <div style={{ marginTop: 30 }}>
          <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>Attached Resume</h3>
          {candidate.resume_link ? (
            <a 
              href={candidate.resume_link.startsWith('http') ? candidate.resume_link : `http://localhost:5000${candidate.resume_link.startsWith('/') ? '' : '/'}${candidate.resume_link}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'inline-block', background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 'bold' }}
            >
              📄 View Resume
            </a>
          ) : <p style={{ color: '#94a3b8' }}>No resume uploaded</p>}
        </div>
      </div>
    </div>
  );
}
