"use client";
import React from "react";
import styles from "../Login/page.module.css";
import ForgotPasswordForm from "./components/ForgotPasswordForm";

const ForgotPassword = () => {
  return (
    <div className={styles.container}>
      <ForgotPasswordForm />
    </div>
  );
};

export default ForgotPassword;