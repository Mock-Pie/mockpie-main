import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import PresentationService, { Presentation } from '../../services/presentationService';

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
  // submittedTrials, 
  // upcomingPresentations, 
  loading = false,
  onRefresh 
}) => {
  const router = useRouter();

  // State for recent presentations
  const [recentPresentations, setRecentPresentations] = useState<Presentation[]>([]);
  const [loadingState, setLoadingState] = useState<boolean>(true);

  useEffect(() => {
    const fetchRecent = async () => {
      setLoadingState(true);
      const response = await PresentationService.getUserPresentations();
      if (response.success && response.data) {
        const presentationsData = (response.data as any).videos || [];
        // Filter to only submitted presentations (uploaded_at <= now)
        const now = new Date();
        const submitted = presentationsData.filter((p: any) => new Date(p.uploaded_at) <= now);
        // Sort by uploaded_at descending (most recent first)
        const sorted = submitted.sort((a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
        // Take the 4 most recent
        const top4 = sorted.slice(0, 4);
        // Fetch feedback for each
        const withScores = await Promise.all(
          top4.map(async (presentation: Presentation) => {
            try {
              const feedbackResponse = await fetch(`http://localhost:8081/feedback/presentation/${presentation.id}/feedback`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                  'Content-Type': 'application/json',
                },
              });
              if (feedbackResponse.ok) {
                const feedbackData = await feedbackResponse.json();
                const enhanced = feedbackData.enhanced_feedback || {};
                const overallScore = enhanced.overall_score || feedbackData.overall_score || feedbackData.score || null;
                return { ...presentation, overall_score: overallScore };
              } else {
                return { ...presentation, overall_score: undefined };
              }
            } catch {
              return { ...presentation, overall_score: undefined };
            }
          })
        );
        setRecentPresentations(withScores);
      } else {
        setRecentPresentations([]);
      }
      setLoadingState(false);
    };
    fetchRecent();
  }, []);

  // Only show the 4 most recent presentations
  const displayedData = recentPresentations;

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

  // Add delete handler
  const handleDelete = async (presentationId: number) => {
    if (!window.confirm('Are you sure you want to delete this presentation?')) return;
    await PresentationService.deletePresentation(presentationId);
    // Refresh the list after deletion
    setRecentPresentations(prev => prev.filter(p => p.id !== presentationId));
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
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className={styles.filterButton} onClick={handleAddNew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Add New</span>
          </button>
        </div>
      </div>
      
      {displayedData.length === 0 ? (
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
            {displayedData.map((item, index) => (
              <tr key={item.id} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                    #{typeof item.id === 'string' ? item.id.slice(-6) : item.id}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--white)' }}>
                        {item.title || 'Untitled'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={styles.tableCell}>{item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString('en-GB') : ''}</td>
                <td className={styles.tableCell}>
                  <span className={styles.statusPresented}>Submitted</span>
                </td>
                <td className={styles.tableCell}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className={styles.deleteButton}
                      style={{ background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', marginRight: 8, cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => handleDelete(Number(item.id))}
                    >
                      Delete
                    </button>
                    <button
                      className={styles.feedbackButton}
                      style={{ background: '#1e90ff', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => router.push(`/Feedback?presentationId=${item.id}`)}
                    >
                      Feedback
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
             {/* No combinedData for submitted only */}
    </div>
  );
};

export default PresentationTable;