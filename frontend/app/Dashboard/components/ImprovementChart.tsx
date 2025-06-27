import React from 'react';
import styles from '../page.module.css';

const ImprovementChart = () => {
  return (
    <div className={styles.improvementSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>📈 Improvement Analytics</h3>
        <button className={styles.yearSelector}>
          <span>2022</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className={styles.chartContainer}>
        {/* Enhanced chart with gradient background */}
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9966FF" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#9966FF" stopOpacity="0.1"/>
              </linearGradient>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9966FF"/>
                <stop offset="50%" stopColor="#00FFCC"/>
                <stop offset="100%" stopColor="#FFD60A"/>
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            <g stroke="rgba(255,255,255,0.1)" strokeWidth="1">
              <line x1="0" y1="40" x2="500" y2="40"/>
              <line x1="0" y1="80" x2="500" y2="80"/>
              <line x1="0" y1="120" x2="500" y2="120"/>
              <line x1="0" y1="160" x2="500" y2="160"/>
            </g>
            
            {/* Main chart area with gradient fill */}
            <path d="M0,90 C50,40 100,140 150,90 C200,40 250,120 300,90 C350,60 400,110 450,90 L450,200 L0,200 Z" 
                  fill="url(#purpleGradient)" />
            
            {/* Main improvement line */}
            <path d="M0,90 C50,40 100,140 150,90 C200,40 250,120 300,90 C350,60 400,110 450,90" 
                  fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round"/>
            
            {/* Secondary comparison line */}
            <path d="M0,100 C50,80 100,120 150,100 C200,80 250,130 300,100 C350,70 400,120 450,100" 
                  fill="none" stroke="#00FFCC" strokeWidth="2" strokeDasharray="5,5" opacity="0.7"/>
            
            {/* Data points */}
            <circle cx="0" cy="90" r="4" fill="#9966FF"/>
            <circle cx="150" cy="90" r="4" fill="#00FFCC"/>
            <circle cx="300" cy="90" r="4" fill="#FFD60A"/>
            <circle cx="450" cy="90" r="4" fill="#9966FF"/>
          </svg>
          
          {/* Chart labels */}
          <div style={{ position: 'absolute', bottom: '10px', left: '20px', fontSize: '12px', color: 'var(--light-grey)' }}>
            Current Month
          </div>
          <div style={{ position: 'absolute', bottom: '10px', right: '20px', fontSize: '12px', color: 'var(--light-grey)' }}>
            Peak Month
          </div>
          
          <div className={styles.avatarContainer}>
            {/* Enhanced avatar with better styling */}
            <svg width="80" height="120" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Head */}
              <ellipse cx="40" cy="30" rx="20" ry="25" fill="#FFD7B5" stroke="#E6C7A3" strokeWidth="2"/>
              {/* Hair */}
              <ellipse cx="40" cy="20" rx="22" ry="18" fill="#8B4513"/>
              {/* Body */}
              <rect x="20" y="55" width="40" height="60" rx="5" fill="#6C7A89" stroke="#5A6774" strokeWidth="2"/>
              {/* Shirt */}
              <rect x="25" y="55" width="30" height="50" rx="3" fill="#95A5A6"/>
              {/* Arms */}
              <ellipse cx="15" cy="70" rx="8" ry="25" fill="#FFD7B5"/>
              <ellipse cx="65" cy="70" rx="8" ry="25" fill="#FFD7B5"/>
              {/* Face details */}
              <circle cx="33" cy="28" r="2" fill="#000"/>
              <circle cx="47" cy="28" r="2" fill="#000"/>
              <path d="M35,35 Q40,40 45,35" stroke="#000" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovementChart;