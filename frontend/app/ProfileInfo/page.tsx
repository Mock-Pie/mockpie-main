'use client';

import React from "react";
import styles from "./page.module.css";
import Header from "./components/Header";
import ProfileForm from "./components/ProfileForm";
import ProtectedRoute from "../components/auth/ProtectedRoute";

const ProfileInfo = () => {
    return (
        <ProtectedRoute>
            <div className={styles.container}>
                <Header />
                <ProfileForm />
            </div>
        </ProtectedRoute>
    );
};

export default ProfileInfo;