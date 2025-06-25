"use client";
import React from "react";
import styles from "../Login/page.module.css";
import PasswordResetOTPForm from "./components/PasswordResetOTPForm";

const PasswordResetOTP = () => {
  return (
    <div className={styles.container}>
      <PasswordResetOTPForm />
    </div>
  );
};

export default PasswordResetOTP; 