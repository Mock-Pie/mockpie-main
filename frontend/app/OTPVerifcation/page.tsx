"use client";
import React from "react";
import styles from "../Login/page.module.css";
import OTPForm from "./components/OtpForm";

const OTPVerification = () => {
  return (
    <div className={styles.container}>
      <OTPForm />
    </div>
  );
};

export default OTPVerification;
