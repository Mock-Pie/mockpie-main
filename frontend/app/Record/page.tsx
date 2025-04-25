"use client";
import Recording from "./components/Recording";
import styles from "../Login/page.module.css";
import Header from "./components/Header";
import SideBar from "../UploadRecordVideos/components/SideBar";

const RecordPage = () => {

    return (
        <div className={styles.container}>
            <SideBar />
            <Header />
            <Recording />
        </div>
    );
}

export default RecordPage;