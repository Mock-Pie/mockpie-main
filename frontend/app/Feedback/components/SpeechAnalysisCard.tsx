"use client";
import React from 'react';
import { FiMic, FiBarChart2, FiActivity, FiAlertCircle, FiZap } from 'react-icons/fi';
import styles from './AnalysisCard.module.css';

interface SpeechMetric {
  value: number | string;
  score: number;
  insight: string;
  recommendation?: string;
}

interface SpeechAnalysisProps {
  speechEmotion: SpeechMetric;
  speakingRate: SpeechMetric;
  pitchAnalysis: SpeechMetric;
  fillerWords: SpeechMetric;
  stutterDetection: SpeechMetric;
}

const SpeechAnalysisCard: React.FC<SpeechAnalysisProps> = ({
  speechEmotion,
  speakingRate,
  pitchAnalysis,
  fillerWords,
  stutterDetection
}) => {
  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'emotion': return <FiMic />;
      case 'rate': return <FiBarChart2 />;
      case 'pitch': return <FiActivity />;
      case 'filler': return <FiAlertCircle />;
      case 'stutter': return <FiZap />;
      default: return <FiMic />;
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
          <FiMic />
        </div>
        <div className={styles.categoryInfo}>
          <h3 className={styles.categoryTitle}>Speech Analysis</h3>
          <p className={styles.categoryDescription}>
            Voice, pace, and speech patterns analysis
          </p>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <MetricItem
          icon={getMetricIcon('emotion')}
          title="Speech Emotion"
          value={speechEmotion.value}
          score={speechEmotion.score}
          insight={speechEmotion.insight}
          recommendation={speechEmotion.recommendation}
        />

        <MetricItem
          icon={getMetricIcon('rate')}
          title="Speaking Rate"
          value={speakingRate.value}
          score={speakingRate.score}
          insight={speakingRate.insight}
          recommendation={speakingRate.recommendation}
        />

        <MetricItem
          icon={getMetricIcon('pitch')}
          title="Pitch Variation"
          value={pitchAnalysis.value}
          score={pitchAnalysis.score}
          insight={pitchAnalysis.insight}
          recommendation={pitchAnalysis.recommendation}
        />

        <MetricItem
          icon={getMetricIcon('filler')}
          title="Filler Words"
          value={fillerWords.value}
          score={fillerWords.score}
          insight={fillerWords.insight}
          recommendation={fillerWords.recommendation}
        />

        <MetricItem
          icon={getMetricIcon('stutter')}
          title="Speech Fluency"
          value={stutterDetection.value}
          score={stutterDetection.score}
          insight={stutterDetection.insight}
          recommendation={stutterDetection.recommendation}
        />
      </div>
    </div>
  );
};

export default SpeechAnalysisCard; 