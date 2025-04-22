'use client';

import React from "react";
import styles from "./page.module.css";
import SideBar from "../UploadRecordVideos/components/SideBar";
import TrialsHeader from "./components/TrialsHeader";
import TrialsTable from "./components/TrialsTable";

const SubmittedTrials = () => {
  return (
    <div className={styles.container}>
      <SideBar />
      <div className={styles.mainContent}>
        <h1 className={styles.pageTitle}>Submitted Trials</h1>
        
        <div className={styles.trialsContainer}>
          {/* Header with filter and submit button */}
          <TrialsHeader />

          {/* Table displaying trial details */}
          <TrialsTable />
        </div>
      </div>
    </div>
  );
};

export default SubmittedTrials;