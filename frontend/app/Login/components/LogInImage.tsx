import React from 'react';
import styles from "../page.module.css";


const LoginImage = () => {
    return (
        <div className={styles.illustrationContainer}>
            <img src="/Images/SignIn.png" 
                className={styles.SignInImage}/>
        </div>
    );
};

export default LoginImage;