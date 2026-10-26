import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AssignTask from './pages/admin/assigntask';
import SelectWorkArea from './pages/employee/SelectWorkArea';
import ItDashboard from './pages/employee/ItDashboard';
import RecruitmentDashboard from './pages/employee/RecruitmentDashboard';
import CrmDashboard from './pages/employee/CrmDashboard';
import FinancialDashboard from './pages/employee/FinancialDashboard';
import ProtectedRoute from './routes/protectedroute';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute role="Admin"><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/assign-task" element={
          <ProtectedRoute role="Admin"><AssignTask /></ProtectedRoute>
        } />

        {/* Employee Routes */}
        <Route path="/employee/select-module" element={
          <ProtectedRoute role="Employee"><SelectWorkArea /></ProtectedRoute>
        } />
        <Route path="/employee/it-dashboard" element={
          <ProtectedRoute role="Employee"><ItDashboard /></ProtectedRoute>
        } />
        <Route path="/employee/recruitment-dashboard" element={
          <ProtectedRoute role="Employee"><RecruitmentDashboard /></ProtectedRoute>
        } />
        <Route path="/employee/crm-dashboard" element={
          <ProtectedRoute role="Employee"><CrmDashboard /></ProtectedRoute>
        } />
        <Route path="/employee/financial-dashboard" element={
          <ProtectedRoute role="Employee"><FinancialDashboard /></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}