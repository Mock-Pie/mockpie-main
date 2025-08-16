import React from 'react';
import styles from '../page.module.css';

const modelWeights = [
  { label: 'Speech Emotion', weight: 0.12, category: 'Speech Analysis' },
  { label: 'WPM Analysis', weight: 0.08, category: 'Speech Analysis' },
  { label: 'Pitch Analysis', weight: 0.08, category: 'Speech Analysis' },
  { label: 'Volume Consistency', weight: 0.07, category: 'Speech Analysis' },
  { label: 'Filler Detection', weight: 0.08, category: 'Speech Quality & Fluency' },
  { label: 'Stutter Detection', weight: 0.07, category: 'Speech Quality & Fluency' },
  { label: 'Lexical Richness', weight: 0.05, category: 'Speech Quality & Fluency' },
  { label: 'Eye Contact', weight: 0.13, category: 'Visual Presence & Engagement' },
  { label: 'Hand Gesture', weight: 0.08, category: 'Visual Presence & Engagement' },
  { label: 'Posture Analysis', weight: 0.09, category: 'Visual Presence & Engagement' },
  { label: 'Facial Emotion', weight: 0.05, category: 'Visual Presence & Engagement' },
  { label: 'Keyword Relevance', weight: 0.05, category: 'Content & Context' },
  { label: 'Confidence Detector', weight: 0.05, category: 'Content & Context' },
];

const categories = [
  'Speech Analysis',
  'Speech Quality & Fluency',
  'Visual Presence & Engagement',
  'Content & Context',
];

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
      </div>
      <div className={styles.legendContainer}>
        {categories.map(category => (
          <div key={category} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600, color: 'var(--naples-yellow)', marginBottom: 4 }}>{category}</div>
            {modelWeights.filter(m => m.category === category).map(m => (
              <div className={styles.legendItem} key={m.label}>
                <span>{m.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--naples-yellow)', fontWeight: '600' }}>{Math.round(m.weight * 100)}%</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChart;