import React from 'react';
import styles from '../page.module.css';
import { FiMail, FiPlus } from 'react-icons/fi';

const ProfileForm = () => {
    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileHeader}>
                <div className={styles.profileImageSection}>
                    <div className={styles.profileImage}>
                        <img src="/Images/avatar.png" alt="Profile" />
                    </div>
                    <div className={styles.profileInfo}>
                        <h3 className={styles.profileName}>Alexa Rawles</h3>
                        <p className={styles.profileEmail}>alexarawles@gmail.com</p>
                    </div>
                </div>
                <button className={styles.saveButton}>Save</button>
            </div>

            <div className={styles.formContainer}>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Full Name</label>
                        <input type="text" placeholder="Your Name" className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Nick Name</label>
                        <input type="text" placeholder="Your Nick Name" className={styles.input} />
                    </div>
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Gender</label>
                        <select className={styles.select}>
                            <option value="">Your Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Country</label>
                        <select className={styles.select}>
                            <option value="">Your Country</option>
                            <option value="us">United States</option>
                            <option value="uk">United Kingdom</option>
                            <option value="ca">Canada</option>
                            <option value="au">Australia</option>
                        </select>
                    </div>
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Language</label>
                        <select className={styles.select}>
                            <option value="">Select Preferred Languages</option>
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Time Zone</label>
                        <select className={styles.select}>
                            <option value="">Select Time Zone</option>
                            <option value="est">Eastern Standard Time (EST)</option>
                            <option value="cst">Central Standard Time (CST)</option>
                            <option value="mst">Mountain Standard Time (MST)</option>
                            <option value="pst">Pacific Standard Time (PST)</option>
                        </select>
                    </div>
                </div>

                <div className={styles.emailSection}>
                    <h3 className={styles.sectionTitle}>My email Address</h3>
                    <div className={styles.emailItem}>
                        <div className={styles.emailIcon}>
                            <FiMail />
                        </div>
                        <div className={styles.emailDetails}>
                            <p className={styles.emailAddress}>alexarawles@gmail.com</p>
                            <p className={styles.emailTimestamp}>1 month ago</p>
                        </div>
                    </div>
                    <button className={styles.addEmailButton}>
                        <FiPlus /> Add Email Address
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileForm;