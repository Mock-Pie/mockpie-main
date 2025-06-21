"use client";
import React, { useState, useCallback } from 'react';
import Link from "next/link";
import { FaExclamationCircle, FaExclamationTriangle } from "react-icons/fa";
import styles from "../../Login/page.module.css";

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = useCallback((email: string) => {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Enter a valid email address.";
    }
    return "";
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear errors when user starts typing
    if (emailError) {
      setEmailError("");
    }
    if (apiError) {
      setApiError("");
    }
  }, [emailError, apiError]);

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

  const handleRequestOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    
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
        window.location.href = `/OTPVerifcation?email=${encodeURIComponent(email.trim())}`;
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
  }, [email, validateEmail]);

  return (
    <div className={styles['form-card']}>
      <div className={styles.header}>
        <div className={styles.logo}>M</div>
        <h1 className={styles['welcome-text']}>Forgot Password?</h1>
        <p className={styles.subtitle}>Enter your email to reset your password</p>
      </div>

      <form onSubmit={handleRequestOtp} noValidate>
        <div className={styles['form-group']}>
          <label htmlFor="email">Email</label>
          <div className={styles['input-container']}>
            <input
              type="email"
              id="email"
              name="email"
              className={styles['form-input']}
              placeholder="Enter your email address"
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

        {apiError && (
          <div className={styles['error-message']} style={{ marginBottom: '16px' }}>
            <FaExclamationTriangle />
            <span>{apiError}</span>
          </div>
        )}

        <button 
          type="submit" 
          className={styles['submit-btn']} 
          disabled={loading}
        >
          {loading ? (
            <>
              <div className={styles.loading}></div>
              Sending OTP...
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>

        <div className={styles['footer-links']} style={{ marginTop: '24px' }}>
          Remember your password? <Link href="/Login">Sign in</Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;