"use client";
import React, { useEffect, useState } from "react";
import SideBar from "../UploadRecordVideos/components/SideBar";
import styles from "../UploadRecordVideos/page.module.css";
import LoadingFeedback from "./components/LoadingFeedback";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Header from "../Upload/components/Header";
import AnalysisOverview from "./components/AnalysisOverview";
import SpeechAnalysisCard from "./components/SpeechAnalysisCard";
import VisualAnalysisCard from "./components/VisualAnalysisCard";
import ContentAnalysisCard from "./components/ContentAnalysisCard";
import InsightsPanel from "./components/InsightsPanel";

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("feedbackData");
            if (stored) {
                setFeedback(JSON.parse(stored));
                setLoading(false);
                localStorage.removeItem("feedbackData");
                return;
            }
        }
        // If not in localStorage, fetch from backend
        if (!presentationId) {
            setError("No presentation ID provided.");
            setLoading(false);
            return;
        }
        fetch(`http://localhost:8081/feedback/presentation/${presentationId}/feedback`)
            .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch feedback"))
            .then(data => {
                setFeedback(data);
                setLoading(false);
            })
            .catch(err => {
                setError(typeof err === "string" ? err : "Error loading feedback");
                setLoading(false);
            });
    }, [pathname, presentationId]);

    if (loading) return <LoadingFeedback />;
    if (error) return <div style={{ padding: 32, textAlign: "center", color: "red" }}>{error}</div>;
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

    return (
        <div className={styles.container}>
            <SideBar />
            {/* <Header /> */}
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <AnalysisOverview {...overviewProps} />
                <SpeechAnalysisCard {...speechAnalysisProps} />
                <VisualAnalysisCard {...visualAnalysisProps} />
                <ContentAnalysisCard {...contentAnalysisProps} />
                <InsightsPanel {...insightsProps} />
            </div>
        </div>
    );
};

export default Feedback;
