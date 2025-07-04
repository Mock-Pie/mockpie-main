'use client';

import React, { useState } from 'react';
import { FiUpload, FiPlay } from 'react-icons/fi';

interface DemoFeedbackProps {
    onLoadDemoData: (data: any) => void;
}

const DemoFeedback: React.FC<DemoFeedbackProps> = ({ onLoadDemoData }) => {
    const [isLoading, setIsLoading] = useState(false);

    const loadDemoData = async () => {
        setIsLoading(true);
        try {
            // This is the sample data from the JSON response
            const demoData = {
                "speech_emotion": {
                    "emotions": {
                        "angry": 0.9419878806386676,
                        "disgust": 0.017506598278747072,
                        "fear": 0.03284414493412312,
                        "happy": 0.00766139168575007
                    },
                    "dominant_emotion": {
                        "emotion": "angry",
                        "confidence": 0.9419878806386676
                    },
                    "overall_score": 3.531914061320161
                },
                "wpm_analysis": {
                    "overall_wpm": 124.6,
                    "word_count": 71,
                    "duration_minutes": 0.57,
                    "assessment": {
                        "status": "good",
                        "message": "Speaking pace is good for presentation",
                        "optimal_range": "120-160 WPM",
                        "optimal_target": "140 WPM"
                    },
                    "overall_score": 5.307297639098982,
                    "recommendations": [
                        "Work on maintaining consistent speaking pace throughout your presentation.",
                        "Practice with a metronome or pacing exercises to develop rhythm.",
                        "Reduce excessive pausing. Practice speaking with more confidence and fluency."
                    ]
                },
                "pitch_analysis": {
                    "pitch_statistics": {
                        "mean_pitch": 147.08372852864312,
                        "pitch_range": 417.2482241888934
                    },
                    "overall_score": 10,
                    "recommendations": [
                        "Work on maintaining consistent voicing throughout speech"
                    ]
                },
                "filler_detection": {
                    "filler_analysis": {
                        "total_fillers": 4,
                        "total_words": 71,
                        "filler_rate_percentage": 5.633802816901409
                    },
                    "overall_score": 5,
                    "recommendations": [
                        "Reduce filler words - practice pausing instead of saying 'um' or 'uh'",
                        "Pay special attention to your use of 'like'",
                        "Work on reducing excessive pauses - practice smooth transitions"
                    ]
                },
                "stutter_detection": {
                    "stutter_detected": true,
                    "stutter_probability": 0.6399161922080177,
                    "overall_score": 3.6008380779198235,
                    "stutter_percentage": 42.857142857142854,
                    "recommendations": [
                        "Practice speaking at a slower pace, especially during presentations",
                        "Use relaxation techniques before speaking engagements",
                        "Consider joining a speech improvement group or workshop"
                    ]
                },
                "facial_emotion": {
                    "face_detection_rate": 0.17142857142857143,
                    "emotion_statistics": {
                        "dominant_emotion": {
                            "emotion": "neutral",
                            "probability": 0.39999999999999997
                        }
                    },
                    "overall_score": 10,
                    "recommendations": [
                        "Try to smile more and show positive facial expressions"
                    ]
                },
                "eye_contact": {
                    "attention_score": 10,
                    "engagement_metrics": {
                        "face_detection_rate": 0.05714285714285714
                    }
                },
                "hand_gesture": {
                    "gesture_statistics": {
                        "hands_visible_percentage": 100,
                        "most_common_gesture": "counting",
                        "average_effectiveness": 8.183673469387756
                    },
                    "overall_score": 8.223705303946115,
                    "recommendations": [
                        "Allow for some natural pauses in gesturing to avoid appearing overly animated.",
                        "You use 'counting' gestures effectively. Continue incorporating similar movements."
                    ]
                },
                "posture_analysis": {
                    "posture_metrics": {
                        "posture_quality": "excellent",
                        "total_penalty_points": 1.8384615384615386
                    },
                    "overall_score": 8.161538461538461,
                    "recommendations": [
                        "Give your arms space to move naturally",
                        "Practice gestures that extend slightly away from your body",
                        "Stand tall with shoulders back and chest open"
                    ]
                },
                "lexical_richness": {
                    "assessment": {
                        "richness_level": "excellent"
                    },
                    "richness_metrics": {
                        "type_token_ratio": 0.7323943661971831
                    },
                    "overall_score": 8,
                    "recommendations": [
                        "Use more content words and fewer filler words"
                    ]
                },
                "keyword_relevance": {
                    "relevance_assessment": {
                        "assessment_level": "fair",
                        "overall_relevance_score": 3.7557602275863236
                    },
                    "topic_coherence": {
                        "coherence_score": 0.6078299117088317
                    },
                    "recommendations": [
                        "Use more specific and technical vocabulary related to your topic"
                    ]
                },
                "enhanced_feedback": {
                    "overall_score": 10.99,
                    "summary": {
                        "overall_performance": "Exceptional",
                        "key_highlights": [
                            "Strong speech performance",
                            "Strong visual performance"
                        ],
                        "primary_focus_areas": [
                            "content development",
                            "confidence development"
                        ]
                    },
                    "recommendations": [
                        "Practice with a metronome to develop consistent pacing",
                        "Use strategic pauses to emphasize key points",
                        "Record and time your presentations to monitor pace",
                        "Practice pausing instead of using filler words",
                        "Record yourself to identify filler word patterns",
                        "Use breathing techniques to reduce nervous speech patterns"
                    ],
                    "score_breakdown": {
                        "overall_score": 10.99,
                        "category_breakdown": {
                            "speech": {
                                "score": 16.31,
                                "weight": 0.4,
                                "contribution": 6.524
                            },
                            "visual": {
                                "score": 9.19,
                                "weight": 0.35,
                                "contribution": 3.2164999999999995
                            },
                            "content": {
                                "score": 5,
                                "weight": 0.15,
                                "contribution": 0.75
                            },
                            "confidence": {
                                "score": 5,
                                "weight": 0.1,
                                "contribution": 0.5
                            }
                        },
                        "model_breakdown": {
                            "speech_emotion": {
                                "score": 9.419878806386675,
                                "weight": 0.12,
                                "contribution": 1.130385456766401
                            },
                            "wpm_analysis": {
                                "score": 3.5999999999999996,
                                "weight": 0.1,
                                "contribution": 0.36
                            },
                            "pitch_analysis": {
                                "score": 10,
                                "weight": 0.09,
                                "contribution": 0.8999999999999999
                            },
                            "filler_detection": {
                                "score": 5,
                                "weight": 0.08,
                                "contribution": 0.4
                            },
                            "stutter_detection": {
                                "score": 3.6008380779198235,
                                "weight": 0.12,
                                "contribution": 0.4321005693503788
                            },
                            "lexical_richness": {
                                "score": 80,
                                "weight": 0.08,
                                "contribution": 6.4
                            },
                            "facial_emotion": {
                                "score": 10,
                                "weight": 0.1,
                                "contribution": 1
                            },
                            "eye_contact": {
                                "score": 10,
                                "weight": 0.12,
                                "contribution": 1.2
                            },
                            "hand_gesture": {
                                "score": 8.257352941176471,
                                "weight": 0.06,
                                "contribution": 0.4954411764705882
                            },
                            "posture_analysis": {
                                "score": 8.161538461538461,
                                "weight": 0.12,
                                "contribution": 0.9793846153846153
                            },
                            "keyword_relevance": {
                                "score": 5,
                                "weight": 0.05,
                                "contribution": 0.25
                            }
                        },
                        "score_distribution": {
                            "excellent": 7,
                            "good": 0,
                            "average": 2,
                            "below_average": 0,
                            "poor": 2
                        }
                    }
                },
                "transcription_info": {
                    "transcription_length": 420,
                    "transcription_preview": "First of all, the Introduce Massage from Hasim Aqed at Minimum, New York, Wietersen, and Sweden. Our Graduation Project is about mock interview assessment. Basically, you give it a job description and...",
                    "transcription_full": "First of all, the Introduce Massage from Hasim Aqed at Minimum, New York, Wietersen, and Sweden. Our Graduation Project is about mock interview assessment. Basically, you give it a job description and it makes an interview or an assessment for you by extracting the important keywords like four years of experience, skills that should be like Python, S++ and so on. It makes an interview or assessment for you. And then,",
                    "transcription_success": true
                }
            };

            // Simulate loading delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            onLoadDemoData(demoData);
        } catch (error) {
            console.error('Error loading demo data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Demo Feedback Data
                </h3>
                <p className="text-gray-600 mb-4">
                    Load sample feedback data to see how the analysis components work
                </p>
                <button
                    onClick={loadDemoData}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Loading...
                        </>
                    ) : (
                        <>
                            <FiPlay />
                            Load Demo Data
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default DemoFeedback; 