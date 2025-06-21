"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";

const Uploading = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); // State for video preview
    const [fileName, setFileName] = useState<string | null>(null); // State for file name
    const [uploadStatus, setUploadStatus] = useState<string | null>(null); // State for upload status
    const [isUploading, setIsUploading] = useState(false); // State for upload progress
    const [videoTitle, setVideoTitle] = useState<string>(""); // State for video title
    const fileInputRef = useRef<HTMLInputElement | null>(null); // Ref for the file input
    const router = useRouter();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Revoke the previous preview URL to free up memory
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Generate a new preview URL
            setFileName(file.name); // Update the file name
            setVideoTitle(file.name.split('.')[0]); // Set default title as filename without extension
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith("video/")) {
            // Revoke the previous preview URL to free up memory
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Generate a new preview URL
            setFileName(file.name); // Update the file name
            setVideoTitle(file.name.split('.')[0]); // Set default title as filename without extension

            // Programmatically set the file input's value
            if (fileInputRef.current) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInputRef.current.files = dataTransfer.files;
            }
        } else {
            alert("Please drop a valid video file.");
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert("Please select a file first.");
            return;
        }

        // Check if user is authenticated
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
            alert("Please log in to upload videos.");
            router.push("/Login");
            return;
        }

        // Validate file size (100MB limit)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (selectedFile.size > maxSize) {
            alert("File size exceeds 100MB limit. Please choose a smaller file.");
            return;
        }

        // Validate file type
        const allowedTypes = [
            'video/mp4', 'video/avi', 'video/mkv', 'video/mov', 'video/wmv', 
            'video/flv', 'video/webm', 'video/m4v', 'video/3gp', 'video/quicktime'
        ];
        if (!allowedTypes.includes(selectedFile.type)) {
            alert("Unsupported file type. Please upload a valid video file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        if (videoTitle.trim()) {
            formData.append("title", videoTitle.trim());
        }

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
                setUploadStatus("Upload successful!");
                console.log("Upload response:", data);
                
                // Redirect to dashboard or presentations list after successful upload
                setTimeout(() => {
                    router.push("/Dashboard");
                }, 2000);
            } else {
                const errorData = await response.json();
                
                if (response.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem("access_token");
                    alert("Session expired. Please log in again.");
                    router.push("/Login");
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

    return (
        <div className={styles.UploadContainer}>
            <div
                className={styles.PreviewSquare}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {previewUrl ? (
                    <video
                        key={previewUrl} // Force the video to reload when the URL changes
                        controls
                        className={styles.VideoPreview}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    >
                        <source src={previewUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    <img
                        src="/Images/Uploading.png"
                        alt="Upload Video"
                        className={styles.ImagePreview}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                )}
            </div>
            
            {/* Video Title Input */}
            {selectedFile && (
                <div style={{ marginTop: '20px', width: '60%' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--white)' }}>
                        Video Title:
                    </label>
                    <input
                        type="text"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        placeholder="Enter video title"
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '5px',
                            border: '1px solid var(--light-grey)',
                            backgroundColor: 'var(--chinese-black)',
                            color: 'var(--white)',
                            fontSize: '14px'
                        }}
                    />
                </div>
            )}

            <div className={styles.ButtonGroup}>
                <label htmlFor="fileInput" className={styles.ChooseFileButton}>
                    Choose File
                </label>
                <input
                    id="fileInput"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className={styles.FileInput}
                    ref={fileInputRef} // Attach the ref to the file input
                />
                <button 
                    onClick={handleUpload} 
                    className={styles.UploadButton}
                    disabled={isUploading || !selectedFile}
                    style={{
                        opacity: (isUploading || !selectedFile) ? 0.6 : 1,
                        cursor: (isUploading || !selectedFile) ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isUploading ? "Uploading..." : "Upload"}
                </button>
            </div>
            {fileName && <p className={styles.FileName}>Selected File: {fileName}</p>}
            {uploadStatus && (
                <p className={styles.UploadStatus} style={{
                    color: uploadStatus.includes("successful") ? "var(--naples-yellow)" : 
                           uploadStatus.includes("failed") || uploadStatus.includes("error") ? "#ff4444" :
                           "var(--white)"
                }}>
                    {uploadStatus}
                </p>
            )}
        </div>
    );
};

export default Uploading;