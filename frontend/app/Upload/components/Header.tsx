import React from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import styles from "../page.module.css";

const Header = () => {
    return (
        <div className={styles.header}>
            <h1 className={styles.title}>Upload Video</h1>
            <p className={styles.subtitle}>Share your presentation and get AI-powered feedback</p>
        </div>
    );
};

export default Header;