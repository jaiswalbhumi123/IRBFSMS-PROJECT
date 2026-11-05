import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('token');
  let user = null;
  try {
    const stored = localStorage.getItem('user');
    user = (stored && stored !== 'undefined') ? JSON.parse(stored) : null;
  } catch {
    user = null;
  }
  
  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/login" replace />;
  
  return children;
}
