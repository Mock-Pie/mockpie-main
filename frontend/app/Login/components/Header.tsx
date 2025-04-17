import React from 'react';
import styles from "../page.module.css";

const Header = () => {
    return (
        <div className={styles.titleSubtitleContainer}>
            <h2 className={styles.title}>Sign In</h2>
        </div>
    );
};

export default Header;