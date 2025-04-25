import React from "react";
import styles from "../Login/page.module.css";
import Header from "./components/Header";
import ForgotPasswordForm from "./components/ForgotPasswordForm";
import ForgotPasswordImage from "./components/ForgotPasswordImage";
import SideBar from "../Login/components/SideBar";


const ForgotPassword= () => {
    return (
        <div className={styles.container}>
        <SideBar />  
        <Header />
        <ForgotPasswordForm />
       <ForgotPasswordImage />
        </div>
    );
};

export default ForgotPassword;