"use client";
import React, { useState } from "react";
import styles from "../../Login/page.module.css";
import { FcGoogle } from "react-icons/fc";
import styles1 from "../page.module.css";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation"; // Import useRouter for navigation

const SignUpPage = () => {
  const router = useRouter(); // Initialize the router
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Sign up successful!");
        router.push("/Login"); // Navigate to the login page
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
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
        </div>
        <div className={styles.inputGroup}>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Confirm password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={styles.input}
          />
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
