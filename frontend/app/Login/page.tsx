import React from "react";
import styles from "./page.module.css";
import SideBar from "./components/SideBar";
import Header from "./components/Header";
import LoginForm from "./components/LoginForm";
import LoginImage from "./components/LogInImage";


const LoginPage = () => {
    return (
        <div className={styles.container}>
        <SideBar />  
        <Header />
        <LoginForm />
        <LoginImage />
        </div>
    );
};

export default LoginPage;