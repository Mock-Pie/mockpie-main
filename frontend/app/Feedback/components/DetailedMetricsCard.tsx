'use client';

import React, { useState } from 'react';
import styles from './DetailedMetricsCard.module.css';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiInfo, FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface MetricItem {
    label: string;
    value: string | number;
    score?: number;
    status?: 'good' | 'fair' | 'poor' | 'excellent' | string;
    description?: string;
    recommendation?: string;
    recommendations?: string[];
    confidence?: number;
    detected?: boolean;
    mostCommonFiller?: string;
    details?: Record<string, any>;
}

interface DetailedMetricsCardProps {
    title: string;
    metrics: MetricItem[];
    icon?: React.ReactNode;
    color?: string;
}

const DetailedMetricsCard: React.FC<DetailedMetricsCardProps> = ({ 
    title, 
    metrics, 
    icon,
    color = '#9966FF' 
}) => {
    const getScoreColor = (score?: number) => {
        if (score === undefined) return styles.scoreNeutral;
        if (score >= 8) return styles.scoreGood;
        if (score >= 6) return styles.scoreFair;
        return styles.scorePoor;
    };

    const getScoreIcon = (score?: number) => {
        if (!score) return <FiMinus />;
        if (score >= 8) return <FiTrendingUp />;
        if (score >= 6) return <FiMinus />;
        return <FiTrendingDown />;
    };

    // Collapsible state for each metric
    const [openIndexes, setOpenIndexes] = useState<{ [key: number]: boolean }>({});
    const toggleOpen = (idx: number) => setOpenIndexes(prev => ({ ...prev, [idx]: !prev[idx] }));

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                {icon && (
                    <div className={styles.iconWrap} style={{ backgroundColor: `${color}20` }}>
                        <div style={{ color }}>{icon}</div>
                    </div>
                )}
                <h3 className={styles.title}>{title}</h3>
            </div>
            <div className={styles.metricsList}>
                {metrics.map((metric, index) => (
                    <div key={index} className={styles.metricItem}>
                        <div className={styles.metricLabelRow}>
                            <span className={styles.metricLabel}>{metric.label}</span>
                            {metric.score !== undefined && (
                                <span className={`${styles.scoreBadge} ${getScoreColor(metric.score)}`}>
                                    {metric.score.toFixed(1)}/10 {getScoreIcon(metric.score)}
                                </span>
                            )}
                        </div>
                        <div className={styles.metricValueRow}>
                            <span className={styles.metricValue}>
                                {typeof metric.value === 'number' ? metric.value : <b>{metric.value}</b>}
                            </span>
                            {/* Status badge */}
                            {metric.status && (
                                <span className={styles.statusBadge}>
                                    {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                                </span>
                            )}
                            {/* Confidence badge */}
                            {metric.confidence !== undefined && (
                                <span className={styles.confidenceBadge}>
                                    Confidence: {(metric.confidence * 100).toFixed(1)}%
                                </span>
                            )}
                            {/* Detected badge for stutter/filler */}
                            {metric.detected === true && (
                                <span className={styles.detectedBadge}>Detected</span>
                            )}
                            {metric.detected === false && (
                                <span className={styles.notDetectedBadge}>Not Detected</span>
                            )}
                        </div>
                        
                        {/* Most common filler */}
                        {metric.mostCommonFiller && (
                            <div className={styles.metricDescription}>
                                Most common filler: <b>{metric.mostCommonFiller}</b>
                            </div>
                        )}
                        
                        {/* Description */}
                        {metric.description && (
                            <p className={styles.metricDescription}>{metric.description}</p>
                        )}
                        
                        {/* Primary Recommendation */}
                        {metric.recommendation && (
                            <div className={styles.recommendation}>
                                <FiInfo className={styles.recommendationIcon} />
                                {metric.recommendation}
                            </div>
                        )}
                        
                        {/* Show More: details and all recommendations */}
                        {(metric.details || (metric.recommendations && metric.recommendations.length > 1)) && (
                            <div style={{ marginTop: '1rem' }}>
                                <button
                                    className={styles.showMoreButton}
                                    onClick={() => toggleOpen(index)}
                                    type="button"
                                    aria-expanded={openIndexes[index]}
                                    aria-controls={`metric-details-${index}`}
                                >
                                    {openIndexes[index] ? (
                                        <>
                                            <FiChevronUp />
                                            Show Less
                                        </>
                                    ) : (
                                        <>
                                            <FiChevronDown />
                                            Show More Details
                                        </>
                                    )}
                                </button>
                                
                                {openIndexes[index] && (
                                    <div 
                                        className={styles.expandableContent}
                                        id={`metric-details-${index}`}
                                        role="region"
                                        aria-labelledby={`metric-${index}`}
                                    >
                                        {/* All recommendations as a list */}
                                        {metric.recommendations && metric.recommendations.length > 1 && (
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <h4 className={styles.sectionHeader}>
                                                    <FiInfo style={{ color: '#3b82f6' }} />
                                                    All Recommendations
                                                </h4>
                                                <ul className={styles.recommendationsList}>
                                                    {metric.recommendations.map((rec, i) => (
                                                        <li key={i}>{rec}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {/* Details as key-value pairs */}
                                        {metric.details && (
                                            <div>
                                                <h4 className={styles.sectionHeader}>
                                                    <FiInfo style={{ color: '#10b981' }} />
                                                    Detailed Statistics
                                                </h4>
                                                <div className={styles.detailsGrid}>
                                                    {Object.entries(metric.details).map(([k, v], i) => (
                                                        <div key={i} className={styles.detailCard}>
                                                            <div style={{ 
                                                                fontWeight: '600', 
                                                                color: 'var(--white)',
                                                                marginBottom: '0.25rem',
                                                                fontSize: '0.9rem',
                                                                textTransform: 'capitalize'
                                                            }}>
                                                                {k.replace(/_/g, ' ')}
                                                            </div>
                                                            <div style={{ 
                                                                color: 'var(--light-grey)',
                                                                fontSize: '0.95rem',
                                                                fontWeight: '500'
                                                            }}>
                                                                {typeof v === 'number' ? v.toFixed(2) : String(v)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DetailedMetricsCard; 