import React, { useState, useEffect } from 'react';
import styles from '../page.module.css';

interface Presentation {
  id: string;
  topic: string;
  date: string;
  time: string;
  description: string;
  type: 'past' | 'upcoming';
  language?: string;
}

interface CalendarWidgetProps {
  submittedTrials: any[];
  upcomingPresentations: any[];
  onPresentationClick?: (presentation: Presentation) => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ 
  submittedTrials, 
  upcomingPresentations, 
  onPresentationClick 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [presentations, setPresentations] = useState<Presentation[]>([]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    // Convert submitted trials to presentation format
    const mappedTrials: Presentation[] = submittedTrials.map((trial) => ({
      id: trial.id?.toString() || Math.random().toString(),
      topic: trial.title || trial.topic || 'Submitted Trial',
      date: trial.uploaded_at ? new Date(trial.uploaded_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      time: trial.uploaded_at ? new Date(trial.uploaded_at).toTimeString().slice(0, 5) : '00:00',
      description: `Submitted trial - ${trial.title || 'Presentation'}`,
      type: 'past' as const,
      language: 'english'
    }));

    // Convert upcoming presentations
    const mappedUpcoming: Presentation[] = upcomingPresentations.map((upcoming) => ({
      id: upcoming.id || Math.random().toString(),
      topic: upcoming.topic || 'Upcoming Presentation',
      date: upcoming.date || new Date().toISOString().split('T')[0],
      time: upcoming.time || '00:00',
      description: upcoming.description || 'Upcoming presentation',
      type: 'upcoming' as const,
      language: upcoming.language || 'english'
    }));

    setPresentations([...mappedTrials, ...mappedUpcoming]);
  }, [submittedTrials, upcomingPresentations]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getPresentationsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return presentations.filter(presentation => presentation.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className={styles.calendarSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Calendar</h3>
        <div className={styles.monthNavigation}>
          <button 
            className={styles.navButton}
            onClick={() => navigateMonth('prev')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className={styles.monthSelector}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button 
            className={styles.navButton}
            onClick={() => navigateMonth('next')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className={styles.calendarHeader}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={index} className={styles.dayLabel}>{day}</div>
        ))}
      </div>
      
      <div className={styles.calendarGrid}>
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className={styles.emptyDay}></div>;
          }

          const dayPresentations = getPresentationsForDate(day);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`${styles.calendarDay} ${isTodayDate ? styles.currentDay : styles.otherDay} ${
                dayPresentations.length > 0 ? styles.hasPresentation : ''
              }`}
              onClick={() => {
                if (dayPresentations.length > 0 && onPresentationClick) {
                  onPresentationClick(dayPresentations[0]);
                }
              }}
              title={dayPresentations.length > 0 ? 
                `${dayPresentations.length} presentation${dayPresentations.length > 1 ? 's' : ''}: ${dayPresentations.map(p => p.topic).join(', ')}` : 
                ''
              }
            >
              <span className={styles.dayNumber}>{day.getDate()}</span>
              {dayPresentations.length > 0 && (
                <div className={styles.presentationIndicators}>
                  {dayPresentations.slice(0, 2).map(presentation => (
                    <div
                      key={presentation.id}
                      className={`${styles.presentationDot} ${
                        presentation.type === 'past' ? styles.pastDot : styles.upcomingDot
                      }`}
                    />
                  ))}
                  {dayPresentations.length > 2 && (
                    <div className={styles.moreIndicator}>+{dayPresentations.length - 2}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarWidget;