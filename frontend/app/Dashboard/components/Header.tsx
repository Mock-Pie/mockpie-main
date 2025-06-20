import React from 'react';
import styles from "../page.module.css";
import UserWidget from './UserWidget';

const Header = () => {
    return (
        <div className={styles.headerContainer}>
            <div className={styles.titleSubtitleContainer}>
                <h2 className={styles.title}>Dashboard</h2>
            </div>
            <UserWidget className={styles.userWidget} />
        </div>
    );
};

export default Header;