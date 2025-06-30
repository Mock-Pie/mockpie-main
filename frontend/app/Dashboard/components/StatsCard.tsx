import React from 'react';
import styles from '../page.module.css';

interface StatsCardProps {
  value: string | number;
  title: string;
  color: 'purple' | 'yellow';
  icon: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ value, title, color, icon, onClick, loading }) => {
  const colorClass = color === 'purple' ? styles.statsCardPurple : styles.statsCardYellow;
  
  return (
    <div className={`${styles.statsCard} ${colorClass} ${onClick ? styles.clickableCard : ''}`}>
      <div className={styles.statsInfo}>
        <h2 className={styles.statsValue}>
          {loading ? (
            <div className={styles.loadingDots}>
              <span>•</span><span>•</span><span>•</span>
            </div>
          ) : (
            value
          )}
        </h2>
        <h3 className={styles.sectionTitle}>{title}</h3>
        {onClick ? (
          <button className={styles.statsLink} onClick={onClick} disabled={loading}>
            View entire list
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '8px', transition: 'transform 0.3s ease' }}>
              <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
        <a className={styles.statsLink}>
          View entire list
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '8px', transition: 'transform 0.3s ease' }}>
            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
        )}
      </div>
      <div className={styles.statsIconContainer}>
        {icon}
      </div>
    </div>
  );
};

export default StatsCard;