"use client";
import styles from "../UploadRecordVideos/page.module.css";
import Header from "./components/Header";
import SideBar from "../UploadRecordVideos/components/SideBar";
import Uploading from "./components/Uploading";

const UploadPage = () => {

    return (
        <div className={styles.container}>
            <SideBar />
            <Header />
            <Uploading />
        </div>
    );
}

export default UploadPage;