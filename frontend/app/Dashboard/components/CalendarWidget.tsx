import React from 'react';
import styles from '../page.module.css';

const CalendarWidget = () => {
  return (
    <div className={styles.calendarSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Calendar</h3>
        <button className={styles.monthSelector}>
          <span>February 2023</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div className={styles.calendarHeader}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={index} className={styles.dayLabel}>{day}</div>
        ))}
      </div>
      
      <div className={styles.calendarGrid}>
        {/* Week 1 */}
        {[27, 28, 29, 30, 31, 1, 2].map((day, index) => (
          <div key={index} className={`${styles.calendarDay} ${day < 27 ? styles.currentDay : day < 1 ? styles.inactiveDay : styles.otherDay}`}>
            {day}
          </div>
        ))}
        
        {/* Week 2 */}
        {[3, 4, 5, 6, 7, 8, 9].map((day, index) => (
          <div key={index} className={`${styles.calendarDay} ${day === 7 ? styles.currentDay : styles.otherDay}`}>
            {day}
          </div>
        ))}
        
        {/* Week 3 */}
        {[10, 11, 12, 13, 14, 15, 16].map((day, index) => (
          <div key={index} className={`${styles.calendarDay} ${styles.otherDay}`}>
            {day}
          </div>
        ))}
        
        {/* Week 4 */}
        {[17, 18, 19, 20, 21, 22, 23].map((day, index) => (
          <div key={index} className={`${styles.calendarDay} ${styles.otherDay}`}>
            {day}
          </div>
        ))}
        
        {/* Week 5 */}
        {[24, 25, 26, 27, 28, 1, 2].map((day, index) => (
          <div key={index} className={`${styles.calendarDay} ${day > 28 ? styles.inactiveDay : styles.otherDay}`}>
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarWidget;