import React from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import styles from "../feedback.module.css";

const Header = () => {
    return (
        <div className={styles.header}>
            <h1 className={styles.title}>Feedback</h1>
            <p className={styles.subtitle}>Share your thoughts and help us improve MockPie</p>
        </div>
    );
};

export default Header;

