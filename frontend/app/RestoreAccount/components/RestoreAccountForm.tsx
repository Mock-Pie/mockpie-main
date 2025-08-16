"use client";
import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaExclamationCircle, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import styles from "../../Login/page.module.css";
import Image from "next/image";
import UserService from "../../services/userService";

const RestoreAccountForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return "Email is required";
    }
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address";
    }
    return "";
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setEmail(value);
    
    // Clear errors when user starts typing
    if (error) {
      setError("");
    }
  }, [error]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    
    setLoading(true);
    
    try {
      // Send OTP for account restoration
      const formData = new FormData();
      formData.append('email', email.trim());
      
      const response = await fetch("http://localhost:8081/auth/restore-account-otp", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        // Redirect to OTP verification page
        router.push(`/RestoreAccountOTP?email=${encodeURIComponent(email.trim())}`);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to send verification code. Please try again.");
      }
    } catch (err) {
      console.error("Error sending restore OTP:", err);
      setError("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, validateEmail, router]);

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
          <h1 className={styles['welcome-text']}>Restore Account</h1>
          <p className={styles.subtitle}>Recover your deleted account within 30 days</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles['form-group']}>
            <label htmlFor="email">Email Address</label>
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
            {error && (
              <div className={styles['error-message']}>
                <FaExclamationCircle />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className={styles['info-box']}>
            <div className={styles['info-icon']}>
              <FaExclamationTriangle />
            </div>
            <div className={styles['info-content']}>
              <h4>Important Information</h4>
              <ul>
                <li>You can only restore accounts deleted within the last 30 days</li>
                <li>All your presentations and analyses will be restored</li>
                <li>Your email will be automatically verified after restoration</li>
                <li>You can log in directly with your original password</li>
                <li>This action cannot be undone once the 30-day period expires</li>
              </ul>
            </div>
          </div>

          <button 
            type="submit" 
            className={styles['submit-btn']} 
            disabled={loading}
          >
            {loading ? (
              <>
                <div className={styles.loading}></div>
                Sending Code...
              </>
            ) : (
              'Send Verification Code'
            )}
          </button>

          <div className={styles['footer-links']}>
            <Link href="/Login" className={styles['back-link']}>
              <FiArrowLeft />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestoreAccountForm; 