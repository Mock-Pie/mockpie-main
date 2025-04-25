"use client";
import React, { useRef } from "react";
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import Link from "next/link";
import styles from "../page.module.css";

const UploadAndRecord = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter(); // Initialize the router

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click(); // Trigger the file input dialog
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            console.log("Selected files:", files); // Handle the uploaded files here

            // Navigate to the UploadVideo page and pass the file name as a query parameter
            router.push(`/UploadVideo?fileName=${files[0].name}`);
        }
    };

    return (
        <div>
            <Link href="/Record" className={styles.RecordButton}>
                Record a video
            </Link>
            <Link href="/Upload" className={styles.UploadButton}>
                Upload a video
            </Link>
            {/* <button onClick={handleUploadClick} className={styles.UploadButton}>
                Upload a video
            </button>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }} // Hide the file input
                onChange={handleFileChange}
                accept="video/*" // Restrict to video files
            /> */}
        </div>
    );
};

export default UploadAndRecord;