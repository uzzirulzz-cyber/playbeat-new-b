import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Loader } from './ui';

export const AdminRoute = ({ children, roles }) => {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();
  if (loading) return <Loader full />;
  if (!admin) return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(admin.role) && admin.role !== 'superadmin') {
    return <Navigate to="/admin" replace />;
  }
  return children;
};
