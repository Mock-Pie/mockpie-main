"use client";
import React, { useState, useCallback } from 'react';
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaExclamationCircle, FaExclamationTriangle, FaCheck, FaTimes } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "../../Login/page.module.css";
import styles1 from "../page.module.css";

const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const emailFromParams = (searchParams && searchParams.get("email")) || "";
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  // Password validation criteria
  const [validationCriteria, setValidationCriteria] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });

  const validatePassword = useCallback((password: string) => {
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>+]/.test(password)
    };
    setValidationCriteria(criteria);
    return Object.values(criteria).every(Boolean);
  }, []);

  const validateConfirmPassword = useCallback((confirmPassword: string) => {
    if (!confirmPassword.trim()) return "Please confirm your password.";
    if (confirmPassword !== password) {
      return "Passwords do not match.";
    }
    return "";
  }, [password]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setShowValidation(true);
    validatePassword(value);
    
    // Clear errors when user starts typing
    if (passwordError) {
      setPasswordError("");
    }
    if (apiError) {
      setApiError("");
    }
  }, [passwordError, apiError, validatePassword]);

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    // Clear errors when user starts typing
    if (confirmPasswordError) {
      setConfirmPasswordError("");
    }
    if (apiError) {
      setApiError("");
    }
  }, [confirmPasswordError, apiError]);

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

  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    
    // Validate password
    const isPasswordValid = validatePassword(password);
    if (!isPasswordValid) {
      setPasswordError("Please ensure your password meets all requirements.");
      return;
    }
    
    // Validate confirm password
    const confirmPasswordValidation = validateConfirmPassword(confirmPassword);
    if (confirmPasswordValidation) {
      setConfirmPasswordError(confirmPasswordValidation);
      return;
    }
    
    setLoading(true);
    
    try {
      const data = new FormData();
      data.append("email", emailFromParams);
      data.append("password", password);
      data.append("password_confirmation", confirmPassword);
      
      const response = await fetch("http://localhost:8081/auth/reset-password", {
        method: "POST",
        body: data,
      });
      
      if (response.ok) {
        // Redirect to login page with success message
        window.location.href = "/Login?message=Password reset successfully! Please login with your new password.";
      } else {
        const errorData = await response.json();
        setApiError(errorData.detail || errorData.message || "Failed to reset password. Please try again.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, emailFromParams, validatePassword, validateConfirmPassword]);

  return (
    <div className={styles['form-card']}>
      <div className={styles.header}>
        <div className={styles.logo}>M</div>
        <h1 className={styles['welcome-text']}>Reset Password</h1>
        <p className={styles.subtitle}>Enter your new password to reset your account</p>
      </div>

      <form onSubmit={handleResetPassword} noValidate>
        <div className={styles['form-group']}>
          <label htmlFor="password">New Password</label>
          <div className={styles['input-container']}>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              className={styles['form-input']}
              placeholder="Enter your new password"
              value={password}
              onChange={handlePasswordChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
              disabled={loading}
              autoComplete="new-password"
            />
            <button 
              type="button" 
              className={styles['password-toggle']} 
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {passwordError && (
            <div className={styles['error-message']}>
              <FaExclamationCircle />
              <span>{passwordError}</span>
            </div>
          )}
        </div>

        {/* Password Validation Checklist */}
        {showValidation && (
          <div className={styles1['validation-checklist']}>
            <div className={styles1['validation-item']}>
              {validationCriteria.length ? <FaCheck className={styles1['check-icon']} /> : <FaTimes className={styles1['times-icon']} />}
              <span>At least 8 characters</span>
            </div>
            <div className={styles1['validation-item']}>
              {validationCriteria.uppercase ? <FaCheck className={styles1['check-icon']} /> : <FaTimes className={styles1['times-icon']} />}
              <span>One uppercase letter</span>
            </div>
            <div className={styles1['validation-item']}>
              {validationCriteria.number ? <FaCheck className={styles1['check-icon']} /> : <FaTimes className={styles1['times-icon']} />}
              <span>One number</span>
            </div>
            <div className={styles1['validation-item']}>
              {validationCriteria.special ? <FaCheck className={styles1['check-icon']} /> : <FaTimes className={styles1['times-icon']} />}
              <span>One special character</span>
            </div>
          </div>
        )}

        <div className={styles['form-group']}>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className={styles['input-container']}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              className={styles['form-input']}
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
              disabled={loading}
              autoComplete="new-password"
            />
            <button 
              type="button" 
              className={styles['password-toggle']} 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {confirmPasswordError && (
            <div className={styles['error-message']}>
              <FaExclamationCircle />
              <span>{confirmPasswordError}</span>
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
              Resetting Password...
            </>
          ) : (
            'Reset Password'
          )}
        </button>

        <div className={styles['footer-links']} style={{ marginTop: '24px' }}>
          Remember your password? <Link href="/Login">Sign in</Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordForm; 