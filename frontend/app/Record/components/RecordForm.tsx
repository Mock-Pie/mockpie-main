'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PresentationService from '../../services/presentationService';
import styles from '../page.module.css';

const RecordForm: React.FC = () => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('english');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Timer for recording duration
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      setError('Failed to access camera and microphone. Please check permissions.');
      console.error('Error accessing media devices:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startRecording = async () => {
    if (!stream) {
      await startCamera();
      return;
    }

    try {
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setRecordedBlob(blob);
        
        // Auto-generate title with timestamp
        if (!title) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          setTitle(`Recording ${timestamp}`);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      setError(null);
    } catch (err) {
      setError('Failed to start recording. Please try again.');
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (videoRef.current && recordedVideoUrl) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const retakeRecording = () => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
    setIsPlaying(false);
    setRecordingTime(0);
    chunksRef.current = [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recordedBlob) {
      setError('Please record a video first');
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

      // Convert blob to file
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
        type: 'video/webm'
      });

      const result = await PresentationService.uploadPresentation(
        file,
        title.trim(),
        language,
        isPublic,
        (progress) => setUploadProgress(progress)
      );

      if (result.success) {
        // Upload successful, clean up and redirect
        stopCamera();
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, []);

  return (
    <div className={styles.recordForm}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Record Presentation</h2>
        <p className={styles.formSubtitle}>
          Record your presentation directly and get AI-powered feedback
        </p>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {/* Video Recording Area */}
      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          className={styles.videoElement}
          muted={!recordedVideoUrl}
          autoPlay={!recordedVideoUrl}
          playsInline
          onEnded={() => setIsPlaying(false)}
        />
        
        {isRecording && (
          <div className={styles.recordingIndicator}>
            <div className={styles.recordingDot}></div>
            <span className={styles.recordingText}>REC {formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className={styles.cameraControls}>
        {!stream && !recordedVideoUrl && (
          <button
            type="button"
            onClick={startCamera}
            className={styles.startCameraButton}
            disabled={uploading}
          >
            Start Camera
          </button>
        )}

        {stream && !recordedVideoUrl && (
          <div className={styles.recordingControls}>
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`${styles.recordButton} ${isRecording ? styles.recording : ''}`}
              disabled={uploading}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            
            <button
              type="button"
              onClick={stopCamera}
              className={styles.stopCameraButton}
              disabled={uploading || isRecording}
            >
              Stop Camera
            </button>
          </div>
        )}

        {recordedVideoUrl && (
          <div className={styles.playbackControls}>
            <button
              type="button"
              onClick={togglePlayback}
              className={styles.playButton}
              disabled={uploading}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <button
              type="button"
              onClick={retakeRecording}
              className={styles.retakeButton}
              disabled={uploading}
            >
              Retake
            </button>
          </div>
        )}
      </div>

      {/* Recording Info */}
      {recordedBlob && (
        <div className={styles.recordingInfo}>
          <span>Duration: {formatTime(recordingTime)}</span>
          <span>Size: {formatFileSize(recordedBlob.size)}</span>
          <span>Format: WebM</span>
        </div>
      )}

      {/* Upload Form */}
      {recordedVideoUrl && (
        <form onSubmit={handleSubmit} className={styles.form}>
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
              disabled={uploading || !recordedBlob || !title.trim()}
            >
              {uploading ? 'Uploading...' : 'Upload Recording'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RecordForm; 