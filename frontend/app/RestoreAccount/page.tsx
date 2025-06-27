import React from "react";
import styles from "./page.module.css";
import RestoreAccountForm from "./components/RestoreAccountForm";

const RestoreAccount = () => {
    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <RestoreAccountForm />
            </div>
        </div>
    );
};

export default RestoreAccount; 