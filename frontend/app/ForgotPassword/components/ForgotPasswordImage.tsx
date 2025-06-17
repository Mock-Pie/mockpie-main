import React from 'react';
import styles from "../../Login/page.module.css";
import styles1 from "../page.module.css";

const ForgotPasswordImage = () => {
    return (
        <div className={styles.illustrationContainer}>
            <img src={"/Images/ForgotPassword.png"} className={styles1.ForgotPasswordImage}/>
        </div>
    );
};

export default ForgotPasswordImage;