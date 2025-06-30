"use client";
import React from "react";
import SideBar from "../UploadRecordVideos/components/SideBar";
import styles from "../UploadRecordVideos/page.module.css";
import feedbackStyles from "./feedback.module.css";

const Feedback = () => {
    return (
        <div className={styles.container}>
            <SideBar />
            <div className={feedbackStyles.mainContent}>
                <div className={feedbackStyles.header}>
                    <h1 className={feedbackStyles.title}>Feedback</h1>
                    <p className={feedbackStyles.subtitle}>Share your thoughts and help us improve MockPie</p>
                </div>
            </div>
        </div>
    );
};

export default Feedback;
