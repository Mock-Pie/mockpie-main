"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import styles from "../page.module.css";

const Recording = () => {
    const router = useRouter();
    const [isRecording, setIsRecording] = useState(false);
    const [videoURL, setVideoURL] = useState("");
    const [recordingTime, setRecordingTime] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("");
    const [videoDuration, setVideoDuration] = useState(0);
    const [showPreview, setShowPreview] = useState(true);
    const [videoFormat, setVideoFormat] = useState<{mimeType: string, extension: string}>({mimeType: 'video/webm', extension: 'webm'});
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoStreamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
    const recordedVideoRef = useRef<HTMLVideoElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const initializeCamera = async () => {
            try {
                // Detect best supported format
                const format = detectVideoFormat();
                setVideoFormat(format);
                console.log(`Using video format: ${format.extension.toUpperCase()} (${format.mimeType})`);

                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                videoStreamRef.current = stream;

                if (videoPreviewRef.current) {
                    videoPreviewRef.current.srcObject = stream;
                    videoPreviewRef.current.play();
                }
            } catch (error) {
                console.error("Error accessing media devices:", error);
                alert("Error accessing camera/microphone. Please check permissions and ensure camera is not being used by another application.");
            }
        };

        initializeCamera();

        return () => {
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // Effect to handle preview switching
    useEffect(() => {
        if (showPreview && videoStreamRef.current && videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = videoStreamRef.current;
            videoPreviewRef.current.play().catch(console.error);
        }
    }, [showPreview]);

    const startRecording = async () => {
        try {
            // Reset video URL when starting a new recording
            if (videoURL) {
                URL.revokeObjectURL(videoURL);
                setVideoURL("");
                setVideoDuration(0);
                setUploadStatus("");
            }

            // Ensure we have a camera stream with audio
            if (!videoStreamRef.current) {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 1280, height: 720 }, 
                    audio: { 
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    } 
                });
                videoStreamRef.current = stream;
            }

            // Verify audio tracks are present
            const audioTracks = videoStreamRef.current.getAudioTracks();
            const videoTracks = videoStreamRef.current.getVideoTracks();
            console.log(`Audio tracks: ${audioTracks.length}, Video tracks: ${videoTracks.length}`);
            
            if (audioTracks.length === 0) {
                console.warn('No audio tracks found in stream!');
            }

            // Make sure the live preview is showing and playing
            setShowPreview(true);
            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = videoStreamRef.current;
                videoPreviewRef.current.play();
            }

            // Create MediaRecorder with the detected format
            let mediaRecorder;
            try {
                // Try with the detected format first
                mediaRecorder = new MediaRecorder(videoStreamRef.current, {
                    mimeType: videoFormat.mimeType,
                    videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
                    audioBitsPerSecond: 128000   // 128 kbps for good audio quality
                });
            } catch (error) {
                console.warn(`Failed to create MediaRecorder with ${videoFormat.mimeType}, trying fallback...`);
                // Fallback to generic format without codec specifications
                const fallbackMimeType = videoFormat.mimeType.split(';')[0];
                try {
                    mediaRecorder = new MediaRecorder(videoStreamRef.current, {
                        mimeType: fallbackMimeType
                    });
                } catch (fallbackError) {
                    // Final fallback - no options
                    mediaRecorder = new MediaRecorder(videoStreamRef.current);
                }
            }
            
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = []; // Reset chunks array

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: videoFormat.mimeType });
                const url = URL.createObjectURL(blob);
                setVideoURL(url);
                setShowPreview(false); // Switch to recorded video view
                
                // Reset duration initially
                setVideoDuration(0);
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
        
        // Restart the camera stream for live preview
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
            alert("No video to upload. Please record a video first.");
            return;
        }

        // Check if user is authenticated
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
            alert("Please log in to upload videos.");
            // You might want to redirect to login page here
            return;
        }

        try {
            setUploadStatus("Uploading...");

            // Convert the video blob to a file
            const response = await fetch(videoURL);
            const blob = await response.blob();
            
            // Create a file from the blob with clean MIME type (remove codec specs)
            const cleanMimeType = videoFormat.mimeType.split(';')[0]; // Remove codec specifications
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `recorded-video-${timestamp}.${videoFormat.extension}`;
            const file = new File([blob], fileName, { type: cleanMimeType });

            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", `Recorded Video ${new Date().toLocaleDateString()}`);

            const uploadResponse = await fetch("http://localhost:8081/presentations/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: formData,
            });

            if (uploadResponse.ok) {
                const data = await uploadResponse.json();
                setUploadStatus("Upload successful!");
                console.log("Upload response:", data);
                
                // Redirect to dashboard after successful upload
                setTimeout(() => {
                    router.push("/Dashboard");
                }, 2000);
            } else {
                const errorData = await uploadResponse.json();
                
                if (uploadResponse.status === 401) {
                    localStorage.removeItem("access_token");
                    alert("Session expired. Please log in again.");
                } else if (uploadResponse.status === 413) {
                    setUploadStatus("File too large. Maximum size is 100MB.");
                } else if (uploadResponse.status === 415) {
                    setUploadStatus("Unsupported file type.");
                } else {
                    setUploadStatus(`Upload failed: ${errorData.detail || "Unknown error"}`);
                }
            }
        } catch (error) {
            console.error("Error uploading video:", error);
            setUploadStatus("Network error. Please check your connection and try again.");
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    const formatDuration = (duration: number) => {
        // Handle invalid duration values
        if (!duration || !isFinite(duration) || isNaN(duration) || duration <= 0) {
            return "0:00";
        }
        
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        return `${minutes}:${String(seconds).padStart(2, "0")}`;
    };

    // Detect best supported video format
    const detectVideoFormat = () => {
        const mp4Options = [
            'video/mp4;codecs="avc1.42E01E,mp4a.40.2"', // H.264 + AAC audio
            'video/mp4;codecs="avc1.42E01E"', // H.264 video only
            'video/mp4', // Generic MP4
        ];
        
        const webmOptions = [
            'video/webm;codecs="vp9,opus"', // VP9 + Opus audio
            'video/webm;codecs="vp8,opus"', // VP8 + Opus audio
            'video/webm;codecs="vp9"', // VP9 video only
            'video/webm;codecs="vp8"', // VP8 video only
            'video/webm', // Generic WebM
        ];

        // Try MP4 first (prioritizing ones with audio codecs)
        for (const mimeType of mp4Options) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                console.log(`Detected supported format: ${mimeType}`);
                return { mimeType, extension: 'mp4' };
            }
        }

        // Fallback to WebM (prioritizing ones with audio codecs)
        for (const mimeType of webmOptions) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                console.log(`Detected supported format: ${mimeType}`);
                return { mimeType, extension: 'webm' };
            }
        }

        // Final fallback
        console.log('Using fallback format: video/webm');
        return { mimeType: 'video/webm', extension: 'webm' };
    };

    return (
        <div className={styles.container}>
            {/* Video Preview Section */}
            <div className={styles.preview}>
                {/* Live Camera Preview */}
                {(showPreview || isRecording) && (
                    <div className={styles.videoWrapper}>
                        <video
                            ref={videoPreviewRef}
                            className={styles.videoPreview}
                            autoPlay
                            muted
                        ></video>
                        {isRecording && (
                            <div className={styles.timer}>
                                🔴 {formatTime(recordingTime)}
                            </div>
                        )}
                        {!isRecording && videoURL && (
                            <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '5px 10px',
                                borderRadius: '5px',
                                fontSize: '12px'
                            }}>
                                Live Preview
                            </div>
                        )}
                    </div>
                )}

                {/* Recorded Video Preview */}
                {!showPreview && videoURL && (
                    <div className={styles.videoWrapper}>
                        <video
                            ref={recordedVideoRef}
                            src={videoURL}
                            controls
                            className={styles.recordedVideo}
                            onLoadedMetadata={() => {
                                if (recordedVideoRef.current) {
                                    const duration = recordedVideoRef.current.duration;
                                    // Only set duration if it's a valid finite number
                                    if (isFinite(duration) && !isNaN(duration) && duration > 0) {
                                        setVideoDuration(duration);
                                    } else {
                                        setVideoDuration(0);
                                    }
                                }
                            }}
                        ></video>
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            background: 'rgba(0,0,0,0.8)',
                            color: 'white',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            fontSize: '12px'
                        }}>
                            📹 Recorded Video
                            {videoDuration > 0 && isFinite(videoDuration) && !isNaN(videoDuration) && (
                                <span style={{ marginLeft: '10px' }}>
                                    Duration: {formatDuration(videoDuration)}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Toggle Buttons */}
            {videoURL && !isRecording && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                    marginTop: '10px'
                }}>
                    <button 
                        onClick={() => setShowPreview(true)}
                        className={styles.actionButton}
                        style={{
                            backgroundColor: showPreview ? 'var(--naples-yellow)' : 'var(--charleston-green)',
                            width: '120px',
                            fontSize: '14px'
                        }}
                    >
                        Live Preview
                    </button>
                    <button 
                        onClick={() => setShowPreview(false)}
                        className={styles.actionButton}
                        style={{
                            backgroundColor: !showPreview ? 'var(--naples-yellow)' : 'var(--charleston-green)',
                            width: '120px',
                            fontSize: '14px'
                        }}
                    >
                        Recorded Video
                    </button>
                </div>
            )}

            {/* Main Action Buttons */}
            <div className={styles.footer}>
                {!isRecording ? (
                    <button onClick={startRecording} className={styles.actionButton}>
                        {videoURL ? "Record New Video" : "Start Recording"}
                    </button>
                ) : (
                    <button onClick={stopRecording} className={styles.actionButton}>
                        Stop Recording
                    </button>
                )}
                
                {videoURL && !isRecording && (
                    <>
                        <button onClick={downloadVideo} className={styles.actionButton}>
                            Download Video
                        </button>
                        <button 
                            onClick={uploadVideo} 
                            className={styles.actionButton}
                            disabled={uploadStatus.includes("Uploading")}
                            style={{
                                opacity: uploadStatus.includes("Uploading") ? 0.6 : 1,
                                cursor: uploadStatus.includes("Uploading") ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {uploadStatus.includes("Uploading") ? "Uploading..." : "Upload Video"}
                        </button>
                    </>
                )}
            </div>

            {/* Upload Status */}
            {uploadStatus && (
                <div style={{
                    marginTop: '15px',
                    padding: '12px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    backgroundColor: uploadStatus.includes("successful") ? '#4CAF50' : 
                                   uploadStatus.includes("failed") || uploadStatus.includes("error") ? '#f44336' :
                                   '#2196F3',
                    color: 'white',
                    fontWeight: '500'
                }}>
                    {uploadStatus}
                </div>
            )}


        </div>
    );
};

export default Recording;
