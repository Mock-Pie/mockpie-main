'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import UserService, { User } from '../../services/userService';

interface FormData {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    phone_number: string;
    gender: string;
}

interface FormErrors {
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
    phone_number?: string;
    gender?: string;
}

const ProfileForm = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        phone_number: '',
        gender: ''
    });

    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUserData();
        
        // Check for success message from email verification
        const successMessage = localStorage.getItem('profileUpdateSuccess');
        if (successMessage) {
            localStorage.removeItem('profileUpdateSuccess');
            alert(successMessage);
        }
        
        // Check for success message from URL parameters (password change)
        const urlParams = new URLSearchParams(window.location.search);
        const message = urlParams.get('message');
        if (message) {
            alert(message);
            // Clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const result = await UserService.getCurrentUser();
            
            if (result.success && result.data) {
                setUser(result.data);
                setFormData({
                    first_name: result.data.first_name || '',
                    last_name: result.data.last_name || '',
                    username: result.data.username || '',
                    email: result.data.email || '',
                    phone_number: result.data.phone_number || '',
                    gender: result.data.gender || ''
                });
                setError(null);
            } else {
                setError(result.error || 'Failed to load user data');
                if (result.error?.includes('Authentication expired')) {
                    router.push('/Login');
                }
            }
        } catch (err) {
            setError('Failed to fetch user data');
            console.error('Error fetching user data:', err);
        } finally {
            setLoading(false);
        }
    };

    const validateField = (name: string, value: string) => {
        switch (name) {
            case "first_name":
                if (!value) return "First name is required.";
                if (!/^[A-Za-z]+$/.test(value)) return "First name must contain only letters.";
                if (value.length < 2) return "First name must be at least 2 characters.";
                return "";
            case "last_name":
                if (!value) return "Last name is required.";
                if (!/^[A-Za-z]+$/.test(value)) return "Last name must contain only letters.";
                if (value.length < 2) return "Last name must be at least 2 characters.";
                return "";
            case "username":
                if (!value) return "Username is required.";
                if (value.length < 3) return "Username must be at least 3 characters.";
                if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Username can only contain letters, numbers, and underscores.";
                return "";
            case "phone_number":
                if (!value) return "Phone number is required.";
                // Egyptian phone numbers: +20(10|11|12|15) then 8 digits
                if (!/^\+20(10|11|12|15)\d{8}$/.test(value)) return "Phone number must be a valid Egyptian number (e.g., +2010XXXXXXXX).";
                return "";
            case "email":
                if (!value) return "Email is required.";
                if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return "Invalid email address.";
                return "";
            case "gender":
                if (!value) return "Gender is required.";
                return "";
            default:
                return "";
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setFormData((prev: FormData) => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field when user starts typing
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors((prev: FormErrors) => ({
                ...prev,
                [name]: ''
            }));
        }
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

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);
            
            // Prepare update data excluding email and gender (they're not changeable)
            const updateData = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                username: formData.username,
                phone_number: formData.phone_number,
                // Note: email and gender are excluded as they're not changeable
            };

            const result = await UserService.updateUser(updateData);
            
            if (result.success) {
                await fetchUserData(); // Refresh data
                alert('Profile updated successfully!');
            } else {
                setError(result.error || 'Failed to update profile');
                if (result.error?.includes('Authentication expired')) {
                    router.push('/Login');
                }
            }
        } catch (err) {
            setError('Failed to update profile');
            console.error('Error updating profile:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = () => {
        const confirmDelete = window.confirm(
            'Are you sure you want to delete your account? This action cannot be undone.'
        );
        
        if (confirmDelete) {
            const doubleConfirm = window.confirm(
                'This will permanently delete all your data. Are you absolutely sure?'
            );
            
            if (doubleConfirm) {
                // TODO: Implement delete account API call
                console.log('Delete account requested');
                alert('Delete account functionality will be implemented soon.');
            }
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 30) return `${diffDays} days ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
        return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
    };

    const getInitials = () => {
        if (!user) return '?';
        
        const firstInitial = user.first_name?.charAt(0)?.toUpperCase() || '';
        const lastInitial = user.last_name?.charAt(0)?.toUpperCase() || '';
        
        if (firstInitial && lastInitial) {
            return firstInitial + lastInitial;
        } else if (firstInitial) {
            return firstInitial;
        } else if (lastInitial) {
            return lastInitial;
        } else {
            return user.username?.charAt(0)?.toUpperCase() || '?';
        }
    };

    if (loading) {
        return (
            <div className={styles.profileContainer}>
                <div className={styles.loadingMessage}>Loading user profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.profileContainer}>
                <div className={styles.errorMessage}>
                    {error}
                    <button onClick={fetchUserData} className={styles.retryButton}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileHeader}>
                <div className={styles.profileImageSection}>
                    <div className={styles.profileImage}>
                        <div className={styles.initials}>{getInitials()}</div>
                    </div>
                    <div className={styles.profileInfo}>
                        <h3 className={styles.profileName}>
                            {user ? `${user.first_name} ${user.last_name}`.trim() || user.username : 'Unknown User'}
                        </h3>
                        <p className={styles.profileEmail}>{user?.email || 'No email available'}</p>
                    </div>
                </div>
                <button 
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>

            <div className={styles.formContainer}>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>First Name</label>
                        <input 
                            type="text" 
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            placeholder="Your First Name" 
                            className={styles.input} 
                        />
                        {formErrors.first_name && <div className={styles.errorText}>{formErrors.first_name}</div>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Last Name</label>
                        <input 
                            type="text" 
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            placeholder="Your Last Name" 
                            className={styles.input} 
                        />
                        {formErrors.last_name && <div className={styles.errorText}>{formErrors.last_name}</div>}
                    </div>
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Username</label>
                        <input 
                            type="text" 
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="Your Username" 
                            className={styles.input} 
                        />
                        {formErrors.username && <div className={styles.errorText}>{formErrors.username}</div>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Phone Number</label>
                        <input 
                            type="text" 
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleInputChange}
                            placeholder="+2010XXXXXXXX" 
                            className={styles.input} 
                        />
                        {formErrors.phone_number && <div className={styles.errorText}>{formErrors.phone_number}</div>}
                    </div>
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Email</label>
                        <div className={styles.emailVerificationContainer}>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="your@email.com" 
                                className={styles.input} 
                                disabled={true}
                                style={{ cursor: 'not-allowed', opacity: 0.7 }}
                                title="Email cannot be changed"
                            />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Gender</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            className={styles.select}
                            disabled={true}
                            style={{ 
                                cursor: 'not-allowed', 
                                opacity: 0.7,
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                                backgroundImage: 'none',
                                backgroundColor: 'white'
                            }}
                            title="Gender cannot be changed"
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <div className={styles.actionButtons}>
                    <button 
                        className={styles.changePasswordButton}
                        onClick={() => router.push('/ChangePassword')}
                    >
                        Change Password
                    </button>
                    <button 
                        className={styles.deleteAccountButton}
                        onClick={handleDeleteAccount}
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileForm;