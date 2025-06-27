"use client";
import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaExclamationTriangle } from "react-icons/fa";
import styles from "../../Login/page.module.css";
import Image from "next/image";
import UserService from "../../services/userService";

const ChangePasswordForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

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

  // Fetch current user's email on component mount
  React.useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const result = await UserService.getCurrentUser();
        if (result.success && result.data) {
          setEmail(result.data.email);
        } else {
          setError("Failed to get user information. Please enter your email manually.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to get user information. Please enter your email manually.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserEmail();
  }, []);

  const handleSendOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setError(emailValidation);
      return;
    }
    
    setLoading(true);
    
    try {
      const userEmail = email.trim();
      const data = new FormData();
      data.append("email", userEmail);
      
      const response = await fetch("http://localhost:8081/auth/forgot-password", {
        method: "POST",
        body: data,
      });
      
      if (response.ok) {
        setSuccess("Password reset OTP has been sent to your email");
        // Redirect to password reset OTP verification page
        setTimeout(() => {
          router.push(`/PasswordResetOTP?email=${encodeURIComponent(userEmail)}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || errorData.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Change password error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [email, validateEmail, router]);

  return (
    <div className={styles['form-card']}>
      <div className={styles.header}>
        <Image src="/Images/Logoo.png" alt="MockPie Logo" width={60} height={60} className={styles.logo} priority />
        <h1 className={styles['welcome-text']}>Change Password</h1>
        <p className={styles.subtitle}>Enter your email to receive a password reset code</p>
      </div>

      <form onSubmit={handleSendOtp} noValidate>
        <div className={styles['form-group']}>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            className={styles['form-input']}
            placeholder={initialLoading ? "Loading..." : "Enter your email address"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || initialLoading}
            autoComplete="email"
          />
        </div>

        {error && (
          <div className={styles['error-message']} style={{ marginBottom: '16px' }}>
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={styles['success-message']} style={{ marginBottom: '16px', color: '#4CAF50' }}>
            <span>{success}</span>
          </div>
        )}

        <button 
          type="submit" 
          className={styles['submit-btn']} 
          disabled={loading || initialLoading}
        >
          {loading ? (
            <>
              <div className={styles.loading}></div>
              Sending OTP...
            </>
          ) : initialLoading ? (
            <>
              <div className={styles.loading}></div>
              Loading...
            </>
          ) : (
            'Send Reset Code'
          )}
        </button>

        <div className={styles['footer-links']} style={{ marginTop: '24px' }}>
          <a href="/ProfileInfo" style={{ marginRight: '20px' }}>← Back to Profile</a>
          Remember your password? <a href="/Login">Sign in</a>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordForm; 