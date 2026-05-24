import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const HOME_FOR_ROLE = {
  super_admin: '/admin/pending-hrs',
  hr: '/hr/dashboard',
  employee: '/employee/dashboard',
};

export const homeForRole = (role) => HOME_FOR_ROLE[role] || '/employee/dashboard';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return children;
}
