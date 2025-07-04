import React from 'react';
import styles from "../feedback.module.css";

const Header = () => {
    return (
        <div className={styles.header}>
            <h1 className={styles.title}>Presentation Feedback</h1>
            <p className={styles.subtitle}>AI-powered analysis of your presentation performance</p>
        </div>
    );
};

export default Header;

