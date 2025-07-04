"use client";
import React, { useState, useRef } from "react";
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize } from "react-icons/fi";
import styles from "./VideoPlayer.module.css";

interface VideoPlayerProps {
    videoUrl: string;
    title?: string;
    className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);

    const formatTime = (time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (!isFullscreen) {
                if (videoRef.current.requestFullscreen) {
                    videoRef.current.requestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
            setIsFullscreen(!isFullscreen);
        }
    };

    const handleVideoClick = () => {
        handlePlayPause();
    };

    return (
        <div className={`${styles.videoPlayerContainer} ${className || ''}`}>
            {title && <h3 className={styles.videoTitle}>{title}</h3>}
            <div className={styles.videoWrapper}>
                <video
                    ref={videoRef}
                    className={styles.video}
                    onClick={handleVideoClick}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                >
                    <source src={videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                
                <div className={styles.controls}>
                    <div className={styles.progressBar}>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className={styles.progressSlider}
                        />
                        <div className={styles.timeDisplay}>
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                    
                    <div className={styles.controlButtons}>
                        <button onClick={handlePlayPause} className={styles.controlButton}>
                            {isPlaying ? <FiPause /> : <FiPlay />}
                        </button>
                        
                        <div className={styles.volumeControl}>
                            <button onClick={toggleMute} className={styles.controlButton}>
                                {isMuted ? <FiVolumeX /> : <FiVolume2 />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className={styles.volumeSlider}
                            />
                        </div>
                        
                        <button onClick={toggleFullscreen} className={styles.controlButton}>
                            {isFullscreen ? <FiMinimize /> : <FiMaximize />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer; 