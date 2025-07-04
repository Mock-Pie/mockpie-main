'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import styles from "./page.module.css";
import uploadStyles from "../UploadRecordVideos/uploadrecord.module.css";
import SideBar from "../UploadRecordVideos/components/SideBar";
import ImprovementChart from "./components/ImprovementChart";
import CalendarWidget from "./components/CalendarWidget";
import PieChart from "./components/PieChart";
import StatsCard from "./components/StatsCard";
import StatsSummary from "./components/StatsSummary";
import PresentationTable from "./components/PresentationTable";
import UserService, { User } from "../services/userService";
import PresentationService from "../services/presentationService";
import UpcomingPresentationService, { UpcomingPresentation } from "../services/upcomingPresentationService";

const Dashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittedTrialsCount, setSubmittedTrialsCount] = useState<number>(0);
  const [presentationsLoading, setPresentationsLoading] = useState(true);
  const [submittedTrialsData, setSubmittedTrialsData] = useState<any[]>([]);
  const [upcomingPresentations, setUpcomingPresentations] = useState<UpcomingPresentation[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchPresentationsData();
    fetchUpcomingPresentations();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const result = await UserService.getCurrentUser();
      
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        console.error('Failed to fetch user data:', result.error);
        if (result.error?.includes('Authentication expired')) {
          router.push('/Login');
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPresentationsData = async () => {
    try {
      setPresentationsLoading(true);
      const result = await PresentationService.getUserPresentations();
      
      if (result.success && result.data) {
        const presentations = (result.data as any).videos || [];
        setSubmittedTrialsCount(presentations.length);
        setSubmittedTrialsData(presentations);
      } else {
        console.error('Failed to fetch presentations data:', result.error);
        if (result.error?.includes('Authentication expired')) {
          router.push('/Login');
        }
      }
    } catch (err) {
      console.error('Error fetching presentations data:', err);
    } finally {
      setPresentationsLoading(false);
    }
  };

  const fetchUpcomingPresentations = async () => {
    try {
      setUpcomingLoading(true);
      
      // Initialize sample data if needed (only on first run)
      // await UpcomingPresentationService.initializeSampleData();
      
      // Fetch upcoming presentations from service
      const result = await UpcomingPresentationService.getUpcomingPresentations();
      
      if (result.success && result.data) {
        setUpcomingPresentations(result.data as UpcomingPresentation[]);
      } else {
        console.error('Failed to fetch upcoming presentations:', result.error);
        if (result.error?.includes('Authentication expired')) {
          router.push('/Login');
        }
      }
    } catch (err) {
      console.error('Error fetching upcoming presentations:', err);
    } finally {
      setUpcomingLoading(false);
    }
  };

  const getDisplayName = () => {
    if (!user) return 'Loading...';
    
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.username || 'Unknown User';
  };

  const handleProfileClick = () => {
    router.push('/ProfileInfo');
  };

  const handleSubmittedTrialsClick = () => {
    router.push('/SubmittedTrials');
  };

  const handleCalendarClick = () => {
    router.push('/Calendar');
  };

  const handlePresentationClick = (presentation: any) => {
    if (presentation.type === 'past') {
      router.push('/SubmittedTrials');
    } else {
      router.push('/Calendar');
    }
  };

  const refreshAllData = async () => {
    await Promise.all([
      fetchUserData(),
      fetchPresentationsData(),
      fetchUpcomingPresentations()
    ]);
  };

  // SVG icons for stats cards
  const purpleIcon = (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="20" width="40" height="50" rx="5" fill="#9966FF" opacity="0.3" />
      <rect x="20" y="10" width="40" height="50" rx="5" fill="#9966FF" opacity="0.6" />
    </svg>
  );

  const yellowIcon = (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="15" width="60" height="40" rx="5" fill="#F0C419" opacity="0.3" />
      <rect x="20" y="30" width="40" height="5" rx="2.5" fill="#F0C419" />
      <rect x="20" y="40" width="30" height="5" rx="2.5" fill="#F0C419" />
    </svg>
  );

  return (
    <div className={styles.container}>
      <SideBar />
      <div className={uploadStyles.mainContent}>
        {/* Header with search, profile, title and subtitle - matching UploadRecordVideos position */}
        <div className={uploadStyles.header}>
        {/* Enhanced Header with search and profile */}
        <div className={styles.enhancedHeader}>
          <div className={styles.searchSection}>
            <div className={styles.searchContainer}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.searchIcon}>
                <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search presentations, analytics..." 
                className={styles.searchInput}
              />
            </div>
          </div>
          
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
                <span className={styles.userName}>{loading ? 'Loading...' : getDisplayName()}</span>
                <span className={styles.userEmail}>{loading ? 'Loading...' : (user?.email || 'No email')}</span>
            </div>
              <div className={styles.userAvatar} onClick={handleProfileClick}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

          {/* Title and subtitle */}
          <h1 className={uploadStyles.title}>Dashboard</h1>
          <p className={uploadStyles.subtitle}>Welcome back! Here's your presentation analytics overview</p>
        </div>
        
        {/* Main Dashboard Grid */}
        <div className={styles.modernDashboardGrid}>
          {/* Left Column - Main Content */}
          <div className={styles.leftColumn}>
          {/* Improvement Chart Section */}
          <ImprovementChart />

            {/* Stats Cards Row */}
            <div className={styles.statsCardsRow}>
          <StatsCard 
            value={submittedTrialsCount} 
            title="Submitted Trials" 
            color="purple" 
            icon={purpleIcon} 
            onClick={handleSubmittedTrialsClick}
            loading={presentationsLoading}
          />
          <StatsCard 
            value={upcomingPresentations.length} 
            title="Presentations In Line" 
            color="yellow" 
            icon={yellowIcon} 
            onClick={handleCalendarClick}
            loading={upcomingLoading}
          />
            </div>

          {/* Presentation Details Table */}
          <PresentationTable 
            submittedTrials={submittedTrialsData}
            upcomingPresentations={upcomingPresentations}
            loading={presentationsLoading || upcomingLoading}
            onRefresh={refreshAllData}
          />
          </div>

          {/* Right Column - Sidebar Content */}
          <div className={styles.rightColumn}>
            {/* Calendar Section */}
            <CalendarWidget 
              submittedTrials={submittedTrialsData}
              upcomingPresentations={upcomingPresentations}
              onPresentationClick={handlePresentationClick}
            />

            {/* Pie Chart Section */}
            <PieChart />

            {/* Stats Summary */}
            <div className={styles.statsSummaryCard}>
              <div className={styles.statsSummaryHeader}>
                <span className={styles.dateRange}>10th - 12th Jun</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.chevronDown}>
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <StatsSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;