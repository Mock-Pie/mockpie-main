'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import { ROUTES } from '../../constants';
import LoadingSpinner from '../shared/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // This should not happen as AuthProvider handles redirects
    // But just in case, we'll redirect here too
    window.location.href = ROUTES.LOGIN;
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 