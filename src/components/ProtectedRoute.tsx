import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = ({
  children,
  requireCompany = false,
}: {
  children: React.ReactNode;
  requireCompany?: boolean;
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requireCompany && !user?.companyId) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
