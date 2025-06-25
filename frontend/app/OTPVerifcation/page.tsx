"use client";
import React from "react";
import styles from "../Login/page.module.css";
import EmailVerificationForm from "./components/EmailVerificationForm";

const OTPVerification = () => {
  return (
    <div className={styles.container}>
      <EmailVerificationForm />
    </div>
  );
};

export default OTPVerification;
