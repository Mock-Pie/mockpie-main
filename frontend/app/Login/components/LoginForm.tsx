"use client";
import React, { useState } from "react";
import Link from "next/link";
import styles from "../page.module.css";
import styles1 from "../../SignUp/page.module.css";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";

const LoginForm = () => {
    const [formData, setFormData] = useState({
        identifier: "",
        password: "",
    });
    const [formErrors, setFormErrors] = useState({
        identifier: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const validateField = (name: string, value: string) => {
        switch (name) {
            case "identifier":
                if (!value) return "Email or phone number is required.";
                if (/^\+20(10|11|12|15)\d{8}$/.test(value)) return ""; // valid Egyptian phone
                if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return ""; // valid email
                return "Enter a valid email or Egyptian phone number.";
            case "password":
                if (!value) return "Password is required.";
                if (value.length < 8) return "Password must be at least 8 characters.";
                if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter.";
                if (!/\d/.test(value)) return "Password must contain at least one number.";
                if (!/[!@#$%^&*(),.?\":{}|<>\[\]\\/~`_+=;'\-]/.test(value)) return "Password must contain at least one special character.";
                return "";
            default:
                return "";
        }
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setFormErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    };
    const validateForm = () => {
        const errors: any = {};
        Object.keys(formData).forEach((key) => {
            errors[key] = validateField(key, (formData as any)[key]);
        });
        setFormErrors(errors);
        return Object.values(errors).every((err) => !err);
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError("");
        if (!validateForm()) return;
        setLoading(true);
        // Prepare FormData for backend
        const data = new FormData();
        if (/^\+20(10|11|12|15)\d{8}$/.test(formData.identifier)) {
            data.append("phone", formData.identifier);
        } else {
            data.append("email", formData.identifier);
        }
        data.append("password", formData.password);
        try {
            const response = await fetch("http://localhost:8081/auth/login", {
                method: "POST",
                body: data,
            });
            if (response.ok) {
                window.location.href = "/Dashboard";
            } else {
                const errorData = await response.json();
                setApiError(errorData.detail || errorData.message || "Login failed.");
            }
        } catch (error) {
            setApiError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className={styles.mainContent}>
            <p className={styles.subtitle}>Welcome to MockPie!</p>
            <form className={styles.loginBox} onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                    <label>Email or Phone number</label>
                    <input
                        type="text"
                        name="identifier"
                        value={formData.identifier}
                        onChange={handleChange}
                        className={styles.input}
                    />
                    {formErrors.identifier && <div style={{ color: 'red', fontSize: '0.9em' }}>{formErrors.identifier}</div>}
                </div>
                <div className={styles.inputGroup}>
                    <label>Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={styles.input}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            style={{
                                position: 'absolute',
                                right: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1em',
                                color: '#888'
                            }}
                            tabIndex={-1}
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                    {formErrors.password && <div style={{ color: 'red', fontSize: '0.9em' }}>{formErrors.password}</div>}
                </div>
                {apiError && <div style={{ color: 'red', marginBottom: 8 }}>{apiError}</div>}
                <button type="submit" className={styles.signInButton} disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                </button>
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
            </form>
        </div>
    );
};

export default LoginForm;