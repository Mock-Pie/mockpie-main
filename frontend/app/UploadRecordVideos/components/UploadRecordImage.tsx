import React from 'react';
import styles from "../page.module.css";

const UploadAndRecordImage = () => {
    return (
        <div className={styles.UploadRecordImageContainer}>
            <div className={styles.ImageContainer}>
                <img src="/Images/Record.png" 
                    className={styles.RecordImage}/>
                <img src="/Images/Upload.png" 
                    className={styles.UploadImage}/>
                <img src="/Images/spacer.png"
                    className={styles.SpacerImage}/>
            </div>
        </div>
    );
};

export default UploadAndRecordImage;