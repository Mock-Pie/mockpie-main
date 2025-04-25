import React from "react";
import { FiFileText, FiUser } from "react-icons/fi";
import { AiOutlineAppstore, AiOutlineHome } from "react-icons/ai";
import { IoSettingsOutline } from "react-icons/io5";
import { TbLogout } from "react-icons/tb";
import Link from "next/link"; // Import Link from Next.js
import styles from "../../Login/page.module.css";
import { VscCalendar } from "react-icons/vsc";

const SideBar = () => {
    return (
        <div className={styles.sidebar}>
            <div className={styles.logo}>
                <img src="/Images/logo.png" className={styles.logoImage} />
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
                <div className={styles.menuItem}>
                    <div className={styles.tooltipContainer}>
                        <IoSettingsOutline className={styles.icon} />
                        <span className={styles.tooltip}>Settings</span>
                    </div>
                </div>
                <Link href="/Login" className={styles.menuItem}>
                    <div className={styles.tooltipContainer}>
                        <TbLogout className={styles.icon} />
                        <span className={styles.tooltip}>Logout</span>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default SideBar;