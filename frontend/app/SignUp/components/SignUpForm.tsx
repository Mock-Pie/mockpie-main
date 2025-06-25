"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { FaExclamationCircle, FaExclamationTriangle } from "react-icons/fa";
import { signIn } from "next-auth/react";
import styles from "../../Login/page.module.css";

const SignUpForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
  });
  const [formErrors, setFormErrors] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [genderHovered, setGenderHovered] = useState(false);

  // Password validation criteria
  const passwordCriteria = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>[\]\\/~`_+=;'\-]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  // Password validation checklist component
  const PasswordValidationChecklist = () => (
    <div style={{ 
      marginTop: '8px', 
      padding: '12px', 
      background: 'rgba(255, 255, 255, 0.05)', 
      borderRadius: '8px', 
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontSize: '12px'
    }}>
      <div style={{ color: 'var(--font-yellow)', marginBottom: '8px', fontWeight: '500' }}>
        Password Requirements:
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          color: passwordCriteria.length ? 'var(--white)' : 'var(--light-grey)'
        }}>
          <span style={{ color: passwordCriteria.length ? '#4CAF50' : '#ff6b6b' }}>
            {passwordCriteria.length ? '✓' : '✗'}
          </span>
          At least 8 characters
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          color: passwordCriteria.uppercase ? 'var(--white)' : 'var(--light-grey)'
        }}>
          <span style={{ color: passwordCriteria.uppercase ? '#4CAF50' : '#ff6b6b' }}>
            {passwordCriteria.uppercase ? '✓' : '✗'}
          </span>
          One uppercase letter
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          color: passwordCriteria.number ? 'var(--white)' : 'var(--light-grey)'
        }}>
          <span style={{ color: passwordCriteria.number ? '#4CAF50' : '#ff6b6b' }}>
            {passwordCriteria.number ? '✓' : '✗'}
          </span>
          One number
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          color: passwordCriteria.special ? 'var(--white)' : 'var(--light-grey)'
        }}>
          <span style={{ color: passwordCriteria.special ? '#4CAF50' : '#ff6b6b' }}>
            {passwordCriteria.special ? '✓' : '✗'}
          </span>
          One special character
        </div>
      </div>
    </div>
  );

  const validateField = useCallback((name: string, value: string) => {
    switch (name) {
      case "firstName":
        if (!value.trim()) return "First name is required.";
        if (!/^[A-Za-z]+$/.test(value.trim())) return "First name must contain only letters.";
        if (value.trim().length < 2) return "First name must be at least 2 characters.";
        return "";
      case "lastName":
        if (!value.trim()) return "Last name is required.";
        if (!/^[A-Za-z]+$/.test(value.trim())) return "Last name must contain only letters.";
        if (value.trim().length < 2) return "Last name must be at least 2 characters.";
        return "";
      case "username":
        if (!value.trim()) return "Username is required.";
        if (value.trim().length < 3) return "Username must be at least 3 characters.";
        if (!/^[a-zA-Z0-9_]+$/.test(value.trim())) return "Username can only contain letters, numbers, and underscores.";
        return "";
      case "phoneNumber":
        if (!value.trim()) return "Phone number is required.";
        if (!/^\+20(10|11|12|15)\d{8}$/.test(value.trim())) return "Phone number must be a valid Egyptian number (e.g., +2010XXXXXXXX).";
        return "";
      case "email":
        if (!value.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Invalid email address.";
        return "";
      case "password":
        if (!value.trim()) return "Password is required.";
        if (value.length < 8) return "Password must be at least 8 characters.";
        if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter.";
        if (!/\d/.test(value)) return "Password must contain at least one number.";
        if (!/[!@#$%^&*(),.?":{}|<>[\]\\/~`_+=;'\-]/.test(value)) return "Password must contain at least one special character.";
        return "";
      case "confirmPassword":
        if (!value.trim()) return "Please confirm your password.";
        if (value !== formData.password) return "Passwords do not match.";
        return "";
      case "gender":
        if (!value.trim()) return "Gender is required.";
        return "";
      default:
        return "";
    }
  }, [formData.password]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
    
    // Clear API error when user modifies form
    if (apiError) {
      setApiError("");
    }
  }, [formErrors, apiError]);

  const validateForm = useCallback(() => {
    const newErrors = {
      firstName: validateField("firstName", formData.firstName),
      lastName: validateField("lastName", formData.lastName),
      username: validateField("username", formData.username),
      phoneNumber: validateField("phoneNumber", formData.phoneNumber),
      email: validateField("email", formData.email),
      password: validateField("password", formData.password),
      confirmPassword: validateField("confirmPassword", formData.confirmPassword),
      gender: validateField("gender", formData.gender),
    };
    
    setFormErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  }, [formData, validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const data = new FormData();
      data.append("first_name", formData.firstName.trim());
      data.append("last_name", formData.lastName.trim());
      data.append("email", formData.email.trim());
      data.append("username", formData.username.trim());
      data.append("phone_number", formData.phoneNumber.trim());
      data.append("password", formData.password);
      data.append("password_confirmation", formData.confirmPassword);
      data.append("gender", formData.gender);

      const response = await fetch("http://localhost:8081/auth/register", {
        method: "POST",
        body: data,
      });

      if (response.ok) {
        console.log('=== Registration Success Debug ===');
        console.log('Original email from form:', formData.email);
        console.log('Email being redirected:', encodeURIComponent(formData.email));
        console.log('Full redirect URL:', `/OTPVerifcation?email=${encodeURIComponent(formData.email)}`);
        
        router.push(`/OTPVerifcation?email=${encodeURIComponent(formData.email)}`);
      } else {
        const errorData = await response.json();
        let errorMessage = "Registration failed.";
        
        if (errorData.detail) {
          if (typeof errorData.detail === 'object') {
            errorMessage = JSON.stringify(errorData.detail);
          } else {
            errorMessage = errorData.detail;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        setApiError(errorMessage);
      }
    } catch (error) {
      console.error("Error during sign up:", error);
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, router]);

  const handleGoogleSignIn = useCallback(async () => {
    setGoogleLoading(true);
    setApiError("");
    
    try {
      const result = await signIn("google", {
        callbackUrl: "/Dashboard",
        redirect: false,
      });
      
      if (result?.error) {
        setApiError("Google sign-in failed. Please try again.");
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setApiError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }, [router]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const container = e.target.closest(`.${styles['input-container']}`) as HTMLElement & { style: CSSStyleDeclaration };
    if (container) {
      container.style.transform = 'scale(1.02)';
    }
  }, [styles]);
  
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const container = e.target.closest(`.${styles['input-container']}`) as HTMLElement & { style: CSSStyleDeclaration };
    if (container) {
      container.style.transform = 'scale(1)';
    }
  }, [styles]);

  return (
    <div className={styles.container}>
      <div className={styles['form-card']}>
        <div className={styles.header}>
          <div className={styles.logo}>M</div>
          <h1 className={styles['welcome-text']}>Join MockPie!</h1>
          <p className={styles.subtitle}>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div className={styles['form-group']}>
              <label htmlFor="firstName">First Name</label>
              <div className={styles['input-container']}>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className={styles['form-input']}
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  disabled={loading || googleLoading}
                />
              </div>
              {formErrors.firstName && (
                <div className={styles['error-message']}>
                  <FaExclamationCircle />
                  <span>{formErrors.firstName}</span>
                </div>
              )}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="lastName">Last Name</label>
              <div className={styles['input-container']}>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className={styles['form-input']}
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  disabled={loading || googleLoading}
                />
              </div>
              {formErrors.lastName && (
                <div className={styles['error-message']}>
                  <FaExclamationCircle />
                  <span>{formErrors.lastName}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="username">Username</label>
            <div className={styles['input-container']}>
              <input
                type="text"
                id="username"
                name="username"
                className={styles['form-input']}
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                disabled={loading || googleLoading}
              />
            </div>
            {formErrors.username && (
              <div className={styles['error-message']}>
                <FaExclamationCircle />
                <span>{formErrors.username}</span>
              </div>
            )}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="email">Email</label>
            <div className={styles['input-container']}>
              <input
                type="email"
                id="email"
                name="email"
                className={styles['form-input']}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                disabled={loading || googleLoading}
                autoComplete="email"
              />
            </div>
            {formErrors.email && (
              <div className={styles['error-message']}>
                <FaExclamationCircle />
                <span>{formErrors.email}</span>
              </div>
            )}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="phoneNumber">Phone Number</label>
            <div className={styles['input-container']}>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                className={styles['form-input']}
                placeholder="+2010XXXXXXXX"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                disabled={loading || googleLoading}
              />
            </div>
            {formErrors.phoneNumber && (
              <div className={styles['error-message']}>
                <FaExclamationCircle />
                <span>{formErrors.phoneNumber}</span>
              </div>
            )}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="gender">Gender</label>
            <div className={styles['input-container']}>
              <select
                id="gender"
                name="gender"
                className={styles['form-input']}
                value={formData.gender}
                onChange={handleInputChange}
                required
                disabled={loading || googleLoading}
                onMouseEnter={() => setGenderHovered(true)}
                onMouseLeave={() => setGenderHovered(false)}
              >
                <option value="" style={{ backgroundColor: 'white', color: 'black' }}>Select gender</option>
                <option value="male" style={{ backgroundColor: 'white', color: 'black' }}>Male</option>
                <option value="female" style={{ backgroundColor: 'white', color: 'black' }}>Female</option>
                <option value="other" style={{ backgroundColor: 'white', color: 'black' }}>Other</option>
              </select>
            </div>
            {formErrors.gender && (
              <div className={styles['error-message']}>
                <FaExclamationCircle />
                <span>{formErrors.gender}</span>
              </div>
            )}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="password">Password</label>
            <div className={styles['input-container']}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className={styles['form-input']}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                disabled={loading || googleLoading}
                autoComplete="new-password"
              />
              <button 
                type="button" 
                className={styles['password-toggle']} 
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || googleLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {formErrors.password && (
              <div className={styles['error-message']}>
                <FaExclamationCircle />
                <span>{formErrors.password}</span>
              </div>
            )}
            {formData.password && <PasswordValidationChecklist />}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={styles['input-container']}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                className={styles['form-input']}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                disabled={loading || googleLoading}
                autoComplete="new-password"
              />
              <button 
                type="button" 
                className={styles['password-toggle']} 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading || googleLoading}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {formErrors.confirmPassword && (
              <div className={styles['error-message']}>
                <FaExclamationCircle />
                <span>{formErrors.confirmPassword}</span>
              </div>
            )}
          </div>

          {apiError && (
            <div className={styles['error-message']} style={{ marginBottom: '16px' }}>
              <FaExclamationTriangle />
              <span>{apiError}</span>
            </div>
          )}

          <button 
            type="submit" 
            className={styles['submit-btn']} 
            disabled={loading || googleLoading}
          >
            {loading ? (
              <>
                <div className={styles.loading}></div>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <button 
            type="button" 
            className={styles['google-btn']} 
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <>
                <div className={styles.loading}></div>
                Connecting...
              </>
            ) : (
              <>
                <FcGoogle />
                Sign up with Google
              </>
            )}
          </button>

          <div className={styles['footer-links']}>
            Already have an account? <Link href="/Login">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUpForm;
