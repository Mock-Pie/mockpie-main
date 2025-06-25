"use client";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from "next/link";
import { FaExclamationCircle, FaExclamationTriangle, FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "../../Login/page.module.css";

type Step = 'email' | 'otp' | 'password';

const ForgotPasswordForm = () => {
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const validateEmail = useCallback((email: string) => {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Enter a valid email address.";
    }
    return "";
  }, []);

  const validatePassword = useCallback((password: string) => {
    const errors = [];
    if (password.length < 8) errors.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
    if (!/\d/.test(password)) errors.push("one number");
    if (!/[!@#$%^&*(),.?":{}|<>+]/.test(password)) errors.push("one special character");
    
    return errors.length === 0 ? "" : `Password must contain ${errors.join(", ")}.`;
  }, []);

  const validateConfirmPassword = useCallback((confirmPassword: string) => {
    if (!confirmPassword.trim()) return "Please confirm your password.";
    if (confirmPassword !== password) return "Passwords do not match.";
    return "";
  }, [password]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'email') {
      setEmail(value);
      if (emailError) setEmailError("");
    } else if (name === 'password') {
      setPassword(value);
      if (passwordError) setPasswordError("");
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
      if (confirmPasswordError) setConfirmPasswordError("");
    }
    
    if (apiError) setApiError("");
  }, [emailError, passwordError, confirmPasswordError, apiError]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    if (apiError) setApiError("");
  }, [otp, apiError]);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

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

  // Step 1: Send forgot password request
  const handleSendOtp = useCallback(async (e: React.FormEvent) => {
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
        setCurrentStep('otp');
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

  // Step 2: Verify OTP
  const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setApiError("Please enter the complete 6-digit OTP");
      return;
    }
    
    setLoading(true);
    
    try {
      const data = new FormData();
      data.append("email", email);
      data.append("otp", otpValue);
      
      const response = await fetch("http://localhost:8081/auth/verify-otp", {
        method: "POST",
        body: data,
      });
      
      if (response.ok) {
        setCurrentStep('password');
      } else {
        const errorData = await response.json();
        setApiError(errorData.detail || errorData.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [otp, email]);

  // Step 3: Reset password
  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    
    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }
    
    const confirmPasswordValidation = validateConfirmPassword(confirmPassword);
    if (confirmPasswordValidation) {
      setConfirmPasswordError(confirmPasswordValidation);
      return;
    }
    
    setLoading(true);
    
    try {
      const data = new FormData();
      data.append("email", email);
      data.append("new_password", password);
      data.append("confirm_password", confirmPassword);
      
      const response = await fetch("http://localhost:8081/auth/reset-password", {
        method: "POST",
        body: data,
      });
      
      if (response.ok) {
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
  }, [password, confirmPassword, email, validatePassword, validateConfirmPassword]);

  // Resend OTP
  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0) return;
    
    setApiError("");
    setResendCooldown(30);
    
    try {
      const data = new FormData();
      data.append("email", email);
      
      const response = await fetch("http://localhost:8081/auth/forgot-password", {
        method: "POST",
        body: data,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setApiError(errorData.detail || "Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      setApiError("Failed to resend OTP. Please try again.");
    }
    
    // Countdown timer
    let seconds = 30;
    const interval = setInterval(() => {
      seconds -= 1;
      setResendCooldown(seconds);
      if (seconds <= 0) clearInterval(interval);
    }, 1000);
  }, [email, resendCooldown]);

  const getStepContent = () => {
    switch (currentStep) {
      case 'email':
        return {
          title: "Forgot Password?",
          subtitle: "Enter your email to reset your password",
          form: (
            <form onSubmit={handleSendOtp} noValidate>
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
                  'Send Reset Code'
                )}
              </button>
            </form>
          )
        };

      case 'otp':
        return {
          title: "Enter Verification Code",
          subtitle: `We sent a six digit code to ${email}`,
          form: (
            <form onSubmit={handleVerifyOtp} noValidate>
              <div className={styles['form-group']}>
                <label>Enter 6-digit code</label>
                <div className={styles['otp-container']} style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      className={styles['otp-input']}
                      style={{
                        width: '40px',
                        height: '48px',
                        textAlign: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        border: '2px solid #e1e5e9',
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa'
                      }}
                      disabled={loading}
                      autoComplete="one-time-code"
                    />
                  ))}
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
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#999' : '#007bff',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )
        };

      case 'password':
        return {
          title: "Reset Your Password",
          subtitle: "Enter your new password",
          form: (
            <form onSubmit={handleResetPassword} noValidate>
              <div className={styles['form-group']}>
                <label htmlFor="password">New Password</label>
                <div className={styles['input-container']} style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className={styles['form-input']}
                    placeholder="Enter new password"
                    value={password}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {passwordError && (
                  <div className={styles['error-message']}>
                    <FaExclamationCircle />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className={styles['input-container']} style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    className={styles['form-input']}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <div className={styles['error-message']}>
                    <FaExclamationCircle />
                    <span>{confirmPasswordError}</span>
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
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )
        };

      default:
        return { title: "", subtitle: "", form: null };
    }
  };

  const stepContent = getStepContent();

  return (
    <div className={styles['form-card']}>
      <div className={styles.header}>
        <div className={styles.logo}>M</div>
        <h1 className={styles['welcome-text']}>{stepContent.title}</h1>
        <p className={styles.subtitle}>{stepContent.subtitle}</p>
      </div>

      {apiError && (
        <div className={styles['error-message']} style={{ marginBottom: '16px' }}>
          <FaExclamationTriangle />
          <span>{apiError}</span>
        </div>
      )}

      {stepContent.form}

      <div className={styles['footer-links']} style={{ marginTop: '24px' }}>
        Remember your password? <Link href="/Login">Sign in</Link>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;