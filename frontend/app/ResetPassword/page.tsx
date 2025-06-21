"use client";
import React from "react";
import styles from "../Login/page.module.css";
import ResetPasswordForm from "./components/ResetPasswordForm";

const ResetPassword = () => {
  return (
    <div className={styles.container}>
      <ResetPasswordForm />
    </div>
  );
};

export default ResetPassword;
