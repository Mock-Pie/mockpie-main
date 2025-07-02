import React from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

interface PresentationData {
  id: string | number;
  title?: string;
  topic?: string;
  date: string;
  status: 'presented' | 'pending' | 'upcoming';
  type: 'submitted' | 'upcoming';
  company?: string;
  uploaded_at?: string;
  time?: string;
}

interface PresentationTableProps {
  submittedTrials: any[];
  upcomingPresentations: any[];
  loading?: boolean;
  onRefresh?: () => void;
}

const PresentationTable: React.FC<PresentationTableProps> = ({ 
  submittedTrials, 
  upcomingPresentations, 
  loading = false,
  onRefresh 
}) => {
  const router = useRouter();

  // Combine and transform data
  const combineData = (): PresentationData[] => {
    const combined: PresentationData[] = [];

    // Add submitted trials (completed presentations)
    submittedTrials.forEach((trial, index) => {
      combined.push({
        id: trial.id || `trial_${index}`,
        title: trial.title,
        company: trial.title || `Presentation ${trial.id || index + 1}`,
        date: new Date(trial.uploaded_at).toLocaleDateString('en-GB'),
        status: 'presented',
        type: 'submitted'
      });
    });

    // Add upcoming presentations
    upcomingPresentations.forEach((presentation, index) => {
      combined.push({
        id: presentation.id || `upcoming_${index}`,
        topic: presentation.topic,
        company: presentation.topic || `Upcoming ${index + 1}`,
        date: new Date(presentation.date).toLocaleDateString('en-GB'),
        status: 'upcoming',
        type: 'upcoming',
        time: presentation.time
      });
    });

    // Sort by date (newest first for submitted, upcoming first for future)
    return combined.sort((a, b) => {
      if (a.type === 'upcoming' && b.type === 'submitted') return -1;
      if (a.type === 'submitted' && b.type === 'upcoming') return 1;
      
      const dateA = new Date(a.date.split('/').reverse().join('-'));
      const dateB = new Date(b.date.split('/').reverse().join('-'));
      
      if (a.type === 'upcoming') {
        return dateA.getTime() - dateB.getTime(); // Upcoming: earliest first
      } else {
        return dateB.getTime() - dateA.getTime(); // Submitted: newest first
      }
    });
  };

  const combinedData = combineData();
  const activeCount = upcomingPresentations.length;

  const getCompanyInitial = (company: string): string => {
    return company.charAt(0).toUpperCase();
  };

  const getCompanyColor = (index: number): string => {
    const colors = [
      'linear-gradient(135deg, #FF6B35, #F7931E)',
      'linear-gradient(135deg, #66CCFF, #3399CC)',
      'linear-gradient(135deg, #99FF66, #66CC33)',
      'linear-gradient(135deg, #FF66B2, #CC3399)',
      'linear-gradient(135deg, #FFCC66, #FF9933)',
      'linear-gradient(135deg, #66FFCC, #33CC99)'
    ];
    return colors[index % colors.length];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'presented':
        return <span className={styles.statusPresented}>✅ Presented</span>;
      case 'upcoming':
        return <span className={styles.statusUpcoming}>🔜 Upcoming</span>;
      case 'pending':
        return <span className={styles.statusPending}>⏳ Pending</span>;
      default:
        return <span className={styles.statusPending}>⏳ Unknown</span>;
    }
  };

  const handleView = (item: PresentationData) => {
    // Always redirect to Submitted Trials when View is clicked
    router.push('/SubmittedTrials');
  };

  const handleAction = (item: PresentationData) => {
    // Always redirect to Feedback when Report is clicked
    router.push('/Feedback');
  };

  const handleAddNew = () => {
    router.push('/Calendar');
  };

  const handleFilter = () => {
    // Implement filter functionality
    console.log('Filter clicked');
  };

  if (loading) {
    return (
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 className={styles.sectionTitle}>📋 Recent Presentations</h3>
            <span style={{ 
              background: 'rgba(255, 214, 10, 0.2)', 
              color: 'var(--naples-yellow)', 
              padding: '4px 12px', 
              borderRadius: '12px', 
              fontSize: '12px', 
              fontWeight: '600' 
            }}>
              Loading...
            </span>
          </div>
        </div>
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: 'var(--light-grey)' 
        }}>
          Loading presentations...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 className={styles.sectionTitle}>📋 Recent Presentations</h3>
          <span style={{ 
            background: 'rgba(255, 214, 10, 0.2)', 
            color: 'var(--naples-yellow)', 
            padding: '4px 12px', 
            borderRadius: '12px', 
            fontSize: '12px', 
            fontWeight: '600' 
          }}>
            {activeCount} Active
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className={styles.filterButton} onClick={handleFilter}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" fill="currentColor"/>
            </svg>
            <span>Filter</span>
          </button>
          <button className={styles.filterButton} onClick={handleAddNew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Add New</span>
          </button>
        </div>
      </div>
      
      {combinedData.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: 'var(--light-grey)',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          margin: '16px 0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--white)' }}>No presentations yet</h4>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px' }}>
            Start by uploading a video or scheduling an upcoming presentation
          </p>
          <button 
            onClick={handleAddNew}
            style={{
              background: 'var(--naples-yellow)',
              color: 'var(--raisin-black)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Get Started
          </button>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeaderRow}>
              <th className={styles.tableHeaderCell}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📄 ID
                </div>
              </th>
              <th className={styles.tableHeaderCell}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🏢 Title/Topic
                </div>
              </th>
              <th className={styles.tableHeaderCell}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📅 Date
                </div>
              </th>
              <th className={styles.tableHeaderCell}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📊 Status
                </div>
              </th>
              <th className={styles.tableHeaderCell}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚡ Actions
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {combinedData.slice(0, 4).map((item, index) => (
              <tr key={item.id} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                    #{typeof item.id === 'string' ? item.id.slice(-6) : item.id}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      background: getCompanyColor(index), 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'white'
                    }}>
                      {getCompanyInitial(item.company || '')}
                    </div>
                    <span style={{ fontWeight: '600' }}>
                      {item.company}
                      {item.time && (
                        <span style={{ 
                          fontSize: '12px', 
                          color: 'var(--light-grey)', 
                          marginLeft: '8px' 
                        }}>
                          {item.time}
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className={styles.tableCell}>{item.date}</td>
                <td className={styles.tableCell}>
                  {getStatusBadge(item.status)}
                </td>
                <td className={styles.tableCell}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleView(item)}
                      style={{ 
                        background: 'rgba(0, 255, 204, 0.2)', 
                        border: '1px solid rgba(0, 255, 204, 0.3)', 
                        color: 'var(--aqua)', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      👁️ View
                    </button>
                                         <button 
                       onClick={() => handleAction(item)}
                       style={{ 
                         background: 'rgba(76, 175, 80, 0.2)', 
                         border: '1px solid rgba(76, 175, 80, 0.3)', 
                         color: '#4CAF50', 
                         padding: '4px 8px', 
                         borderRadius: '6px', 
                         fontSize: '12px',
                         cursor: 'pointer'
                       }}
                     >
                       📊 Report
                     </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
             {combinedData.length > 4 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button 
            onClick={() => router.push('/SubmittedTrials')}
            style={{
              background: 'none',
              border: '1px solid rgba(255, 214, 10, 0.3)',
              color: 'var(--naples-yellow)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            View All Presentations ({combinedData.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default PresentationTable;