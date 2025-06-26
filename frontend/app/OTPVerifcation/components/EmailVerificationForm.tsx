"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaExclamationCircle, FaExclamationTriangle } from "react-icons/fa";
import styles from "../../Login/page.module.css";
import UserService from "../../services/userService";
import Image from "next/image";

const EmailVerificationForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromParams = (searchParams && searchParams.get("email")) || "";
  
  const [email, setEmail] = useState("");
  const [isEmailChange, setIsEmailChange] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    // Check if this is for email change verification
    const pendingEmailChange = localStorage.getItem('pendingEmailChange');
    if (pendingEmailChange) {
      try {
        const data = JSON.parse(pendingEmailChange);
        console.log('Email change flow - new email:', data.newEmail);
        
        // Validate the email format before proceeding
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.newEmail || !emailRegex.test(data.newEmail)) {
          console.error('Invalid email in localStorage, clearing corrupted data:', data.newEmail);
          localStorage.removeItem('pendingEmailChange');
          setError('Invalid email data found. Please try again.');
          return;
        }
        
        // Check if the email looks suspicious (contains numbers at the beginning)
        if (data.newEmail.match(/^\d+/)) {
          console.error('Suspicious email format detected, clearing data:', data.newEmail);
          localStorage.removeItem('pendingEmailChange');
          setError('Invalid email format detected. Please try again.');
          return;
        }
        
        setEmail(data.newEmail);
        setProfileData(data.profileData);
        setIsEmailChange(true);
        
        // For email change, we need to send OTP via forgot-password endpoint
        sendOTPForEmailChange(data.newEmail);
      } catch (error) {
        console.error('Error parsing pendingEmailChange data:', error);
        localStorage.removeItem('pendingEmailChange');
        setError('Invalid data found. Please try again.');
      }
    } else {
      // Use email from URL params for registration flow
      console.log('Registration flow - email from params (raw):', emailFromParams);
      
      // Test URL encoding/decoding
      console.log('=== URL Encoding Test ===');
      console.log('Raw email from params:', emailFromParams);
      console.log('Decoded email:', emailFromParams ? decodeURIComponent(emailFromParams) : "");
      console.log('Double decoded:', emailFromParams ? decodeURIComponent(decodeURIComponent(emailFromParams)) : "");
      
      // Properly decode the email from URL parameters
      const decodedEmail = emailFromParams ? decodeURIComponent(emailFromParams) : "";
      console.log('Registration flow - email from params (decoded):', decodedEmail);
      
      // Validate that the decoded email looks like a valid email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (decodedEmail && !emailRegex.test(decodedEmail)) {
        console.error('Invalid email format after decoding:', decodedEmail);
        setError('Invalid email format. Please try registering again.');
        return;
      }
      
      setEmail(decodedEmail);
      setIsEmailChange(false);
      // For registration, OTP is already sent during registration process
      // No need to send it again here
    }
  }, [emailFromParams]);

  const sendOTPForEmailChange = async (emailAddress: string) => {
    try {
      console.log('Sending OTP for email verification:', emailAddress);
      console.log('Email being sent to backend:', emailAddress);
      
      const formData = new FormData();
      formData.append('email', emailAddress);

      const response = await fetch("http://localhost:8081/auth/forgot-password", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        console.log('OTP sent successfully via forgot-password');
        setError(''); // Clear any previous errors
      } else {
        const errorData = await response.json();
        console.error('Failed to send OTP:', errorData);
        setError(errorData.detail || 'Failed to send verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error in sendOTPForEmailChange:', error);
      setError('Network error. Please check your connection and try again.');
    }
  };

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    if (error) setError("");
    if (resendMessage) setResendMessage("");
  }, [otp, error, resendMessage]);

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
      if (resendMessage) setResendMessage("");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResendMessage("");
    setLoading(true);
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      setLoading(false);
      return;
    }
    
    console.log('=== OTP Verification Debug ===');
    console.log('Current email state:', email);
    console.log('Email type:', typeof email);
    console.log('Email length:', email.length);
    console.log('Verifying OTP for email:', email);
    console.log('OTP value:', otpValue);
    console.log('Is email change flow:', isEmailChange);
    
    try {
      // Use the existing verify-otp endpoint for both flows
      const data = new FormData();
      data.append("email", email);
      data.append("otp", otpValue);
      
      console.log('FormData email being sent:', data.get('email'));
      
      const response = await fetch("http://localhost:8081/auth/verify-otp", {
        method: "POST",
        body: data,
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        if (isEmailChange) {
          // Handle email change verification
          await handleEmailChangeVerification();
        } else {
          // Handle registration verification
          router.push("/Login?message=Email verified successfully! Please login with your account.");
        }
      } else {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        setError(errorData.detail || errorData.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error('Network error in handleVerifyOtp:', err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChangeVerification = async () => {
    try {
      if (!profileData) {
        setError("Profile data not found. Please try again.");
        return;
      }

      console.log('Starting email change verification...');
      console.log('Profile data:', profileData);
      console.log('New email:', email);

      // Update the actual user profile with the verified email
      const updateData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        username: profileData.username,
        email: email, // Use the verified new email
        phone_number: profileData.phone_number,
        gender: profileData.gender as 'male' | 'female' | 'other'
      };

      console.log('Update data to send:', updateData);

      const result = await UserService.updateUser(updateData);
      
      console.log('Update result:', result);
      
      if (result.success) {
        console.log('Email update successful, updated user:', result.data);
        
        // Clear the pending email change data
        localStorage.removeItem('pendingEmailChange');
        
        // Redirect back to profile with success message
        localStorage.setItem('profileUpdateSuccess', 'Email updated successfully!');
        router.push('/ProfileInfo');
      } else {
        console.error('Email update failed:', result.error);
        setError(result.error || 'Failed to update profile with new email');
      }
    } catch (err) {
      console.error('Error in handleEmailChangeVerification:', err);
      setError('Failed to update profile. Please try again.');
    }
  };

  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0) return;
    
    setError("");
    setResendMessage("");
    setResendCooldown(30);
    
    console.log('Resending OTP for email:', email);
    
    try {
      if (isEmailChange) {
        // Resend OTP for email change
        await sendOTPForEmailChange(email);
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
  }, [email, resendCooldown, isEmailChange]);

  const getSubtitleText = () => {
    if (isEmailChange) {
      return `We sent a six digit code to ${email} to verify your new email address.`;
    }
    return `We sent a six digit code to ${email} to verify your email address.`;
  };

  return (
    <div className={styles['form-card']}>
      <div className={styles.header}>
        <Image src="/Images/Logoo.png" alt="MockPie Logo" width={60} height={60} className={styles.logo} priority />
        <h1 className={styles['welcome-text']}>Verify Your Email</h1>
        <p className={styles.subtitle}>{getSubtitleText()}</p>
      </div>

      <form onSubmit={handleVerifyOtp} noValidate>
        <div className={styles['form-group']}>
          <label>Enter 6-digit code</label>
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

        {resendMessage && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '12px 16px',
            background: 'rgba(72, 187, 120, 0.1)',
            border: '1px solid rgba(72, 187, 120, 0.3)',
            borderRadius: '8px',
            color: '#2f855a',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '16px'
          }}>
            <span>{resendMessage}</span>
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
              Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            Don't receive the code?{' '}
          </span>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0}
            style={{
              background: 'none',
              border: 'none',
              color: resendCooldown > 0 ? '#999' : '#007bff',
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailVerificationForm; 