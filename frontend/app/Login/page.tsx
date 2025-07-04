import React from "react";
import styles from "./page.module.css";
import LoginForm from "./components/LoginForm";


const LoginPage = () => {
    return (
        <div className={styles.container}>
        <LoginForm />
        </div>
    );
};

export default LoginPage;
