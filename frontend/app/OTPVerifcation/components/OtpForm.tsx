"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaExclamationCircle, FaExclamationTriangle } from "react-icons/fa";
import styles from "../../Login/page.module.css";
import UserService from "../../services/userService";

const OTPForm = () => {
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
      const data = JSON.parse(pendingEmailChange);
      setEmail(data.newEmail);
      setProfileData(data.profileData);
      setIsEmailChange(true);
      
      // Automatically send OTP for email verification
      sendOTPForEmailChange(data.newEmail);
    } else {
      // Use email from URL params for forgot password flow
      setEmail(emailFromParams);
      setIsEmailChange(false);
    }
  }, [emailFromParams]);

  const sendOTPForEmailChange = async (emailAddress: string) => {
    try {
      console.log('Sending OTP for email verification:', emailAddress);
      
      // First, try to clean up any existing temporary user with this email
      await cleanupExistingTempUser(emailAddress);
      
      // Create a unique temporary user to trigger OTP sending
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 10);
      
      const tempFormData = new FormData();
      tempFormData.append('first_name', 'EmailVerify');
      tempFormData.append('last_name', 'Temp'); 
      tempFormData.append('email', emailAddress);
      tempFormData.append('username', `verify_${timestamp}_${randomId}`);
      tempFormData.append('phone_number', `+20155${timestamp.toString().slice(-7)}`);
      tempFormData.append('password', 'TempPassword123!@#');
      tempFormData.append('password_confirmation', 'TempPassword123!@#');
      tempFormData.append('gender', 'prefer_not_to_say');

      const response = await fetch("http://localhost:8081/auth/register", {
        method: "POST",
        body: tempFormData,
      });

      if (response.ok) {
        console.log('OTP sent successfully via registration');
        setError(''); // Clear any previous errors
      } else {
        const errorData = await response.json();
        console.error('Registration failed:', errorData);
        
        // Check if it's because email already exists
        if (errorData.detail && (errorData.detail.includes('already') || errorData.detail.includes('taken'))) {
          // Try a different approach - use forgot password for existing emails
          await tryForgotPasswordApproach(emailAddress);
        } else {
          setError(errorData.detail || 'Failed to send verification code. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in sendOTPForEmailChange:', error);
      setError('Network error. Please check your connection and try again.');
    }
  };

  const cleanupExistingTempUser = async (emailAddress: string) => {
    try {
      console.log('Cleaning up existing temporary user for:', emailAddress);
      
      const formData = new FormData();
      formData.append('email', emailAddress);

      const response = await fetch("http://localhost:8081/auth/cleanup-temp-user", {
        method: "DELETE",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Cleanup result:', result.message);
      } else {
        console.log('Cleanup failed or not needed');
      }
    } catch (error) {
      console.log('Cleanup error (not critical):', error);
    }
  };

  const tryForgotPasswordApproach = async (emailAddress: string) => {
    try {
      console.log('Trying forgot password approach for existing email:', emailAddress);
      
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
        if (errorData.detail && errorData.detail.includes('does not exist')) {
          setError('Unable to send verification code. Please try a different email address.');
        } else {
          setError(errorData.detail || 'Failed to send verification code. Please try again.');
        }
      }
    } catch (error) {
      setError('Failed to send verification code. Please try again.');
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
    
    try {
      // Use the existing verify-otp endpoint for both flows
      const data = new FormData();
      data.append("email", email);
      data.append("otp", otpValue);
      
      const response = await fetch("http://localhost:8081/auth/verify-otp", {
        method: "POST",
        body: data,
      });
      
      if (response.ok) {
        if (isEmailChange) {
          // Handle email change verification
          await handleEmailChangeVerification();
        } else {
          // Handle forgot password verification or registration verification
          window.location.href = `/ResetPassword?email=${encodeURIComponent(email)}`;
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || errorData.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
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
        
        // Clean up the temporary user by trying to delete it
        await cleanupTempUser();
        
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

  const cleanupTempUser = async () => {
    try {
      console.log('Cleaning up temporary user after successful verification');
      
      const formData = new FormData();
      formData.append('email', email);

      const response = await fetch("http://localhost:8081/auth/cleanup-temp-user", {
        method: "DELETE",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Post-verification cleanup:', result.message);
      } else {
        console.log('Post-verification cleanup failed or not needed');
      }
    } catch (error) {
      // Silent fail - cleanup is not critical for user experience
      console.log('Cleanup not needed or failed silently');
    }
  };

  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0) return;
    
    setError("");
    setResendMessage("");
    setResendCooldown(30);
    
    try {
      if (isEmailChange) {
        // Resend OTP for email change
        await sendOTPForEmailChange(email);
      } else {
        // Resend OTP for forgot password
        const data = new FormData();
        data.append("email", email);
      
        const response = await fetch("http://localhost:8081/auth/forgot-password", {
          method: "POST",
          body: data,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.detail || "Failed to resend OTP. Please try again.");
          return;
        }
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
    return `We sent a six digit code to ${email}`;
  };

  return (
    <div className={styles['form-card']}>
      <div className={styles.header}>
        <div className={styles.logo}>M</div>
        <h1 className={styles['welcome-text']}>Enter Verification Code</h1>
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
            'Verify Code'
          )}
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            Don't receive the OTP?{' '}
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

export default OTPForm;
