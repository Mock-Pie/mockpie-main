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
            wpm_variance: "How much your speaking speed changed. Consistent pacing helps your audience follow along.",
            pause_count: "Number of pauses: Some pauses are good for emphasis, but too many can break your flow.",
            pause_percentage: "The percentage of your talk spent pausing. Pauses are good for emphasis, but too many can break flow.",
            total_pause_time: "Total time spent pausing. Use pauses for effect, but avoid long silences.",
            avg_pause_duration: "Average length of each pause. Short, purposeful pauses are best.",
            word_count: "Total words spoken. Enough words show depth, but avoid rambling.",
            duration_minutes: "Total duration of your presentation in minutes. Aim for the recommended time.",
            filler_count: "Number of filler words used (um, uh, etc.): Fewer fillers make your speech sound more confident and polished.",
            filler_frequency: "Filler words per minute: High frequency can distract your audience. Practice to reduce fillers.",
            stutter_count: "Number of stuttering instances: Occasional stutters are normal, but frequent stuttering can affect clarity.",
            stutter_frequency: "Stutters per minute: Lower is better for smooth delivery.",
            stutter_percentage: "Percent of your speech with stuttering. Practice can help reduce this.",
            stutter_frequency_per_minute: "How often stuttering occurred per minute. Lower is better for clarity.",
            stutter_segments_count: "Number of segments with stuttering. Fewer is better.",
            total_segments: "Total segments analyzed for stuttering.",
            volume_variance: "Volume variation: Some variation keeps your speech lively, but too much can be distracting.",
            pitch_variance: "Pitch variation: Varying your pitch helps maintain interest. Monotone speech can bore listeners.",
            mean_pitch: "The average pitch of your voice throughout the presentation.",
            pitch_range: "The difference between your highest and lowest pitch.",
            pitch_std: "How much your pitch varied from the average.",
            intonation_variability: "How much your voice tone changed during speech.",
            pitch_dynamism: "How dynamic and expressive your pitch changes were.",
            semitone_range: "The range of musical notes your voice covered.",
            emotion_confidence: "Emotion detection confidence: Higher values mean the system is more certain about your emotional tone.",
            dominant_emotion: "The main emotion shown in your speech or on your face.",
            emotion_distribution: "Breakdown of emotions detected: Helps you understand the emotional range in your delivery.",
            emotional_range: "How much your emotions varied throughout the presentation.",
            emotion_consistency: "How consistently you maintained emotional expression.",
            engagement_score: "How engaging your delivery or facial expressions were to listeners.",
            emotion_std: "The standard deviation of your emotional expression.",

            // Visual metrics
            happy: "How often you smiled. Smiling helps connect with your audience.",
            sad: "How often you looked sad. Try to keep your tone upbeat for most presentations.",
            angry: "How often you looked angry. A calm tone is usually more effective.",
            fearful: "How often you looked fearful. Confidence helps your message.",
            disgusted: "How often you looked disgusted. Stay positive for best results.",
            surprised: "How often you looked surprised. Expressiveness can help, but avoid overdoing it.",
            neutral: "How often you looked neutral. Some neutrality is fine, but show emotion to engage your audience.",
            positivity_score: "How positive your facial expressions were overall.",
            negativity_score: "How negative your facial expressions were overall.",
            neutrality_score: "How neutral your facial expressions were overall.",
            emotional_variability: "How much your facial emotions changed throughout.",
            face_detection_rate: "How often your face was visible. Make sure your face is well-lit and in frame.",
            attention_score: "How well you maintained eye contact. Good eye contact builds trust.",
            center_attention_ratio: "How often you looked at the center of the frame.",
            average_engagement_score: "How engaging your eye contact was overall.",
            total_frames_analyzed: "The total number of video frames analyzed for eye contact.",
            gesture_variety: "The number of different gestures you used. Variety keeps things interesting.",
            hand_usage_distribution: "How you used your left and right hands. Balanced use looks natural.",
            zone_distribution: "Where you used your hands most. Use the space around you for emphasis.",
            posture_score: "Your overall posture quality. Good posture shows confidence.",
            posture_confidence: "How confident the system is in your posture assessment.",

            // Content metrics
            keyword_relevance_score: "How well your speech matched the topic keywords. Higher is better.",
            keyword_coverage: "The percentage of important topic keywords you used.",
            lexical_diversity: "How varied your vocabulary was. More variety keeps your speech interesting.",
            content_structure_score: "How well your talk was organized.",
            topic_coherence: "How well you stayed on topic.",
            content_confidence: "How confident the system is in your content analysis.",
            hdd: "A measure of vocabulary variety. Higher is better.",
            mtld: "A measure of how much you varied your word choice.",
            type_token_ratio: "The ratio of unique words to total words. Higher means more variety.",
            unique_words: "The number of different words you used.",
            content_word_ratio: "The proportion of meaningful words in your speech.",
            hapax_legomena: "Words that appear only once. More can indicate richer vocabulary.",
            complex_word_ratio: "The proportion of complex words (3+ syllables).",
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
                                    Error: Could not compute score for this model, needs more data
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