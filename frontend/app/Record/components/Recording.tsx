"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "../page.module.css";

const Recording = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [videoURL, setVideoURL] = useState("");
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoStreamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const initializeCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                videoStreamRef.current = stream;

                if (videoPreviewRef.current) {
                    videoPreviewRef.current.srcObject = stream;
                    videoPreviewRef.current.play();
                }
            } catch (error) {
                console.error("Error accessing media devices:", error);
            }
        };

        initializeCamera();

        return () => {
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            // Reset video URL when starting a new recording
            if (videoURL) {
                URL.revokeObjectURL(videoURL);
                setVideoURL("");
            }

            // Reinitialize camera stream if needed
            if (!videoStreamRef.current) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                videoStreamRef.current = stream;
            }

            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = videoStreamRef.current;
                videoPreviewRef.current.play();
            }

            const mediaRecorder = new MediaRecorder(videoStreamRef.current);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = []; // Reset chunks array

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "video/webm" });
                const url = URL.createObjectURL(blob);
                setVideoURL(url);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime((prevTime) => prevTime + 1);
            }, 1000);
        } catch (error) {
            console.error("Error starting recording:", error);
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

    const downloadVideo = () => {
        if (videoURL) {
            const a = document.createElement("a");
            a.href = videoURL;
            a.download = "recording.mp4";
            a.click();
        }
    };

    const uploadVideo = () => {
        alert("Upload functionality is not implemented yet.");
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    return (
        <div className={styles.container}>
            {/* Video Preview Section */}
            <div className={styles.preview}>
                {!videoURL ? (
                    <div className={styles.videoWrapper}>
                        <video
                            ref={videoPreviewRef}
                            className={styles.videoPreview}
                            autoPlay
                            muted
                        ></video>
                        {isRecording && (
                            <div className={styles.timer}>
                                {formatTime(recordingTime)}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.videoWrapper}>
                        <video
                            src={videoURL}
                            controls
                            className={styles.recordedVideo}
                        ></video>
                    </div>
                )}
            </div>

            {/* Button Section */}
            <div className={styles.footer}>
                {!isRecording ? (
                    <button onClick={startRecording} className={styles.actionButton}>
                        Start Recording
                    </button>
                ) : (
                    <button onClick={stopRecording} className={styles.actionButton}>
                        Stop Recording
                    </button>
                )}
                {videoURL && (
                    <>
                        <button onClick={downloadVideo} className={styles.actionButton}>
                            Download Video
                        </button>
                        <button onClick={uploadVideo} className={styles.actionButton}>
                            Upload Video
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Recording;
