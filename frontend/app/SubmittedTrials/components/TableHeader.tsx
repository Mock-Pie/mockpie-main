import React from 'react';
import styles from "../page.module.css";

const TableHeader = () => {
    return (
        <div className={styles.tableHeader}>
            <div>ID</div>
            <div>Name</div>
            <div>Date</div>
            <div>Feedback</div>
            <div>Actions</div>
        </div>
    );
};

export default TableHeader;