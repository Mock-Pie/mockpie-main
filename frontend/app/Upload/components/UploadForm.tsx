'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PresentationService from '../../services/presentationService';
import styles from '../page.module.css';

const UploadForm: React.FC = () => {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('english');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please select a valid video file (MP4, AVI, MOV, WMV, WEBM)');
        return;
      }
      
      // Validate file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (selectedFile.size > maxSize) {
        setError('File size must be less than 100MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      
      // Auto-generate title from filename if not set
      if (!title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
        setTitle(fileName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a video file');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a presentation title');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      const result = await PresentationService.uploadPresentation(
        file,
        title.trim(),
        language,
        isPublic,
        (progress) => setUploadProgress(progress)
      );

      if (result.success) {
        // Upload successful, redirect to submitted trials
        router.push('/SubmittedTrials?upload=success');
      } else {
        setError(result.error || 'Upload failed');
        if (result.error?.includes('Authentication expired')) {
          router.push('/Login');
        }
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={styles.uploadForm}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Upload Presentation Video</h2>
        <p className={styles.formSubtitle}>
          Share your presentation to get AI-powered feedback and analysis
        </p>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* File Upload */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Video File *</label>
          <div className={styles.fileUploadContainer}>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className={styles.fileInput}
              disabled={uploading}
              id="video-upload"
            />
            <label htmlFor="video-upload" className={styles.fileUploadLabel}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {file ? file.name : 'Choose video file or drag and drop'}
            </label>
          </div>
          {file && (
            <div className={styles.fileInfo}>
              <span>Size: {formatFileSize(file.size)}</span>
              <span>Type: {file.type}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Presentation Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            placeholder="Enter presentation title"
            disabled={uploading}
            maxLength={255}
            required
          />
        </div>

        {/* Language */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={styles.select}
            disabled={uploading}
          >
            <option value="english">English</option>
            <option value="arabic">Arabic</option>
          </select>
        </div>

        {/* Visibility */}
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className={styles.checkbox}
              disabled={uploading}
            />
            Make this presentation public
          </label>
          <p className={styles.helpText}>
            Public presentations can be viewed by other users
          </p>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className={styles.progressText}>{uploadProgress}%</span>
          </div>
        )}

        {/* Submit Button */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.cancelButton}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={uploading || !file || !title.trim()}
          >
            {uploading ? 'Uploading...' : 'Upload Presentation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadForm; 