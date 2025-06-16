import React from 'react';
import styles from "../../Login/page.module.css";
import styles1 from "../page.module.css";

const ForgotPasswordImage = ({ step }: { step: number }) => {
    let imgSrc = "/Images/ForgotPassword.png";
    if (step === 2) imgSrc = "/Images/OTP.png";
    if (step === 3) imgSrc = "/Images/Reset Password.png";
    return (
        <div className={styles.illustrationContainer}>
            <img src={imgSrc} className={styles1.ForgotPasswordImage}/>
        </div>
    );
};

export default ForgotPasswordImage;