"use client";
import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { FaExclamationCircle, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import { signIn } from "next-auth/react";
import styles from "../page.module.css";
import Image from "next/image";

const LoginForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        identifier: "",
        password: "",
    });
    const [formErrors, setFormErrors] = useState({
        identifier: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Check for success message from URL parameters
    useEffect(() => {
        const message = searchParams?.get("message");
        if (message) {
            setSuccessMessage(message);
            // Clear the message from URL without reloading the page
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("message");
            window.history.replaceState({}, "", newUrl.toString());
        }
    }, [searchParams]);

    const validateField = useCallback((name: string, value: string) => {
        switch (name) {
            case "identifier":
                if (!value.trim()) return "Email is required.";
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Invalid email address.";
                return "";
            case "password":
                if (!value.trim()) return "Password is required.";
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

        // Clear success message when user starts typing
        if (successMessage) {
            setSuccessMessage("");
        }
    }, [formErrors, apiError, successMessage]);

    const validateForm = useCallback(() => {
        const newErrors = {
            identifier: validateField("identifier", formData.identifier),
            password: validateField("password", formData.password),
        };
        
        setFormErrors(newErrors);
        return Object.values(newErrors).every((error) => !error);
    }, [formData, validateField]);

    const sendVerificationOTP = async (email: string) => {
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('email', email);

            const response = await fetch("http://localhost:8081/auth/send-verification-otp", {
                method: "POST",
                body: formDataToSend,
            });

            if (response.ok) {
                console.log('Verification OTP sent successfully');
                return true;
            } else {
                let errorMessage = "Failed to send verification code. Please try again or contact support.";
                try {
                    const errorData = await response.json();
                    if (typeof errorData.detail === 'string') {
                        if (errorData.detail.toLowerCase().includes('not exist') || 
                            errorData.detail.toLowerCase().includes('not found') ||
                            errorData.detail.toLowerCase().includes('deleted')) {
                            errorMessage = "Account not found or has been deleted. Please check your email or restore your account.";
                        } else {
                            errorMessage = errorData.detail;
                        }
                    }
                    console.error('Failed to send verification OTP:', errorData);
                } catch (parseError) {
                    // If response is not JSON or empty, use default error message
                    console.error('Failed to send verification OTP: (no JSON body or parsing failed)');
                }
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error('Error sending verification OTP:', error);
            return false;
        }
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError("");
        setSuccessMessage("");
        
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
                console.log("Login error response:", errorData);
                
                // Check if user is specifically not verified (email verification required)
                const isEmailNotVerified = errorData.detail && typeof errorData.detail === 'string' && 
                    (errorData.detail.toLowerCase().includes('email not verified') ||
                     errorData.detail.toLowerCase().includes('account not verified') ||
                     errorData.detail.toLowerCase().includes('not verified'));
                
                if (isEmailNotVerified) {
                    // Send verification OTP only for email verification issues
                    const otpSent = await sendVerificationOTP(formData.identifier.trim());
                    
                    if (otpSent === true) {
                        // Redirect to OTP verification page
                        router.push(`/OTPVerifcation?email=${encodeURIComponent(formData.identifier.trim())}&from=login`);
                    } else if (typeof otpSent === 'object' && otpSent.error) {
                        // Display the specific error message from sendVerificationOTP
                        setApiError(otpSent.error);
                    } else {
                        setApiError("Account not verified. Failed to send verification code. Please try again or contact support.");
                    }
                } else {
                    // Handle other error response formats
                    let errorMessage = "Login failed. Please check your credentials.";
                    
                    if (typeof errorData.detail === 'string') {
                        errorMessage = errorData.detail;
                    } else if (Array.isArray(errorData.detail)) {
                        // Handle validation errors from FastAPI/Pydantic
                        errorMessage = errorData.detail.map((err: any) => err.msg || err.message).join(', ');
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                    
                    setApiError(errorMessage);
                }
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
        setSuccessMessage("");
        
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
                    <Image src="/Images/Logoo.png" alt="MockPie Logo" width={60} height={60} className={styles.logo} priority />
                    <h1 className={styles['welcome-text']}>Welcome to MockPie!</h1>
                    <p className={styles.subtitle}>Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className={styles['form-group']}>
                        <label htmlFor="identifier">Email</label>
                        <div className={styles['input-container']}>
                            <input
                                type="text"
                                id="identifier"
                                name="identifier"
                                className={styles['form-input']}
                                placeholder="Enter your email"
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

                    {successMessage && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            padding: '12px 16px',
                            background: 'rgba(72, 187, 120, 0.1)',
                            border: '1px solid rgba(72, 187, 120, 0.3)',
                            borderRadius: '8px',
                            color: '#2f855a',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginBottom: '16px'
                        }}>
                            <FaCheckCircle />
                            <span>{successMessage}</span>
                        </div>
                    )}

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
                        <span className={styles['link-separator']}>•</span>
                        <Link href="/RestoreAccount">Restore deleted account</Link>
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