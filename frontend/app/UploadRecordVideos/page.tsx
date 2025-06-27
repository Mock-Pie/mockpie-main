"use client";
import React from "react";
import SideBar from "./components/SideBar";
import { FaUpload, FaVideo } from "react-icons/fa";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import uploadStyles from "./uploadrecord.module.css";

const UploadRecordVideos = () => {
    const router = useRouter();

    const goToUpload = () => {
        router.push("/Upload");
    };

    const goToRecord = () => {
        router.push("/Record");
    };

    return (
        <div className={styles.container}>
            <SideBar />
            <div className={uploadStyles.mainContent}>
                <div className={uploadStyles.header}>
                    <h1 className={uploadStyles.title}>Upload / Record Videos</h1>
                    <p className={uploadStyles.subtitle}>Choose how you want to add your video content</p>
                </div>

                <div className={uploadStyles.uploadRecordSection}>
                    {/* Upload Card */}
                    <div className={uploadStyles.actionCard} onClick={goToUpload}>
                        <div className={uploadStyles.actionIcon}>
                            <FaUpload />
                        </div>
                        <h3 className={uploadStyles.actionTitle}>Upload Video</h3>
                        <p className={uploadStyles.actionDescription}>
                            Select a video file from your device. All major formats supported including MP4, AVI, MOV, and more.
                        </p>
                        <button className={uploadStyles.actionButton} onClick={(e) => { e.stopPropagation(); goToUpload(); }}>
                            Go to Upload
                        </button>
                    </div>

                    {/* Record Card */}
                    <div className={uploadStyles.actionCard} onClick={goToRecord}>
                        <div className={uploadStyles.actionIcon}>
                            <FaVideo />
                        </div>
                        <h3 className={uploadStyles.actionTitle}>Record Video</h3>
                        <p className={uploadStyles.actionDescription}>
                            Record a new video using your camera. Perfect for creating fresh content on the spot.
                        </p>
                        <button className={uploadStyles.actionButton} onClick={(e) => { e.stopPropagation(); goToRecord(); }}>
                            Go to Record
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className={uploadStyles.footer}>
                    <h3 className={uploadStyles.footerTitle}>
                        💡 Important Notes & Best Practices
                    </h3>
                    
                    <div className={uploadStyles.footerContent}>
                        <div className={uploadStyles.footerSection}>
                            <h4 className={uploadStyles.sectionTitle}>🎥 Recording Tips</h4>
                    <ul className={uploadStyles.footerList}>
                        <li>Record in a quiet environment for best audio quality</li>
                                <li>Ensure good lighting for clear video visibility</li>
                                <li>Keep your camera steady or use a tripod</li>
                                <li>Speak clearly and at a moderate pace</li>
                                <li>Camera and microphone permissions required for recording</li>
                            </ul>
                        </div>

                        <div className={uploadStyles.footerSection}>
                            <h4 className={uploadStyles.sectionTitle}>📁 File Requirements</h4>
                            <ul className={uploadStyles.footerList}>
                                <li>All video formats supported (MP4, AVI, MOV, WMV, etc.)</li>
                        <li>Maximum file size: 500MB per video</li>
                        <li>Recommended resolution: 1080p or higher</li>
                                <li>Minimum duration: 10 seconds</li>
                                <li>Maximum duration: 30 minutes</li>
                    </ul>
                        </div>
                    </div>

                    <div className={uploadStyles.quickTips}>
                        <h4 className={uploadStyles.tipsTitle}>💡 Quick Tips</h4>
                        <div className={uploadStyles.tipsGrid}>
                            <div className={uploadStyles.tipCard}>
                                <span className={uploadStyles.tipIcon}>🎯</span>
                                <span>Look directly at the camera for better engagement</span>
                            </div>
                            <div className={uploadStyles.tipCard}>
                                <span className={uploadStyles.tipIcon}>🎙️</span>
                                <span>Test your microphone before recording</span>
                            </div>
                            <div className={uploadStyles.tipCard}>
                                <span className={uploadStyles.tipIcon}>⚡</span>
                                <span>Close unnecessary apps for better performance</span>
                            </div>
                            <div className={uploadStyles.tipCard}>
                                <span className={uploadStyles.tipIcon}>📱</span>
                                <span>Use landscape mode for better video composition</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadRecordVideos;