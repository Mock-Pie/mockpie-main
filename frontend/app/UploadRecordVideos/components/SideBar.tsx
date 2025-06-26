"use client";
import React from "react";
import { FiFileText, FiUser } from "react-icons/fi";
import { AiOutlineAppstore, AiOutlineHome } from "react-icons/ai";
import { IoSettingsOutline } from "react-icons/io5";
import { TbLogout } from "react-icons/tb";
import Link from "next/link"; // Import Link from Next.js
import styles from "../page.module.css";
import { VscCalendar } from "react-icons/vsc";
import Image from "next/image";
import { signOut } from "next-auth/react";

const SideBar = () => {
    const handleLogout = async () => {
        try {
            // Get the access token from localStorage or sessionStorage
            const accessToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            
            if (accessToken) {
                // Call the backend logout API
                const response = await fetch("http://localhost:8081/auth/logout", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                });

                if (response.ok) {
                    console.log("Successfully logged out from backend");
                } else {
                    console.error("Failed to logout from backend");
                }
            }

            // Clear local storage/session storage
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');

            // Sign out from NextAuth (Google OAuth)
            await signOut({ redirect: false });

            // Redirect to login page
            window.location.href = "/Login";
        } catch (error) {
            console.error("Error during logout:", error);
            // Even if API call fails, still clear local data and redirect
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/Login";
        }
    };

    return (
        <div className={styles.sidebar}>
            <div className={styles.logo}>
                <Image src="/Images/Logoo.png" alt="Logo" width={120} height={40} className={styles.logoImage} priority />
            </div>
            <div className={styles.menu}>
                <Link href="/Dashboard" className={styles.menuItem}>
                    <div className={styles.tooltipContainer}>
                        <AiOutlineHome className={styles.icon} />
                        <span className={styles.tooltip}>Dashboard</span>
                    </div>
                </Link>
                <Link href="/UploadRecordVideos" className={styles.menuItem}>
                    <div className={styles.tooltipContainer}>
                        <AiOutlineAppstore className={styles.icon} />
                        <span className={styles.tooltip}>Upload or Record</span>
                    </div>
                </Link>
                <Link href="/SubmittedTrials" className={styles.menuItem}>
                    <div className={styles.tooltipContainer}>
                        <FiFileText className={styles.icon} />
                        <span className={styles.tooltip}>Submitted Trials</span>
                    </div>
                </Link>
                <Link href="/Calendar" className={styles.menuItem}>
                    <div className={styles.tooltipContainer}>
                        <VscCalendar className={styles.icon} />
                        <span className={styles.tooltip}>Calendar</span>
                    </div>
                </Link>
                <Link href="/ProfileInfo" className={styles.menuItem}>
                    <div className={styles.tooltipContainer}>
                        <FiUser className={styles.icon} />
                        <span className={styles.tooltip}>Profile</span>
                    </div>
                </Link>
                {/* <div className={styles.menuItem}>
                    <div className={styles.tooltipContainer}>
                        <IoSettingsOutline className={styles.icon} />
                        <span className={styles.tooltip}>Settings</span>
                    </div>
                </div> */}
                <div className={styles.menuItem} onClick={handleLogout} style={{ cursor: 'pointer' }}>
                    <div className={styles.tooltipContainer}>
                        <TbLogout className={styles.icon} />
                        <span className={styles.tooltip}>Logout</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SideBar;