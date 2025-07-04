"use client";
import React from 'react';
import { FiEye, FiSmile, FiMove, FiUser } from 'react-icons/fi';
import styles from './AnalysisCard.module.css';

interface VisualMetric {
  value: number | string;
  score: number;
  normalized_score: number;
  insight: string;
  recommendation?: string;
}

interface VisualAnalysisProps {
  facialEmotion: VisualMetric;
  eyeContact: VisualMetric;
  handGestures: VisualMetric;
  postureAnalysis: VisualMetric;
}

const VisualAnalysisCard: React.FC<VisualAnalysisProps> = ({
  facialEmotion,
  eyeContact,
  handGestures,
  postureAnalysis
}) => {
  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'emotion': return <FiSmile />;
      case 'eye': return <FiEye />;
      case 'gesture': return <FiMove />;
      case 'posture': return <FiUser />;
      default: return <FiEye />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return styles.excellent;
    if (score >= 65) return styles.good;
    if (score >= 50) return styles.average;
    return styles.needsWork;
  };

  const MetricItem = ({ 
    icon, 
    title, 
    value, 
    score, 
    insight, 
    recommendation 
  }: { 
    icon: React.ReactNode;
    title: string;
    value: number | string;
    score: number;
    insight: string;
    recommendation?: string;
  }) => (
    <div className={styles.metricItem}>
      <div className={styles.metricHeader}>
        <div className={styles.metricIcon}>
          {icon}
        </div>
        <div className={styles.metricTitle}>
          <h4>{title}</h4>
          <div className={styles.metricValue}>
            <span className={styles.value}>{value}</span>
            <span className={`${styles.score} ${getScoreColor(score)}`}>
              {score}/100
            </span>
          </div>
        </div>
      </div>
      
      <div className={styles.metricContent}>
        <div className={styles.progressBar}>
          <div 
            className={`${styles.progressFill} ${getScoreColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
        
        <p className={styles.insight}>{insight}</p>
        
        {recommendation && (
          <div className={styles.recommendation}>
            <span className={styles.recommendationLabel}>Tip:</span>
            {recommendation}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.analysisCard}>
      <div className={styles.cardHeader}>
        <div className={styles.categoryIcon}>
          <FiEye />
        </div>
        <div className={styles.categoryInfo}>
          <h3 className={styles.categoryTitle}>Visual Analysis</h3>
          <p className={styles.categoryDescription}>
            Body language, expressions, and visual presence
          </p>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <MetricItem
          icon={getMetricIcon('emotion')}
          title="Facial Expression"
          value={facialEmotion.value}
          score={facialEmotion.normalized_score}
          insight={facialEmotion.insight}
          recommendation={facialEmotion.recommendation}
        />

        <MetricItem
          icon={getMetricIcon('eye')}
          title="Eye Contact"
          value={eyeContact.value}
          score={eyeContact.normalized_score}
          insight={eyeContact.insight}
          recommendation={eyeContact.recommendation}
        />

        <MetricItem
          icon={getMetricIcon('gesture')}
          title="Hand Gestures"
          value={handGestures.value}
          score={handGestures.normalized_score}
          insight={handGestures.insight}
          recommendation={handGestures.recommendation}
        />

        <MetricItem
          icon={getMetricIcon('posture')}
          title="Posture"
          value={postureAnalysis.value}
          score={postureAnalysis.normalized_score}
          insight={postureAnalysis.insight}
          recommendation={postureAnalysis.recommendation}
        />
      </div>
    </div>
  );
};

export default VisualAnalysisCard; 