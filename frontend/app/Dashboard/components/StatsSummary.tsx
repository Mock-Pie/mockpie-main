import React from 'react';
import styles from '../page.module.css';

const StatsSummary = () => {
  return (
    <div className={styles.pieChartSection}>
      <button className={styles.timeRangeSelector}>
        <span>01:15 - 12:15 pm</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      <div className={styles.statsSummary}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Points Scored</span>
          <span className={styles.statValue}>1500 pts</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>New Weaknesses</span>
          <span className={`${styles.statValue} ${styles.positiveChange}`}>3 +1</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Repeated Weaknesses</span>
          <span className={`${styles.statValue} ${styles.positiveChange}`}>8 +5</span>
        </div>
      </div>
    </div>
  );
};

export default StatsSummary;