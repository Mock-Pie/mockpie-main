"use client";
import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "../../Login/page.module.css";
import styles1 from "../page.module.css";
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
          // Handle forgot password verification
          window.location.href = `/ResetPassword?email=${encodeURIComponent(email)}`;
        }
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

  const handleResendOtp = async () => {
    setError("");
    setResendMessage("");
    setResendCooldown(30);
    
    try {
      if (isEmailChange) {
        // Resend OTP for email change
        await sendOTPForEmailChange(email);
        setResendMessage("OTP resent! Please check your email.");
      } else {
        // Resend OTP for forgot password
        const data = new FormData();
        data.append("email", email);
      
        const response = await fetch("http://localhost:8081/auth/forgot-password", {
          method: "POST",
          body: data,
        });
        setResendMessage("OTP resent! Please check your email.");
      }
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

  const getSubtitleText = () => {
    if (isEmailChange) {
      return `We sent a six digit code to ${email} to verify your new email address.`;
    }
    return "We sent a six digit code to your email.";
  };

  return (
    <div className={styles['form-card']}>
      <div className={styles.header}>
        <div className={styles.logo}>M</div>
        <h1 className={styles['welcome-text']}>Verify OTP</h1>
        <p className={styles.subtitle}>{getSubtitleText()}</p>
      </div>

      <form onSubmit={handleVerifyOtp} noValidate>
        <div className={styles['form-group']}>
          <label>Enter 6-digit code</label>
          <div className={styles1['otp-container']} onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(idx, e.target.value)}
                className={styles1['otp-input']}
                required
                disabled={loading}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className={styles['error-message']} style={{ marginBottom: '16px' }}>
            <span>{error}</span>
          </div>
        )}

        {resendMessage && (
          <div className={styles1['success-message']} style={{ marginBottom: '16px' }}>
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
            'Verify OTP'
          )}
        </button>

        <div className={styles['footer-links']} style={{ marginTop: '24px' }}>
          Don't receive the OTP?{' '}
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0}
            className={styles1['link-button']}
          >
            Resend{resendCooldown > 0 ? ` (${resendCooldown}s)` : ''}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OTPForm;
