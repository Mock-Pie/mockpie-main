import React from 'react';
import styles from "../Login/page.module.css";
import SideBar from "./components/SideBar";
import Header from "./components/Header";
import UploadAndRecordImage from './components/UploadRecordImage';
import UploadAndRecord from './components/UploadAndRecordButtons';
import Footer from './components/FooterText';


const VideoScreen = () => {
    return (
        <div className={styles.container}>
        <SideBar /> 
        <Header />
        <UploadAndRecordImage />
        <UploadAndRecord />
        <Footer />
        </div>
    );
}

export default VideoScreen;