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
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "male", // default gender
  });
  const [formErrors, setFormErrors] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // Combine first and last name for username
    const username = `${formData.firstName} ${formData.lastName}`.trim();

    // Prepare FormData for x-www-form-urlencoded or multipart/form-data
    const data = new FormData();
    data.append("email", formData.email);
    data.append("username", username);
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
        alert("Sign up successful!");
        router.push("/Login"); // Navigate to the login page
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || errorData.message}`);
      }
    } catch (error) {
      console.error("Error during sign up:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className={styles1.mainContent}>
      <p className={styles.subtitle}>Welcome to MockPie!</p>
      <div className={styles1.SignUpBox}>
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
          <label>Phone number</label>
          <input
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className={styles.input}
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
            className={styles.input}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
          {formErrors.gender && <div style={{ color: 'red', fontSize: '0.9em' }}>{formErrors.gender}</div>}
        </div>
        <button onClick={handleSubmit} className={styles.signInButton}>
          Sign up
        </button>

        <div className={styles.footerText}>
          <div className={styles1.footerText}>
            <p>
              Have an account?{" "}
              <Link href="/Login" className={styles1.link}>
                Sign in
              </Link>
            </p>
          </div>
          <div className={styles1.or}>- OR -</div>
          <div
            className={styles.link}
            onClick={() => signIn("google")} // Trigger Google OAuth
          >
            <div className={styles1.iconGoogle}>
              <FcGoogle />
            </div>
            Sign up with Google
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
