import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = ({
  children,
  requireCompany = false,
  requireNoCompany = false,
}: {
  children: React.ReactNode;
  requireCompany?: boolean;
  requireNoCompany?: boolean;
}) => {
  const { isAuthenticated, isLoading, activeCompanyId } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requireCompany && !activeCompanyId) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requireNoCompany && activeCompanyId) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
