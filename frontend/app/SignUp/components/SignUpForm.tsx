"use client";
import React, { useState } from "react";
import styles from "../../Login/page.module.css";
import { FcGoogle } from "react-icons/fc";
import styles1 from "../page.module.css";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { FiEye, FiEyeOff } from "react-icons/fi";

const SignUpPage = () => {
  const router = useRouter(); // Initialize the router
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "", // no default gender
  });
  const [otp, setOtp] = useState("");
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
  const [error, setError] = useState("");

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "firstName":
        if (!value) return "First name is required.";
        if (!/^[A-Za-z]+$/.test(value)) return "First name must contain only letters.";
        if (value.length < 2) return "First name must be at least 2 characters.";
        return "";
      case "lastName":
        if (!value) return "Last name is required.";
        if (!/^[A-Za-z]+$/.test(value)) return "Last name must contain only letters.";
        if (value.length < 2) return "Last name must be at least 2 characters.";
        return "";
      case "username":
        if (!value) return "Username is required.";
        if (value.length < 3) return "Username must be at least 3 characters.";
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Username can only contain letters, numbers, and underscores.";
        return "";
      case "phoneNumber":
        if (!value) return "Phone number is required.";
        // Egyptian phone numbers: +20(10|11|12|15) then 8 digits
        if (!/^\+20(10|11|12|15)\d{8}$/.test(value)) return "Phone number must be a valid Egyptian number (e.g., +2010XXXXXXXX).";
        return "";
      case "email":
        if (!value) return "Email is required.";
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return "Invalid email address.";
        return "";
      case "password":
        if (!value) return "Password is required.";
        if (value.length < 8) return "Password must be at least 8 characters.";
        if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter.";
        if (!/\d/.test(value)) return "Password must contain at least one number.";
        if (!/[!@#$%^&*(),.?\":{}|<>\[\]\\/~`_+=;'\-]/.test(value)) return "Password must contain at least one special character.";
        return "";
      case "confirmPassword":
        if (!value) return "Please confirm your password.";
        if (value !== formData.password) return "Passwords do not match.";
        return "";
      case "gender":
        if (!value) return "Gender is required.";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setFormErrors((prevErrors) => ({
      ...prevErrors,
      [name]: validateField(name, value),
    }));
  };

  const validateForm = () => {
    const errors: any = {};
    Object.keys(formData).forEach((key) => {
      errors[key] = validateField(key, (formData as any)[key]);
    });
    setFormErrors(errors);
    // Return true if no errors
    return Object.values(errors).every((err) => !err);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const data = new FormData();
    data.append("first_name", formData.firstName);
    data.append("last_name", formData.lastName);
    data.append("email", formData.email);
    data.append("username", formData.username);
    data.append("phone_number", formData.phoneNumber);
    data.append("password", formData.password);
    data.append("password_confirmation", formData.confirmPassword);
    data.append("gender", formData.gender);

    try {
      const response = await fetch("http://localhost:8081/auth/register", {
        method: "POST",
        body: data,
      });

      if (response.ok) {
        setStep(2);
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
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error during sign up:", error);
      setError("An error occurred. Please try again.");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError("OTP is required");
      return;
    }

    try {
      const data = new FormData();
      data.append("email", formData.email);
      data.append("otp", otp);

      const response = await fetch("http://localhost:8081/auth/verify-otp", {
        method: "POST",
        body: data,
      });

      if (response.ok) {
        alert("Email verified successfully!");
        router.push("/Login");
      } else {
        const errorData = await response.json();
        let errorMessage = "OTP verification failed.";
        
        if (errorData.detail) {
          if (typeof errorData.detail === 'object') {
            errorMessage = JSON.stringify(errorData.detail);
          } else {
            errorMessage = errorData.detail;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error during OTP verification:", error);
      setError("An error occurred during verification. Please try again.");
    }
  };

  return (
    <div className={styles1.mainContent}>
      <p className={styles.subtitle}>Welcome to MockPie!</p>
      <div className={styles1.SignUpBox}>
        {step === 1 ? (
          <>
            <div className={styles1.names}>
              <div className={styles.inputGroup}>
                <label>First name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={styles.input}
                />
                {formErrors.firstName && <div style={{ color: 'red', fontSize: '0.9em' }}>{formErrors.firstName}</div>}
              </div>
              <div className={styles.inputGroup}>
                <label>Last name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={styles.input}
                />
                {formErrors.lastName && <div style={{ color: 'red', fontSize: '0.9em' }}>{formErrors.lastName}</div>}
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={styles.input}
                placeholder="Choose a username"
              />
              {formErrors.username && <div style={{ color: 'red', fontSize: '0.9em' }}>{formErrors.username}</div>}
            </div>
            <div className={styles.inputGroup}>
              <label>Phone number</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={styles.input}
                placeholder="+2010XXXXXXXX"
              />
              {formErrors.phoneNumber && <div style={{ color: 'red', fontSize: '0.9em' }}>{formErrors.phoneNumber}</div>}
            </div>
            <div className={styles.inputGroup}>
              <label>Email</label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.input}
                placeholder="your@email.com"
              />
              {formErrors.email && <div style={{ color: 'red', fontSize: '0.9em' }}>{formErrors.email}</div>}
            </div>
            <div className={styles.inputGroup}>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2em',
                    color: '#888',
                    padding: 0,
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {formErrors.password && <div style={{ color: 'red', fontSize: '0.9em' }}>{formErrors.password}</div>}
            </div>
            <div className={styles.inputGroup}>
              <label>Confirm password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2em',
                    color: '#888',
                    padding: 0,
                  }}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {formErrors.confirmPassword && <div style={{ color: 'red', fontSize: '0.9em' }}>{formErrors.confirmPassword}</div>}
            </div>
            <div className={styles.inputGroup}>
              <label>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={styles1.genderSelect}
                style={{
                  color: formData.gender === "" ? '#888' : 'white',
                  backgroundColor: 'transparent'
                }}
              >
                <option value="" disabled style={{ color: 'black' }}>Select your gender</option>
                <option value="male" style={{ color: 'black' }}>Male</option>
                <option value="female" style={{ color: 'black' }}>Female</option>
                <option value="prefer_not_to_say" style={{ color: 'black' }}>Prefer not to say</option>
              </select>
              {formErrors.gender && <div style={{ color: 'red', fontSize: '0.9em' }}>{formErrors.gender}</div>}
            </div>
            {error && (
              <div style={{ color: 'red', marginBottom: 8 }}>
                {(() => {
                  try {
                    const arr = JSON.parse(error);
                    if (Array.isArray(arr)) {
                      return arr.map((e: any, i: number) =>
                        <div key={i}>
                          {e.loc?.[1] ? <b>{e.loc[1]}: </b> : null}{e.msg}
                        </div>
                      );
                    }
                  } catch {
                    return error;
                  }
                  return error;
                })()}
              </div>
            )}
            <button onClick={handleSubmit} className={styles.signInButton}>
              Sign up
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 10, color: 'green', fontWeight: 'bold' }}>
              A verification code has been sent to your email.
            </div>
            <div className={styles.inputGroup}>
              <label>Enter Verification Code</label>
              <input
                type="text"
                className={styles.input}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="Enter the code sent to your email"
              />
            </div>
            {error && (
              <div style={{ color: 'red', marginBottom: 8 }}>
                {(() => {
                  try {
                    const arr = JSON.parse(error);
                    if (Array.isArray(arr)) {
                      return arr.map((e: any, i: number) =>
                        <div key={i}>
                          {e.loc?.[1] ? <b>{e.loc[1]}: </b> : null}{e.msg}
                        </div>
                      );
                    }
                  } catch {
                    return error;
                  }
                  return error;
                })()}
              </div>
            )}
            <button onClick={handleVerifyOtp} className={styles.signInButton}>
              Verify Email
            </button>
          </>
        )}

        <div className={styles.footerText}>
          <div className={styles1.footerText}>
            <p>
              Have an account?{" "}
              <Link href="/Login" className={styles1.link}>
                Sign in
              </Link>
            </p>
          </div>
          {step === 1 && (
            <>
              <div className={styles1.or}>- OR -</div>
              <div
                className={styles.link}
                onClick={() => signIn("google")}
              >
                <div className={styles1.iconGoogle}>
                  <FcGoogle />
                </div>
                Sign up with Google
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
