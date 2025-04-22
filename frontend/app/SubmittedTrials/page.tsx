'use client';

import React from "react";
import styles from "./page.module.css";
import SideBar from "../UploadRecordVideos/components/SideBar";
import TrialsTable from "./components/TrialsTable";
import Header from "./components/Header";

const SubmittedTrials = () => {
  return (
    <div className={styles.container}>
      <SideBar />
      <div className={styles.mainContent}>
        <Header />
        <div className={styles.trialsContainer}>
         <TrialsTable />
        </div>
      </div>
    </div>
  );
};

export default SubmittedTrials;