"use client";
import React, { useState } from "react";
import styles from "../Login/page.module.css";
import Header from "./components/Header";
import ForgotPasswordForm from "./components/ForgotPasswordForm";
import ForgotPasswordImage from "./components/ForgotPasswordImage";
import SideBar from "../Login/components/SideBar";

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    return (
        <div className={styles.container}>
            <SideBar />
            <Header />
            <ForgotPasswordForm step={step} setStep={setStep} />
            <ForgotPasswordImage step={step} />
        </div>
    );
};

export default ForgotPassword;