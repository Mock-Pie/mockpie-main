"use client";
import React, { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import styles from "../Login/page.module.css";
import otpStyles from "./page.module.css";
import Header from "./components/Header";

const OTPVerification = () => {
  const searchParams = useSearchParams();
  const email = (searchParams && searchParams.get("email")) || "";
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleOtpChange = (idx: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);
    if (value && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
    if (!value && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

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
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the 6-digit OTP");
      setLoading(false);
      return;
    }
    try {
      const data = new FormData();
      data.append("email", email);
      data.append("otp", otpValue);
      const response = await fetch("http://localhost:8081/auth/verify-otp", {
        method: "POST",
        body: data,
      });
      if (response.ok) {
        window.location.href = `/ResetPassword?email=${encodeURIComponent(email)}`;
      } else {
        const errorData = await response.json();
        setError(errorData.detail || errorData.message || "Invalid OTP");
      }
    } catch (err) {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setResendMessage("");
    setResendCooldown(30);
    try {
      const data = new FormData();
      data.append("email", email);
      await fetch("http://localhost:8081/auth/forgot-password", {
        method: "POST",
        body: data,
      });
      setResendMessage("OTP resent! Please check your email.");
    } catch {
      setError("Failed to resend OTP. Please try again.");
    }
    let seconds = 30;
    const interval = setInterval(() => {
      seconds -= 1;
      setResendCooldown(seconds);
      if (seconds <= 0) clearInterval(interval);
    }, 1000);
  };

  return (
    <div className={otpStyles.container}>
      <div className={otpStyles.formWrapper}>
        <div className={otpStyles.formBox}>
          <Header />
          <div className={otpStyles.subtitle}>We sent a six digit code to your email.</div>
          <form onSubmit={handleVerifyOtp}>
            <div className={otpStyles.otpInputRow} onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  className={otpStyles.otpInput}
                  required
                />
              ))}
            </div>
            {error && <div className={otpStyles.error}>{error}</div>}
            {resendMessage && <div className={otpStyles.success}>{resendMessage}</div>}
            <button type="submit" className={otpStyles.button} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
          <div className={otpStyles.resendRow}>
            Don't receive the otp?{' '}
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
              className={otpStyles.resendButton + (resendCooldown > 0 ? ' ' + otpStyles.resendButtonDisabled : '')}
            >
              Resend{resendCooldown > 0 ? ` (${resendCooldown}s)` : ''}
            </button>
          </div>
        </div>
      </div>
      <div className={otpStyles.imageWrapper}>
        <img src="/Images/OTP.png" alt="OTP Verification" className={otpStyles.image} />
      </div>
    </div>
  );
};

export default OTPVerification;
