"use client";
import React from 'react';
import { FiFileText, FiBook, FiTarget } from 'react-icons/fi';
import styles from './AnalysisCard.module.css';

interface ContentMetric {
  value: number | string;
  score: number;
  normalized_score: number;
  insight: string;
  recommendation?: string;
}

interface ContentAnalysisProps {
  lexicalRichness: ContentMetric;
  keywordRelevance: ContentMetric;
}

const ContentAnalysisCard: React.FC<ContentAnalysisProps> = ({
  lexicalRichness,
  keywordRelevance
}) => {
  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'lexical': return <FiBook />;
      case 'keyword': return <FiTarget />;
      default: return <FiFileText />;
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
          <FiFileText />
        </div>
        <div className={styles.categoryInfo}>
          <h3 className={styles.categoryTitle}>Content Analysis</h3>
          <p className={styles.categoryDescription}>
            Vocabulary richness and topic relevance
          </p>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <MetricItem
          icon={getMetricIcon('lexical')}
          title="Lexical Richness"
          value={lexicalRichness.value}
          score={lexicalRichness.normalized_score}
          insight={lexicalRichness.insight}
          recommendation={lexicalRichness.recommendation}
        />

        <MetricItem
          icon={getMetricIcon('keyword')}
          title="Topic Relevance"
          value={keywordRelevance.value}
          score={keywordRelevance.normalized_score}
          insight={keywordRelevance.insight}
          recommendation={keywordRelevance.recommendation}
        />
      </div>
    </div>
  );
};

export default ContentAnalysisCard; 