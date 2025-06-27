"use client";
import React from "react";
import styles from "../Login/page.module.css";
import RestoreAccountOTPForm from "./components/RestoreAccountOTPForm";

const RestoreAccountOTP = () => {
  return (
    <div className={styles.container}>
      <RestoreAccountOTPForm />
    </div>
  );
};

export default RestoreAccountOTP; 