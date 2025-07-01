import React from 'react';
import { FiBarChart3 } from 'react-icons/fi';
import styles from "../feedback.module.css";

const Header = () => {
    return (
        <div className={styles.header}>
            <h1 className={styles.title}>Analysis Results</h1>
            <p className={styles.subtitle}>AI-powered feedback on your presentation performance</p>
        </div>
    );
};

export default Header;

