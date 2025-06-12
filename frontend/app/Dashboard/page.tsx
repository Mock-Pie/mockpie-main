'use client';

import React from "react";
import styles from "./page.module.css";
import SideBar from "../UploadRecordVideos/components/SideBar";
import ImprovementChart from "./components/ImprovementChart";
import CalendarWidget from "./components/CalendarWidget";
import PieChart from "./components/PieChart";
import StatsCard from "./components/StatsCard";
import StatsSummary from "./components/StatsSummary";
import PresentationTable from "./components/PresentationTable";

const Dashboard = () => {
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
      <div className={styles.mainContent}>
        {/* <h1 className={styles.greeting}>Hello, Jana</h1> */}
        
        <div className={styles.dashboardGrid}>
          {/* Improvement Chart Section */}
          <ImprovementChart />

          {/* Calendar Section */}
          <CalendarWidget />

          {/* Pie Chart Section */}
          <PieChart />

          {/* Stats Cards */}
          <StatsCard 
            value={150} 
            title="Submitted Trials" 
            color="purple" 
            icon={purpleIcon} 
          />

          <StatsCard 
            value={20} 
            title="Presentations In Line" 
            color="yellow" 
            icon={yellowIcon} 
          />

          {/* Time Range Selector and Stats Summary */}
          <StatsSummary />

          {/* Presentation Details Table */}
          <PresentationTable />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;