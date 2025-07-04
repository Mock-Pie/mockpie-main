import React from 'react';
import styles from "../Login/page.module.css";
import SignUpForm from "./components/SignUpForm";

const SignUpPage = () => {
    return (
        <div className={styles.container}>
            <SignUpForm />
        </div>
    );
}

export default SignUpPage;