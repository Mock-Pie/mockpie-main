import React from "react";
import styles from "../Login/page.module.css";
import Header from "./components/Header";
import SideBar from "../UploadRecordVideos/components/SideBar";


const ProfileInfo= () => {
    return (
        <div className={styles.container}>
        <SideBar />  
        <Header />
        </div>
    );
};

export default ProfileInfo;