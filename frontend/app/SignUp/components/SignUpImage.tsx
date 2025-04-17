import React from 'react';
import styles from "../../Login/page.module.css";
import styles1 from "../page.module.css";

const SignUpImage = () => {
    return (
        <div className={styles.illustrationContainer}>
       <img src="/Images/SignUp.png" 
            className={styles1.SignUpImage}/>
      </div>
    );
};

export default SignUpImage;