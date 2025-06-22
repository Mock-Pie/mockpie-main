"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { FaExclamationCircle, FaExclamationTriangle } from "react-icons/fa";
import { signIn } from "next-auth/react";
import styles from "../page.module.css";

const LoginForm = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        identifier: "",
        password: "",
    });
    const [formErrors, setFormErrors] = useState({
        identifier: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const validateField = useCallback((name: string, value: string) => {
        switch (name) {
            case "identifier":
                if (!value.trim()) return "Email or username is required.";
                // Allow both email format and username format (letters, numbers, underscores, 3+ chars)
                const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
                const isUsername = /^[a-zA-Z0-9_]{3,}$/.test(value.trim());
                if (!isEmail && !isUsername) {
                    return "Enter a valid email address or username (3+ characters, letters, numbers, underscores only).";
                }
                return "";
            case "password":
                if (!value.trim()) return "Password is required.";
                if (value.length < 6) return "Password must be at least 6 characters.";
                return "";
            default:
                return "";
        }
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        
        // Clear error when user starts typing
        if (formErrors[name as keyof typeof formErrors]) {
            setFormErrors((prev) => ({ ...prev, [name]: "" }));
        }
        
        // Clear API error when user modifies form
        if (apiError) {
            setApiError("");
        }
    }, [formErrors, apiError]);

    const validateForm = useCallback(() => {
        const newErrors = {
            identifier: validateField("identifier", formData.identifier),
            password: validateField("password", formData.password),
        };
        
        setFormErrors(newErrors);
        return !newErrors.identifier && !newErrors.password;
    }, [formData, validateField]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError("");
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("email", formData.identifier.trim());
            formDataToSend.append("password", formData.password);

            const response = await fetch("http://localhost:8081/auth/login", {
                method: "POST",
                body: formDataToSend,
            });
            
            if (response.ok) {
                const responseData = await response.json();
                
                // Store tokens securely
                if (responseData.access_token) {
                    localStorage.setItem("access_token", responseData.access_token);
                }
                if (responseData.refresh_token) {
                    localStorage.setItem("refresh_token", responseData.refresh_token);
                }
                
                // Redirect to dashboard
                router.push("/Dashboard");
            } else {
                const errorData = await response.json();
                setApiError(errorData.detail || errorData.message || "Login failed. Please check your credentials.");
            }
        } catch (error) {
            console.error("Login error:", error);
            setApiError("Network error. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm, router]);

    const handleGoogleSignIn = useCallback(async () => {
        setGoogleLoading(true);
        setApiError("");
        
        try {
            const result = await signIn("google", {
                callbackUrl: "/Dashboard",
                redirect: false,
            });
            
            if (result?.error) {
                setApiError("Google sign-in failed. Please try again.");
            } else if (result?.url) {
                router.push(result.url);
            }
        } catch (error) {
            console.error("Google sign-in error:", error);
            setApiError("Google sign-in failed. Please try again.");
        } finally {
            setGoogleLoading(false);
        }
    }, [router]);

    const handlePasswordToggle = useCallback(() => {
        setShowPassword((prev) => !prev);
    }, []);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        const container = e.target.closest(`.${styles['input-container']}`) as HTMLElement & { style: CSSStyleDeclaration };
        if (container) {
            container.style.transform = 'scale(1.02)';
        }
    }, [styles]);
    
    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        const container = e.target.closest(`.${styles['input-container']}`) as HTMLElement & { style: CSSStyleDeclaration };
        if (container) {
            container.style.transform = 'scale(1)';
        }
    }, [styles]);

    return (
        <div className={styles.container}>
            <div className={styles['form-card']}>
                <div className={styles.header}>
                    <div className={styles.logo}>M</div>
                    <h1 className={styles['welcome-text']}>Welcome to MockPie!</h1>
                    <p className={styles.subtitle}>Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className={styles['form-group']}>
                        <label htmlFor="identifier">Email or Username</label>
                        <div className={styles['input-container']}>
                            <input
                                type="text"
                                id="identifier"
                                name="identifier"
                                className={styles['form-input']}
                                placeholder="Enter your email or username"
                                value={formData.identifier}
                                onChange={handleInputChange}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                required
                                disabled={loading || googleLoading}
                                autoComplete="email"
                            />
                        </div>
                        {formErrors.identifier && (
                            <div className={styles['error-message']}>
                                <FaExclamationCircle />
                                <span>{formErrors.identifier}</span>
                            </div>
                        )}
                    </div>

                    <div className={styles['form-group']}>
                        <label htmlFor="password">Password</label>
                        <div className={styles['input-container']}>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                className={styles['form-input']}
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleInputChange}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                required
                                disabled={loading || googleLoading}
                                autoComplete="current-password"
                            />
                            <button 
                                type="button" 
                                className={styles['password-toggle']} 
                                onClick={handlePasswordToggle}
                                disabled={loading || googleLoading}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                        {formErrors.password && (
                            <div className={styles['error-message']}>
                                <FaExclamationCircle />
                                <span>{formErrors.password}</span>
                            </div>
                        )}
                    </div>

                    {apiError && (
                        <div className={styles['error-message']} style={{ marginBottom: '16px' }}>
                            <FaExclamationTriangle />
                            <span>{apiError}</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className={styles['submit-btn']} 
                        disabled={loading || googleLoading}
                    >
                        {loading ? (
                            <>
                                <div className={styles.loading}></div>
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>

                    <div className={styles['forgot-password']}>
                        <Link href="/ForgotPassword">Forgot your password?</Link>
                    </div>

                    <div className={styles.divider}>
                        <span>or</span>
                    </div>

                    <button 
                        type="button" 
                        className={styles['google-btn']} 
                        onClick={handleGoogleSignIn}
                        disabled={loading || googleLoading}
                    >
                        {googleLoading ? (
                            <>
                                <div className={styles.loading}></div>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <FcGoogle />
                                Sign in with Google
                            </>
                        )}
                    </button>

                    <div className={styles['footer-links']}>
                        Don't have an account? <Link href="/SignUp">Sign up</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginForm;