import { Navigate } from 'react-router-dom';

export default function CustomerProtectedRoute({ children }) {
  const token = localStorage.getItem('customerToken');
  let customer = null;
  try {
    const stored = localStorage.getItem('customerUser');
    customer = (stored && stored !== 'undefined') ? JSON.parse(stored) : null;
  } catch {
    customer = null;
  }

  if (!token) {
    return <Navigate to="/customer/login" replace />;
  }

  return children;
}
