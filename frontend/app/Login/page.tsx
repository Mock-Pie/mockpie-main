'use client';

import React from "react";
import styles from "./page.module.css";
import LoginForm from "./components/LoginForm";
import PublicRoute from "../components/auth/PublicRoute";

const LoginPage = () => {
    return (
        <PublicRoute>
            <div className={styles.container}>
                <LoginForm />
            </div>
        </PublicRoute>
    );
};

export default LoginPage;
