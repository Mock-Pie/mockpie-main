"use client";
import React, { useState, useEffect } from 'react';
import { 
  IoFilterOutline, 
  IoDownloadOutline, 
  IoTrashOutline, 
  IoPlayOutline, 
  IoSearchOutline, 
  IoCalendarOutline, 
  IoPersonOutline, 
  IoDocumentTextOutline, 
  IoEyeOutline, 
  IoChevronDownOutline, 
  IoCloseOutline,
  IoRefreshOutline
} from 'react-icons/io5';
import { useRouter } from 'next/navigation';
import styles from "./page.module.css";
import styles1 from "../UploadRecordVideos/page.module.css";
import uploadStyles from "../UploadRecordVideos/uploadrecord.module.css";
import SideBar from "../UploadRecordVideos/components/SideBar";
import PresentationService from '../services/presentationService';
import { Presentation as PresentationType } from '../types';

const SubmittedTrials = () => {
  const router = useRouter();
  const [presentations, setPresentations] = useState<PresentationType[]>([]);
  const [filteredPresentations, setFilteredPresentations] = useState<PresentationType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [selectedPresentations, setSelectedPresentations] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'bulk'>('single');
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const presentationsPerPage = 5;

  // Fetch presentations on component mount
  useEffect(() => {
    fetchPresentations();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  // Calculate pagination
  const indexOfLastPresentation = currentPage * presentationsPerPage;
  const indexOfFirstPresentation = indexOfLastPresentation - presentationsPerPage;
  const currentPresentations = filteredPresentations.slice(indexOfFirstPresentation, indexOfLastPresentation);
  const totalPages = Math.ceil(filteredPresentations.length / presentationsPerPage);

  // Pagination handlers
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleViewFeedback = (presentationId: number) => {
    router.push(`/Feedback?presentationId=${presentationId}`);
  };

  const fetchPresentations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await PresentationService.getUserPresentations();
      console.log(response);
      if (response.success && response.data) {
        const presentationsData = (response.data as any).videos || [];
        
        // Fetch feedback data for each presentation to get overall scores
        const presentationsWithScores = await Promise.all(
          presentationsData.map(async (presentation: PresentationType) => {
            try {
              const feedbackResponse = await fetch(`http://localhost:8081/feedback/presentation/${presentation.id}/feedback`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (feedbackResponse.ok) {
                const feedbackData = await feedbackResponse.json();
                // Extract overall score from enhanced feedback like the Feedback page does
                const enhanced = feedbackData.enhanced_feedback || {};
                const overallScore = enhanced.overall_score || feedbackData.overall_score || feedbackData.score || null;
                return { ...presentation, overall_score: overallScore };
              } else {
                // If no feedback available, keep the presentation without score
                return { ...presentation, overall_score: undefined };
              }
            } catch (error) {
              console.error(`Error fetching feedback for presentation ${presentation.id}:`, error);
              return { ...presentation, overall_score: undefined };
            }
          })
        );
        
        console.log('Presentations with scores:', presentationsWithScores.map((p: PresentationType) => ({ id: p.id, title: p.title, overall_score: p.overall_score })));
        setPresentations(presentationsWithScores);
        setFilteredPresentations(presentationsWithScores);
      } else {
        setError(response.error || 'Failed to fetch presentations');
        if (response.error?.includes('Authentication expired')) {
          setTimeout(() => router.push('/Login'), 2000);
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Error fetching presentations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPresentations();
    setRefreshing(false);
  };

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
    let filtered = presentations;

    if (search) {
      filtered = filtered.filter(presentation => 
        presentation.title.toLowerCase().includes(search.toLowerCase()) ||
        presentation.id.toString().includes(search.toLowerCase())
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
      
      filtered = filtered.filter(presentation => 
        new Date(presentation.uploaded_at) >= filterDate
      );
    }

    setFilteredPresentations(filtered);
  };

  const toggleFeedback = (id: string) => {
    setExpandedFeedback(expandedFeedback === id ? null : id);
  };

  const togglePresentationSelection = (id: number) => {
    setSelectedPresentations(prev => 
      prev.includes(id) 
        ? prev.filter(presentationId => presentationId !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedPresentations.length === 0) return;
    
    setDeleteType('bulk');
    setShowDeleteModal(true);
  };

  const confirmBulkDelete = async () => {

    try {
      const deletePromises = selectedPresentations.map(id => 
        PresentationService.deletePresentation(id)
      );
      
      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter(result => !result.success);
      
      if (failedDeletes.length > 0) {
        setError(`Failed to delete ${failedDeletes.length} presentation(s)`);
      } else {
        // Refresh the list after successful deletion
        await fetchPresentations();
        setSelectedPresentations([]);
        setShowDeleteModal(false);
      }
    } catch (err) {
      setError('Error deleting presentations');
      console.error('Error in bulk delete:', err);
    }
  };

  const handleDeletePresentation = async (id: number) => {
    setItemToDelete(id);
    setDeleteType('single');
    setShowDeleteModal(true);
  };

  const confirmSingleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await PresentationService.deletePresentation(itemToDelete);
      
      if (response.success) {
        await fetchPresentations();
        setShowDeleteModal(false);
        setItemToDelete(null);
      } else {
        setError(response.error || 'Failed to delete presentation');
      }
    } catch (err) {
      setError('Error deleting presentation');
      console.error('Error deleting presentation:', err);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteType === 'bulk') {
      confirmBulkDelete();
    } else {
      confirmSingleDelete();
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleDownloadPresentation = async (presentation: PresentationType) => {
    try {
      // Get authentication token
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setError('Please log in to download videos.');
        setTimeout(() => router.push('/Login'), 2000);
        return;
      }

      // Show loading state
      setError(null);
      setRefreshing(true);

      // Fetch the video file with authentication
      const downloadUrl = `http://localhost:8081${presentation.url}`;
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('access_token');
          setError('Session expired. Please log in again.');
          setTimeout(() => router.push('/Login'), 2000);
          return;
        } else if (response.status === 404) {
          setError('Video file not found. It may have been deleted.');
          return;
        } else {
          setError(`Download failed: ${response.statusText}`);
          return;
        }
      }

      // Convert response to blob
      const blob = await response.blob();
      
      // Create object URL for the blob
      const objectUrl = URL.createObjectURL(blob);
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = objectUrl;
      
      // Extract file extension from URL or use mp4 as default
      const urlParts = presentation.url.split('.');
      const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1] : 'mp4';
      
      // Set download filename
      link.download = `${presentation.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;
      
      // Append to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      URL.revokeObjectURL(objectUrl);
      
    } catch (error) {
      console.error('Error downloading presentation:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const getScoreClass = (score: number): string => {
    if (score >= 8) return styles.excellentScore;
    if (score >= 6) return styles.goodScore;
    if (score >= 4) return styles.averageScore;
    return styles.poorScore;
  };

  const getFeedbackText = (presentation: PresentationType): string => {
    // Generate feedback based on presentation properties
    const feedbacks = [
      "Presentation uploaded successfully. Ready for analysis.",
      "Video quality looks good. Consider reviewing for content clarity.",
      "File size is appropriate for analysis. Processing may take a few minutes.",
      "Presentation is ready for review and feedback.",
      "Upload completed. You can now view detailed analysis."
    ];
    
    // Use presentation ID to consistently assign feedback
    const index = presentation.id % feedbacks.length;
    return feedbacks[index];
  };

  if (loading) {
    return (
      <div className={styles1.container}>
        <SideBar />
        <div className={uploadStyles.mainContent}>
          <div className={`${uploadStyles.header} ${styles.customHeader}`}>
            <h1 className={uploadStyles.title}>Submitted Trials</h1>
            <p className={uploadStyles.subtitle}>Loading your presentations...</p>
          </div>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading presentations...</p>
          </div>
        </div>
      </div>
    );
  }

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
          {/* Error Display */}
          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
              <button onClick={() => setError(null)} className={styles.closeError}>
                <IoCloseOutline size={16} />
              </button>
            </div>
          )}

          {/* Search and Filters */}
          <div className={styles.searchFiltersContainer}>
            <div className={styles.searchFiltersContent}>
              <div className={styles.searchContainer}>
                <div className={styles.searchInputWrapper}>
                  <IoSearchOutline className={styles.searchIcon} size={20} />
                  <input
                    type="text"
                    placeholder="Search presentations by title or ID..."
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
                  <IoChevronDownOutline className={styles.filterSelectIcon} size={16} />
                </div>

                {/* Refresh Button */}
                <button 
                  className={styles.refreshButton} 
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <IoRefreshOutline size={18} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>

                {/* Submit New Trial Button */}
                <button className={styles.submitNewButton} onClick={handleSubmitNewTrial}>
                  <IoDocumentTextOutline size={18} />
                  Submit New Trial
                </button>

                {/* Bulk Actions */}
                {selectedPresentations.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className={styles.bulkDeleteButton}
                  >
                    <IoTrashOutline size={16} />
                    Delete ({selectedPresentations.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Presentations Table */}
          <div className={styles.tableContainer}>
            <div className={styles.tableWrapper}>
              <table className={styles.trialsTable}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th className={styles.tableHeaderCell}>Presentation</th>
                    <th className={styles.tableHeaderCell}>Date</th>
                    <th className={styles.tableHeaderCell}>Topic</th>
                    <th className={styles.tableHeaderCell}>Overall Score</th>
                    <th className={styles.tableHeaderCell}>Feedback</th>
                    <th className={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {currentPresentations.map((presentation) => (
                    <tr key={presentation.id} className={styles.tableRow}>
                      <td className={styles.trialCell}>
                        <div className={styles.trialInfo}>
                          <div className={styles.videoThumbnail}>
                            <div className={styles.videoPlaceholder}>
                              <IoPlayOutline className={styles.videoIcon} size={16} />
                            </div>
                            <div className={styles.playIndicator}>
                              <IoPlayOutline className={styles.playIcon} size={8} />
                            </div>
                          </div>
                          <div className={styles.trialDetails}>
                            <p className={styles.trialName}>{presentation.title}</p>
                            <p className={styles.trialMeta}>ID: {presentation.id} • {presentation.is_public ? 'Public' : 'Private'}</p>
                          </div>
                        </div>
                      </td>
                      <td className={styles.dateCell}>
                        {new Date(presentation.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className={styles.topicCell}>
                        {presentation.topic || 'Unknown'}
                      </td>
                      <td className={styles.scoreCell}>
                        {presentation.overall_score !== undefined ? (
                          <div className={styles.scoreDisplay}>
                            <span className={`${styles.scoreValue} ${getScoreClass(presentation.overall_score)}`}>
                              {presentation.overall_score}/10
                            </span>
                          </div>
                        ) : (
                          <span className={styles.noScore}>No score yet</span>
                        )}
                      </td>
                      <td className={styles.feedbackCell}>
                        <button 
                          className={styles.feedbackButton}
                          onClick={() => handleViewFeedback(presentation.id)}
                          title="View detailed feedback"
                        >
                          <IoEyeOutline size={16} />
                          See Feedback
                        </button>
                      </td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actionButtons}>
                          <button 
                            className={styles.actionButton}
                            title="Download"
                            onClick={() => handleDownloadPresentation(presentation)}
                          >
                            <IoDownloadOutline size={16} />
                          </button>
                          <button 
                            className={styles.actionButton}
                            title="Delete"
                            onClick={() => handleDeletePresentation(presentation.id)}
                          >
                            <IoTrashOutline size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPresentations.length === 0 && (
              <div className={styles.emptyState}>
                <IoDocumentTextOutline className={styles.emptyStateIcon} />
                <h3 className={styles.emptyStateTitle}>
                  {presentations.length === 0 ? 'No presentations yet' : 'No presentations found'}
                </h3>
                <p className={styles.emptyStateText}>
                  {presentations.length === 0 
                    ? 'Start by uploading your first video presentation.' 
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {presentations.length === 0 && (
                  <button className={styles.submitNewButton} onClick={handleSubmitNewTrial}>
                    <IoDocumentTextOutline size={18} />
                    Upload Your First Presentation
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.tableFooter}>
            <p className={styles.footerText}>
              Showing {indexOfFirstPresentation + 1}-{Math.min(indexOfLastPresentation, filteredPresentations.length)} of {filteredPresentations.length} presentations
            </p>
            <div className={styles.pagination}>
              <button 
                className={styles.paginationButton} 
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className={styles.paginationCurrent}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                className={styles.paginationButton} 
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.deleteModal}>
              <div className={styles.modalContent}>
                <h3 className={styles.modalTitle}>
                  Confirm Delete
                </h3>
                <p className={styles.modalMessage}>
                  {deleteType === 'bulk' 
                    ? `Are you sure you want to delete ${selectedPresentations.length} presentation(s)? This action cannot be undone.`
                    : 'Are you sure you want to delete this presentation? This action cannot be undone.'
                  }
                </p>
                <div className={styles.modalActions}>
                  <button 
                    className={styles.cancelButton} 
                    onClick={handleCancelDelete}
                  >
                    Cancel
                  </button>
                  <button 
                    className={styles.deleteButton} 
                    onClick={handleConfirmDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmittedTrials;