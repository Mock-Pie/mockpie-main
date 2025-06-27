"use client";
import React from "react";
import styles from "../Login/page.module.css";
import ChangePasswordForm from "./components/ChangePasswordForm";

const ChangePassword = () => {
  return (
    <div className={styles.container}>
      <ChangePasswordForm />
    </div>
  );
};

export default ChangePassword; 