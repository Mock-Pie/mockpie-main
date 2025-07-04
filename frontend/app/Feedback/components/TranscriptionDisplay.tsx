"use client";
import React, { useState } from "react";
import { FiFileText, FiCopy, FiCheck } from "react-icons/fi";
import styles from "./TranscriptionDisplay.module.css";

interface TranscriptionDisplayProps {
    transcription: string;
    title?: string;
    className?: string;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ 
    transcription, 
    title = "Transcription", 
    className 
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(transcription);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const formatTranscription = (text: string) => {
        // Split into sentences and add proper spacing
        return text
            .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2') // Add line breaks between sentences
            .replace(/\n\n+/g, '\n\n') // Remove multiple consecutive line breaks
            .trim();
    };

    const formattedText = formatTranscription(transcription);

    return (
        <div className={`${styles.transcriptionContainer} ${className || ''}`}>
            {title && (
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <FiFileText className={styles.titleIcon} />
                        <h3 className={styles.title}>{title}</h3>
                    </div>
                    <button 
                        onClick={handleCopy} 
                        className={styles.copyButton}
                        title="Copy transcription"
                    >
                        {copied ? <FiCheck /> : <FiCopy />}
                    </button>
                </div>
            )}
            
            <div className={styles.content}>
                {transcription ? (
                    <div className={styles.transcriptionText}>
                        {formattedText.split('\n').map((paragraph, index) => (
                            <p key={index} className={styles.paragraph}>
                                {paragraph}
                            </p>
                        ))}
                    </div>
                ) : (
                    <div className={styles.noTranscription}>
                        <p>No transcription available for this video.</p>
                    </div>
                )}
            </div>
            
            {transcription && (
                <div className={styles.stats}>
                    <span className={styles.stat}>
                        Words: {transcription.split(/\s+/).filter(word => word.length > 0).length}
                    </span>
                    <span className={styles.stat}>
                        Characters: {transcription.length}
                    </span>
                </div>
            )}
        </div>
    );
};

export default TranscriptionDisplay; 