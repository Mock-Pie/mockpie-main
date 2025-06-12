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

  // Placeholder for API call to request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // TODO: Call your API to send OTP
    // Example: await api.sendOtp(emailOrUsername)
    // If success:
    setStep(2);
    // If error: setError('User not found')
  };

  // Placeholder for API call to verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // TODO: Call your API to verify OTP
    // Example: await api.verifyOtp(emailOrUsername, otp)
    // If success:
    setStep(3);
    // If error: setError('Invalid OTP')
  };

  // Placeholder for API call to reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    // TODO: Call your API to reset password
    // Example: await api.resetPassword(emailOrUsername, otp, newPassword)
    // If success:
    window.location.href = "/Login";
    // If error: setError('Failed to reset password')
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