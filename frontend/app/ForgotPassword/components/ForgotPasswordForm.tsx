"use client";
import React, { useState } from 'react';
import styles from "../../Login/page.module.css";
import styles1 from "../../SignUp/page.module.css";
import Link from 'next/link';

const ForgotPasswordForm = () => {
  const [step, setStep] = useState(1);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  // Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = new FormData();
      data.append("email", emailOrUsername);
      const response = await fetch("http://localhost:8081/auth/forgot-password", {
        method: "POST",
        body: data,
      });
      if (response.ok) {
        setStep(2);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || errorData.message || "User not found");
      }
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = new FormData();
      data.append("email", emailOrUsername);
      data.append("otp", otp);
      const response = await fetch("http://localhost:8081/auth/verify-otp", {
        method: "POST",
        body: data,
      });
      if (response.ok) {
        setStep(3);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || errorData.message || "Invalid OTP");
      }
    } catch (err) {
      setError("Failed to verify OTP. Please try again.");
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const data = new FormData();
      data.append("email", emailOrUsername);
      data.append("new_password", newPassword);
      data.append("confirm_password", confirmPassword);
      const response = await fetch("http://localhost:8081/auth/reset-password", {
        method: "POST",
        body: data,
      });
      if (response.ok) {
        window.location.href = "/Login";
      } else {
        const errorData = await response.json();
        setError(errorData.detail || errorData.message || "Failed to reset password");
      }
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    }
  };

  return (
    <div className={styles.mainContent}>

      <div className={styles.loginBox}>
        {step === 1 && (
          <form onSubmit={handleRequestOtp}>
            <div className={styles.inputGroup}>
              <label>Email or Username</label>
              <input
                type="text"
                className={styles.input}
                value={emailOrUsername}
                onChange={e => setEmailOrUsername(e.target.value)}
                required
              />
            </div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <button type="submit" className={styles.signInButton}>Get OTP</button>
          </form>
        )}
        {step === 2 && (
          <>
            <div style={{ marginBottom: 10, color: 'green', fontWeight: 'bold' }}>
              A fake OTP (123456) has been sent to your email/username for testing.
            </div>
            <form onSubmit={handleVerifyOtp}>
              <div className={styles.inputGroup}>
                <label>Enter OTP</label>
                <input
                  type="text"
                  className={styles.input}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                />
              </div>
              {error && <div style={{ color: 'red' }}>{error}</div>}
              <button type="submit" className={styles.signInButton}>Verify OTP</button>
            </form>
          </>
        )}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className={styles.inputGroup}>
              <label>New Password</label>
              <input
                type="password"
                className={styles.input}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Confirm New Password</label>
              <input
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <button type="submit" className={styles.signInButton}>Reset Password</button>
          </form>
        )}
        <div className={styles.footerText}>
          <p>
            Don't have an account?{' '}
            <Link href="/SignUp" className={styles1.link}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;