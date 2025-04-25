import React from 'react';
import Link from 'next/link';
import { IoFilterOutline } from 'react-icons/io5';
import styles from "../page.module.css";

interface HeaderActionsProps {
    handleFilterClick: () => void;
}

const HeaderActions = ({ handleFilterClick }: HeaderActionsProps) => {
    return (
        <div className={styles.headerActions}>
            <div className={styles.headerTitle}>Trials Details</div>
            <div className={styles.actionButtons}>
                <button className={styles.filterButton} onClick={handleFilterClick}>
                    <IoFilterOutline />Filter
                </button>
                <Link href="/UploadRecordVideos">
                    <button className={styles.submitButton}>Submit new trial</button>
                </Link>
            </div>
        </div>
    );
};

export default HeaderActions;