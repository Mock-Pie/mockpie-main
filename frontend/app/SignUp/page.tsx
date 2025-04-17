import React from 'react';
import styles from "../Login/page.module.css";
import SideBar from "../Login/components/SideBar";
import Header from "./components/Header";
import SignUpForm from "./components/SignUpForm";
import SignUpImage from './components/SignUpImage';

const SignUpPage = () => {
    return (
        <div className={styles.container}>
        <SideBar />  
        <Header />
        <SignUpForm />
        <SignUpImage />
        </div>
    );
}

export default SignUpPage;