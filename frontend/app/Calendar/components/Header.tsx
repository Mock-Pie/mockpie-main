import React from 'react';
import styles from "../../UploadRecordVideos/uploadrecord.module.css";

const Header = () => {
    return (
        <div className={styles.header}>
            <h1 className={styles.title}>Calendar</h1>
            <p className={styles.subtitle}>Manage your schedule and upcoming presentations</p>
        </div>
    );
};

export default Header;