"use client";
import React, { useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaExclamationTriangle } from "react-icons/fa";
import Image from "next/image";
import styles from "../../Login/page.module.css";
import UserService from "../../services/userService";

const RestoreAccountOTPForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromParams = (searchParams && searchParams.get("email")) || "";
  
  const [email, setEmail] = useState(emailFromParams);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    if (error) setError("");
  }, [otp, error]);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only proceed if the pasted data is 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      const newOtp = [...otp];
      
      // Update OTP state with pasted digits
      digits.forEach((digit, idx) => {
        if (idx < 6) {
          newOtp[idx] = digit;
        }
      });
      
      setOtp(newOtp);
      
      // Focus the last input field
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
      
      if (error) setError("");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      setLoading(false);
      return;
    }
    
    try {
      const result = await UserService.restoreUser(email, otpValue);
      
      if (result.success) {
        // Show success message and redirect
        alert("Account restored successfully! Your email is now verified and you can log in directly with your original credentials.");
        router.push('/Login?message=Account restored successfully! Your email is verified and you can log in directly.');
      } else {
        setError(result.error || "Failed to restore account");
      }
    } catch (err) {
      console.error("Error restoring account:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0) return;
    
    setError("");
    setResendCooldown(30);
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      
      const response = await fetch("http://localhost:8081/auth/restore-account-otp", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to resend OTP. Please try again.");
        return;
      }
    } catch (error) {
      setError("Failed to resend OTP. Please try again.");
      return;
    }
    
    // Countdown timer
    let seconds = 30;
    const interval = setInterval(() => {
      seconds -= 1;
      setResendCooldown(seconds);
      if (seconds <= 0) clearInterval(interval);
    }, 1000);
  }, [email, resendCooldown]);

  return (
    <div className={styles['form-card']}>
      <div className={styles.header}>
        <Image src="/Images/Logoo.png" alt="MockPie Logo" width={60} height={60} className={styles.logo} priority />
        <h1 className={styles['welcome-text']}>Restore Account</h1>
        <p className={styles.subtitle}>We sent a six digit code to {email} to verify your identity</p>
      </div>

      <form onSubmit={handleVerifyOtp} noValidate>
        <div className={styles['form-group']}>
          <label style={{ 
            textAlign: 'center', 
            display: 'block', 
            width: '100%',
            margin: '0 auto',
            fontSize: '16px',
            fontWeight: '500',
            color: 'var(--naples-yellow)',
            marginBottom: '12px'
          }}>Enter 6-digit code</label>
          <div className={styles['otp-container']} style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }} onPaste={handlePaste}>
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
                onFocus={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.borderColor = 'var(--font-yellow)';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onBlur={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'var(--naples-yellow)';
                  e.target.style.transform = 'scale(1)';
                }}
                className={styles['otp-input']}
                style={{
                  width: '40px',
                  height: '48px',
                  textAlign: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  border: '2px solid var(--naples-yellow)',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--white)',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'text'
                }}
                disabled={loading}
                autoComplete="one-time-code"
              />
            ))}
          </div>
        </div>

        {error && (
          <div className={styles['error-message']} style={{ marginBottom: '16px' }}>
            <FaExclamationTriangle />
            <span>{error}</span>
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
              Restoring Account...
            </>
          ) : (
            'Restore Account'
          )}
        </button>

        <div className={styles['footer-links']}>
          <button 
            type="button" 
            onClick={handleResendOtp}
            disabled={resendCooldown > 0}
            style={{
              background: 'none',
              border: 'none',
              color: resendCooldown > 0 ? 'var(--light-grey)' : 'var(--naples-yellow)',
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              fontSize: '14px'
            }}
          >
            {resendCooldown > 0 
              ? `Resend code in ${resendCooldown}s` 
              : 'Resend verification code'
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default RestoreAccountOTPForm; 