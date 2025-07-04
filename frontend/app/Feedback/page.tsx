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
import { FiPlay, FiFileText, FiCopy, FiCheck } from "react-icons/fi";

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
            <div className={feedbackStyles.mainContent}>
                <Header />
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
                        {/* Always show transcription if available, regardless of success status */}
                        {feedback && feedback.transcription_info && (feedback.transcription_info.transcription_full || feedback.transcription_info.transcription_preview) && (
                            <TranscriptionDisplay 
                                transcription={feedback.transcription_info.transcription_full || feedback.transcription_info.transcription_preview || ""}
                                title=""
                            />
                        )}
                        {/* Debug: Show transcription info if available but no content */}
                        {feedback && feedback.transcription_info && !feedback.transcription_info.transcription_full && !feedback.transcription_info.transcription_preview && (
                            <div style={{ 
                                background: 'rgba(255, 0, 0, 0.1)', 
                                padding: '20px', 
                                borderRadius: '10px',
                                border: '1px solid rgba(255, 0, 0, 0.3)',
                                color: 'white'
                            }}>
                                <h3>Transcription Debug Info</h3>
                                <p>Success: {feedback.transcription_info.transcription_success ? 'Yes' : 'No'}</p>
                                <p>Length: {feedback.transcription_info.transcription_length || 'N/A'}</p>
                                <p>Has Full: {feedback.transcription_info.transcription_full ? 'Yes' : 'No'}</p>
                                <p>Has Preview: {feedback.transcription_info.transcription_preview ? 'Yes' : 'No'}</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Analysis Overview - Below Both */}
                <AnalysisOverview {...overviewProps} />
                
                {/* Other Analysis Cards */}
                <SpeechAnalysisCard {...speechAnalysisProps} />
                <VisualAnalysisCard {...visualAnalysisProps} />
                <ContentAnalysisCard {...contentAnalysisProps} />
                <InsightsPanel {...insightsProps} />
            </div>
        </div>
    );
};

export default Feedback;
