import React from 'react';
import styles from "../../Login/page.module.css";
import styles1 from "../../SignUp/page.module.css";
import Link from 'next/link';

const ForgotPasswordForm = () => {

    return (
      <div className={styles.mainContent}>
        <p className={styles.subtitle}>Welcome to MockPie!</p>
        <div className={styles.loginBox}>
          <div className={styles.inputGroup}>
            <label >Email or Phone number</label>
            <input type="text" className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label>New pssword</label>
            <input type="password" className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label>Re-Enter password</label>
            <input type="password" className={styles.input} />
          </div>
          <Link href="/Login">
            <button className={styles.signInButton}>Save</button>
          </Link>
          <div className={styles.footerText}>
            <p>
                Don't have an account?{' '}
                <Link href="/SignUp" className={styles1.link}>
                    Sign up
                </Link>
            </p>
          </div>
        </div>
      </div>
    );
};

export default ForgotPasswordForm;