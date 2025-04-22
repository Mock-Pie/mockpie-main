import React from 'react';
import styles from '../page.module.css';
import { FiFilter } from 'react-icons/fi';
import Link from 'next/link';

const TrialsHeader = () => {
  return (
    <div className={styles.header}>
      <div className={styles.filterContainer}>
        <button className={styles.actionButton}>
          <FiFilter size={20} />
          Filter
        </button>
      </div>
      <Link href="/UploadRecordVideos" passHref legacyBehavior>
        <button className={styles.submitButton}>
          Submit new trial
        </button>
      </Link>
    </div>
  );
};

export default TrialsHeader;