import React from "react";
import { FiMessageSquare, FiFileText , FiUser} from "react-icons/fi";
import {AiOutlineAppstore, AiOutlineHome} from "react-icons/ai";
import { IoSettingsOutline } from "react-icons/io5";
import styles from "../page.module.css";



const SideBar = () => {
    return (
<div className={styles.sidebar}>
    <div className={styles.logo}>
          <img src="/Images/logo.png" className={styles.logoImage}/>
        </div>
        <div className={styles.menu}>
          <div className={styles.menuItem}><AiOutlineHome className={styles.icon} /></div>
          <div className={styles.menuItem}><AiOutlineAppstore className={styles.icon} /></div>
          <div className={styles.menuItem}><FiFileText className={styles.icon} /></div>
          <div className={styles.menuItem}>< FiMessageSquare className={styles.icon} /></div>    
          <div className={styles.menuItem}><FiUser className={styles.icon} /></div>
          <div className={styles.menuItem}>< IoSettingsOutline className={styles.icon} /></div>
    </div>
 </div>
  );
};

export default SideBar;