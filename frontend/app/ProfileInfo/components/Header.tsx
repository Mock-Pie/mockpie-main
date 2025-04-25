import React from 'react';
import styles from "../page.module.css";

const Header = () => {
    return (
        <div className={styles.titleContainer}>
            <h2 className={styles.title}>Profile</h2>
        </div>
    );
};

export default Header;