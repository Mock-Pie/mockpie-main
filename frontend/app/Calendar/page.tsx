"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import styles from "../UploadRecordVideos/page.module.css";
import calendarStyles from "./page.module.css";
import SideBar from "../UploadRecordVideos/components/SideBar";
import Header from "./components/Header";
import PresentationService, { Presentation as ApiPresentation } from '../services/presentationService';
import UpcomingPresentationService, { UpcomingPresentation as UpcomingPresentationData } from '../services/upcomingPresentationService';
import { 
    FiChevronLeft, 
    FiChevronRight, 
    FiPlus, 
    FiEdit3, 
    FiTrash2, 
    FiClock, 
    FiUser, 
    FiX,
    FiCheck,
    FiCalendar,
    FiSearch,
    FiFilter,
    FiRefreshCw
} from "react-icons/fi";

interface Presentation {
    id: string;
    topic: string;
    date: string;
    time: string;
    description: string;
    type: 'past' | 'upcoming';
    language?: string;
}

const Calendar = () => {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [presentations, setPresentations] = useState<Presentation[]>([]);
    const [upcomingPresentations, setUpcomingPresentations] = useState<Presentation[]>([]);
    const [filteredPresentations, setFilteredPresentations] = useState<Presentation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPresentation, setEditingPresentation] = useState<Presentation | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteType, setDeleteType] = useState<'past' | 'upcoming'>('past');
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        topic: '',
        date: '',
        time: '',
        description: '',
        language: ''
    });

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        type: 'all', // 'all', 'past', 'upcoming'
        dateRange: 'all', // 'all', 'today', 'week', 'month', 'custom'
        customDateStart: '',
        customDateEnd: ''
    });

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Fetch presentations on component mount
    useEffect(() => {
        const initializeData = async () => {
            // First fetch upcoming presentations
            const upcomingData = await fetchUpcomingPresentations();
            // Then fetch past presentations and combine with upcoming
            await fetchPresentations(upcomingData, true);
        };
        
        initializeData();
    }, []);

    // Helper function to combine and update all presentations
    const combineAndUpdatePresentations = async (pastPresentations: Presentation[], upcomingPresentations: Presentation[]) => {
        const allPresentations = [...pastPresentations, ...upcomingPresentations];
        setPresentations(allPresentations);
        return allPresentations;
    };

    const fetchPresentations = async (currentUpcoming?: Presentation[], isInitialLoad = false) => {
        try {
            if (isInitialLoad) {
                setLoading(true);
            }
            setError(null);
            
            const response = await PresentationService.getUserPresentations();
            
            const upcomingToUse = currentUpcoming || upcomingPresentations;
            
            if (response.success && response.data) {
                const apiPresentations = (response.data as any).videos || [];
                
                // Map API presentations to calendar format
                const mappedPresentations: Presentation[] = apiPresentations.map((apiPres: ApiPresentation) => {
                    const uploadDate = new Date(apiPres.uploaded_at);
                    return {
                        id: apiPres.id.toString(),
                        topic: apiPres.title,
                        date: uploadDate.toISOString().split('T')[0], // Extract date part
                        time: uploadDate.toTimeString().slice(0, 5), // Extract time part (HH:MM)
                        description: `Submitted trial - ${apiPres.title}`,
                        type: 'past' as const,
                        language: 'english' // Default language since API doesn't provide it
                    };
                });
                
                // Combine with upcoming presentations
                await combineAndUpdatePresentations(mappedPresentations, upcomingToUse);
                
            } else {
                setError(response.error || 'Failed to fetch presentations');
                if (response.error?.includes('Authentication expired')) {
                    setTimeout(() => router.push('/Login'), 2000);
                }
                // If API fails, just use upcoming presentations
                await combineAndUpdatePresentations([], upcomingToUse);
            }
        } catch (err) {
            setError('Network error. Please check your connection.');
            console.error('Error fetching presentations:', err);
            // Fallback to upcoming presentations only
            await combineAndUpdatePresentations([], currentUpcoming || upcomingPresentations);
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    };

    const fetchUpcomingPresentations = async (updateCalendar = false) => {
        try {
            // Initialize sample data if needed
            await UpcomingPresentationService.initializeSampleData();
            
            // Fetch upcoming presentations from service
            const result = await UpcomingPresentationService.getUpcomingPresentations();
            
            if (result.success && result.data) {
                // Convert service data to calendar format
                const mappedUpcoming: Presentation[] = (result.data as UpcomingPresentationData[]).map(upcoming => ({
                    id: upcoming.id,
                    topic: upcoming.topic,
                    date: upcoming.date,
                    time: upcoming.time,
                    description: upcoming.description,
                    type: 'upcoming' as const,
                    language: upcoming.language || 'english'
                }));
                
                setUpcomingPresentations(mappedUpcoming);
                
                // If updating calendar, refresh the combined presentations
                if (updateCalendar) {
                    await fetchPresentations(mappedUpcoming);
                }
                
                return mappedUpcoming;
            } else {
                console.error('Failed to fetch upcoming presentations:', result.error);
                return [];
            }
        } catch (err) {
            console.error('Error fetching upcoming presentations:', err);
            return [];
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            // First refresh upcoming presentations
            const upcomingData = await fetchUpcomingPresentations();
            // Then refresh past presentations and combine with updated upcoming data
            await fetchPresentations(upcomingData);
        } catch (err) {
            console.error('Error during refresh:', err);
        } finally {
            setRefreshing(false);
        }
    };

    // Filter presentations based on search and filters
    useEffect(() => {
        let filtered = presentations;

        // Apply search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(presentation => 
                presentation.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                presentation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                presentation.date.includes(searchQuery) ||
                presentation.time.includes(searchQuery) ||
                presentation.language?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply type filter
        if (filters.type !== 'all') {
            filtered = filtered.filter(presentation => presentation.type === filters.type);
        }

        // Apply date range filter
        if (filters.dateRange !== 'all') {
            const today = new Date();
            let startDate = new Date();
            let endDate = new Date();

            switch (filters.dateRange) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                case 'week':
                    startDate.setDate(today.getDate() - 7);
                    endDate.setDate(today.getDate() + 7);
                    break;
                case 'month':
                    startDate.setMonth(today.getMonth() - 1);
                    endDate.setMonth(today.getMonth() + 1);
                    break;
                case 'custom':
                    if (filters.customDateStart) startDate = new Date(filters.customDateStart);
                    if (filters.customDateEnd) endDate = new Date(filters.customDateEnd);
                    break;
            }

            filtered = filtered.filter(presentation => {
                const presentationDate = new Date(presentation.date);
                return presentationDate >= startDate && presentationDate <= endDate;
            });
        }

        setFilteredPresentations(filtered);
    }, [presentations, searchQuery, filters]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const getPresentationsForDate = (date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        return filteredPresentations.filter(p => p.date === dateString);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isPastDate = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
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

    const openModal = (date?: Date, presentation?: Presentation) => {
        if (presentation) {
            setEditingPresentation(presentation);
            setFormData({
                topic: presentation.topic,
                date: presentation.date,
                time: presentation.time,
                description: presentation.description,
                language: presentation.language || ''
            });
        } else {
            setEditingPresentation(null);
            const selectedDateStr = date ? date.toISOString().split('T')[0] : '';
            setFormData({
                topic: '',
                date: selectedDateStr,
                time: '',
                description: '',
                language: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPresentation(null);
        setFormData({
            topic: '',
            date: '',
            time: '',
            description: '',
            language: ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const presentationDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const presentationType = presentationDate < today ? 'past' : 'upcoming';

        try {
            if (presentationType === 'upcoming') {
                if (editingPresentation && editingPresentation.type === 'upcoming') {
                    // Update existing upcoming presentation
                    const result = await UpcomingPresentationService.updateUpcomingPresentation(
                        editingPresentation.id,
                        {
                            topic: formData.topic,
                            date: formData.date,
                            time: formData.time,
                            description: formData.description,
                            language: formData.language
                        }
                    );

                    if (result.success) {
                        await fetchUpcomingPresentations(true); // Refresh data and update calendar
                        setSuccessMessage('Presentation updated successfully!');
                        setTimeout(() => setSuccessMessage(null), 3000);
                    } else {
                        setError(result.error || 'Failed to update presentation');
                        return;
                    }
                } else if (!editingPresentation) {
                    // Add new upcoming presentation
                    const result = await UpcomingPresentationService.addUpcomingPresentation({
                        topic: formData.topic,
                        date: formData.date,
                        time: formData.time,
                        description: formData.description,
                        language: formData.language
                    });

                    if (result.success) {
                        await fetchUpcomingPresentations(true); // Refresh data and update calendar
                        setSuccessMessage('New presentation added to calendar!');
                        setTimeout(() => setSuccessMessage(null), 3000);
                    } else {
                        setError(result.error || 'Failed to add presentation');
                        return;
                    }
                }
            } else {
                // For past presentations, use local state (since they can't be "scheduled")
                const newPresentation: Presentation = {
                    id: editingPresentation ? editingPresentation.id : `local-${Date.now()}`,
                    topic: formData.topic,
                    date: formData.date,
                    time: formData.time,
                    description: formData.description,
                    type: 'past',
                    language: formData.language
                };

                if (editingPresentation) {
                    setPresentations(presentations.map(p => 
                        p.id === editingPresentation.id ? newPresentation : p
                    ));
                } else {
                    setPresentations([...presentations, newPresentation]);
                }
            }

            closeModal();
        } catch (err) {
            setError('Failed to save presentation. Please try again.');
            console.error('Error saving presentation:', err);
        }
    };

    const handleDeleteClick = (id: string) => {
        const presentation = presentations.find(p => p.id === id);
        if (!presentation) return;

        setItemToDelete(id);
        setDeleteType(presentation.type);
        setShowDeleteModal(true);
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setItemToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        const presentation = presentations.find(p => p.id === itemToDelete);
        if (!presentation) return;

        try {
            if (presentation.type === 'past' && !itemToDelete.startsWith('local-')) {
                // Delete submitted trial via API
                const response = await PresentationService.deletePresentation(parseInt(itemToDelete));
                
                if (response.success) {
                    // Refresh data from API after successful deletion
                    await fetchPresentations(upcomingPresentations);
                    setSuccessMessage('Presentation deleted successfully!');
                    setTimeout(() => setSuccessMessage(null), 3000);
                } else {
                    setError(response.error || 'Failed to delete presentation');
                }
            } else if (presentation.type === 'upcoming' && !itemToDelete.startsWith('local-')) {
                // Delete upcoming presentation via service
                const result = await UpcomingPresentationService.deleteUpcomingPresentation(itemToDelete);
                
                if (result.success) {
                    await fetchUpcomingPresentations(true); // Refresh upcoming presentations and update calendar
                    setSuccessMessage('Presentation deleted successfully!');
                    setTimeout(() => setSuccessMessage(null), 3000);
                } else {
                    setError(result.error || 'Failed to delete presentation');
                }
            } else {
                // For local presentations, delete locally
                setPresentations(prev => prev.filter(p => p.id !== itemToDelete));
                
                if (presentation.type === 'upcoming') {
                    setUpcomingPresentations(prev => prev.filter(p => p.id !== itemToDelete));
                }
                setSuccessMessage('Presentation deleted successfully!');
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (err) {
            setError('Error deleting presentation');
            console.error('Error deleting presentation:', err);
        } finally {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const handlePresentationClick = (presentation: Presentation) => {
        if (presentation.type === 'past') {
            // Redirect to submitted trials for past presentations
            router.push('/SubmittedTrials');
        } else {
            // Open modal for upcoming presentations
            openModal(undefined, presentation);
        }
    };

    const clearFilters = () => {
        setFilters({
            type: 'all',
            dateRange: 'all',
            customDateStart: '',
            customDateEnd: ''
        });
        setSearchQuery('');
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (filters.type !== 'all') count++;
        if (filters.dateRange !== 'all') count++;
        if (searchQuery.trim()) count++;
        return count;
    };

    const days = getDaysInMonth(currentDate);

        if (loading) {
        return (
            <div className={styles.container}>
                <SideBar />
                <div className={calendarStyles.mainContent}>
                    <Header />
                    <div className={calendarStyles.loadingState}>
                        <div className={calendarStyles.loadingSpinner}></div>
                        <p>Loading your presentations...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <SideBar />  
            <div className={calendarStyles.mainContent}>
                <Header />
                
                {/* Error Display */}
                {error && (
                    <div className={calendarStyles.errorMessage}>
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className={calendarStyles.closeErrorButton}>
                            <FiX />
                        </button>
                    </div>
                )}
                
                {/* Success Display */}
                {successMessage && (
                    <div className={calendarStyles.successMessage}>
                        <span>{successMessage}</span>
                        <button onClick={() => setSuccessMessage(null)} className={calendarStyles.closeSuccessButton}>
                            <FiX />
                        </button>
                    </div>
                )}
                
                {/* Search and Filters Section */}
                <div className={calendarStyles.searchSection}>
                    <div className={calendarStyles.searchBar}>
                        <div className={calendarStyles.searchInputContainer}>
                            <FiSearch className={calendarStyles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search presentations by topic, language..."
                                className={calendarStyles.searchInput}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button 
                                    className={calendarStyles.clearSearchButton}
                                    onClick={() => setSearchQuery('')}
                                >
                                    <FiX />
                                </button>
                            )}
                        </div>
                        
                        <div className={calendarStyles.filterControls}>
                            <button
                                className={`${calendarStyles.filterToggle} ${showFilters ? calendarStyles.active : ''}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <FiFilter />
                                Filters
                                {getActiveFiltersCount() > 0 && (
                                    <span className={calendarStyles.filterBadge}>{getActiveFiltersCount()}</span>
                                )}
                            </button>
                            
                            {(searchQuery || getActiveFiltersCount() > 0) && (
                                <button
                                    className={calendarStyles.clearButton}
                                    onClick={clearFilters}
                                >
                                    <FiRefreshCw />
                                    Clear All
                                </button>
                            )}
                            
                            <div className={calendarStyles.resultsCount}>
                                {filteredPresentations.length} of {presentations.length} presentations
                            </div>
                        </div>
                    </div>

                    {/* Advanced Filters Panel */}
                    {showFilters && (
                        <div className={calendarStyles.filtersPanel}>
                            <div className={calendarStyles.filterGroup}>
                                <label className={calendarStyles.filterLabel}>Type</label>
                                <select
                                    className={calendarStyles.filterSelect}
                                    value={filters.type}
                                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                                >
                                    <option value="all">All Presentations</option>
                                    <option value="upcoming">Upcoming Only</option>
                                    <option value="past">Submitted Trials</option>
                                </select>
                            </div>

                            <div className={calendarStyles.filterGroup}>
                                <label className={calendarStyles.filterLabel}>Date Range</label>
                                <select
                                    className={calendarStyles.filterSelect}
                                    value={filters.dateRange}
                                    onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                                >
                                    <option value="all">All Dates</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                            </div>

                            {filters.dateRange === 'custom' && (
                                <div className={calendarStyles.customDateRange}>
                                    <div className={calendarStyles.filterGroup}>
                                        <label className={calendarStyles.filterLabel}>Start Date</label>
                                        <input
                                            type="date"
                                            className={calendarStyles.filterSelect}
                                            value={filters.customDateStart}
                                            onChange={(e) => setFilters({...filters, customDateStart: e.target.value})}
                                        />
                                    </div>
                                    <div className={calendarStyles.filterGroup}>
                                        <label className={calendarStyles.filterLabel}>End Date</label>
                                        <input
                                            type="date"
                                            className={calendarStyles.filterSelect}
                                            value={filters.customDateEnd}
                                            onChange={(e) => setFilters({...filters, customDateEnd: e.target.value})}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className={calendarStyles.calendarContainer}>
                    {/* Calendar Header */}
                    <div className={calendarStyles.calendarHeader}>
                        <div className={calendarStyles.monthNavigation}>
                            <button 
                                className={calendarStyles.navButton}
                                onClick={() => navigateMonth('prev')}
                            >
                                <FiChevronLeft />
                            </button>
                            <h2 className={calendarStyles.monthTitle}>
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                            <button 
                                className={calendarStyles.navButton}
                                onClick={() => navigateMonth('next')}
                            >
                                <FiChevronRight />
                            </button>
                        </div>
                        <div className={calendarStyles.headerActions}>
                            <button
                                className={`${calendarStyles.refreshButton} ${refreshing ? calendarStyles.refreshing : ''}`}
                                onClick={handleRefresh}
                                disabled={refreshing}
                                title="Refresh presentations"
                            >
                                <FiRefreshCw />
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <button 
                                className={calendarStyles.addButton}
                                onClick={() => openModal()}
                            >
                                <FiPlus /> Add Presentations
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className={calendarStyles.calendarGrid}>
                        {/* Week headers */}
                        {weekDays.map(day => (
                            <div key={day} className={calendarStyles.weekHeader}>
                                {day}
                            </div>
                        ))}
                        
                        {/* Calendar days */}
                        {days.map((day, index) => {
                            if (!day) {
                                return <div key={index} className={calendarStyles.emptyDay}></div>;
                            }

                            const dayPresentations = getPresentationsForDate(day);
                            const isSelected = selectedDate?.toDateString() === day.toDateString();
                            const isTodayDate = isToday(day);
                            const isPast = isPastDate(day);

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`${calendarStyles.calendarDay} ${isTodayDate ? calendarStyles.today : ''} ${isSelected ? calendarStyles.selected : ''} ${isPast ? calendarStyles.pastDay : ''}`}
                                    onClick={() => setSelectedDate(day)}
                                >
                                    <span className={calendarStyles.dayNumber}>{day.getDate()}</span>
                                    <div className={calendarStyles.presentationsContainer}>
                                        {dayPresentations.slice(0, 2).map(presentation => (
                                            <div
                                                key={presentation.id}
                                                className={`${calendarStyles.presentationDot} ${calendarStyles[presentation.type]}`}
                                                title={presentation.topic}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePresentationClick(presentation);
                                                }}
                                            >
                                                {presentation.topic.substring(0, 15)}...
                                            </div>
                                        ))}
                                        {dayPresentations.length > 2 && (
                                            <div className={calendarStyles.moreIndicator}>
                                                +{dayPresentations.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        className={calendarStyles.quickAddButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openModal(day);
                                        }}
                                        title="Add presentation"
                                    >
                                        <FiPlus />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Presentations List */}
                {selectedDate && (
                    <div className={calendarStyles.presentationsList}>
                        <h3 className={calendarStyles.listTitle}>
                            Presentations for {selectedDate.toLocaleDateString()}
                        </h3>
                        <div className={calendarStyles.presentationsGrid}>
                            {getPresentationsForDate(selectedDate).length === 0 ? (
                                <div className={calendarStyles.noResults}>
                                    No presentations found for this date.
                                </div>
                            ) : (
                                getPresentationsForDate(selectedDate).map(presentation => (
                                    <div 
                                        key={presentation.id} 
                                        className={`${calendarStyles.presentationCard} ${calendarStyles[presentation.type]} ${
                                            presentation.type === 'past' ? calendarStyles.clickableCard : ''
                                        }`}
                                        onClick={() => presentation.type === 'past' ? handlePresentationClick(presentation) : undefined}
                                        style={presentation.type === 'past' ? { cursor: 'pointer' } : undefined}
                                    >
                                        <div className={calendarStyles.cardHeader}>
                                            <h4 className={calendarStyles.cardTitle}>
                                                {presentation.type === 'past' 
                                                    ? `${presentation.topic} (Submitted Trial)` 
                                                    : presentation.topic
                                                }
                                            </h4>
                                            <div className={calendarStyles.cardActions}>
                                                {presentation.type === 'upcoming' && (
                                                    <button
                                                        className={calendarStyles.actionButton}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openModal(undefined, presentation);
                                                        }}
                                                    >
                                                        <FiEdit3 />
                                                    </button>
                                                )}
                                                <button
                                                    className={`${calendarStyles.actionButton} ${calendarStyles.deleteButton}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(presentation.id);
                                                    }}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                        <div className={calendarStyles.cardContent}>
                                            <div className={calendarStyles.cardMeta}>
                                                <span><FiClock /> {presentation.time}</span>
                                                {presentation.language && (
                                                    <span>
                                                        <FiUser /> {presentation.language.charAt(0).toUpperCase() + presentation.language.slice(1)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={calendarStyles.cardDescription}>{presentation.description}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Global Search Results */}
                {(searchQuery || getActiveFiltersCount() > 0) && (
                    <div className={calendarStyles.searchResults}>
                        <h3 className={calendarStyles.listTitle}>
                            Search Results ({filteredPresentations.length} found)
                        </h3>
                        <div className={calendarStyles.presentationsGrid}>
                            {filteredPresentations.length === 0 ? (
                                <div className={calendarStyles.noResults}>
                                    <FiSearch className={calendarStyles.noResultsIcon} />
                                    <p>No presentations match your search criteria.</p>
                                    <button className={calendarStyles.clearButton} onClick={clearFilters}>
                                        Clear filters and try again
                                    </button>
                                </div>
                            ) : (
                                filteredPresentations.map(presentation => (
                                    <div 
                                        key={presentation.id} 
                                        className={`${calendarStyles.presentationCard} ${calendarStyles[presentation.type]} ${
                                            presentation.type === 'past' ? calendarStyles.clickableCard : ''
                                        }`}
                                        onClick={() => presentation.type === 'past' ? handlePresentationClick(presentation) : undefined}
                                        style={presentation.type === 'past' ? { cursor: 'pointer' } : undefined}
                                    >
                                        <div className={calendarStyles.cardHeader}>
                                            <h4 className={calendarStyles.cardTitle}>
                                                {presentation.type === 'past' 
                                                    ? `${presentation.topic} (Submitted Trial)` 
                                                    : presentation.topic
                                                }
                                            </h4>
                                            <div className={calendarStyles.cardActions}>
                                                {presentation.type === 'upcoming' && (
                                                    <button
                                                        className={calendarStyles.actionButton}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openModal(undefined, presentation);
                                                        }}
                                                    >
                                                        <FiEdit3 />
                                                    </button>
                                                )}
                                                <button
                                                    className={`${calendarStyles.actionButton} ${calendarStyles.deleteButton}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(presentation.id);
                                                    }}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                        <div className={calendarStyles.cardContent}>
                                            <div className={calendarStyles.cardMeta}>
                                                <span><FiCalendar /> {new Date(presentation.date).toLocaleDateString()}</span>
                                                <span><FiClock /> {presentation.time}</span>
                                                {presentation.language && (
                                                    <span>
                                                        <FiUser /> {presentation.language.charAt(0).toUpperCase() + presentation.language.slice(1)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={calendarStyles.cardDescription}>{presentation.description}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className={calendarStyles.modalOverlay}>
                        <div className={calendarStyles.deleteModal}>
                            <div className={calendarStyles.modalContent}>
                                <h3 className={calendarStyles.modalTitle}>
                                    Confirm Delete
                                </h3>
                                <p className={calendarStyles.modalMessage}>
                                    {deleteType === 'past' 
                                        ? 'Are you sure you want to delete this submitted trial? This action cannot be undone.'
                                        : 'Are you sure you want to delete this upcoming presentation? This action cannot be undone.'
                                    }
                                </p>
                                <div className={calendarStyles.modalActions}>
                                    <button 
                                        className={calendarStyles.cancelButton} 
                                        onClick={handleCancelDelete}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className={calendarStyles.deleteButton} 
                                        onClick={handleConfirmDelete}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add/Edit Modal */}
                {isModalOpen && (
                    <div className={calendarStyles.modalOverlay} onClick={closeModal}>
                        <div className={calendarStyles.modal} onClick={(e) => e.stopPropagation()}>
                            <div className={calendarStyles.modalHeader}>
                                <h3 className={calendarStyles.modalTitle}>
                                    {editingPresentation ? 'Edit Presentation' : 'Add New Presentation'}
                                </h3>
                                <button className={calendarStyles.closeButton} onClick={closeModal}>
                                    <FiX />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className={calendarStyles.modalForm}>
                                <div className={calendarStyles.formGroup}>
                                    <label className={calendarStyles.formLabel}>Presentation Topic *</label>
                                    <input
                                        type="text"
                                        className={calendarStyles.formInput}
                                        value={formData.topic}
                                        onChange={(e) => setFormData({...formData, topic: e.target.value})}
                                        placeholder="for content relevance analysis"
                                        maxLength={255}
                                        required
                                    />
                                </div>
                                
                                <div className={calendarStyles.formRow}>
                                    <div className={calendarStyles.formGroup}>
                                        <label className={calendarStyles.formLabel}>Date</label>
                                        <input
                                            type="date"
                                            className={calendarStyles.formInput}
                                            value={formData.date}
                                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className={calendarStyles.formGroup}>
                                        <label className={calendarStyles.formLabel}>Time</label>
                                        <input
                                            type="time"
                                            className={calendarStyles.formInput}
                                            value={formData.time}
                                            onChange={(e) => setFormData({...formData, time: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className={calendarStyles.formGroup}>
                                    <label className={calendarStyles.formLabel}>Language *</label>
                                                    <select
                  className={calendarStyles.formSelect}
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value})}
                  required
                >
                  <option value="">Select Language</option>
                                        <option value="english">English</option>
                                        <option value="arabic">Arabic</option>
                                    </select>
                                </div>
                                
                                <div className={calendarStyles.formGroup}>
                                    <label className={calendarStyles.formLabel}>Description</label>
                                    <textarea
                                        className={calendarStyles.formTextarea}
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        rows={3}
                                        placeholder="Brief description of the presentation..."
                                    />
                                </div>
                                
                                <div className={calendarStyles.modalActions}>
                                    <button type="button" className={calendarStyles.cancelButton} onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className={calendarStyles.submitButton}>
                                        <FiCheck /> {editingPresentation ? 'Update' : 'Add'} Presentation
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Calendar;