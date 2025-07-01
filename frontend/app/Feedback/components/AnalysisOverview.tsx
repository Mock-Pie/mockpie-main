"use client";
import React from 'react';
import { FiTrendingUp, FiTarget, FiClock, FiCheckCircle } from 'react-icons/fi';
import styles from './AnalysisOverview.module.css';

interface AnalysisOverviewProps {
  overallScore: number;
  analysisDate: string;
  videoDuration: string;
  focusAreas: string[];
}

const AnalysisOverview: React.FC<AnalysisOverviewProps> = ({ 
  overallScore, 
  analysisDate, 
  videoDuration, 
  focusAreas 
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return styles.excellent;
    if (score >= 65) return styles.good;
    if (score >= 50) return styles.average;
    return styles.needsWork;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Average';
    return 'Needs Work';
  };

  return (
    <div className={styles.overviewContainer}>
      <div className={styles.overviewHeader}>
        <h2 className={styles.title}>Analysis Overview</h2>
        <p className={styles.subtitle}>Your presentation performance summary</p>
      </div>

      <div className={styles.metricsGrid}>
        {/* Overall Score */}
        <div className={`${styles.scoreCard} ${styles.primaryCard}`}>
          <div className={styles.scoreCircle}>
            <div className={`${styles.scoreRing} ${getScoreColor(overallScore)}`}>
              <span className={styles.scoreValue}>{overallScore}</span>
              <span className={styles.scoreLabel}>Overall Score</span>
            </div>
          </div>
          <div className={styles.scoreDetails}>
            <span className={`${styles.scoreBadge} ${getScoreColor(overallScore)}`}>
              {getScoreLabel(overallScore)}
            </span>
            <p className={styles.scoreDescription}>
              {overallScore >= 80 ? 'Outstanding presentation! You demonstrated excellent communication skills.' :
               overallScore >= 65 ? 'Great job! Your presentation shows strong communication abilities.' :
               overallScore >= 50 ? 'Good foundation. There are opportunities for improvement.' :
               'Keep practicing! Focus on the key areas highlighted below.'}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiClock />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{videoDuration}</span>
              <span className={styles.statLabel}>Duration</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiTarget />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{focusAreas.length}</span>
              <span className={styles.statLabel}>Focus Areas</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiTrendingUp />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{analysisDate}</span>
              <span className={styles.statLabel}>Analyzed</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiCheckCircle />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>Complete</span>
              <span className={styles.statLabel}>Status</span>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Areas */}
      <div className={styles.focusSection}>
        <h3 className={styles.focusTitle}>Analyzed Focus Areas</h3>
        <div className={styles.focusTags}>
          {focusAreas.map((area, index) => (
            <span key={index} className={styles.focusTag}>
              {area.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisOverview; 