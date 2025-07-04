'use client';

import React from 'react';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

// Higher-order component for protected routes
export const withAuth = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <ProtectedRoute>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Higher-order component for public routes
export const withPublicAuth = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <PublicRoute>
      <Component {...props} />
    </PublicRoute>
  );
};

// Utility to check if a route should be public
export const isPublicRoute = (pathname: string): boolean => {
  const PUBLIC_ROUTES = [
    '/Login',
    '/SignUp',
    '/ForgotPassword',
    '/ResetPassword',
    '/OTPVerifcation',
    '/PasswordResetOTP',
    '/RestoreAccount',
    '/RestoreAccountOTP',
  ];
  
  return PUBLIC_ROUTES.includes(pathname);
};

// Utility to check if a route should be protected
export const isProtectedRoute = (pathname: string): boolean => {
  return !isPublicRoute(pathname) && pathname !== '/';
}; 