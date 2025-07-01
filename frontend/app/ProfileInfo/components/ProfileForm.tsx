'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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

    // Auto-hide success message after 5 seconds
    useEffect(() => {
        if (showSuccessMessage) {
            const timer = setTimeout(() => {
                setShowSuccessMessage(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showSuccessMessage]);

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
        
        // Also clear general error if user is actively editing
        if (error) {
            setError(null);
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
            clearFieldErrors(); // Clear any existing errors
            
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
                setSuccessMessage('Profile updated successfully!');
                setShowSuccessMessage(true);
            } else {
                // Check if this is a field-specific error
                const fieldErrors = parseFieldErrors(result.error || '');
                
                if (Object.keys(fieldErrors).length > 0) {
                    // Display field-specific errors
                    setFormErrors(fieldErrors);
                    setError(null);
                } else {
                    // Display general error
                    setError(result.error || 'Failed to update profile');
                    if (result.error?.includes('Authentication expired')) {
                        router.push('/Login');
                    }
                }
            }
        } catch (err) {
            clearFieldErrors();
            setError('Failed to update profile');
            console.error('Error updating profile:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = () => {
        setShowDeleteModal(true);
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
    };

    const handleConfirmDelete = async () => {
                try {
                    setSaving(true);
                    const result = await UserService.deleteUser();
                    
                    if (result.success) {
                        // Clear all local storage
                        localStorage.clear();
                        sessionStorage.clear();
                        
                        // Hide delete modal and show success modal
                        setShowDeleteModal(false);
                        setShowSuccessModal(true);
                        
                        // Redirect to login page after 3 seconds
                        setTimeout(() => {
                        router.push('/Login');
                        }, 3000);
                    } else {
                        setError(result.error || 'Failed to delete account');
                        if (result.error?.includes('Authentication expired')) {
                            router.push('/Login');
                        }
                    }
                } catch (err) {
                    setError('Failed to delete account. Please try again.');
                    console.error('Error deleting account:', err);
                } finally {
                    setSaving(false);
            setShowDeleteModal(false);
        }
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        router.push('/Login');
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

    // Helper function to parse field-specific errors from API responses
    const parseFieldErrors = (errorMessage: string) => {
        const fieldErrors: FormErrors = {};
        
        if (errorMessage.includes('FIELD_ERROR:')) {
            const errors = errorMessage.split('|');
            errors.forEach(error => {
                if (error.startsWith('FIELD_ERROR:')) {
                    const parts = error.split(':');
                    if (parts.length >= 3) {
                        const field = parts[1];
                        const message = parts.slice(2).join(':');
                        fieldErrors[field as keyof FormErrors] = message;
                    }
                }
            });
        }
        
        return fieldErrors;
    };

    // Helper function to clear field-specific errors
    const clearFieldErrors = () => {
        setFormErrors({});
        setError(null);
    };

    // Helper function to determine if an error is a duplicate data error
    const isDuplicateDataError = (errorMessage: string) => {
        return errorMessage && (
            errorMessage.toLowerCase().includes('already taken') ||
            errorMessage.toLowerCase().includes('already registered') ||
            errorMessage.toLowerCase().includes('already exists')
        );
    };

    // Helper function to get error display class
    const getErrorDisplayClass = (field: keyof FormErrors) => {
        const errorMessage = formErrors[field];
        if (!errorMessage) return styles.errorText;
        
        return isDuplicateDataError(errorMessage) 
            ? styles.duplicateDataError 
            : styles.errorText;
    };

    // Helper function to get input class names
    const getInputClassName = (field: keyof FormErrors) => {
        const hasError = formErrors[field];
        return hasError 
            ? `${styles.input} ${styles.hasError}` 
            : styles.input;
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

            {/* Success message display */}
            {showSuccessMessage && (
                <div className={styles.successSection}>
                    <div className={styles.successIcon}>✅</div>
                    <div className={styles.successText}>{successMessage}</div>
                    <button 
                        className={styles.successCloseButton}
                        onClick={() => setShowSuccessMessage(false)}
                        aria-label="Close success message"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Information section about data validation */}
            {Object.keys(formErrors).some(key => formErrors[key as keyof FormErrors] && isDuplicateDataError(formErrors[key as keyof FormErrors] || '')) && (
                <div className={styles.infoSection}>
                    <div className={styles.infoIcon}>ℹ️</div>
                    <div className={styles.infoText}>
                        Some of your information conflicts with existing user data. Please update the highlighted fields with unique values.
                    </div>
                </div>
            )}

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
                            className={getInputClassName('first_name')} 
                        />
                        {formErrors.first_name && <div className={getErrorDisplayClass('first_name')}>{formErrors.first_name}</div>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Last Name</label>
                        <input 
                            type="text" 
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            placeholder="Your Last Name" 
                            className={getInputClassName('last_name')} 
                        />
                        {formErrors.last_name && <div className={getErrorDisplayClass('last_name')}>{formErrors.last_name}</div>}
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
                            className={getInputClassName('username')} 
                        />
                        {formErrors.username && <div className={getErrorDisplayClass('username')}>{formErrors.username}</div>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Phone Number</label>
                        <input 
                            type="text" 
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleInputChange}
                            placeholder="+2010XXXXXXXX" 
                            className={getInputClassName('phone_number')} 
                        />
                        {formErrors.phone_number && <div className={getErrorDisplayClass('phone_number')}>{formErrors.phone_number}</div>}
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
                                className={getInputClassName('email')} 
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
                            className={getInputClassName('gender')}
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
                        disabled={saving}
                    >
                        Change Password
                    </button>
                    <button 
                        className={styles.deleteAccountButton}
                        onClick={handleDeleteAccount}
                        disabled={saving}
                    >
                        {saving ? 'Deleting...' : 'Delete Account'}
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.deleteModal}>
                        <div className={styles.modalContent}>
                            <h3 className={styles.modalTitle}>
                                Confirm Account Deletion
                            </h3>
                            <p className={styles.modalMessage}>
                                Are you sure you want to delete your account?
                            </p>
                            <div className={styles.modalActions}>
                                <button 
                                    className={styles.cancelButton} 
                                    onClick={handleCancelDelete}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className={styles.deleteButton} 
                                    onClick={handleConfirmDelete}
                                    disabled={saving}
                                >
                                    {saving ? 'Deleting...' : 'Delete Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.successModal}>
                        <div className={styles.modalContent}>
                            <div className={styles.successIcon}>
                                <svg 
                                    className={styles.checkmark} 
                                    viewBox="0 0 52 52"
                                    fill="none" 
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle 
                                        className={styles.checkmarkCircle} 
                                        cx="26" 
                                        cy="26" 
                                        r="25" 
                                        fill="none"
                                        stroke="#22c55e"
                                        strokeWidth="2"
                                    />
                                    <path 
                                        className={styles.checkmarkCheck} 
                                        fill="none" 
                                        stroke="#22c55e" 
                                        strokeWidth="3" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        d="M14.5 26.5l7.5 7.5 15.5-15.5"
                                    />
                                </svg>
                            </div>
                            <h3 className={styles.successTitle}>
                                Account Deleted Successfully!
                            </h3>
                            <p className={styles.successMessage}>
                                Your account has been permanently deleted. You will be redirected to the login page in a few seconds.
                            </p>
                            <div className={styles.successActions}>
                                <button 
                                    className={styles.redirectButton} 
                                    onClick={handleSuccessModalClose}
                                >
                                    Go to Login Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileForm;