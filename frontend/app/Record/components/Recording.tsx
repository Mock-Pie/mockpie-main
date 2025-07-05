"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { 
    FiVideo, 
    FiVideoOff, 
    FiDownload, 
    FiUploadCloud, 
    FiPlay, 
    FiCamera,
    FiCheck,
    FiX,
    FiLoader,
    FiClock,
    FiEye,
    FiFilm,
    FiRadio,
    FiTarget
} from "react-icons/fi";
import styles from "../page.module.css";
import FocusModal from "../../components/shared/FocusModal";

const Recording = () => {
    const router = useRouter();
    const [isRecording, setIsRecording] = useState(false);
    const [videoURL, setVideoURL] = useState("");
    const [recordingTime, setRecordingTime] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);
    const [showPreview, setShowPreview] = useState(true);
    const [cameraReady, setCameraReady] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [videoFormat, setVideoFormat] = useState<{mimeType: string, extension: string}>({mimeType: 'video/mp4', extension: 'mp4'});
    const [presentationTopic, setPresentationTopic] = useState<string>("");
    const [selectedLanguage, setSelectedLanguage] = useState<string>("");
    const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
    const [showFocusModal, setShowFocusModal] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoStreamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
    const recordedVideoRef = useRef<HTMLVideoElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Ensure we're on the client side
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return; // Don't run on server side

        const initializeCamera = async () => {
            try {
                // Detect best supported format
                const format = detectVideoFormat();
                setVideoFormat(format);
                console.log(`Using video format: ${format.extension.toUpperCase()} (${format.mimeType})`);

                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                videoStreamRef.current = stream;

                // Wait a bit to ensure the video element is ready
                await new Promise(resolve => setTimeout(resolve, 100));

                if (videoPreviewRef.current) {
                    videoPreviewRef.current.srcObject = stream;
                    
                    // Wait for the video to be ready before playing
                    await new Promise((resolve, reject) => {
                        if (videoPreviewRef.current) {
                            videoPreviewRef.current.onloadedmetadata = () => {
                                videoPreviewRef.current?.play().then(resolve).catch(reject);
                            };
                            videoPreviewRef.current.onerror = reject;
                        }
                    });
                    
                    setCameraReady(true);
                }
            } catch (error) {
                console.error("Error accessing media devices:", error);
                alert("Error accessing camera/microphone. Please check permissions and ensure camera is not being used by another application.");
                setCameraReady(false);
            }
        };

        initializeCamera();

        return () => {
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, [isClient]);

    // Effect to handle preview switching
    useEffect(() => {
        if (showPreview && videoStreamRef.current && videoPreviewRef.current && cameraReady) {
            videoPreviewRef.current.srcObject = videoStreamRef.current;
            videoPreviewRef.current.play().catch(console.error);
        }
    }, [showPreview, cameraReady]);

    // Cleanup effect to prevent memory leaks
    useEffect(() => {
        return () => {
            // Clean up video URL when component unmounts
            if (videoURL) {
                URL.revokeObjectURL(videoURL);
            }
        };
    }, [videoURL]);

    const startRecording = async () => {
        try {
            // Reset video URL when starting a new recording
            if (videoURL) {
                URL.revokeObjectURL(videoURL);
                setVideoURL("");
                setVideoDuration(0);
                setUploadStatus("");
            }

            // Ensure we have a camera stream
            if (!videoStreamRef.current || !cameraReady) {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: true, 
                    audio: true
                });
                videoStreamRef.current = stream;
                
                if (videoPreviewRef.current) {
                    videoPreviewRef.current.srcObject = stream;
                    await videoPreviewRef.current.play();
                    setCameraReady(true);
                }
            }

            // Make sure the live preview is showing and playing
            setShowPreview(true);
            if (videoPreviewRef.current && videoStreamRef.current) {
                videoPreviewRef.current.srcObject = videoStreamRef.current;
                videoPreviewRef.current.play();
            }

            // Create MediaRecorder with the detected format
            let mediaRecorder;
            try {
                mediaRecorder = new MediaRecorder(videoStreamRef.current, {
                    mimeType: videoFormat.mimeType,
                    videoBitsPerSecond: 2500000,
                    audioBitsPerSecond: 128000
                });
            } catch (error) {
                console.warn(`Failed to create MediaRecorder with ${videoFormat.mimeType}, trying fallback...`);
                const fallbackMimeType = videoFormat.mimeType.split(';')[0];
                try {
                    mediaRecorder = new MediaRecorder(videoStreamRef.current, {
                        mimeType: fallbackMimeType
                    });
                } catch (fallbackError) {
                    mediaRecorder = new MediaRecorder(videoStreamRef.current);
                }
            }
            
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                try {
                    console.log("Recording stopped, creating video blob...");
                    const blob = new Blob(chunksRef.current, { type: videoFormat.mimeType });
                    const url = URL.createObjectURL(blob);
                    console.log("Video URL created:", url);
                    setVideoURL(url);
                    setShowPreview(false);
                    setVideoDuration(0);
                    console.log("Video state updated successfully");
                } catch (error) {
                    console.error("Error in onstop handler:", error);
                    setUploadStatus("Error processing recorded video. Please try again.");
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime((prevTime) => prevTime + 1);
            }, 1000);
        } catch (error) {
            console.error("Error starting recording:", error);
            alert("Error accessing camera/microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const recordNewVideo = () => {
        setShowPreview(true);
        setVideoURL("");
        setVideoDuration(0);
        setUploadStatus("");
        setRecordingTime(0);
        
        if (videoStreamRef.current && videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = videoStreamRef.current;
            videoPreviewRef.current.play().catch(console.error);
        }
    };

    const togglePreview = () => {
        setShowPreview(!showPreview);
    };

    const downloadVideo = () => {
        if (videoURL) {
            const a = document.createElement("a");
            a.href = videoURL;
            a.download = `recording.${videoFormat.extension}`;
            a.click();
        }
    };

    const uploadVideo = async () => {
        if (!videoURL) {
            setUploadStatus("No video to upload. Please record a video first.");
            return;
        }

        // Reject if video duration is less than 30 seconds
        if (videoDuration < 30) {
            setUploadStatus("Video is too short. Minimum duration is 30 seconds.");
            return;
        }

        // Validate required fields
        if (!presentationTopic.trim()) {
            setUploadStatus("Please enter a presentation topic.");
            return;
        }

        if (!selectedLanguage) {
            setUploadStatus("Please select a language.");
            return;
        }

        if (selectedFocus.length === 0) {
            setUploadStatus("Please select at least one focus area for analysis.");
            return;
        }

        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
            setUploadStatus("Please log in to upload videos.");
            setTimeout(() => router.push("/Login"), 2000);
            return;
        }

        try {
            setIsUploading(true);
            setUploadStatus("Preparing upload...");

            const response = await fetch(videoURL);
            const blob = await response.blob();

            const file = new File([blob], `recording.${videoFormat.extension}`, {
                type: videoFormat.mimeType,
            });

            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", `Recording ${new Date().toLocaleString()}`);
            formData.append("topic", presentationTopic.trim());
            formData.append("language", selectedLanguage);
            formData.append("focus_areas", JSON.stringify(selectedFocus));

            try {
                setIsUploading(true);
                setUploadStatus("Uploading...");
                const response = await fetch("http://localhost:8081/presentations/upload", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                    },
                    body: formData,
                });
                if (response.ok) {
                    const data = await response.json();
                    // Save presentationId to localStorage before anything else
                    if (data && data.presentation_id) {
                        localStorage.setItem("presentationId", data.presentation_id);
                    }
                    setUploadStatus("Upload successful! Generating feedback...");
                    // POST to feedback API
                    const feedbackForm = new FormData();
                    feedbackForm.append("file", file);
                    feedbackForm.append("services", selectedFocus.join(","));
                    feedbackForm.append("presentation_id", data.presentation_id);
                    feedbackForm.append("language", selectedLanguage);
                    feedbackForm.append("topic", presentationTopic.trim());
                    const feedbackRes = await fetch("http://localhost:8081/feedback/custom-feedback", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${accessToken}`,
                        },
                        body: feedbackForm,
                    });
                    if (feedbackRes.ok) {
                        const feedbackData = await feedbackRes.json();
                        localStorage.setItem("feedbackData", JSON.stringify(feedbackData));
                        console.log("Feedback data stored in localStorage:", feedbackData);
                        router.push("/Feedback");
                    } else {
                        setUploadStatus("Failed to generate feedback. Please try again later.");
                    }
                } else {
                    const errorData = await response.json();
                    
                    if (response.status === 401) {
                        localStorage.removeItem("access_token");
                        setUploadStatus("Session expired. Please log in again.");
                        setTimeout(() => router.push("/Login"), 2000);
                    } else if (response.status === 413) {
                        setUploadStatus("File too large. Maximum size is 100MB.");
                    } else if (response.status === 415) {
                        setUploadStatus("Unsupported file type.");
                    } else {
                        setUploadStatus(`Upload failed: ${errorData.detail || "Unknown error"}`);
                    }
                }
            } catch (error) {
                console.error("Error uploading file:", error);
                setUploadStatus("Network error. Please check your connection and try again.");
            } finally {
                setIsUploading(false);
            }
        } catch (error) {
            console.error("Error in uploadVideo:", error);
            setUploadStatus("An unexpected error occurred during upload.");
        }
    };
    


    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const formatDuration = (duration: number) => {
        // Handle invalid duration values
        if (!duration || !isFinite(duration) || isNaN(duration) || duration <= 0) {
            return "0:00";
        }
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const handleVideoLoadedMetadata = () => {
        if (recordedVideoRef.current) {
            const duration = recordedVideoRef.current.duration;
            // Only set duration if it's a valid, finite number
            if (duration && isFinite(duration) && !isNaN(duration) && duration > 0) {
                setVideoDuration(duration);
            } else {
                setVideoDuration(0);
            }
        }
    };

    const detectVideoFormat = () => {
        const formats = [
            { mimeType: 'video/mp4;codecs=h264', extension: 'mp4' },
            { mimeType: 'video/mp4', extension: 'mp4' },
            { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
            { mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
            { mimeType: 'video/webm', extension: 'webm' },
        ];

        for (const format of formats) {
            if (MediaRecorder.isTypeSupported(format.mimeType)) {
                return format;
            }
        }

        return { mimeType: 'video/mp4', extension: 'mp4' };
    };

    const getUploadStatusClass = () => {
        if (!uploadStatus) return "";
        if (uploadStatus.includes("successful")) return styles.uploadSuccess;
        if (uploadStatus.includes("failed") || uploadStatus.includes("error") || uploadStatus.includes("expired")) return styles.uploadError;
        if (uploadStatus.includes("Uploading") || uploadStatus.includes("Preparing")) return styles.uploadUploading;
        return styles.uploadError;
    };

    const getStatusIcon = () => {
        if (!uploadStatus) return null;
        if (uploadStatus.includes("successful")) return <FiCheck />;
        if (uploadStatus.includes("failed") || uploadStatus.includes("error") || uploadStatus.includes("expired")) return <FiX />;
        if (uploadStatus.includes("Uploading") || uploadStatus.includes("Preparing")) return <div className={styles.loadingSpinner}></div>;
        return <FiX />;
    };

    return (
        <div className={styles.container} onSubmit={(e) => e.preventDefault()}>
            <div className={styles.studioContainer}>
                <div className={styles.mainContent}>
                    {/* Video Preview Section */}
                    <div className={`${styles.preview} ${isRecording ? styles.recording : ''}`}>
                    <div className={styles.videoWrapper}>
                        {/* Live Camera Preview */}
                        {showPreview && isClient && (
                            <>
                                <video
                                    ref={videoPreviewRef}
                                    className={`${styles.videoPreview} ${cameraReady ? styles.visible : styles.hidden}`}
                                    muted
                                    playsInline
                                />
                                {!cameraReady && (
                                    <div className={styles.cameraPlaceholder}>
                                        <FiCamera className={styles.cameraIcon} />
                                        <div className={styles.cameraText}>Setting up camera...</div>
                                        <div className={styles.cameraSubtext}>Please allow camera and microphone access</div>
                                        <button 
                                            onClick={() => {
                                                const initializeCamera = async () => {
                                                    try {
                                                        const format = detectVideoFormat();
                                                        setVideoFormat(format);
                                                        
                                                        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                                                        videoStreamRef.current = stream;

                                                        // Wait a bit to ensure the video element is ready
                                                        await new Promise(resolve => setTimeout(resolve, 100));

                                                        if (videoPreviewRef.current) {
                                                            videoPreviewRef.current.srcObject = stream;
                                                            
                                                            // Wait for the video to be ready before playing
                                                            await new Promise((resolve, reject) => {
                                                                if (videoPreviewRef.current) {
                                                                    videoPreviewRef.current.onloadedmetadata = () => {
                                                                        videoPreviewRef.current?.play().then(resolve).catch(reject);
                                                                    };
                                                                    videoPreviewRef.current.onerror = reject;
                                                                }
                                                            });
                                                        }
                                                        setCameraReady(true);
                                                    } catch (error) {
                                                        console.error("Error accessing media devices:", error);
                                                        alert("Error accessing camera/microphone. Please check permissions and ensure camera is not being used by another application.");
                                                        setCameraReady(false);
                                                    }
                                                };
                                                initializeCamera();
                                            }}
                                            style={{
                                                marginTop: "16px",
                                                padding: "8px 16px",
                                                backgroundColor: "var(--naples-yellow)",
                                                color: "var(--white)",
                                                border: "none",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                fontSize: "14px",
                                                fontWeight: "500"
                                            }}
                                        >
                                            Retry Camera Setup
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Show loading state on server side */}
                        {showPreview && !isClient && (
                            <div className={styles.cameraPlaceholder}>
                                <FiCamera className={styles.cameraIcon} />
                                <div className={styles.cameraText}>Loading...</div>
                                <div className={styles.cameraSubtext}>Please wait while the camera initializes</div>
                            </div>
                        )}

                        {/* Recorded Video Playback */}
                        {!showPreview && videoURL && (
                            <video
                                ref={recordedVideoRef}
                                src={videoURL}
                                className={styles.recordedVideo}
                                controls
                                onLoadedMetadata={handleVideoLoadedMetadata}
                            />
                        )}

                        {/* Recording Timer */}
                        {isRecording && (
                            <div className={styles.timer}>
                                <div className={styles.recordingIndicator}></div>
                                <FiClock />
                                REC {formatTime(recordingTime)}
                            </div>
                        )}

                        {/* Status Badge */}
                        <div className={`${styles.statusBadge} ${showPreview ? styles.live : styles.recorded}`}>
                            {showPreview ? (
                                <>
                                    <FiRadio />
                                    LIVE
                                </>
                            ) : (
                                <>
                                    <FiFilm />
                                    RECORDED
                                </>
                            )}
                        </div>
                    </div>
                </div>
                </div>

                {/* Control Panel */}
                <div className={styles.controlPanel}>
                    {/* Presentation Details Form */}
                    <div className={styles.presentationForm}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    Presentation Topic *
                                </label>
                                <input
                                    type="text"
                                    value={presentationTopic}
                                    onChange={(e) => setPresentationTopic(e.target.value)}
                                    placeholder="for content relevance analysis"
                                    className={styles.formInput}
                                    maxLength={255}
                                />
                                <div className={styles.characterCount}>
                                    {presentationTopic.length}/255 characters
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    Language *
                                </label>
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                    className={styles.formSelect}
                                >
                                    <option value="">Select Language</option>
                                    <option value="english">English</option>
                                    <option value="arabic">Arabic</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    Focus Areas *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowFocusModal(true)}
                                    className={styles.focusButton}
                                >
                                    <FiTarget style={{ marginRight: '8px' }} />
                                    {selectedFocus.length > 0 
                                        ? `${selectedFocus.length} focus area${selectedFocus.length > 1 ? 's' : ''} selected`
                                        : "Choose a focus"
                                    }
                                </button>
                                {selectedFocus.length > 0 && (
                                    <div className={styles.selectedFocusPreview}>
                                        {selectedFocus.slice(0, 2).map((focus, index) => (
                                            <span key={focus} className={styles.focusTag}>
                                                {focus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                        ))}
                                        {selectedFocus.length > 2 && (
                                            <span className={styles.focusMore}>
                                                +{selectedFocus.length - 2} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Preview Toggle Section */}
                    {videoURL && (
                        <div className={styles.toggleSection}>
                            <div className={styles.toggleButtons}>
                                <button
                                    className={`${styles.toggleButton} ${showPreview ? styles.active : ''}`}
                                    onClick={() => setShowPreview(true)}
                                >
                                    <FiEye />
                                    Live Preview
                                </button>
                                <button
                                    className={`${styles.toggleButton} ${!showPreview ? styles.active : ''}`}
                                    onClick={() => setShowPreview(false)}
                                >
                                    <FiPlay />
                                    Recorded Video
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Upload Status */}
                    {uploadStatus && (
                        <div className={`${styles.UploadStatus} ${getUploadStatusClass()}`}>
                            {uploadStatus.includes("successful") && <FiCheck style={{ marginRight: '8px' }} />}
                            {(uploadStatus.includes("failed") || uploadStatus.includes("error") || uploadStatus.includes("expired")) && <FiX style={{ marginRight: '8px' }} />}
                            {uploadStatus}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className={styles.footer}>
                        {!isRecording && !videoURL && (
                            <button
                                onClick={startRecording}
                                className={`${styles.actionButton} ${styles.recordButton}`}
                                disabled={!cameraReady}
                            >
                                <FiVideo />
                                Start Recording
                            </button>
                        )}

                        {isRecording && (
                            <button
                                onClick={stopRecording}
                                className={`${styles.actionButton} ${styles.stopButton} ${styles.recording}`}
                            >
                                <FiVideoOff />
                                Stop Recording
                            </button>
                        )}

                        {videoURL && !isRecording && (
                            <>
                                <button
                                    onClick={recordNewVideo}
                                    className={`${styles.actionButton} ${styles.newRecordingButton}`}
                                >
                                    <FiVideo />
                                    New Recording
                                </button>
                                <button
                                    onClick={downloadVideo}
                                    className={`${styles.actionButton} ${styles.downloadButton}`}
                                >
                                    <FiDownload />
                                    Download
                                </button>
                                <button
                                    onClick={uploadVideo}
                                    disabled={isUploading || !presentationTopic.trim() || !selectedLanguage || selectedFocus.length === 0}
                                    className={`${styles.actionButton} ${styles.uploadButton}`}
                                >
                                    {isUploading ? (
                                        <>
                                            <div className={styles.loadingSpinner}></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <FiUploadCloud />
                                            Upload Video
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <FocusModal
                isOpen={showFocusModal}
                onClose={() => setShowFocusModal(false)}
                onSave={(focus) => setSelectedFocus(focus)}
                selectedFocus={selectedFocus}
            />
        </div>
    );
};

export default Recording;
