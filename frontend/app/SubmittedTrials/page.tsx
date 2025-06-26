"use client";
import React, { useState } from 'react';
import { Filter, Download, Trash2, Play, Search, Calendar, User, FileText, Eye, ChevronDown, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from "./page.module.css";
import styles1 from "../UploadRecordVideos/page.module.css";
import uploadStyles from "../UploadRecordVideos/uploadrecord.module.css";
import SideBar from "../UploadRecordVideos/components/SideBar";

interface Trial {
  id: string;
  name: string;
  date: string;
  feedback: string;
  duration: string;
  size: string;
}

const mockTrials: Trial[] = [
  { 
    id: "TR001", 
    name: "Product Demo Trial", 
    date: "2024-06-20", 
    feedback: "Excellent presentation with clear explanations. The product features were well demonstrated and the flow was natural. Minor improvement needed in the conclusion section.", 
    duration: "5:23",
    size: "45 MB"
  },
  { 
    id: "TR002", 
    name: "User Onboarding Video", 
    date: "2024-06-19", 
    feedback: "Good coverage of onboarding steps. Consider adding more visual cues and reducing the pace slightly for better user comprehension.", 
    duration: "8:15",
    size: "72 MB"
  },
  { 
    id: "TR003", 
    name: "Feature Walkthrough", 
    date: "2024-06-18", 
    feedback: "Comprehensive walkthrough but needs better organization. Some sections feel rushed while others are too detailed. Audio quality could be improved.", 
    duration: "12:45",
    size: "156 MB"
  },
  { 
    id: "TR004", 
    name: "Tutorial Series Part 1", 
    date: "2024-06-17", 
    feedback: "Great starting point for the tutorial series. Clear voice and good pacing. The visual examples are helpful and engaging.", 
    duration: "6:30",
    size: "58 MB"
  },
  { 
    id: "TR005", 
    name: "Bug Report Demo", 
    date: "2024-06-16", 
    feedback: "The bug reproduction steps are clear, but the video quality is poor. Please re-record with better lighting and screen resolution.", 
    duration: "3:45",
    size: "28 MB"
  },
];

const SubmittedTrials = () => {
  const router = useRouter();
  const [trials, setTrials] = useState<Trial[]>(mockTrials);
  const [filteredTrials, setFilteredTrials] = useState<Trial[]>(mockTrials);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [selectedTrials, setSelectedTrials] = useState<string[]>([]);

  const handleSubmitNewTrial = () => {
    router.push('/UploadRecordVideos');
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term, dateFilter);
  };

  const handleDateFilter = (date: string) => {
    setDateFilter(date);
    applyFilters(searchTerm, date);
  };

  const applyFilters = (search: string, date: string) => {
    let filtered = trials;

    if (search) {
      filtered = filtered.filter(trial => 
        trial.name.toLowerCase().includes(search.toLowerCase()) ||
        trial.id.toLowerCase().includes(search.toLowerCase()) ||
        trial.feedback.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (date !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (date) {
        case 'today':
          filterDate.setDate(today.getDate());
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(trial => 
        new Date(trial.date) >= filterDate
      );
    }

    setFilteredTrials(filtered);
  };

  const toggleFeedback = (id: string) => {
    setExpandedFeedback(expandedFeedback === id ? null : id);
  };

  const toggleTrialSelection = (id: string) => {
    setSelectedTrials(prev => 
      prev.includes(id) 
        ? prev.filter(trialId => trialId !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedTrials.length === 0) return;
    
    const updatedTrials = trials.filter(trial => !selectedTrials.includes(trial.id));
    setTrials(updatedTrials);
    setFilteredTrials(updatedTrials);
    setSelectedTrials([]);
  };

  return (
    <div className={styles1.container}>
      <SideBar />
      <div className={uploadStyles.mainContent}>
        {/* Header - Same as UploadRecordVideos */}
        <div className={`${uploadStyles.header} ${styles.customHeader}`}>
          <h1 className={uploadStyles.title}>Submitted Trials</h1>
          <p className={uploadStyles.subtitle}>Manage and review your submitted video trials</p>
        </div>

        <div className={styles.mainContent}>
          {/* Search and Filters */}
          <div className={styles.searchFiltersContainer}>
            <div className={styles.searchFiltersContent}>
              <div className={styles.searchContainer}>
                <div className={styles.searchInputWrapper}>
                  <Search className={styles.searchIcon} size={20} />
                  <input
                    type="text"
                    placeholder="Search trials by name, ID, or feedback..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>
              
              <div className={styles.filtersContainer}>
                {/* Date Filter */}
                <div className={styles.filterSelectWrapper}>
                  <select
                    value={dateFilter}
                    onChange={(e) => handleDateFilter(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                  </select>
                  <ChevronDown className={styles.filterSelectIcon} size={16} />
                </div>

                {/* Submit New Trial Button */}
                <button className={styles.submitNewButton} onClick={handleSubmitNewTrial}>
                  <FileText size={18} />
                  Submit New Trial
                </button>

                {/* Bulk Actions */}
                {selectedTrials.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className={styles.bulkDeleteButton}
                  >
                    <Trash2 size={16} />
                    Delete ({selectedTrials.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Trials Table */}
          <div className={styles.tableContainer}>
            <div className={styles.tableWrapper}>
              <table className={styles.trialsTable}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th className={styles.checkboxHeader}>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTrials(filteredTrials.map(t => t.id));
                          } else {
                            setSelectedTrials([]);
                          }
                        }}
                        checked={selectedTrials.length === filteredTrials.length && filteredTrials.length > 0}
                        className={styles.checkbox}
                      />
                    </th>
                    <th className={styles.tableHeaderCell}>Trial</th>
                    <th className={styles.tableHeaderCell}>Date</th>
                    <th className={styles.tableHeaderCell}>Duration</th>
                    <th className={styles.tableHeaderCell}>Feedback</th>
                    <th className={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {filteredTrials.map((trial) => (
                    <tr key={trial.id} className={styles.tableRow}>
                      <td className={styles.checkboxCell}>
                        <input
                          type="checkbox"
                          checked={selectedTrials.includes(trial.id)}
                          onChange={() => toggleTrialSelection(trial.id)}
                          className={styles.checkbox}
                        />
                      </td>
                      <td className={styles.trialCell}>
                        <div className={styles.trialInfo}>
                          <div className={styles.videoThumbnail}>
                            <div className={styles.videoPlaceholder}>
                              <Play className={styles.videoIcon} size={16} />
                            </div>
                            <div className={styles.playIndicator}>
                              <Play className={styles.playIcon} size={8} />
                            </div>
                          </div>
                          <div className={styles.trialDetails}>
                            <p className={styles.trialName}>{trial.name}</p>
                            <p className={styles.trialMeta}>{trial.id} • {trial.size}</p>
                          </div>
                        </div>
                      </td>
                      <td className={styles.dateCell}>
                        {new Date(trial.date).toLocaleDateString()}
                      </td>
                      <td className={styles.durationCell}>
                        {trial.duration}
                      </td>
                      <td className={styles.feedbackCell}>
                        <div className={styles.feedbackContent}>
                          <p className={`${styles.feedbackText} ${expandedFeedback === trial.id ? '' : styles.feedbackTruncated}`}>
                            {expandedFeedback === trial.id ? trial.feedback : `${trial.feedback.substring(0, 80)}...`}
                          </p>
                          <button
                            onClick={() => toggleFeedback(trial.id)}
                            className={styles.viewMoreButton}
                          >
                            <Eye size={12} />
                            {expandedFeedback === trial.id ? 'Show less' : 'View more'}
                          </button>
                        </div>
                      </td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actionButtons}>
                          <button 
                            className={styles.actionButton}
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            className={styles.actionButton}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTrials.length === 0 && (
              <div className={styles.emptyState}>
                <FileText className={styles.emptyStateIcon} />
                <h3 className={styles.emptyStateTitle}>No trials found</h3>
                <p className={styles.emptyStateText}>
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.tableFooter}>
            <p className={styles.footerText}>Showing {filteredTrials.length} of {trials.length} trials</p>
            <div className={styles.pagination}>
              <button className={styles.paginationButton}>Previous</button>
              <span className={styles.paginationCurrent}>1</span>
              <button className={styles.paginationButton}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmittedTrials;