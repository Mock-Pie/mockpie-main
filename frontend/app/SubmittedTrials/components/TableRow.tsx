import React from 'react';
import styles from "../page.module.css";
import { TfiDownload } from "react-icons/tfi";

interface Trial {
    id: string;
    name: string;
    date: string;
    feedback: string;
}

interface TableRowProps {
    trial: Trial;
}

const TableRow = ({ trial }: TableRowProps) => {
    return (
        <div className={styles.tableRow}>
            <div className={styles.videoCell}>
                <div className={styles.videoThumbnail}>
                    <img 
                        src="/Images/VideoIcon.png" 
                        alt="Video" 
                        className={styles.videoIcon}
                    />
                    <div className={styles.playIcon}></div>
                </div>
                {trial.id}
            </div>
            <div>{trial.name}</div>
            <div>{trial.date}</div>
            <div className={styles.feedbackCell}>
                <div className={styles.feedbackText}>
                    This is feedback about this vid...
                </div>
                <button className={styles.viewMore}>view more</button>
            </div>
            <div className={styles.actions}>
                <button className={styles.downloadButton}>
                    <TfiDownload size={18} color="#F9C74F" />
                </button>
                <button className={styles.deleteButton}>
                    <img 
                        src="/Images/TrashIcon.png"
                        className={styles.trashIcon}
                    />
                </button>
            </div>
        </div>
    );
};

export default TableRow;