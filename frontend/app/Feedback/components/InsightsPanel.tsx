"use client";
import React from 'react';
import { FiZap, FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import styles from './InsightsPanel.module.css';

interface Insight {
  type: 'strength' | 'improvement' | 'tip';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface InsightsPanelProps {
  insights: Insight[];
  keyTakeaways: string[];
  nextSteps: string[];
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insights,
  keyTakeaways,
  nextSteps
}) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <FiCheckCircle />;
      case 'improvement': return <FiTrendingUp />;
      case 'tip': return <FiZap />;
      default: return <FiZap />;
    }
  };

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'strength': return styles.strengthInsight;
      case 'improvement': return styles.improvementInsight;
      case 'tip': return styles.tipInsight;
      default: return styles.tipInsight;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <FiAlertTriangle />;
      case 'medium': return <FiTrendingUp />;
      case 'low': return <FiZap />;
      default: return <FiZap />;
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high': return styles.highPriority;
      case 'medium': return styles.mediumPriority;
      case 'low': return styles.lowPriority;
      default: return styles.lowPriority;
    }
  };

  return (
    <div className={styles.insightsContainer}>
      <div className={styles.insightsHeader}>
        <h2 className={styles.title}>Key Insights & Recommendations</h2>
        <p className={styles.subtitle}>Personalized feedback to enhance your presentation skills</p>
      </div>

      <div className={styles.insightsGrid}>
        {/* Key Takeaways */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <FiCheckCircle />
            </div>
            <h3 className={styles.sectionTitle}>Key Takeaways</h3>
          </div>
          <div className={styles.takeawaysList}>
            {keyTakeaways.map((takeaway, index) => (
              <div key={index} className={styles.takeawayItem}>
                <div className={styles.takeawayBullet}>
                  <FiArrowRight />
                </div>
                <span className={styles.takeawayText}>{takeaway}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Insights */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <FiZap />
            </div>
            <h3 className={styles.sectionTitle}>Detailed Insights</h3>
          </div>
          <div className={styles.insightsList}>
            {insights.map((insight, index) => (
              <div key={index} className={`${styles.insightItem} ${getInsightStyle(insight.type)}`}>
                <div className={styles.insightHeader}>
                  <div className={styles.insightIcon}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className={styles.insightTitleContainer}>
                    <h4 className={styles.insightTitle}>{insight.title}</h4>
                    <span className={`${styles.priorityBadge} ${getPriorityStyle(insight.priority)}`}>
                      {getPriorityIcon(insight.priority)}
                      {insight.priority} priority
                    </span>
                  </div>
                </div>
                <p className={styles.insightDescription}>{insight.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <FiTrendingUp />
            </div>
            <h3 className={styles.sectionTitle}>Next Steps</h3>
          </div>
          <div className={styles.stepsList}>
            {nextSteps.map((step, index) => (
              <div key={index} className={styles.stepItem}>
                <div className={styles.stepNumber}>
                  {index + 1}
                </div>
                <span className={styles.stepText}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button className={styles.primaryButton}>
          <FiTrendingUp />
          Practice Again
        </button>
        <button className={styles.secondaryButton}>
          <FiCheckCircle />
          Save Report
        </button>
      </div>
    </div>
  );
};

export default InsightsPanel; 