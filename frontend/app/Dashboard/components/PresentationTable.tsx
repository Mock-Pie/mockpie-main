import React from 'react';
import styles from '../page.module.css';

const PresentationTable = () => {
  return (
    <div className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <h3 className={styles.sectionTitle}>Presentation Details</h3>
        <button className={styles.filterButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6h16M4 12h16m-7 6h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Filter</span>
        </button>
      </div>
      
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeaderRow}>
            <th className={styles.tableHeaderCell}>ID</th>
            <th className={styles.tableHeaderCell}>Name</th>
            <th className={styles.tableHeaderCell}>Date</th>
            <th className={styles.tableHeaderCell}>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.tableRow}>
            <td className={styles.tableCell}>827306</td>
            <td className={styles.tableCell}>Patagonia</td>
            <td className={styles.tableCell}>13/01/2022</td>
            <td className={`${styles.tableCell} ${styles.statusPending}`}>Pending</td>
          </tr>
          <tr className={styles.tableRow}>
            <td className={styles.tableCell}>829386</td>
            <td className={styles.tableCell}>Adom.com</td>
            <td className={styles.tableCell}>13/01/2022</td>
            <td className={`${styles.tableCell} ${styles.statusPresented}`}>Presented</td>
          </tr>
          <tr className={styles.tableRow}>
            <td className={styles.tableCell}>826185</td>
            <td className={styles.tableCell}>Charles Tea</td>
            <td className={styles.tableCell}>13/01/2022</td>
            <td className={`${styles.tableCell} ${styles.statusUpcoming}`}>Upcoming</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PresentationTable;