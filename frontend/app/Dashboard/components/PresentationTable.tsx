import React from 'react';
import styles from '../page.module.css';

const PresentationTable = () => {
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
            3 Active
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
        <button className={styles.filterButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" fill="currentColor"/>
          </svg>
          <span>Filter</span>
        </button>
          <button className={styles.filterButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Add New</span>
          </button>
        </div>
      </div>
      
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
                🏢 Company
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
          <tr className={styles.tableRow}>
            <td className={styles.tableCell}>
              <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>#827306</span>
            </td>
            <td className={styles.tableCell}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '8px', 
                  background: 'linear-gradient(135deg, #FF6B35, #F7931E)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  P
                </div>
                <span style={{ fontWeight: '600' }}>Patagonia</span>
              </div>
            </td>
            <td className={styles.tableCell}>13/01/2022</td>
            <td className={styles.tableCell}>
              <span className={styles.statusPending}>⏳ Pending</span>
            </td>
            <td className={styles.tableCell}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ 
                  background: 'rgba(0, 255, 204, 0.2)', 
                  border: '1px solid rgba(0, 255, 204, 0.3)', 
                  color: 'var(--aqua)', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}>
                  👁️ View
                </button>
                <button style={{ 
                  background: 'rgba(255, 214, 10, 0.2)', 
                  border: '1px solid rgba(255, 214, 10, 0.3)', 
                  color: 'var(--naples-yellow)', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}>
                  ✏️ Edit
                </button>
              </div>
            </td>
          </tr>
          <tr className={styles.tableRow}>
            <td className={styles.tableCell}>
              <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>#829386</span>
            </td>
            <td className={styles.tableCell}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '8px', 
                  background: 'linear-gradient(135deg, #66CCFF, #3399CC)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  A
                </div>
                <span style={{ fontWeight: '600' }}>Adom.com</span>
              </div>
            </td>
            <td className={styles.tableCell}>13/01/2022</td>
            <td className={styles.tableCell}>
              <span className={styles.statusPresented}>✅ Presented</span>
            </td>
            <td className={styles.tableCell}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ 
                  background: 'rgba(0, 255, 204, 0.2)', 
                  border: '1px solid rgba(0, 255, 204, 0.3)', 
                  color: 'var(--aqua)', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}>
                  👁️ View
                </button>
                <button style={{ 
                  background: 'rgba(76, 175, 80, 0.2)', 
                  border: '1px solid rgba(76, 175, 80, 0.3)', 
                  color: '#4CAF50', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}>
                  📊 Report
                </button>
              </div>
            </td>
          </tr>
          <tr className={styles.tableRow}>
            <td className={styles.tableCell}>
              <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>#826185</span>
            </td>
            <td className={styles.tableCell}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '8px', 
                  background: 'linear-gradient(135deg, #99FF66, #66CC33)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  C
                </div>
                <span style={{ fontWeight: '600' }}>Charles Tea</span>
              </div>
            </td>
            <td className={styles.tableCell}>13/01/2022</td>
            <td className={styles.tableCell}>
              <span className={styles.statusUpcoming}>🔜 Upcoming</span>
            </td>
            <td className={styles.tableCell}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ 
                  background: 'rgba(0, 255, 204, 0.2)', 
                  border: '1px solid rgba(0, 255, 204, 0.3)', 
                  color: 'var(--aqua)', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}>
                  👁️ View
                </button>
                <button style={{ 
                  background: 'rgba(33, 150, 243, 0.2)', 
                  border: '1px solid rgba(33, 150, 243, 0.3)', 
                  color: '#2196F3', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}>
                  🚀 Start
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PresentationTable;