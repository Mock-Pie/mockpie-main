"use client";
import React from "react";
import Link from "next/link";
import styles from "../page.module.css";
import styles1 from "../../SignUp/page.module.css";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";

const LoginForm = () => {
    return (
        <div className={styles.mainContent}>
            <p className={styles.subtitle}>Welcome to MockPie!</p>
            <div className={styles.loginBox}>
                <div className={styles.inputGroup}>
                    <label>Email or Phone number</label>
                    <input type="text" className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                    <label>Password</label>
                    <input type="password" className={styles.input} />
                </div>
                <Link href="/Dashboard">
                    <button className={styles.signInButton}>Sign in</button>
                </Link>
                <div className={styles.footerText}>
                    <div className={styles1.footerText}>
                        <p>
                            Don't have an account?{" "}
                            <Link href="/SignUp" className={styles1.link}>
                                Sign up
                            </Link>
                        </p>
                    </div>
                    <div className={styles1.or}>
                        <Link href="/ForgotPassword">
                            Forgot password?
                        </Link>
                    </div>
                    <div
                        className={styles.link}
                        onClick={() => signIn("google")} // Trigger Google OAuth
                    >
                        <div className={styles1.iconGoogle}>
                            <FcGoogle />
                        </div>
                        Sign in with Google
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;