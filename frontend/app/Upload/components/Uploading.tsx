"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiUploadCloud, FiFile, FiCheck, FiX, FiTarget } from "react-icons/fi";
import styles from "../page.module.css";
import FocusModal from "../../components/shared/FocusModal";

const Uploading = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [videoTitle, setVideoTitle] = useState<string>("");
    const [presentationTopic, setPresentationTopic] = useState<string>("");
    const [selectedLanguage, setSelectedLanguage] = useState<string>("");
    const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
    const [showFocusModal, setShowFocusModal] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file: File) => {
        // Revoke the previous preview URL to free up memory
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setFileName(file.name);
        setVideoTitle(file.name.split('.')[0]);
        setUploadStatus(null);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);
        
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith("video/")) {
            processFile(file);
            
            // Programmatically set the file input's value
            if (fileInputRef.current) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInputRef.current.files = dataTransfer.files;
            }
        } else {
            setUploadStatus("Please drop a valid video file.");
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadStatus("Please select a file first.");
            return;
        }

        // Check video duration before upload
        const duration = await new Promise<number>((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                resolve(video.duration);
            };
            video.onerror = () => reject('Failed to load video metadata');
            video.src = URL.createObjectURL(selectedFile);
        });
        if (duration < 30) {
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

        // Check if user is authenticated
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
            setUploadStatus("Please log in to upload videos.");
            setTimeout(() => router.push("/Login"), 2000);
            return;
        }

        // Validate file size (100MB limit)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (selectedFile.size > maxSize) {
            setUploadStatus("File size exceeds 100MB limit. Please choose a smaller file.");
            return;
        }

        // Validate file type
        const allowedTypes = [
            'video/mp4', 'video/avi', 'video/mkv', 'video/mov', 'video/wmv', 
            'video/flv', 'video/webm', 'video/m4v', 'video/3gp', 'video/quicktime'
        ];
        if (!allowedTypes.includes(selectedFile.type)) {
            setUploadStatus("Unsupported file type. Please upload a valid video file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        if (videoTitle.trim()) {
            formData.append("title", videoTitle.trim());
        }
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
                feedbackForm.append("file", selectedFile);
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
    };

    const getStatusClass = () => {
        if (!uploadStatus) return "";
        if (uploadStatus.includes("successful")) return styles.StatusSuccess;
        if (uploadStatus.includes("failed") || uploadStatus.includes("error") || uploadStatus.includes("expired")) return styles.StatusError;
        if (uploadStatus.includes("Uploading")) return styles.StatusUploading;
        return styles.StatusError;
    };

    return (
        <div className={styles.UploadContainer}>
            <div
                className={`${styles.PreviewSquare} ${isDragOver ? styles.dragOver : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                {previewUrl ? (
                    <video
                        key={previewUrl}
                        controls
                        className={styles.VideoPreview}
                    >
                        <source src={previewUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    <div className={styles.DropZone}>
                        <FiUploadCloud className={styles.UploadIcon} />
                        <div className={styles.DropZoneText}>
                            {isDragOver ? "Drop your video here" : "Upload Video"}
                        </div>
                        <div className={styles.DropZoneSubtext}>
                            Drag and drop your video file here, or click to browse
                        </div>
                        <div className={styles.DropZoneSubtext}>
                            Supports: MP4, AVI, MKV, MOV, WMV (Max: 100MB)
                        </div>
                    </div>
                )}
            </div>
            
            {/* File Information */}
            {selectedFile && (
                <div className={styles.FileInfo}>
                    <div className={styles.TitleInputGroup}>
                        <label className={styles.TitleLabel}>
                            Video Title
                        </label>
                        <input
                            type="text"
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            placeholder="Enter a title for your video"
                            className={styles.TitleInput}
                        />
                    </div>
                    <div className={styles.FileDetails}>
                        <div className={styles.FileName}>
                            <FiFile style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            {fileName}
                        </div>
                        <div className={styles.FileSize}>
                            {formatFileSize(selectedFile.size)}
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.ButtonGroup}>
                <label htmlFor="fileInput" className={styles.ChooseFileButton}>
                    {selectedFile ? "Change File" : "Choose File"}
                </label>
                <input
                    id="fileInput"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className={styles.FileInput}
                    ref={fileInputRef}
                />
                <button 
                    onClick={handleUpload} 
                    className={styles.UploadButton}
                    disabled={isUploading || !selectedFile || !presentationTopic.trim() || !selectedLanguage || selectedFocus.length === 0}
                >
                    {isUploading ? (
                        <>
                            <div className={styles.LoadingSpinner}></div>
                            Uploading...
                        </>
                    ) : (
                        <>
                            <FiUploadCloud style={{ marginRight: '8px' }} />
                            Upload Video
                        </>
                    )}
                </button>
            </div>

            {/* Presentation Details Form */}
            <div className={styles.PresentationDetailsForm}>
                                    <div className={styles.FormGroup}>
                        <label className={styles.FormLabel}>
                            Presentation Topic *
                        </label>
                        <input
                            type="text"
                            value={presentationTopic}
                            onChange={(e) => setPresentationTopic(e.target.value)}
                            placeholder="for content relevance analysis"
                            className={styles.FormInput}
                            maxLength={255}
                        />
                        <div className={styles.CharacterCount}>
                            {presentationTopic.length}/255 characters
                        </div>
                    </div>
                <div className={styles.FormGroup}>
                    <label className={styles.FormLabel}>
                        Language *
                    </label>
                    <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className={styles.FormSelect}
                    >
                        <option value="">Select Language</option>
                        <option value="english">English</option>
                        <option value="arabic">Arabic</option>
                    </select>
                </div>
                
                <div className={styles.FormGroup}>
                    <label className={styles.FormLabel}>
                        Focus Areas *
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowFocusModal(true)}
                        className={styles.FocusButton}
                    >
                        <FiTarget style={{ marginRight: '8px' }} />
                        {selectedFocus.length > 0 
                            ? `${selectedFocus.length} focus area${selectedFocus.length > 1 ? 's' : ''} selected`
                            : "Choose a focus"
                        }
                    </button>
                    {selectedFocus.length > 0 && (
                        <div className={styles.SelectedFocusPreview}>
                            {selectedFocus.slice(0, 2).map((focus, index) => (
                                <span key={focus} className={styles.FocusTag}>
                                    {focus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                            ))}
                            {selectedFocus.length > 2 && (
                                <span className={styles.FocusMore}>
                                    +{selectedFocus.length - 2} more
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {uploadStatus && (
                <div className={`${styles.UploadStatus} ${getStatusClass()}`}>
                    {uploadStatus.includes("successful") && <FiCheck style={{ marginRight: '8px' }} />}
                    {(uploadStatus.includes("failed") || uploadStatus.includes("error")) && <FiX style={{ marginRight: '8px' }} />}
                    {uploadStatus}
                </div>
            )}

            <FocusModal
                isOpen={showFocusModal}
                onClose={() => setShowFocusModal(false)}
                onSave={(focus) => setSelectedFocus(focus)}
                selectedFocus={selectedFocus}
            />
        </div>
    );
};

export default Uploading;