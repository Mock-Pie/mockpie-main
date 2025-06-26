"use client";
import React, { useState, useEffect } from "react";
import { FiFileText, FiUser } from "react-icons/fi";
import { AiOutlineAppstore, AiOutlineHome } from "react-icons/ai";
import { IoSettingsOutline } from "react-icons/io5";
import { TbLogout } from "react-icons/tb";
import Link from "next/link";
import styles from "../page.module.css";
import { VscCalendar } from "react-icons/vsc";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const SideBar = () => {
    const pathname = usePathname();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const menuItems = [
        { href: "/Dashboard", icon: AiOutlineHome, label: "Dashboard" },
        { href: "/UploadRecordVideos", icon: AiOutlineAppstore, label: "Upload or Record" },
        { href: "/SubmittedTrials", icon: FiFileText, label: "Submitted Trials" },
        { href: "/Calendar", icon: VscCalendar, label: "Calendar" },
        { href: "/ProfileInfo", icon: FiUser, label: "Profile" },
    ];

    const handleLogout = async () => {
        if (isLoggingOut) return; // Prevent multiple clicks
        
        setIsLoggingOut(true);
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
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div className={styles.sidebar}>
            <div className={styles.logoContainer}>
                <Image 
                    src="/Images/Logoo.png" 
                    alt="Logo" 
                    width={120} 
                    height={40} 
                    className={styles.logoImage} 
                    priority 
                />
            </div>
            
            <nav className={styles.navigation}>
                <div className={styles.menu}>
                    {menuItems.map((item) => {
                        const IconComponent = item.icon;
                        const isActive = pathname === item.href;
                        
                        return (
                            <Link 
                                key={item.href} 
                                href={item.href} 
                                className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
                            >
                                <div className={styles.tooltipContainer}>
                                    <IconComponent className={styles.icon} />
                                    <span className={styles.tooltip}>{item.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
                
                <div className={styles.logoutSection}>
                    <div 
                        className={`${styles.menuItem} ${styles.logoutItem} ${isLoggingOut ? styles.loggingOut : ''}`}
                        onClick={handleLogout}
                    >
                        <div className={styles.tooltipContainer}>
                            <TbLogout className={styles.icon} />
                            <span className={styles.tooltip}>
                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                            </span>
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default SideBar;