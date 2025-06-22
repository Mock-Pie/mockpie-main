import React from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import styles from "../../UploadRecordVideos/page.module.css";

const Header = () => {
    return (
        <div className={styles.titleSubtitleContainer}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                marginBottom: '8px'
            }}>
                <FiUploadCloud 
                    style={{ 
                        fontSize: '2.5rem', 
                        color: 'var(--naples-yellow)' 
                    }} 
                />
                <h2 className={styles.title} style={{
                    background: 'linear-gradient(135deg, var(--white) 0%, var(--naples-yellow) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    margin: 0
                }}>
                    Upload Video
                </h2>
            </div>
            <p style={{
                color: 'var(--light-grey)',
                fontSize: '1.1rem',
                margin: 0,
                fontWeight: 400
            }}>
                Share your presentation and get AI-powered feedback
            </p>
        </div>
    );
};

export default Header;