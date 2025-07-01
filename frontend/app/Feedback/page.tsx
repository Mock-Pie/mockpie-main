"use client";
import React from "react";
import SideBar from "../UploadRecordVideos/components/SideBar";
import styles from "../UploadRecordVideos/page.module.css";
import feedbackStyles from "./feedback.module.css";
import AnalysisOverview from "./components/AnalysisOverview";
import SpeechAnalysisCard from "./components/SpeechAnalysisCard";
import VisualAnalysisCard from "./components/VisualAnalysisCard";
import ContentAnalysisCard from "./components/ContentAnalysisCard";
import InsightsPanel from "./components/InsightsPanel";

const Feedback = () => {
    // Mock data - replace with actual API data
    const mockData = {
        overview: {
            overallScore: 78,
            analysisDate: "Today",
            videoDuration: "3:42",
            focusAreas: ["speech_emotion", "eye_contact", "speaking_rate", "lexical_richness"]
        },
        speechAnalysis: {
            speechEmotion: {
                value: "Confident & Engaging",
                score: 85,
                insight: "Your voice conveys confidence and maintains listener engagement throughout the presentation.",
                recommendation: "Continue using vocal variety to emphasize key points."
            },
            speakingRate: {
                value: "142 WPM",
                score: 72,
                insight: "Speaking pace is slightly fast but within acceptable range for presentations.",
                recommendation: "Try slowing down by 10-15 WPM for better comprehension."
            },
            pitchAnalysis: {
                value: "Good Variation",
                score: 80,
                insight: "Excellent use of pitch variation to maintain audience interest.",
                recommendation: "Use lower pitch for emphasis on important points."
            },
            fillerWords: {
                value: "8 instances",
                score: 65,
                insight: "Moderate use of filler words detected, mainly 'um' and 'uh'.",
                recommendation: "Practice pausing instead of using filler words."
            },
            stutterDetection: {
                value: "Minimal",
                score: 88,
                insight: "Speech flows smoothly with minimal disruptions.",
                recommendation: "Maintain current speech rhythm and confidence."
            }
        },
        visualAnalysis: {
            facialEmotion: {
                value: "Positive & Animated",
                score: 82,
                insight: "Facial expressions effectively convey enthusiasm and engagement.",
                recommendation: "Maintain natural expressions while being mindful of camera angle."
            },
            eyeContact: {
                value: "75% Direct",
                score: 75,
                insight: "Good eye contact with camera, simulating audience connection.",
                recommendation: "Increase direct camera contact during key messages."
            },
            handGestures: {
                value: "Natural & Supportive",
                score: 78,
                insight: "Hand gestures complement speech well and appear natural.",
                recommendation: "Use slightly larger gestures for virtual presentations."
            },
            postureAnalysis: {
                value: "Professional",
                score: 85,
                insight: "Maintains good posture throughout the presentation.",
                recommendation: "Continue current posture habits for professional appearance."
            }
        },
        contentAnalysis: {
            lexicalRichness: {
                value: "Advanced",
                score: 83,
                insight: "Vocabulary demonstrates strong command of subject matter.",
                recommendation: "Balance advanced terms with accessible language for broader audiences."
            },
            keywordRelevance: {
                value: "Highly Relevant",
                score: 90,
                insight: "Content strongly aligns with stated presentation topic.",
                recommendation: "Excellent topic focus - maintain this level of relevance."
            }
        },
        insights: {
            keyTakeaways: [
                "Strong overall performance with excellent content relevance",
                "Voice conveys confidence and maintains engagement",
                "Visual presence is professional and animated",
                "Minor improvements needed in speaking pace and filler words"
            ],
            detailedInsights: [
                {
                    type: "strength" as const,
                    title: "Excellent Content Knowledge",
                    description: "Your deep understanding of the topic shines through in your vocabulary choices and examples.",
                    priority: "low" as const
                },
                {
                    type: "improvement" as const,
                    title: "Speaking Pace Optimization",
                    description: "Reducing your speaking rate by 10-15 WPM would improve comprehension and impact.",
                    priority: "medium" as const
                },
                {
                    type: "tip" as const,
                    title: "Reduce Filler Words",
                    description: "Practice strategic pauses instead of using 'um' and 'uh' to enhance professionalism.",
                    priority: "high" as const
                }
            ],
            nextSteps: [
                "Practice speaking at 125-130 WPM for optimal comprehension",
                "Record yourself practicing to identify and reduce filler words",
                "Focus on strategic pauses to replace filler words",
                "Continue leveraging your strong content knowledge and natural presence"
            ]
        }
    };

    return (
        <div className={styles.container}>
            <SideBar />
            <div className={feedbackStyles.mainContent}>
                <div className={feedbackStyles.header}>
                    <h1 className={feedbackStyles.title}>Analysis Results</h1>
                    <p className={feedbackStyles.subtitle}>AI-powered feedback on your presentation performance</p>
                </div>

                <AnalysisOverview 
                    overallScore={mockData.overview.overallScore}
                    analysisDate={mockData.overview.analysisDate}
                    videoDuration={mockData.overview.videoDuration}
                    focusAreas={mockData.overview.focusAreas}
                />

                <SpeechAnalysisCard {...mockData.speechAnalysis} />

                <VisualAnalysisCard {...mockData.visualAnalysis} />

                <ContentAnalysisCard {...mockData.contentAnalysis} />

                <InsightsPanel 
                    insights={mockData.insights.detailedInsights}
                    keyTakeaways={mockData.insights.keyTakeaways}
                    nextSteps={mockData.insights.nextSteps}
                />
            </div>
        </div>
    );
};

export default Feedback;
