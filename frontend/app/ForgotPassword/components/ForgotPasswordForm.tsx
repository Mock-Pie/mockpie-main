"use client";
import React, { useState } from 'react';
import styles from "../../Login/page.module.css";
import styles1 from "../../SignUp/page.module.css";
import Link from 'next/link';

const ForgotPasswordForm = ({ step, setStep }: { step: number, setStep: (s: number) => void }) => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

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
        setShowSuccess(true);
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
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            padding: '40px 32px',
            minWidth: 350,
            textAlign: 'center',
            position: 'relative',
          }}>
            <div style={{ fontSize: 90, color: 'limegreen', marginBottom: 10 }}>
              &#10003;
            </div>
            <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 8 }}>
              Password Changed Successfully!
            </div>
            <div style={{ color: '#1abc1a', fontWeight: 500, marginBottom: 24 }}>
              Proceed to log in
            </div>
            <button
              onClick={() => window.location.href = '/Login'}
              style={{
                background: 'linear-gradient(90deg, #a8430e, #b86b2a)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 32px',
                fontWeight: 600,
                fontSize: 18,
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
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