import React from "react";
import styles from "../UploadRecordVideos/page.module.css";
import SideBar from "../UploadRecordVideos/components/SideBar";
import Header from "./components/Header";


const Calendar= () => {
    return (
        <div className={styles.container}>
        <SideBar />  
        <Header />
        </div>
    );
};

export default Calendar;