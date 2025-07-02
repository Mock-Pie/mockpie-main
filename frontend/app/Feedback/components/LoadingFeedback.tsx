"use client";
import React from "react";
import { FiLoader } from "react-icons/fi";
import styles from "./AnalysisOverview.module.css";

const LoadingFeedback = () => (
  <div className={styles.overviewContainer} style={{ textAlign: "center", padding: "48px 0" }}>
    <FiLoader className={styles.loadingSpinner} size={48} style={{ animation: "spin 1s linear infinite", marginBottom: 24 }} />
    <h2>Generating your feedback...</h2>
    <p>Please wait while our AI analyzes your presentation.</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default LoadingFeedback;