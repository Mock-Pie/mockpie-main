import React from 'react';
import styles from '../page.module.css';

interface StatsCardProps {
  value: string | number;
  title: string;
  color: 'purple' | 'yellow';
  icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ value, title, color, icon }) => {
  const colorClass = color === 'purple' ? styles.statsCardPurple : styles.statsCardYellow;
  
  return (
    <div className={`${styles.statsCard} ${colorClass}`}>
      <div className={styles.statsInfo}>
        <h2 className={styles.statsValue}>{value}</h2>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <a className={styles.statsLink}>View entire list</a>
      </div>
      <div>
        {icon}
      </div>
    </div>
  );
};

export default StatsCard;