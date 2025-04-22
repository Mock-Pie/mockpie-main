import React from 'react';
import styles from '../page.module.css';

const ImprovementChart = () => {
  return (
    <div className={styles.improvementSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Improvement</h3>
        <button className={styles.yearSelector}>
          <span>2022</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className={styles.chartContainer}>
        {/* Placeholder for line chart */}
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* This would be replaced with an actual chart component */}
          <svg width="100%" height="100%" viewBox="0 0 500 180" preserveAspectRatio="none">
            <path d="M0,90 C50,40 100,140 150,90 C200,40 250,120 300,90 C350,60 400,110 450,90 L450,180 L0,180 Z" fill="none" stroke="#9966FF" strokeWidth="3" />
            <path d="M0,100 C50,80 100,120 150,100 C200,80 250,130 300,100 C350,70 400,120 450,100" fill="none" stroke="#00FFCC" strokeWidth="2" strokeDasharray="5,5" />
          </svg>
          <div className={styles.avatarContainer}>
            {/* Placeholder for avatar */}
            <svg width="80" height="120" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="40" cy="30" rx="20" ry="25" fill="#FFD7B5" />
              <rect x="20" y="55" width="40" height="60" fill="#6C7A89" />
              <rect x="30" y="55" width="20" height="60" fill="#95A5A6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovementChart;