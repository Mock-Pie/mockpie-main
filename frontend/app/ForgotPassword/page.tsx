"use client";
import React from "react";
import styles from "./page.module.css";
import Header from "./components/Header";
import ForgotPasswordImage from "./components/ForgotPasswordImage";
import ForgotPasswordForm from "./components/ForgotPasswordForm";
import SideBar from "../Login/components/SideBar";
import styles1 from "../Login/page.module.css";

const ForgotPassword = () => {
  return (
    <div className={styles1.container}>
      <Header />
      {/* <SideBar /> */}
      <div className={styles.formWrapper}>
        <div className={styles.formBox}>
          <ForgotPasswordForm />
        </div>
      </div>
      <ForgotPasswordImage />
    </div>
  );
};

export default ForgotPassword;