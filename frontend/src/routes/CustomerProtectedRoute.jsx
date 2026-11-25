import { Navigate } from 'react-router-dom';

export default function CustomerProtectedRoute({ children }) {
  const token = localStorage.getItem('customerToken') || localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/customer/login" replace />;
  }

  return children;
}
