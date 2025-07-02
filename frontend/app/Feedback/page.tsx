"use client";
import React, { useEffect, useState } from "react";
import SideBar from "../UploadRecordVideos/components/SideBar";
import styles from "../UploadRecordVideos/page.module.css";
import feedbackStyles from "./feedback.module.css";
import AnalysisOverview from "./components/AnalysisOverview";
import SpeechAnalysisCard from "./components/SpeechAnalysisCard";
import VisualAnalysisCard from "./components/VisualAnalysisCard";
import ContentAnalysisCard from "./components/ContentAnalysisCard";
import InsightsPanel from "./components/InsightsPanel";
import LoadingFeedback from "./components/LoadingFeedback";
import { useRouter, usePathname } from "next/navigation";

// Define the type for the feedback data
interface FeedbackData {
    overview: {
        overallScore: number;
        analysisDate: string;
        videoDuration: string;
        focusAreas: string[];
    };
    speechAnalysis: any;
    visualAnalysis: any;
    contentAnalysis: any;
    insights: {
        keyTakeaways: string[];
        detailedInsights: any[];
        nextSteps: string[];
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
        setError("No feedback data found. Please upload or record a presentation first.");
        setLoading(false);
    }, [pathname]);

    if (loading) return <LoadingFeedback />;
    if (error) return <div style={{ padding: 32, textAlign: "center", color: "red" }}>{error}</div>;
    if (!feedback) return null;

    return (
        <div className={styles.container}>
            <SideBar />
            <div className={feedbackStyles.mainContent}>
                <div className={feedbackStyles.header}>
                    <h1 className={feedbackStyles.title}>Analysis Results</h1>
                    <p className={feedbackStyles.subtitle}>AI-powered feedback on your presentation performance</p>
                </div>

                <AnalysisOverview 
                    overallScore={feedback.overview.overallScore}
                    analysisDate={feedback.overview.analysisDate}
                    videoDuration={feedback.overview.videoDuration}
                    focusAreas={feedback.overview.focusAreas}
                />

                <SpeechAnalysisCard {...feedback.speechAnalysis} />

                <VisualAnalysisCard {...feedback.visualAnalysis} />

                <ContentAnalysisCard {...feedback.contentAnalysis} />

                <InsightsPanel 
                    insights={feedback.insights.detailedInsights}
                    keyTakeaways={feedback.insights.keyTakeaways}
                    nextSteps={feedback.insights.nextSteps}
                />
            </div>
        </div>
    );
};

export default Feedback;
