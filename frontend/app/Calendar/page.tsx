import React from "react";
import styles from "../UploadRecordVideos/page.module.css";
import uploadStyles from "../UploadRecordVideos/uploadrecord.module.css";
import SideBar from "../UploadRecordVideos/components/SideBar";
import Header from "./components/Header";


const Calendar= () => {
    return (
        <div className={styles.container}>
            <SideBar />  
            <div className={uploadStyles.mainContent}>
                <Header />
                {/* Calendar content will go here */}
            </div>
        </div>
    );
};

export default Calendar;