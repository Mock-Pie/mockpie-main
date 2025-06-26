"use client";
import styles from "./page.module.css";
import Header from "./components/Header";
import SideBar from "../UploadRecordVideos/components/SideBar";
import Uploading from "./components/Uploading";

const UploadPage = () => {

    return (
        <div className={styles.container}>
            <SideBar />
            <div className={styles.mainContent}>
                <Header />
                <Uploading />
            </div>
        </div>
    );
}

export default UploadPage;