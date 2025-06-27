import React from 'react';
import styles from '../page.module.css';

const PieChart = () => {
  return (
    <div className={styles.pieChartSection}>
      <div className={styles.sectionHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #9966FF, #00FFCC)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
            </svg>
          </div>
          <span className={styles.sectionTitle} style={{ fontSize: '1rem' }}>📊 Performance Analytics</span>
        </div>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--naples-yellow)', fontWeight: '600' }}>(Jana)</span>
      </div>
      
      <div className={styles.pieChartContainer}>
        {/* Enhanced pie chart with gradients */}
        <svg className={styles.pieChart} viewBox="0 0 100 100">
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9966"/>
              <stop offset="100%" stopColor="#FF6B35"/>
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#66CCFF"/>
              <stop offset="100%" stopColor="#3399CC"/>
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#99FF66"/>
              <stop offset="100%" stopColor="#66CC33"/>
            </linearGradient>
            <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFCC66"/>
              <stop offset="100%" stopColor="#FF9900"/>
            </linearGradient>
          </defs>
          
          {/* Pie segments with gradients and shadows */}
          <circle cx="50" cy="50" r="35" fill="transparent" stroke="url(#gradient1)" strokeWidth="12" strokeDasharray="30 70" transform="rotate(-90 50 50)" />
          <circle cx="50" cy="50" r="35" fill="transparent" stroke="url(#gradient2)" strokeWidth="12" strokeDasharray="25 75" strokeDashoffset="-30" transform="rotate(-90 50 50)" />
          <circle cx="50" cy="50" r="35" fill="transparent" stroke="url(#gradient3)" strokeWidth="12" strokeDasharray="25 75" strokeDashoffset="-55" transform="rotate(-90 50 50)" />
          <circle cx="50" cy="50" r="35" fill="transparent" stroke="url(#gradient4)" strokeWidth="12" strokeDasharray="20 80" strokeDashoffset="-80" transform="rotate(-90 50 50)" />
          
          {/* Center circle for better visual */}
          <circle cx="50" cy="50" r="20" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center', top: '50%', transform: 'translateY(-50%)' }}>
          <div style={{ fontSize: '14px', color: 'var(--white)', fontWeight: '600' }}>Analysis</div>
          <div style={{ fontSize: '12px', color: 'var(--light-grey)' }}>Overview</div>
        </div>
      </div>
      
      <div className={styles.legendContainer}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: 'linear-gradient(135deg, #FF9966, #FF6B35)' }}></div>
          <span>Facial Expressions</span>
          <span style={{ marginLeft: 'auto', color: 'var(--naples-yellow)', fontWeight: '600' }}>30%</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: 'linear-gradient(135deg, #66CCFF, #3399CC)' }}></div>
          <span>Hand Gestures</span>
          <span style={{ marginLeft: 'auto', color: 'var(--naples-yellow)', fontWeight: '600' }}>25%</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: 'linear-gradient(135deg, #99FF66, #66CC33)' }}></div>
          <span>Voice Tone</span>
          <span style={{ marginLeft: 'auto', color: 'var(--naples-yellow)', fontWeight: '600' }}>25%</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: 'linear-gradient(135deg, #FFCC66, #FF9900)' }}></div>
          <span>Eye Contact</span>
          <span style={{ marginLeft: 'auto', color: 'var(--naples-yellow)', fontWeight: '600' }}>20%</span>
        </div>
      </div>
    </div>
  );
};

export default PieChart;