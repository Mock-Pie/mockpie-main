"use client";
import React, { useState, useRef } from "react";
import styles from "../page.module.css";

const Uploading = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); // State for video preview
    const [fileName, setFileName] = useState<string | null>(null); // State for file name
    const [uploadStatus, setUploadStatus] = useState<string | null>(null); // State for upload status
    const fileInputRef = useRef<HTMLInputElement | null>(null); // Ref for the file input

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

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            setUploadStatus("Uploading...");
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setUploadStatus("Upload successful!");
                console.log("Uploaded file URL:", data.fileUrl); // Log the uploaded file URL
            } else {
                setUploadStatus("Upload failed.");
                console.error("Failed to upload file.");
            }
        } catch (error) {
            setUploadStatus("An error occurred during upload.");
            console.error("Error uploading file:", error);
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
                    >
                        <source src={previewUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    <img
                        src="/Images/Uploading.png"
                        alt="Sign Up"
                        className={styles.ImagePreview}
                    />
                )}
            </div>
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
                <button onClick={handleUpload} className={styles.UploadButton}>
                    Upload
                </button>
            </div>
            {fileName && <p className={styles.FileName}>Selected File: {fileName}</p>}
            {uploadStatus && <p className={styles.UploadStatus}>{uploadStatus}</p>}
        </div>
    );
};

export default Uploading;