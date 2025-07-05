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

    // Get the used criteria from feedback response
    const usedCriteria = feedback.used_criteria || [];
    console.log('Used criteria:', usedCriteria);
    
    // Helper function to check if a metric should be shown based on used criteria
    const shouldShowMetric = (metricKey: string) => {
        return usedCriteria.includes(metricKey);
    };

    // Helper function to check if a value is valid (not undefined, null, or empty)
    const isValidValue = (value: any): boolean => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        if (typeof value === 'number' && isNaN(value)) return false;
        return true;
    };

    // Helper function to filter out undefined properties from an object
    const filterUndefinedProps = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;
        const filtered: any = {};
        Object.keys(obj).forEach(key => {
            if (isValidValue(obj[key])) {
                filtered[key] = obj[key];
            }
        });
        return Object.keys(filtered).length > 0 ? filtered : undefined;
    };

    // Helper function to check if a metric has valid data to display
    const hasValidData = (metric: any): boolean => {
        return isValidValue(metric.value) || 
               isValidValue(metric.score) || 
               isValidValue(metric.recommendation) ||
               isValidValue(metric.details) ||
               isValidValue(metric.description);
    };

    // Helper function to add descriptions to detail objects
    const addDetailDescriptions = (details: any, descriptions: any): any => {
        if (!details || typeof details !== 'object') return details;
        const enhancedDetails: any = {};
        Object.keys(details).forEach(key => {
            if (isValidValue(details[key])) {
                enhancedDetails[key] = details[key];
            }
        });
        return Object.keys(enhancedDetails).length > 0 ? enhancedDetails : undefined;
    };

    // --- Analysis Overview ---
    const enhanced = feedback.enhanced_feedback || {};
    const overviewProps = {
        overallScore: isValidValue(enhanced.overall_score) ? normalizeScore(enhanced.overall_score) : 0,
        analysisDate: new Date().toLocaleDateString(),
        videoDuration: (() => {
            const duration = feedback.duration;
            if (isValidValue(duration) && duration > 0) {
                return `${Math.round(duration)}s`;
            }
            return '-';
        })(),
        focusAreas: usedCriteria
            .filter((criteria: string) => isValidValue(criteria))
            .map((criteria: string) => criteria.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())),
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
            ? enhanced.detailed_feedback.areas_for_improvement
                .filter((area: string) => isValidValue(area) && area.trim() !== '')
                .map((area: string) => ({
                    type: 'improvement',
                    title: area,
                    description: area,
                    priority: 'high',
                })) : [],
        keyTakeaways: Array.isArray(enhanced.summary?.key_highlights) 
            ? enhanced.summary.key_highlights.filter((highlight: string) => isValidValue(highlight) && highlight.trim() !== '')
            : [],
        nextSteps: Array.isArray(enhanced.recommendations) 
            ? enhanced.recommendations.filter((rec: string) => isValidValue(rec) && rec.trim() !== '')
            : [],
    };

    // --- Prepare metrics for new components using enhanced_feedback.individual_model_scores ---
    const modelScores = enhanced.individual_model_scores || {};
    
    const allSpeechMetrics = [
        {
            key: "speech_emotion",
            label: "Speech Emotion",
            value: feedback.speech_emotion?.dominant_emotion?.emotion || 'N/A',
            score: modelScores.speech_emotion?.normalized_score ?? undefined,
            confidence: feedback.speech_emotion?.dominant_emotion?.confidence,
            recommendation: Array.isArray(feedback.speech_emotion?.recommendations) ? feedback.speech_emotion.recommendations[0] : undefined,
            recommendations: feedback.speech_emotion?.recommendations,
            details: feedback.speech_emotion?.emotions ? addDetailDescriptions({
                ...feedback.speech_emotion.emotions,
                emotional_range: feedback.speech_emotion?.presentation_metrics?.emotional_range,
                emotion_consistency: feedback.speech_emotion?.presentation_metrics?.emotion_consistency,
                engagement_score: feedback.speech_emotion?.presentation_metrics?.engagement_score,
                emotion_std: feedback.speech_emotion?.emotion_analysis?.angry?.std,
            }, {
                happy: "The percentage of time you expressed happiness in your speech",
                sad: "The percentage of time you expressed sadness in your speech",
                angry: "The percentage of time you expressed anger in your speech",
                fearful: "The percentage of time you expressed fear in your speech",
                disgusted: "The percentage of time you expressed disgust in your speech",
                surprised: "The percentage of time you expressed surprise in your speech",
                neutral: "The percentage of time you spoke in a neutral tone",
                emotional_range: "How much your emotions varied throughout the presentation",
                emotion_consistency: "How consistently you maintained emotional expression",
                engagement_score: "How engaging your emotional delivery was to listeners",
                emotion_std: "The standard deviation of your emotional expression"
            }) : undefined,
            description: `Confidence: ${(feedback.speech_emotion?.dominant_emotion?.confidence * 100).toFixed(1)}%`
        },
        {
            key: "wpm_analysis",
            label: "Speaking Rate (WPM)",
            value: feedback.wpm_analysis?.overall_wpm || 'N/A',
            score: modelScores.wpm_analysis?.normalized_score ?? undefined,
            status: feedback.wpm_analysis?.assessment?.status,
            recommendation: Array.isArray(feedback.wpm_analysis?.recommendations) ? feedback.wpm_analysis.recommendations[0] : undefined,
            recommendations: feedback.wpm_analysis?.recommendations,
            details: addDetailDescriptions({
                word_count: feedback.wpm_analysis?.word_count,
                duration_minutes: feedback.wpm_analysis?.duration_minutes,
                pace_consistency: feedback.wpm_analysis?.pace_consistency?.score,
                pause_percentage: feedback.wpm_analysis?.pause_analysis?.pause_percentage,
                total_pause_time: feedback.wpm_analysis?.pause_analysis?.total_pause_time,
                avg_pause_duration: feedback.wpm_analysis?.pause_analysis?.average_pause_duration,
                pause_count: feedback.wpm_analysis?.pause_analysis?.pause_count,
                wpm_variance: feedback.wpm_analysis?.segment_analysis?.wpm_variance,
            }, {
                word_count: "The total number of words spoken in your presentation",
                duration_minutes: "The total duration of your presentation in minutes",
                pace_consistency: "How consistently you maintained your speaking pace throughout",
                pause_percentage: "The percentage of time spent in silence during your speech",
                total_pause_time: "The total amount of time you paused during your presentation",
                avg_pause_duration: "The average length of each pause you took",
                pause_count: "The total number of pauses you made during your presentation",
                wpm_variance: "How much your speaking speed varied throughout the presentation"
            }),
            description: feedback.wpm_analysis?.assessment?.message
        },
        {
            key: "pitch_analysis",
            label: "Pitch Analysis",
            value: `${feedback.pitch_analysis?.pitch_statistics?.mean_pitch?.toFixed(1) || 'N/A'} Hz`,
            score: modelScores.pitch_analysis?.normalized_score ?? undefined,
            recommendation: Array.isArray(feedback.pitch_analysis?.recommendations) ? feedback.pitch_analysis.recommendations[0] : undefined,
            recommendations: feedback.pitch_analysis?.recommendations,
            details: feedback.pitch_analysis?.pitch_statistics ? addDetailDescriptions({
                ...feedback.pitch_analysis.pitch_statistics,
                intonation_variability: feedback.pitch_analysis?.intonation_patterns?.intonation_variability,
                pitch_dynamism: feedback.pitch_analysis?.variation_metrics?.pitch_dynamism,
                semitone_range: feedback.pitch_analysis?.variation_metrics?.semitone_range,
            }, {
                mean_pitch: "The average pitch of your voice throughout the presentation",
                pitch_range: "The difference between your highest and lowest pitch",
                pitch_std: "How much your pitch varied from the average",
                intonation_variability: "How much your voice tone changed during speech",
                pitch_dynamism: "How dynamic and expressive your pitch changes were",
                semitone_range: "The range of musical notes your voice covered"
            }) : undefined,
            description: `Range: ${feedback.pitch_analysis?.pitch_statistics?.pitch_range?.toFixed(1) || 'N/A'} Hz`
        },
        {
            key: "filler_detection",
            label: "Filler Words",
            value: `${feedback.filler_detection?.filler_analysis?.total_fillers || 0} words`,
            score: modelScores.filler_detection?.normalized_score ?? undefined,
            recommendation: Array.isArray(feedback.filler_detection?.recommendations) ? feedback.filler_detection.recommendations[0] : undefined,
            recommendations: feedback.filler_detection?.recommendations,
            mostCommonFiller: feedback.filler_detection?.filler_analysis?.most_common_filler,
            details: feedback.filler_detection?.filler_analysis ? addDetailDescriptions({
                ...feedback.filler_detection.filler_analysis,
                pause_percentage: feedback.filler_detection?.pause_analysis?.pause_percentage,
                total_pauses: feedback.filler_detection?.pause_analysis?.total_pauses,
                average_pause_duration: feedback.filler_detection?.pause_analysis?.average_pause_duration,
            }, {
                total_fillers: "The total number of filler words you used",
                filler_rate_percentage: "The percentage of your speech that consisted of filler words",
                most_common_filler: "The filler word you used most frequently",
                pause_percentage: "The percentage of time you spent pausing",
                total_pauses: "The total number of pauses you made",
                average_pause_duration: "The average length of each pause"
            }) : undefined,
            description: `${feedback.filler_detection?.filler_analysis?.filler_rate_percentage?.toFixed(1) || 0}% of speech`
        },
        {
            key: "stutter_detection",
            label: "Stutter Detection",
            value: feedback.stutter_detection?.stutter_detected ? 'Detected' : 'Not Detected',
            score: modelScores.stutter_detection?.normalized_score ?? undefined,
            detected: feedback.stutter_detection?.stutter_detected,
            recommendation: Array.isArray(feedback.stutter_detection?.recommendations) ? feedback.stutter_detection.recommendations[0] : undefined,
            recommendations: feedback.stutter_detection?.recommendations,
            details: addDetailDescriptions({
                stutter_percentage: feedback.stutter_detection?.stutter_percentage,
                stutter_frequency_per_minute: feedback.stutter_detection?.stutter_frequency_per_minute,
                stutter_segments_count: feedback.stutter_detection?.stutter_segments_count,
                total_segments: feedback.stutter_detection?.total_segments,
                stutter_timeline: feedback.stutter_detection?.stutter_timeline?.map((seg: any) => `Segment ${seg.segment_id}: ${seg.stutter_probability ? (seg.stutter_probability * 100).toFixed(1) : ''}%`),
            }, {
                stutter_percentage: "The percentage of speech segments that contained stuttering",
                stutter_frequency_per_minute: "How many stuttering incidents occurred per minute",
                stutter_segments_count: "The number of speech segments that contained stuttering",
                total_segments: "The total number of speech segments analyzed",
                stutter_timeline: "A timeline showing when stuttering occurred during your presentation"
            }),
            description: `${feedback.stutter_detection?.stutter_percentage?.toFixed(1) || 0}% of segments affected`
        }
    ];
    
    // Filter speech metrics based on used criteria and valid data
    const speechMetrics = allSpeechMetrics
        .filter(metric => shouldShowMetric(metric.key))
        .map(metric => ({
            ...metric,
            details: filterUndefinedProps(metric.details),
            recommendation: isValidValue(metric.recommendation) ? metric.recommendation : undefined,
            recommendations: Array.isArray(metric.recommendations) && metric.recommendations.length > 0 ? metric.recommendations : undefined,
            confidence: isValidValue(metric.confidence) ? metric.confidence : undefined,
            status: isValidValue(metric.status) ? metric.status : undefined,
            detected: isValidValue(metric.detected) ? metric.detected : undefined,
            mostCommonFiller: isValidValue(metric.mostCommonFiller) ? metric.mostCommonFiller : undefined,
            description: isValidValue(metric.description) ? metric.description : undefined
        }))
        .filter(hasValidData);

    const allVisualMetrics = [
        {
            key: "facial_emotion",
            label: "Facial Emotion",
            value: feedback.facial_emotion?.emotion_statistics?.dominant_emotion?.emotion || 'N/A',
            score: modelScores.facial_emotion?.normalized_score ?? undefined,
            recommendation: Array.isArray(feedback.facial_emotion?.recommendations) ? feedback.facial_emotion.recommendations[0] : undefined,
            recommendations: feedback.facial_emotion?.recommendations,
            details: feedback.facial_emotion?.emotion_statistics ? addDetailDescriptions({
                ...feedback.facial_emotion.emotion_statistics.emotion_averages,
                dominant_emotion: feedback.facial_emotion?.emotion_statistics?.dominant_emotion?.emotion,
                positivity_score: feedback.facial_emotion?.emotion_statistics?.positivity_score,
                negativity_score: feedback.facial_emotion?.emotion_statistics?.negativity_score,
                neutrality_score: feedback.facial_emotion?.emotion_statistics?.neutrality_score,
                emotional_variability: feedback.facial_emotion?.emotion_statistics?.emotional_variability,
                face_detection_rate: feedback.facial_emotion?.face_detection_rate,
                engagement_score: feedback.facial_emotion?.engagement_metrics?.engagement_score,
                visual_appeal: feedback.facial_emotion?.engagement_metrics?.visual_appeal,
            }, {
                happy: "The percentage of time you showed happiness on your face",
                sad: "The percentage of time you showed sadness on your face",
                angry: "The percentage of time you showed anger on your face",
                fearful: "The percentage of time you showed fear on your face",
                disgusted: "The percentage of time you showed disgust on your face",
                surprised: "The percentage of time you showed surprise on your face",
                neutral: "The percentage of time you had a neutral facial expression",
                dominant_emotion: "The emotion you displayed most frequently",
                positivity_score: "How positive your facial expressions were overall",
                negativity_score: "How negative your facial expressions were overall",
                neutrality_score: "How neutral your facial expressions were overall",
                emotional_variability: "How much your facial emotions changed throughout",
                face_detection_rate: "The percentage of time your face was clearly visible",
                engagement_score: "How engaging your facial expressions were to viewers",
                visual_appeal: "How visually appealing your facial expressions were"
            }) : undefined,
            description: `Detection rate: ${(feedback.facial_emotion?.face_detection_rate * 100).toFixed(1)}%`
        },
        {
            key: "eye_contact",
            label: "Eye Contact",
            value: `${feedback.eye_contact?.attention_score || 0}/10`,
            score: modelScores.eye_contact?.normalized_score ?? undefined,
            recommendation: undefined,
            recommendations: undefined,
            details: feedback.eye_contact ? addDetailDescriptions({
                attention_score: feedback.eye_contact?.attention_score,
                center_attention_ratio: feedback.eye_contact?.confidence_metrics?.center_attention_ratio,
                face_detection_rate: feedback.eye_contact?.engagement_metrics?.face_detection_rate,
                average_engagement_score: feedback.eye_contact?.engagement_metrics?.average_engagement_score,
                total_frames_analyzed: feedback.eye_contact?.engagement_metrics?.total_frames_analyzed,
            }, {
                attention_score: "How well you maintained eye contact with the camera/audience",
                center_attention_ratio: "The percentage of time you looked at the center of the frame",
                face_detection_rate: "The percentage of time your face was clearly visible",
                average_engagement_score: "How engaging your eye contact was overall",
                total_frames_analyzed: "The total number of video frames analyzed for eye contact"
            }) : undefined,
            description: `Face detection: ${(feedback.eye_contact?.engagement_metrics?.face_detection_rate * 100).toFixed(1)}%`
        },
        {
            key: "hand_gesture",
            label: "Hand Gestures",
            value: feedback.hand_gesture?.gesture_statistics?.most_common_gesture || 'N/A',
            score: modelScores.hand_gesture?.normalized_score ?? undefined,
            recommendation: Array.isArray(feedback.hand_gesture?.recommendations) ? feedback.hand_gesture.recommendations[0] : undefined,
            recommendations: feedback.hand_gesture?.recommendations,
            details: feedback.hand_gesture?.gesture_statistics ? addDetailDescriptions({
                ...feedback.hand_gesture.gesture_statistics,
                gesture_variety: feedback.hand_gesture?.gesture_statistics?.gesture_variety,
                hand_usage_distribution: feedback.hand_gesture?.gesture_statistics?.hand_usage_distribution,
                zone_distribution: feedback.hand_gesture?.gesture_statistics?.zone_distribution,
                average_effectiveness: feedback.hand_gesture?.gesture_statistics?.average_effectiveness,
                engagement_level: feedback.hand_gesture?.engagement_metrics?.engagement_level,
                hands_usage_rating: feedback.hand_gesture?.engagement_metrics?.hands_usage_rating,
            }, {
                most_common_gesture: "The hand gesture you used most frequently",
                gesture_variety: "How many different types of hand gestures you used",
                hand_usage_distribution: "How you used your left and right hands",
                zone_distribution: "Which areas of your body you gestured towards",
                average_effectiveness: "How effective your hand gestures were overall",
                engagement_level: "How engaging your hand gestures were to viewers",
                hands_usage_rating: "How well you utilized your hands during the presentation",
                hands_visible_percentage: "The percentage of time your hands were clearly visible"
            }) : undefined,
            description: `${feedback.hand_gesture?.gesture_statistics?.hands_visible_percentage || 0}% visibility`
        },
        {
            key: "posture_analysis",
            label: "Posture Quality",
            value: feedback.posture_analysis?.posture_metrics?.posture_quality || 'N/A',
            score: modelScores.posture_analysis?.normalized_score ?? undefined,
            recommendation: Array.isArray(feedback.posture_analysis?.recommendations) ? feedback.posture_analysis.recommendations[0] : undefined,
            recommendations: feedback.posture_analysis?.recommendations,
            details: feedback.posture_analysis?.posture_metrics ? addDetailDescriptions({
                ...feedback.posture_analysis.posture_metrics,
                most_problematic: feedback.posture_analysis?.posture_metrics?.most_problematic,
                main_issues: feedback.posture_analysis?.posture_metrics?.main_issues,
                pose_counts: feedback.posture_analysis?.bad_posture_summary?.pose_counts,
                pose_percentages: feedback.posture_analysis?.bad_posture_summary?.pose_percentages,
            }, {
                posture_quality: "The overall quality of your posture during the presentation",
                total_penalty_points: "Points deducted for poor posture throughout the presentation",
                most_problematic: "The most problematic aspect of your posture",
                main_issues: "The main posture issues identified during your presentation",
                pose_counts: "How many times each type of posture was detected",
                pose_percentages: "The percentage of time you maintained each posture type"
            }) : undefined,
            description: `${feedback.posture_analysis?.posture_metrics?.total_penalty_points?.toFixed(1) || 0} penalty points`
        }
    ];
    
    // Filter visual metrics based on used criteria and valid data
    const visualMetrics = allVisualMetrics
        .filter(metric => shouldShowMetric(metric.key))
        .map(metric => ({
            ...metric,
            details: filterUndefinedProps(metric.details),
            recommendation: isValidValue(metric.recommendation) ? metric.recommendation : undefined,
            recommendations: Array.isArray(metric.recommendations) && metric.recommendations.length > 0 ? metric.recommendations : undefined,
            description: isValidValue(metric.description) ? metric.description : undefined
        }))
        .filter(hasValidData);

    const allContentMetrics = [
        {
            key: "lexical_richness",
            label: "Lexical Richness",
            value: feedback.lexical_richness?.assessment?.richness_level || 'N/A',
            score: modelScores.lexical_richness?.score ?? undefined,
            recommendation: Array.isArray(feedback.lexical_richness?.recommendations) ? feedback.lexical_richness.recommendations[0] : undefined,
            recommendations: feedback.lexical_richness?.recommendations,
            details: feedback.lexical_richness?.richness_metrics ? addDetailDescriptions({
                ...feedback.lexical_richness.richness_metrics,
                vocabulary_size: feedback.lexical_richness?.vocabulary_statistics?.vocabulary_size,
                unique_words: feedback.lexical_richness?.vocabulary_statistics?.unique_words,
                content_word_ratio: feedback.lexical_richness?.vocabulary_statistics?.content_word_ratio,
                hapax_legomena: feedback.lexical_richness?.vocabulary_statistics?.hapax_legomena,
                average_word_length: feedback.lexical_richness?.vocabulary_statistics?.average_word_length,
                average_words_per_sentence: feedback.lexical_richness?.complexity_analysis?.average_words_per_sentence,
                complex_word_ratio: feedback.lexical_richness?.complexity_analysis?.complex_word_ratio,
            }, {
                type_token_ratio: "The ratio of unique words to total words, indicating vocabulary diversity",
                vocabulary_size: "The total number of different words you used",
                unique_words: "The number of words you used only once",
                content_word_ratio: "The percentage of meaningful words versus function words",
                hapax_legomena: "Words that appeared only once in your presentation",
                average_word_length: "The average number of letters per word you used",
                average_words_per_sentence: "The average number of words per sentence",
                complex_word_ratio: "The percentage of complex words in your vocabulary"
            }) : undefined,
            description: `TTR: ${(feedback.lexical_richness?.richness_metrics?.type_token_ratio * 100).toFixed(1)}%`
        },
        {
            key: "keyword_relevance",
            label: "Keyword Relevance",
            value: feedback.keyword_relevance?.relevance_assessment?.assessment_level || 'N/A',
            score: modelScores.keyword_relevance?.normalized_score ?? undefined,
            recommendation: Array.isArray(feedback.keyword_relevance?.recommendations) ? feedback.keyword_relevance.recommendations[0] : undefined,
            recommendations: feedback.keyword_relevance?.recommendations,
            details: feedback.keyword_relevance?.topic_coherence ? addDetailDescriptions({
                ...feedback.keyword_relevance.topic_coherence,
                keyword_coverage_percentage: feedback.keyword_relevance?.topic_coherence?.keyword_coverage_percentage,
                semantic_coherence: feedback.keyword_relevance?.topic_coherence?.semantic_coherence,
                diversity_score: feedback.keyword_relevance?.keyword_diversity?.diversity_score,
                total_unique_keywords: feedback.keyword_relevance?.keyword_diversity?.total_unique_keywords,
                extracted_keywords: feedback.keyword_relevance?.extracted_keywords?.keybert?.map((k: any) => `${k.keyword} (${k.score})`).join(', '),
            }, {
                coherence_score: "How well your content stayed focused on the main topic",
                topic_focus: "How focused your presentation was on the intended subject",
                keyword_coverage_percentage: "The percentage of important keywords you covered",
                semantic_coherence: "How semantically related your content was to the topic",
                diversity_score: "How diverse your keyword usage was throughout the presentation",
                total_unique_keywords: "The total number of unique keywords you used",
                extracted_keywords: "The most important keywords automatically extracted from your speech"
            }) : undefined,
            description: `Coherence: ${(feedback.keyword_relevance?.topic_coherence?.coherence_score * 100).toFixed(1)}%`
        }
    ];
    
    // Filter content metrics based on used criteria and valid data
    const contentMetrics = allContentMetrics
        .filter(metric => shouldShowMetric(metric.key))
        .map(metric => ({
            ...metric,
            details: filterUndefinedProps(metric.details),
            recommendation: isValidValue(metric.recommendation) ? metric.recommendation : undefined,
            recommendations: Array.isArray(metric.recommendations) && metric.recommendations.length > 0 ? metric.recommendations : undefined,
            description: isValidValue(metric.description) ? metric.description : undefined
        }))
        .filter(hasValidData);

    // Prepare recommendations - only from used criteria and valid data
    const allRecommendations = [
        ...(shouldShowMetric('speech_emotion') ? (feedback.speech_emotion?.recommendations || []) : []),
        ...(shouldShowMetric('wpm_analysis') ? (feedback.wpm_analysis?.recommendations || []) : []),
        ...(shouldShowMetric('pitch_analysis') ? (feedback.pitch_analysis?.recommendations || []) : []),
        ...(shouldShowMetric('filler_detection') ? (feedback.filler_detection?.recommendations || []) : []),
        ...(shouldShowMetric('stutter_detection') ? (feedback.stutter_detection?.recommendations || []) : []),
        ...(shouldShowMetric('facial_emotion') ? (feedback.facial_emotion?.recommendations || []) : []),
        ...(shouldShowMetric('hand_gesture') ? (feedback.hand_gesture?.recommendations || []) : []),
        ...(shouldShowMetric('posture_analysis') ? (feedback.posture_analysis?.recommendations || []) : []),
        ...(shouldShowMetric('lexical_richness') ? (feedback.lexical_richness?.recommendations || []) : []),
        ...(shouldShowMetric('keyword_relevance') ? (feedback.keyword_relevance?.recommendations || []) : []),
        ...(enhanced.recommendations || [])
    ]
    .filter(rec => isValidValue(rec) && typeof rec === 'string' && rec.trim() !== '')
    .map(rec => ({ text: rec, priority: 'medium' as const }));

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
                        {presentation && presentation.file_info?.file_exists && isValidValue(presentation.url) && (
                            <VideoPlayer 
                                videoUrl={`http://localhost:8081${presentation.url}`}
                                title={presentation.title || 'Video'}
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
                                    if (isValidValue(transcription) && transcription.trim() !== '') {
                                        try {
                                            await navigator.clipboard.writeText(transcription);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        } catch (err) {
                                            console.error('Failed to copy text: ', err);
                                        }
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

                        {feedback && feedback.transcription_info && 
                         (isValidValue(feedback.transcription_info.transcription_full) || isValidValue(feedback.transcription_info.transcription_preview)) && (
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
                    {speechMetrics.length > 0 && (
                        <DetailedMetricsCard 
                            title="Speech Analysis"
                            metrics={speechMetrics}
                            icon={<FiMic />}
                            color="#3B82F6"
                        />
                    )}
                    {visualMetrics.length > 0 && (
                        <DetailedMetricsCard 
                            title="Visual Analysis"
                            metrics={visualMetrics}
                            icon={<FiEye />}
                            color="#10B981"
                        />
                    )}
                    {contentMetrics.length > 0 && (
                        <DetailedMetricsCard 
                            title="Content Analysis"
                            metrics={contentMetrics}
                            icon={<FiMessageSquare />}
                            color="#F59E0B"
                        />
                    )}
                </div>
                
                {/* Show message if no analysis cards are displayed */}
                {speechMetrics.length === 0 && visualMetrics.length === 0 && contentMetrics.length === 0 && (
                    <div className={feedbackStyles.noAnalysisMessage}>
                        <FiTarget className={feedbackStyles.noAnalysisIcon} />
                        <h3>No Analysis Available</h3>
                        <p>No analysis models were selected for this presentation. Please upload a new video with analysis focus areas selected.</p>
                    </div>
                )}
                
                {/* Original Insights Panel */}
                <InsightsPanel {...insightsProps} />
            </div>
        </div>
    );
};

export default Feedback;
