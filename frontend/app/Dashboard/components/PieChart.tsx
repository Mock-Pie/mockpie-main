import React from 'react';
import styles from '../page.module.css';

const PieChart = () => {
  return (
    <div className={styles.pieChartSection}>
      <div className={styles.sectionHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#9966FF" />
            </svg>
          </div>
          <span style={{ fontSize: 'var(--text-xs)' }}>MockPie.com</span>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--light-grey)' }}>(Greg)</span>
      </div>
      
      <div className={styles.pieChartContainer}>
        {/* Placeholder for pie chart */}
        <svg className={styles.pieChart} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#FF9966" strokeWidth="20" strokeDasharray="75 175" />
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#66CCFF" strokeWidth="20" strokeDasharray="50 200" strokeDashoffset="-75" />
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#99FF66" strokeWidth="20" strokeDasharray="75 175" strokeDashoffset="-125" />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--light-grey)' }}>Distribution of</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--light-grey)' }}>Weakness Points</div>
        </div>
      </div>
      
      <div className={styles.legendContainer}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#FF9966' }}></div>
          <span>Facial Expressions</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#66CCFF' }}></div>
          <span>Hand Gestures</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#99FF66' }}></div>
          <span>Voice Tone</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#FFCC66' }}></div>
          <span>Eye Contact</span>
        </div>
      </div>
    </div>
  );
};

export default PieChart;