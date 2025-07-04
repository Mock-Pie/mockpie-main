'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ROUTES, STORAGE_KEYS } from '../../constants';
import { getFromStorage, removeFromStorage } from '../../utils';
import type { User } from '../../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.OTP_VERIFICATION,
  ROUTES.PASSWORD_RESET_OTP,
  ROUTES.RESTORE_ACCOUNT,
  ROUTES.RESTORE_ACCOUNT_OTP,
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const login = (token: string, userData: User) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    removeFromStorage(STORAGE_KEYS.ACCESS_TOKEN);
    removeFromStorage(STORAGE_KEYS.USER_DATA);
    setUser(null);
    router.push(ROUTES.LOGIN);
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      const token = getFromStorage<string>(STORAGE_KEYS.ACCESS_TOKEN);
      const userData = getFromStorage<User>(STORAGE_KEYS.USER_DATA);

      if (!token || !userData) {
        setUser(null);
        return false;
      }

      // Verify token with backend
      const response = await fetch('http://localhost:8081/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const freshUserData = await response.json();
        setUser(freshUserData);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(freshUserData));
        return true;
      } else {
        // Token is invalid, clear storage and redirect to login
        logout();
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      // Handle root path specially
      if (pathname === '/') {
        setLoading(false);
        return;
      }
      
      // Check if current route is public
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname as any);
      
      if (isPublicRoute) {
        setLoading(false);
        return;
      }

      // For protected routes, check authentication
      const isAuthenticated = await checkAuth();
      
      if (!isAuthenticated && !isPublicRoute) {
        router.push(ROUTES.LOGIN);
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, [pathname]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 