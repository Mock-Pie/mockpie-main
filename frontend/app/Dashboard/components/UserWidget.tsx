'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserService, { User } from '../../services/userService';
import styles from './UserWidget.module.css';

interface UserWidgetProps {
  className?: string;
}

const UserWidget: React.FC<UserWidgetProps> = ({ className }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const result = await UserService.getCurrentUser();
      
      if (result.success && result.data) {
        setUser(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load user data');
        if (result.error?.includes('Authentication expired')) {
          router.push('/Login');
        }
      }
    } catch (err) {
      setError('Failed to fetch user data');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = () => {
    router.push('/ProfileInfo');
  };

  const getDisplayName = () => {
    if (!user) return 'Unknown User';
    
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.username || 'Unknown User';
  };

  const getInitials = () => {
    if (!user) return '?';
    
    const firstInitial = user.first_name?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.last_name?.charAt(0)?.toUpperCase() || '';
    
    if (firstInitial && lastInitial) {
      return firstInitial + lastInitial;
    } else if (firstInitial) {
      return firstInitial;
    } else if (lastInitial) {
      return lastInitial;
    } else {
      return user.username?.charAt(0)?.toUpperCase() || '?';
    }
  };

  if (loading) {
    return (
      <div className={`${styles.userWidget} ${className || ''}`}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.userWidget} ${styles.error} ${className || ''}`}>
        <div className={styles.errorText}>Failed to load user info</div>
        <button onClick={fetchUserData} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.userWidget} ${className || ''}`} onClick={handleProfileClick}>
      <div className={styles.userAvatar}>
        <div className={styles.initials}>{getInitials()}</div>
      </div>
      <div className={styles.userInfo}>
        <div className={styles.userName}>{getDisplayName()}</div>
        <div className={styles.userEmail}>{user?.email}</div>
      </div>
      <div className={styles.profileIcon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </div>
  );
};

export default UserWidget; 