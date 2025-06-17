"use client";
import React, { useState } from 'react';
import styles from "../../ForgotPassword/page.module.css";

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = new FormData();
      data.append("email", email);
      const response = await fetch("http://localhost:8081/auth/forgot-password", {
        method: "POST",
        body: data,
      });
      if (response.ok) {
        window.location.href = `/OTPVerifcation?email=${encodeURIComponent(email)}`;
      } else {
        const errorData = await response.json();
        setError(errorData.detail || errorData.message || "User not found");
      }
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRequestOtp}>
      <div style={{ marginBottom: 16 }}>
        <label className={styles.label}>Email</label>
        <input
          type="text"
          className={styles.input}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="Email"
        />
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <button
        type="submit"
        className={styles.button}
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Get OTP'}
      </button>
    </form>
  );
};

export default ForgotPasswordForm;