"use client";
import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import resetStyles from "./page.module.css";
import Header from "./components/Header";

const passwordChecks = [
  {
    label: "At least one uppercase",
    test: (pw: string) => /[A-Z]/.test(pw),
  },
  {
    label: "At least one lowercase",
    test: (pw: string) => /[a-z]/.test(pw),
  },
  {
    label: "At least one numeric character",
    test: (pw: string) => /[0-9]/.test(pw),
  },
  {
    label: "At least one special symbol",
    test: (pw: string) => /[^A-Za-z0-9]/.test(pw),
  },
  {
    label: "8 to 12 characters long",
    test: (pw: string) => pw.length >= 8 && pw.length <= 12,
  },
];

const ResetPassword = () => {
  const searchParams = useSearchParams();
  const email = (searchParams && searchParams.get("email")) || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordValidations = passwordChecks.map(check => check.test(newPassword));
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      data.append("email", email);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={resetStyles.container}>
      {showSuccess && (
        <div className={resetStyles.modalOverlay}>
          <div className={resetStyles.modalContent}>
            <div className={resetStyles.successIcon}>
              <svg className={resetStyles.checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className={resetStyles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
                <path className={resetStyles.checkmark} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <div className={resetStyles.successTitle}>
              Password Changed Successfully!
            </div>
            <div className={resetStyles.successMessage}>
              Proceed to log in
            </div>
            <button
              onClick={() => window.location.href = '/Login'}
              className={resetStyles.loginButton}
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
      <div className={resetStyles.formWrapper}>
        <div className={resetStyles.formBox}>
          <Header />
          <div className={resetStyles.subtitle}>Fill in your new password.</div>
          <form onSubmit={handleResetPassword}>
            <div className={resetStyles.inputGroup}>
              <label className={resetStyles.label}>New password</label>
              <input
                type="password"
                className={resetStyles.input}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                placeholder="New password"
              />
            </div>
            <div className={resetStyles.inputGroup}>
              <label className={resetStyles.label}>Confirm password</label>
              <input
                type="password"
                className={resetStyles.input}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm password"
              />
            </div>
            <div className={resetStyles.passwordChecks}>
              {passwordChecks.map((check, idx) => (
                <div 
                  key={check.label} 
                  className={`${resetStyles.checkItem} ${passwordValidations[idx] ? resetStyles.checkValid : resetStyles.checkInvalid}`}
                >
                  <span className={resetStyles.checkIcon}>
                    {passwordValidations[idx] ? '✔️' : '⭕'}
                  </span>
                  {check.label}
                </div>
              ))}
              <div 
                className={`${resetStyles.checkItem} ${passwordsMatch ? resetStyles.checkValid : resetStyles.checkInvalid}`}
              >
                <span className={resetStyles.checkIcon}>
                  {passwordsMatch ? '✔️' : '⭕'}
                </span>
                Password match
              </div>
            </div>
            {error && <div className={resetStyles.error}>{error}</div>}
            <button 
              type="submit" 
              className={resetStyles.button}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
      <div className={resetStyles.imageWrapper}>
        <img 
          src="/Images/Reset Password.png" 
          alt="Reset Password" 
          className={resetStyles.image}
        />
      </div>
    </div>
  );
};

export default ResetPassword;
