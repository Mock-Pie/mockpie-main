import React from "react";
import styles from "./page.module.css";
import Header from "./components/Header";
import SideBar from "../UploadRecordVideos/components/SideBar";
import ProfileForm from "./components/ProfileForm";

const ProfileInfo = () => {
    return (
        <div className={styles.container}>
            <SideBar />  
            <div className={styles.mainContent}>
                <Header />
                <ProfileForm />
            </div>
        </div>
    );
};

export default ProfileInfo;