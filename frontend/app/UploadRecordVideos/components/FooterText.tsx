import React from 'react';
import styles from "../page.module.css";

const Footer = () => {
    return (
        <div className={styles.footerContainer}>
            <h3 className={styles.FooterTitle}>Important Notes:</h3>
            <ul className={styles.FooterList}>
                <li>When recording a video, it’s better to be in a quiet area.</li>
                <li>All video extensions are supported.</li>
            </ul>
        </div>
    );
};

export default Footer;