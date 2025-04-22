import React from 'react';
import styles from '../page.module.css';
import { FiDownload, FiTrash2 } from 'react-icons/fi';

const TrialsTable = () => {
  const trials = [
    {
      id: 'R217303',
      thumbnail: '/Images/video-thumbnail.jpg',
      name: 'Pranjapets',
      date: '13/01/2022',
      feedback: 'This is feedback about this video presentation. The delivery was clear and concise.',
    },
    {
      id: 'R78358',
      thumbnail: '/Images/video-thumbnail.jpg',
      name: 'Adom.com',
      date: '13/01/2022',
      feedback: 'This is feedback about this video presentation. Good points on market analysis.',
    },
    {
      id: 'R28795',
      thumbnail: '/Images/video-thumbnail.jpg',
      name: 'Charles Tea',
      date: '13/01/2022',
      feedback: 'This is feedback about this video presentation. Consider improving the pacing.',
    },
    {
      id: 'R28575',
      thumbnail: '/Images/video-thumbnail.jpg',
      name: 'Sarah Bloom',
      date: '13/01/2022',
      feedback: 'This is feedback about this video presentation. Excellent use of visual aids.',
    },
    {
      id: 'R28617',
      thumbnail: '/Images/video-thumbnail.jpg',
      name: 'John Green',
      date: '13/01/2022',
      feedback: 'This is feedback about this video presentation. Work on body language.',
    },
  ];

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.tableHeader}>ID</th>
          <th className={styles.tableHeader}>Name</th>
          <th className={styles.tableHeader}>Date</th>
          <th className={styles.tableHeader}>Feedback</th>
          <th className={styles.tableHeader}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {trials.map((trial) => (
          <tr key={trial.id} className={styles.tableRow}>
            <td className={styles.tableCell}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img
                  src={trial.thumbnail}
                  alt={`${trial.name}'s video thumbnail`}
                  className={styles.videoThumbnail}
                />
                {trial.id}
              </div>
            </td>
            <td className={styles.tableCell}>{trial.name}</td>
            <td className={styles.tableCell}>{trial.date}</td>
            <td className={styles.tableCell}>
              <div className={styles.feedbackText}>
                {trial.feedback}
                <a href="#" className={styles.viewMore}>view more</a>
              </div>
            </td>
            <td className={styles.tableCell}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className={styles.actionButton} title="Download video">
                  <FiDownload size={20} />
                </button>
                <button className={styles.actionButton} title="Delete trial">
                  <FiTrash2 size={20} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TrialsTable;