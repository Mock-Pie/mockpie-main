import React, { useEffect, useState } from 'react';
import styles from "../page.module.css";
import { TfiDownload } from "react-icons/tfi";
import { AiOutlineDelete } from "react-icons/ai";


interface Trial {
    id: string;
    name: string;
    date: string;
    feedback: string;
    url?: string;
}

interface TableRowProps {
    trial: Trial;
}

const TableRow = ({ trial }: TableRowProps) => {
    const [videoSize, setVideoSize] = useState<number | null>(null);

    useEffect(() => {
        if (trial.url) {
            fetch(trial.url, { method: 'HEAD' })
                .then(res => {
                    const size = res.headers.get('content-length');
                    if (size) setVideoSize(Number(size));
                });
        }
    }, [trial.url]);

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
                {videoSize !== null && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#aaa' }}>
                        { (videoSize / (1024 * 1024)).toFixed(2) } MB
                    </span>
                )}
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
                    <AiOutlineDelete size={18} color="#F9C74F" />
                </button>
            </div>
        </div>
    );
};

export default TableRow;