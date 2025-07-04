'use client';

import React, { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { ROUTES } from '../../constants';
import LoadingSpinner from '../shared/LoadingSpinner';

interface PublicRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Redirect authenticated users to dashboard
      window.location.href = ROUTES.DASHBOARD;
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    // User is authenticated, don't render the public page
    return null;
  }

  return <>{children}</>;
};

export default PublicRoute; 