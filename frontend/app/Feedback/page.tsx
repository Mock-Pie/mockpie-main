"use client";
import React, { useEffect, useState } from "react";
import SideBar from "../UploadRecordVideos/components/SideBar";
import styles from "../UploadRecordVideos/page.module.css";
import feedbackStyles from "./feedback.module.css";
import LoadingFeedback from "./components/LoadingFeedback";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Header from "./components/Header";
import AnalysisOverview from "./components/AnalysisOverview";
import SpeechAnalysisCard from "./components/SpeechAnalysisCard";
import VisualAnalysisCard from "./components/VisualAnalysisCard";
import ContentAnalysisCard from "./components/ContentAnalysisCard";
import InsightsPanel from "./components/InsightsPanel";
import VideoPlayer from "./components/VideoPlayer";
import TranscriptionDisplay from "./components/TranscriptionDisplay";
import DetailedMetricsCard from "./components/DetailedMetricsCard";
import RecommendationsCard from "./components/RecommendationsCard";
// import ScoreBreakdownCard from "./components/ScoreBreakdownCard";
import DemoFeedback from "./components/DemoFeedback";
import { FiPlay, FiFileText, FiCopy, FiCheck, FiMic, FiEye, FiMessageSquare, FiBarChart, FiTarget, FiZap } from "react-icons/fi";

// Define the type for the feedback data
interface FeedbackData {
    overview: {
        overallScore: number;
        analysisDate: string;
        videoDuration: string;
        focusAreas: string[];
    };
    speechAnalysis?: any;
    visualAnalysis?: any;
    contentAnalysis?: any;
    insights?: {
        keyTakeaways: string[];
        detailedInsights: any[];
        nextSteps: string[];
    };
    [key: string]: any; // Allow arbitrary keys for dynamic feedback fields
}

// Define the type for presentation data
interface PresentationData {
    id: number;
    title: string;
    url: string;
    uploaded_at: string;
    file_info?: {
        file_size?: number;
        file_exists?: boolean;
    };
}

// Add this at the top of the file for TypeScript
declare global {
    interface Window {
        __feedbackData?: FeedbackData;
    }
}

const Feedback = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    // Try to get presentationId from URL, else from localStorage
    let presentationId = searchParams?.get("presentationId");
    if (typeof window !== "undefined" && !presentationId) {
        presentationId = localStorage.getItem("presentationId");
    }
    const [feedback, setFeedback] = useState<FeedbackData | null>(null);
    const [presentation, setPresentation] = useState<PresentationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (typeof window !== "undefined") {
                const stored = localStorage.getItem("feedbackData");
                if (stored) {
                    setFeedback(JSON.parse(stored));
                    localStorage.removeItem("feedbackData");
                }
            }
            
            // If not in localStorage, fetch from backend
            if (!presentationId) {
                setError("No presentation ID provided.");
                setLoading(false);
                return;
            }

            try {
                // Fetch presentation details
                const accessToken = localStorage.getItem("access_token");
                if (!accessToken) {
                    setError("Please log in to view feedback.");
                    setLoading(false);
                    return;
                }

                const presentationResponse = await fetch(`http://localhost:8081/presentations/${presentationId}`, {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                    },
                });

                if (presentationResponse.ok) {
                    const presentationData = await presentationResponse.json();
                    setPresentation(presentationData);
                } else {
                    console.error("Failed to fetch presentation details");
                }

                // Fetch feedback data
                const feedbackResponse = await fetch(`http://localhost:8081/feedback/presentation/${presentationId}/feedback`);
                if (feedbackResponse.ok) {
                    const feedbackData = await feedbackResponse.json();
                    console.log('Feedback data received:', feedbackData);
                    console.log('Transcription info:', feedbackData.transcription_info);
                    setFeedback(feedbackData);
                } else {
                    setError("Failed to fetch feedback data");
                }
            } catch (err) {
                setError(typeof err === "string" ? err : "Error loading data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [pathname, presentationId]);

    const handleLoadDemoData = (demoData: any) => {
        setFeedback(demoData);
        setError(null);
        setLoading(false);
    };

    if (loading) return <LoadingFeedback />;
    if (error && !feedback) {
        return (
            <div className={styles.container}>
                <SideBar />
                <div className={feedbackStyles.mainContent}>
                    <Header />
                    <div style={{ padding: 32, textAlign: "center", color: "red" }}>{error}</div>
                    <DemoFeedback onLoadDemoData={handleLoadDemoData} />
                </div>
            </div>
        );
    }
    if (!feedback) return null;

    // Helper to normalize scores to 10
    const normalizeScore = (score: number | undefined | null) => {
        if (typeof score !== 'number' || isNaN(score)) return 0;
        return score > 10 ? Math.round((score / 10) * 10) / 10 : Math.round(score * 10) / 10;
    };

    // --- Analysis Overview ---
    const enhanced = feedback.enhanced_feedback || {};
    const overviewProps = {
        overallScore: normalizeScore(enhanced.overall_score),
        analysisDate: new Date().toLocaleDateString(),
        videoDuration: feedback.pitch_analysis?.pitch_statistics?.total_duration
            ? `${Math.round(feedback.pitch_analysis.pitch_statistics.total_duration)}s`
            : (feedback.facial_emotion?.temporal_analysis?.total_duration ? `${Math.round(feedback.facial_emotion.temporal_analysis.total_duration)}s` : '-'),
        focusAreas: Array.isArray(enhanced.summary?.primary_focus_areas)
            ? enhanced.summary.primary_focus_areas
            : [],
    };

    // --- Speech Analysis ---
    const speechFeedback = enhanced.detailed_feedback?.speech_feedback?.specific_feedback || {};
    const speechAnalysisProps = {
        speechEmotion: {
            value: feedback.speech_emotion?.dominant_emotion?.emotion || '-',
            score: normalizeScore(speechFeedback.speech_emotion?.score),
            insight: speechFeedback.speech_emotion?.feedback || '-',
            recommendation: speechFeedback.speech_emotion?.assessment || undefined,
        },
        speakingRate: {
            value: feedback.speaking_rate?.value || '-',
            score: normalizeScore(feedback.speaking_rate?.score),
            insight: feedback.speaking_rate?.insight || '-',
            recommendation: feedback.speaking_rate?.recommendation || undefined,
        },
        pitchAnalysis: {
            value: feedback.pitch_analysis?.pitch_statistics?.mean_pitch || '-',
            score: normalizeScore(speechFeedback.pitch_analysis?.score),
            insight: speechFeedback.pitch_analysis?.feedback || '-',
            recommendation: speechFeedback.pitch_analysis?.assessment || undefined,
        },
        fillerWords: {
            value: feedback.filler_words?.value || '-',
            score: normalizeScore(feedback.filler_words?.score),
            insight: feedback.filler_words?.insight || '-',
            recommendation: feedback.filler_words?.recommendation || undefined,
        },
        stutterDetection: {
            value: feedback.stutter_detection?.stutter_detected ? 'Detected' : 'Not Detected',
            score: normalizeScore(speechFeedback.stutter_detection?.score),
            insight: speechFeedback.stutter_detection?.feedback || '-',
            recommendation: speechFeedback.stutter_detection?.assessment || undefined,
        },
    };

    // --- Visual Analysis ---
    const visualFeedback = enhanced.detailed_feedback?.visual_feedback?.specific_feedback || {};
    const visualAnalysisProps = {
        facialEmotion: {
            value: feedback.facial_emotion?.emotion_statistics?.dominant_emotion?.emotion || '-',
            score: normalizeScore(visualFeedback.facial_emotion?.score),
            insight: visualFeedback.facial_emotion?.feedback || '-',
            recommendation: visualFeedback.facial_emotion?.assessment || undefined,
        },
        eyeContact: {
            value: feedback.eye_contact?.attention_score || '-',
            score: normalizeScore(visualFeedback.eye_contact?.score),
            insight: visualFeedback.eye_contact?.feedback || '-',
            recommendation: visualFeedback.eye_contact?.assessment || undefined,
        },
        handGestures: {
            value: feedback.hand_gestures?.value || '-',
            score: normalizeScore(feedback.hand_gestures?.score),
            insight: feedback.hand_gestures?.insight || '-',
            recommendation: feedback.hand_gestures?.recommendation || undefined,
        },
        postureAnalysis: {
            value: feedback.posture_analysis?.posture_metrics?.posture_quality || '-',
            score: normalizeScore(visualFeedback.posture_analysis?.score),
            insight: visualFeedback.posture_analysis?.feedback || '-',
            recommendation: visualFeedback.posture_analysis?.assessment || undefined,
        },
    };

    // --- Content Analysis ---
    const contentFeedback = enhanced.detailed_feedback?.content_feedback?.specific_feedback || {};
    const contentAnalysisProps = {
        lexicalRichness: {
            value: feedback.lexical_richness?.assessment?.richness_level || '-',
            score: normalizeScore(contentFeedback.lexical_richness?.score),
            insight: contentFeedback.lexical_richness?.feedback || '-',
            recommendation: contentFeedback.lexical_richness?.assessment || undefined,
        },
        keywordRelevance: {
            value: feedback.keyword_relevance?.relevance_assessment?.assessment_level || '-',
            score: normalizeScore(contentFeedback.keyword_relevance?.score),
            insight: contentFeedback.keyword_relevance?.feedback || '-',
            recommendation: contentFeedback.keyword_relevance?.assessment || undefined,
        },
    };

    // --- Insights ---
    const insightsProps = {
        insights: Array.isArray(enhanced.detailed_feedback?.areas_for_improvement)
            ? enhanced.detailed_feedback.areas_for_improvement.map((area: string) => ({
                type: 'improvement',
                title: area,
                description: area,
                priority: 'high',
            })) : [],
        keyTakeaways: Array.isArray(enhanced.summary?.key_highlights) ? enhanced.summary.key_highlights : [],
        nextSteps: Array.isArray(enhanced.recommendations) ? enhanced.recommendations : [],
    };

    // --- Prepare metrics for new components using enhanced_feedback.individual_model_scores ---
    const modelScores = enhanced.individual_model_scores || {};
    const speechMetrics = [
        {
            label: "Speech Emotion",
            value: feedback.speech_emotion?.dominant_emotion?.emotion || 'N/A',
            score: modelScores.speech_emotion?.score ?? undefined,
            confidence: feedback.speech_emotion?.dominant_emotion?.confidence,
            recommendation: Array.isArray(feedback.speech_emotion?.recommendations) ? feedback.speech_emotion.recommendations[0] : undefined,
            recommendations: feedback.speech_emotion?.recommendations,
            details: feedback.speech_emotion?.emotions ? {
                ...feedback.speech_emotion.emotions,
                emotional_range: feedback.speech_emotion?.presentation_metrics?.emotional_range,
                emotion_consistency: feedback.speech_emotion?.presentation_metrics?.emotion_consistency,
                engagement_score: feedback.speech_emotion?.presentation_metrics?.engagement_score,
                emotion_std: feedback.speech_emotion?.emotion_analysis?.angry?.std,
            } : undefined,
            description: `Confidence: ${(feedback.speech_emotion?.dominant_emotion?.confidence * 100).toFixed(1)}%`
        },
        {
            label: "Speaking Rate (WPM)",
            value: feedback.wpm_analysis?.overall_wpm || 'N/A',
            score: modelScores.wpm_analysis?.score ?? undefined,
            status: feedback.wpm_analysis?.assessment?.status,
            recommendation: Array.isArray(feedback.wpm_analysis?.recommendations) ? feedback.wpm_analysis.recommendations[0] : undefined,
            recommendations: feedback.wpm_analysis?.recommendations,
            details: {
                word_count: feedback.wpm_analysis?.word_count,
                duration_minutes: feedback.wpm_analysis?.duration_minutes,
                pace_consistency: feedback.wpm_analysis?.pace_consistency?.score,
                pause_percentage: feedback.wpm_analysis?.pause_analysis?.pause_percentage,
                total_pause_time: feedback.wpm_analysis?.pause_analysis?.total_pause_time,
                avg_pause_duration: feedback.wpm_analysis?.pause_analysis?.average_pause_duration,
                pause_count: feedback.wpm_analysis?.pause_analysis?.pause_count,
                wpm_variance: feedback.wpm_analysis?.segment_analysis?.wpm_variance,
            },
            description: feedback.wpm_analysis?.assessment?.message
        },
        {
            label: "Pitch Analysis",
            value: `${feedback.pitch_analysis?.pitch_statistics?.mean_pitch?.toFixed(1) || 'N/A'} Hz`,
            score: modelScores.pitch_analysis?.score ?? undefined,
            recommendation: Array.isArray(feedback.pitch_analysis?.recommendations) ? feedback.pitch_analysis.recommendations[0] : undefined,
            recommendations: feedback.pitch_analysis?.recommendations,
            details: feedback.pitch_analysis?.pitch_statistics ? {
                ...feedback.pitch_analysis.pitch_statistics,
                intonation_variability: feedback.pitch_analysis?.intonation_patterns?.intonation_variability,
                pitch_dynamism: feedback.pitch_analysis?.variation_metrics?.pitch_dynamism,
                semitone_range: feedback.pitch_analysis?.variation_metrics?.semitone_range,
            } : undefined,
            description: `Range: ${feedback.pitch_analysis?.pitch_statistics?.pitch_range?.toFixed(1) || 'N/A'} Hz`
        },
        {
            label: "Filler Words",
            value: `${feedback.filler_detection?.filler_analysis?.total_fillers || 0} words`,
            score: modelScores.filler_detection?.score ?? undefined,
            recommendation: Array.isArray(feedback.filler_detection?.recommendations) ? feedback.filler_detection.recommendations[0] : undefined,
            recommendations: feedback.filler_detection?.recommendations,
            mostCommonFiller: feedback.filler_detection?.filler_analysis?.most_common_filler,
            details: feedback.filler_detection?.filler_analysis ? {
                ...feedback.filler_detection.filler_analysis,
                pause_percentage: feedback.filler_detection?.pause_analysis?.pause_percentage,
                total_pauses: feedback.filler_detection?.pause_analysis?.total_pauses,
                average_pause_duration: feedback.filler_detection?.pause_analysis?.average_pause_duration,
            } : undefined,
            description: `${feedback.filler_detection?.filler_analysis?.filler_rate_percentage?.toFixed(1) || 0}% of speech`
        },
        {
            label: "Stutter Detection",
            value: feedback.stutter_detection?.stutter_detected ? 'Detected' : 'Not Detected',
            score: modelScores.stutter_detection?.score ?? undefined,
            detected: feedback.stutter_detection?.stutter_detected,
            recommendation: Array.isArray(feedback.stutter_detection?.recommendations) ? feedback.stutter_detection.recommendations[0] : undefined,
            recommendations: feedback.stutter_detection?.recommendations,
            details: {
                stutter_percentage: feedback.stutter_detection?.stutter_percentage,
                stutter_frequency_per_minute: feedback.stutter_detection?.stutter_frequency_per_minute,
                stutter_segments_count: feedback.stutter_detection?.stutter_segments_count,
                total_segments: feedback.stutter_detection?.total_segments,
                stutter_timeline: feedback.stutter_detection?.stutter_timeline?.map((seg: any) => `Segment ${seg.segment_id}: ${seg.stutter_probability ? (seg.stutter_probability * 100).toFixed(1) : ''}%`),
            },
            description: `${feedback.stutter_detection?.stutter_percentage?.toFixed(1) || 0}% of segments affected`
        }
    ];

    const visualMetrics = [
        {
            label: "Facial Emotion",
            value: feedback.facial_emotion?.emotion_statistics?.dominant_emotion?.emotion || 'N/A',
            score: modelScores.facial_emotion?.score ?? undefined,
            recommendation: Array.isArray(feedback.facial_emotion?.recommendations) ? feedback.facial_emotion.recommendations[0] : undefined,
            recommendations: feedback.facial_emotion?.recommendations,
            details: feedback.facial_emotion?.emotion_statistics ? {
                ...feedback.facial_emotion.emotion_statistics.emotion_averages,
                dominant_emotion: feedback.facial_emotion?.emotion_statistics?.dominant_emotion?.emotion,
                positivity_score: feedback.facial_emotion?.emotion_statistics?.positivity_score,
                negativity_score: feedback.facial_emotion?.emotion_statistics?.negativity_score,
                neutrality_score: feedback.facial_emotion?.emotion_statistics?.neutrality_score,
                emotional_variability: feedback.facial_emotion?.emotion_statistics?.emotional_variability,
                face_detection_rate: feedback.facial_emotion?.face_detection_rate,
                engagement_score: feedback.facial_emotion?.engagement_metrics?.engagement_score,
                visual_appeal: feedback.facial_emotion?.engagement_metrics?.visual_appeal,
            } : undefined,
            description: `Detection rate: ${(feedback.facial_emotion?.face_detection_rate * 100).toFixed(1)}%`
        },
        {
            label: "Eye Contact",
            value: `${feedback.eye_contact?.attention_score || 0}/10`,
            score: modelScores.eye_contact?.score ?? modelScores.eye_contact ?? undefined,
            recommendation: undefined,
            recommendations: undefined,
            details: feedback.eye_contact ? {
                attention_score: feedback.eye_contact?.attention_score,
                center_attention_ratio: feedback.eye_contact?.confidence_metrics?.center_attention_ratio,
                face_detection_rate: feedback.eye_contact?.engagement_metrics?.face_detection_rate,
                average_engagement_score: feedback.eye_contact?.engagement_metrics?.average_engagement_score,
                total_frames_analyzed: feedback.eye_contact?.engagement_metrics?.total_frames_analyzed,
            } : undefined,
            description: `Face detection: ${(feedback.eye_contact?.engagement_metrics?.face_detection_rate * 100).toFixed(1)}%`
        },
        {
            label: "Hand Gestures",
            value: feedback.hand_gesture?.gesture_statistics?.most_common_gesture || 'N/A',
            score: modelScores.hand_gesture?.score ?? undefined,
            recommendation: Array.isArray(feedback.hand_gesture?.recommendations) ? feedback.hand_gesture.recommendations[0] : undefined,
            recommendations: feedback.hand_gesture?.recommendations,
            details: feedback.hand_gesture?.gesture_statistics ? {
                ...feedback.hand_gesture.gesture_statistics,
                gesture_variety: feedback.hand_gesture?.gesture_statistics?.gesture_variety,
                hand_usage_distribution: feedback.hand_gesture?.gesture_statistics?.hand_usage_distribution,
                zone_distribution: feedback.hand_gesture?.gesture_statistics?.zone_distribution,
                average_effectiveness: feedback.hand_gesture?.gesture_statistics?.average_effectiveness,
                engagement_level: feedback.hand_gesture?.engagement_metrics?.engagement_level,
                hands_usage_rating: feedback.hand_gesture?.engagement_metrics?.hands_usage_rating,
            } : undefined,
            description: `${feedback.hand_gesture?.gesture_statistics?.hands_visible_percentage || 0}% visibility`
        },
        {
            label: "Posture Quality",
            value: feedback.posture_analysis?.posture_metrics?.posture_quality || 'N/A',
            score: modelScores.posture_analysis?.score ?? undefined,
            recommendation: Array.isArray(feedback.posture_analysis?.recommendations) ? feedback.posture_analysis.recommendations[0] : undefined,
            recommendations: feedback.posture_analysis?.recommendations,
            details: feedback.posture_analysis?.posture_metrics ? {
                ...feedback.posture_analysis.posture_metrics,
                most_problematic: feedback.posture_analysis?.posture_metrics?.most_problematic,
                main_issues: feedback.posture_analysis?.posture_metrics?.main_issues,
                pose_counts: feedback.posture_analysis?.bad_posture_summary?.pose_counts,
                pose_percentages: feedback.posture_analysis?.bad_posture_summary?.pose_percentages,
            } : undefined,
            description: `${feedback.posture_analysis?.posture_metrics?.total_penalty_points?.toFixed(1) || 0} penalty points`
        }
    ];

    const contentMetrics = [
        {
            label: "Lexical Richness",
            value: feedback.lexical_richness?.assessment?.richness_level || 'N/A',
            score: modelScores.lexical_richness?.score ?? undefined,
            recommendation: Array.isArray(feedback.lexical_richness?.recommendations) ? feedback.lexical_richness.recommendations[0] : undefined,
            recommendations: feedback.lexical_richness?.recommendations,
            details: feedback.lexical_richness?.richness_metrics ? {
                ...feedback.lexical_richness.richness_metrics,
                vocabulary_size: feedback.lexical_richness?.vocabulary_statistics?.vocabulary_size,
                unique_words: feedback.lexical_richness?.vocabulary_statistics?.unique_words,
                content_word_ratio: feedback.lexical_richness?.vocabulary_statistics?.content_word_ratio,
                hapax_legomena: feedback.lexical_richness?.vocabulary_statistics?.hapax_legomena,
                average_word_length: feedback.lexical_richness?.vocabulary_statistics?.average_word_length,
                average_words_per_sentence: feedback.lexical_richness?.complexity_analysis?.average_words_per_sentence,
                complex_word_ratio: feedback.lexical_richness?.complexity_analysis?.complex_word_ratio,
            } : undefined,
            description: `TTR: ${(feedback.lexical_richness?.richness_metrics?.type_token_ratio * 100).toFixed(1)}%`
        },
        {
            label: "Keyword Relevance",
            value: feedback.keyword_relevance?.relevance_assessment?.assessment_level || 'N/A',
            score: modelScores.keyword_relevance?.score ?? undefined,
            recommendation: Array.isArray(feedback.keyword_relevance?.recommendations) ? feedback.keyword_relevance.recommendations[0] : undefined,
            recommendations: feedback.keyword_relevance?.recommendations,
            details: feedback.keyword_relevance?.topic_coherence ? {
                ...feedback.keyword_relevance.topic_coherence,
                keyword_coverage_percentage: feedback.keyword_relevance?.topic_coherence?.keyword_coverage_percentage,
                semantic_coherence: feedback.keyword_relevance?.topic_coherence?.semantic_coherence,
                diversity_score: feedback.keyword_relevance?.keyword_diversity?.diversity_score,
                total_unique_keywords: feedback.keyword_relevance?.keyword_diversity?.total_unique_keywords,
                extracted_keywords: feedback.keyword_relevance?.extracted_keywords?.keybert?.map((k: any) => `${k.keyword} (${k.score})`).join(', '),
            } : undefined,
            description: `Coherence: ${(feedback.keyword_relevance?.topic_coherence?.coherence_score * 100).toFixed(1)}%`
        }
    ];

    // Prepare recommendations
    const allRecommendations = [
        ...(feedback.speech_emotion?.recommendations || []),
        ...(feedback.wpm_analysis?.recommendations || []),
        ...(feedback.pitch_analysis?.recommendations || []),
        ...(feedback.filler_detection?.recommendations || []),
        ...(feedback.stutter_detection?.recommendations || []),
        ...(feedback.facial_emotion?.recommendations || []),
        ...(feedback.hand_gesture?.recommendations || []),
        ...(feedback.posture_analysis?.recommendations || []),
        ...(feedback.lexical_richness?.recommendations || []),
        ...(feedback.keyword_relevance?.recommendations || []),
        ...(enhanced.recommendations || [])
    ].map(rec => ({ text: rec, priority: 'medium' as const }));

    return (
        <div className={styles.container}>
            <SideBar />
            <div className={feedbackStyles.mainContent}>
                <Header />
                
                {/* Demo Component (only show if no real data) */}
                {!presentationId && (
                    <DemoFeedback onLoadDemoData={handleLoadDemoData} />
                )}
                
                {/* Video and Transcription Row */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                    gap: '30px', 
                    marginBottom: '30px',
                    alignItems: 'start'
                }} className={feedbackStyles['video-transcription-grid']}>
                    {/* Video Player - Left Side */}
                    <div className={feedbackStyles.videoFrame}>
                        <div className={feedbackStyles.frameHeader}>
                            <FiPlay className={feedbackStyles.frameIcon} />
                            <h3 className={feedbackStyles.frameTitle}>Video Preview</h3>
                        </div>
                        {presentation && presentation.file_info?.file_exists && (
                            <VideoPlayer 
                                videoUrl={`http://localhost:8081${presentation.url}`}
                                title={presentation.title}
                            />
                        )}
                    </div>
                    
                    {/* Transcription Display - Right Side */}
                    <div className={feedbackStyles.transcriptionFrame}>
                        <div className={feedbackStyles.frameHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                <FiFileText className={feedbackStyles.frameIcon} />
                                <h3 className={feedbackStyles.frameTitle}>Video Transcription</h3>
                            </div>
                            <button 
                                onClick={async () => {
                                    const transcription = feedback?.transcription_info?.transcription_full || feedback?.transcription_info?.transcription_preview || "";
                                    try {
                                        await navigator.clipboard.writeText(transcription);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    } catch (err) {
                                        console.error('Failed to copy text: ', err);
                                    }
                                }}
                                className={feedbackStyles.copyButton}
                                title="Copy transcription"
                            >
                                {copied ? (
                                    <>
                                        <FiCheck />
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <FiCopy />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {feedback && feedback.transcription_info && (feedback.transcription_info.transcription_full || feedback.transcription_info.transcription_preview) && (
                            <TranscriptionDisplay 
                                transcription={feedback.transcription_info.transcription_full || feedback.transcription_info.transcription_preview || ""}
                                title=""
                            />
                        )}
                    </div>
                </div>
                
                {/* Analysis Overview */}
                <AnalysisOverview {...overviewProps} />
                
                {/* Detailed Metrics Grid */}
                <div className={feedbackStyles.detailedMetricsGrid}>
                    <DetailedMetricsCard 
                        title="Speech Analysis"
                        metrics={speechMetrics}
                        icon={<FiMic />}
                        color="#3B82F6"
                    />
                    <DetailedMetricsCard 
                        title="Visual Analysis"
                        metrics={visualMetrics}
                        icon={<FiEye />}
                        color="#10B981"
                    />
                    <DetailedMetricsCard 
                        title="Content Analysis"
                        metrics={contentMetrics}
                        icon={<FiMessageSquare />}
                        color="#F59E0B"
                    />
                </div>
                
                {/* Original Insights Panel */}
                <InsightsPanel {...insightsProps} />
            </div>
        </div>
    );
};

export default Feedback;
