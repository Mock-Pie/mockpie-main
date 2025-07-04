"use client";
import React, { useState, useCallback } from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaExclamationCircle, FaExclamationTriangle } from "react-icons/fa";
import styles from "../../Login/page.module.css";
import Image from "next/image";

const ForgotPasswordForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validateEmail = useCallback((email: string) => {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Enter a valid email address.";
    }
    return "";
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'email') {
      setEmail(value);
      if (emailError) setEmailError("");
    }
    
    if (apiError) setApiError("");
    if (successMessage) setSuccessMessage("");
  }, [emailError, apiError, successMessage]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const container = e.target.closest(`.${styles['input-container']}`) as HTMLElement & { style: CSSStyleDeclaration };
    if (container) {
      container.style.transform = 'scale(1.02)';
    }
  }, []);
  
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const container = e.target.closest(`.${styles['input-container']}`) as HTMLElement & { style: CSSStyleDeclaration };
    if (container) {
      container.style.transform = 'scale(1)';
    }
  }, []);

  const handleSendOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");
    
    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }
    
    setLoading(true);
    
    try {
      const data = new FormData();
      data.append("email", email.trim());
      
      const response = await fetch("http://localhost:8081/auth/forgot-password", {
        method: "POST",
        body: data,
      });
      
      if (response.ok) {
        // Redirect to password reset OTP verification page
        router.push(`/PasswordResetOTP?email=${encodeURIComponent(email.trim())}`);
      } else {
        const errorData = await response.json();
        setApiError(errorData.detail || errorData.message || "User not found. Please check your email address.");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [email, validateEmail, router]);

  return (
    <div className={styles['form-card']}>
      <div className={styles.header}>
        <Image src="/Images/Logoo.png" alt="MockPie Logo" width={60} height={60} className={styles.logo} priority />
        <h1 className={styles['welcome-text']}>Forgot Password?</h1>
        <p className={styles.subtitle}>Enter your email to reset your password</p>
      </div>

      {apiError && (
        <div className={styles['error-message']} style={{ marginBottom: '16px' }}>
          <FaExclamationTriangle />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSendOtp} noValidate>
        <div className={styles['form-group']}>
          <label htmlFor="email">Email</label>
          <div className={styles['input-container']}>
            <input
              type="email"
              id="email"
              name="email"
              className={styles['form-input']}
              placeholder="Enter your email"
              value={email}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
          {emailError && (
            <div className={styles['error-message']}>
              <FaExclamationCircle />
              <span>{emailError}</span>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className={styles['submit-btn']} 
          disabled={loading}
        >
          {loading ? (
            <>
              <div className={styles.loading}></div>
              Sending...
            </>
          ) : (
            'Send Verification Code'
          )}
        </button>
      </form>

      <div className={styles['footer-links']} style={{ marginTop: '24px' }}>
        Remember your password? <Link href="/Login">Sign in</Link>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;