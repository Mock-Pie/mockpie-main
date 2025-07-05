'use client';

import React, { useState } from 'react';
import styles from './DetailedMetricsCard.module.css';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiInfo, FiChevronDown, FiChevronUp, FiHelpCircle } from 'react-icons/fi';
import Tooltip from "./Tooltip";

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

    const getDetailDescription = (key: string): string => {
        const descriptions: { [key: string]: string } = {
            // Speech metrics
            wpm: "Words per minute: Measures your speaking speed. Aim for 120–160 wpm for clear, engaging speech.",
            pause_count: "Number of pauses: Frequent pauses can disrupt flow, but some are natural for emphasis and breathing.",
            pause_duration: "Average pause length (seconds): Short pauses help clarity, but long or frequent pauses may signal uncertainty.",
            filler_count: "Filler words used (um, uh, etc.): Fewer fillers make your speech sound more confident and polished.",
            filler_frequency: "Filler words per minute: High frequency can distract your audience. Practice to reduce fillers.",
            stutter_count: "Stuttering instances: Occasional stutters are normal, but frequent stuttering can affect clarity.",
            stutter_frequency: "Stutters per minute: Lower is better for smooth delivery.",
            volume_variance: "Volume variation: Some variation keeps your speech lively, but too much can be distracting.",
            pitch_variance: "Pitch variation: Varying your pitch helps maintain interest. Monotone speech can bore listeners.",
            emotion_confidence: "Emotion detection confidence: Higher values mean the system is more certain about your emotional tone.",
            dominant_emotion: "Most frequent emotion detected: Shows the main emotion you conveyed (e.g., happy, neutral, nervous).",
            emotion_distribution: "Breakdown of emotions detected: Helps you understand the emotional range in your delivery.",
            
            // Visual metrics
            eye_contact_percentage: "Eye contact: The percentage of time you looked at the camera. More eye contact builds connection.",
            eye_contact_duration: "Average eye contact session (seconds): Longer sessions show confidence, but don't stare too long.",
            posture_score: "Posture quality: Higher scores mean you maintained good, open posture throughout your talk.",
            posture_confidence: "Posture analysis confidence: How sure the system is about your posture assessment.",
            gesture_count: "Hand gestures: Using your hands can make your talk more engaging, but avoid overdoing it.",
            gesture_frequency: "Gestures per minute: A moderate rate helps emphasize points without distraction.",
            facial_expression_count: "Facial expressions: More expressions can make you appear more lively and relatable.",
            facial_confidence: "Facial analysis confidence: How certain the system is about your facial expression results.",
            
            // Content metrics
            keyword_relevance_score: "Keyword relevance: How well your speech matched the topic keywords. Higher is better.",
            keyword_coverage: "Keyword coverage: The percentage of important topic keywords you used.",
            lexical_diversity: "Lexical diversity: Measures vocabulary variety. Higher diversity makes your speech more interesting.",
            content_structure_score: "Content structure: How well your talk was organized (introduction, body, conclusion, etc.).",
            topic_coherence: "Topic coherence: How well you stayed on topic throughout your presentation.",
            content_confidence: "Content analysis confidence: How sure the system is about your content assessment.",
            
            // General metrics
            duration: "Total presentation time: The full length of your talk, in seconds.",
            word_count: "Total words spoken: Gives you an idea of your content volume.",
            sentence_count: "Total sentences: More sentences can mean more structure, but too many short sentences may hurt flow.",
            average_sentence_length: "Average words per sentence: Aim for 12–18 words for clear, concise communication.",
            confidence: "Overall analysis confidence: How certain the system is about your results.",
            
            // Lexical richness details
            hdd: "Hypergeometric Distribution Diversity (HDD): A measure of vocabulary variety. Higher is better.",
            mtld: "Measure of Textual Lexical Diversity (MTLD): Higher values mean more varied vocabulary.",
            type_token_ratio: "Type-Token Ratio: The ratio of unique words to total words. Higher means more variety.",
            unique_words: "Unique words: The number of different words you used.",
            content_word_ratio: "Content word ratio: The proportion of meaningful words (nouns, verbs, etc.) in your speech.",
            hapax_legomena: "Hapax Legomena: Words that appear only once. More can indicate richer vocabulary.",
            complex_word_ratio: "Complex word ratio: The proportion of complex words (3+ syllables). Higher can mean more advanced vocabulary.",
        };
        
        return descriptions[key] || `The ${key.replace(/_/g, ' ')} value`;
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

    // Tooltip state
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

    return (
        <div className={styles.card} style={{ position: 'relative' }}>
            {/* Custom Tooltip */}
            {tooltip && <Tooltip text={tooltip.text} x={tooltip.x} y={tooltip.y} />}
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
                            {metric.score === -1 ? (
                                <span style={{ color: 'red', fontWeight: 600, marginLeft: 8 }}>
                                    Error: Could not compute score for this model
                                </span>
                            ) : metric.score !== undefined && (
                                <span className={`${styles.scoreBadge} ${getScoreColor(metric.score)}`}>
                                    {metric.score.toFixed(1)}/10 {getScoreIcon(metric.score)}
                                </span>
                            )}
                        </div>
                        {metric.score === -1 ? null : (
                            <>
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
                                                            {Object.entries(metric.details).map(([k, v], i) => {
                                                                const description = getDetailDescription(k);
                                                                return (
                                                                    <div
                                                                        key={i}
                                                                        className={styles.detailCard}
                                                                        onMouseEnter={description ? (e) => {
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            setTooltip({
                                                                                text: description,
                                                                                x: rect.right + 8,
                                                                                y: rect.top,
                                                                            });
                                                                        } : undefined}
                                                                        onMouseLeave={description ? () => setTooltip(null) : undefined}
                                                                    >
                                                                        <div style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.5rem',
                                                                            marginBottom: '0.25rem',
                                                                        }}>
                                                                            <div style={{
                                                                                fontWeight: '600',
                                                                                color: 'var(--white)',
                                                                                fontSize: '0.9rem',
                                                                                textTransform: 'capitalize',
                                                                            }}>
                                                                                {k.replace(/_/g, ' ')}
                                                                            </div>
                                                                            {description && (
                                                                                <div
                                                                                    style={{
                                                                                        cursor: 'help',
                                                                                        color: 'var(--light-grey)',
                                                                                        fontSize: '0.8rem',
                                                                                        display: 'inline-flex',
                                                                                        alignItems: 'center',
                                                                                    }}
                                                                                >
                                                                                    <FiHelpCircle />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div style={{
                                                                            color: 'var(--light-grey)',
                                                                            fontSize: '0.95rem',
                                                                            fontWeight: '500',
                                                                        }}>
                                                                            {typeof v === 'number' ? v.toFixed(2) : String(v)}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DetailedMetricsCard; 