"use client"

import React, { useState } from 'react';
import styles from "./page.module.css";
import SideBar from "../UploadRecordVideos/components/SideBar";
import Header from "./components/Header";
import { IoFilterOutline } from "react-icons/io5";
import Link from 'next/link';

interface Trial {
    id: string;
    name: string;
    date: string;
    feedback: string;
}

const mockTrials: Trial[] = [
    { id: 'R217303', name: 'Franjaipets', date: '12/01/2022', feedback: 'This is feedback about this vid...' },
    { id: 'R78358', name: 'Adom.com', date: '12/01/2022', feedback: 'This is feedback about this vid...' },
    { id: 'R28795', name: 'Charles Tea', date: '12/01/2022', feedback: 'This is feedback about this vid...' },
    { id: 'R28575', name: 'Sarah Bloom', date: '12/01/2022', feedback: 'This is feedback about this vid...' },
    { id: 'R28517', name: 'John Green', date: '12/01/2022', feedback: 'This is feedback about this vid...' },
];

const SubmittedTrials = () => {
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterType, setFilterType] = useState<'id' | 'name' | 'date' | null>(null);
    const [filterValue, setFilterValue] = useState('');
    const [filteredTrials, setFilteredTrials] = useState<Trial[]>(mockTrials);

    const handleFilterClick = () => {
        setShowFilterModal(!showFilterModal);
    };

    const handleFilterTypeChange = (type: 'id' | 'name' | 'date') => {
        setFilterType(type);
    };

    const handleFilterValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterValue(e.target.value);
    };

    const applyFilter = () => {
        if (!filterType || !filterValue) {
            setFilteredTrials(mockTrials);
            return;
        }

        const filtered = mockTrials.filter(trial => {
            const value = trial[filterType].toLowerCase();
            return value.includes(filterValue.toLowerCase());
        });

        setFilteredTrials(filtered);
        setShowFilterModal(false);
    };

    const clearFilter = () => {
        setFilterType(null);
        setFilterValue('');
        setFilteredTrials(mockTrials);
        setShowFilterModal(false);
    };

    return (
        <div className={styles.container}>
            <SideBar />
            <Header />
            <div className={styles.mainContent}>
                <div className={styles.headerActions}>
                    <div className={styles.headerTitle}>Trials Details</div>
                    <div className={styles.actionButtons}>
                        <button className={styles.filterButton} onClick={handleFilterClick}><IoFilterOutline />Filter</button>
                        <Link href="/UploadRecordVideos">
                            <button className={styles.submitButton}>Submit new trial</button>
                        </Link>
                    </div>
                </div>

                {showFilterModal && (
                    <div className={styles.filterModal}>
                        <div className={styles.filterModalContent}>
                            <h3>Filter Videos</h3>
                            <div className={styles.filterOptions}>
                                <div className={styles.filterTypeOptions}>
                                    <label>
                                        <input 
                                            type="radio" 
                                            name="filterType" 
                                            checked={filterType === 'id'} 
                                            onChange={() => handleFilterTypeChange('id')} 
                                        />
                                        Filter by ID
                                    </label>
                                    <label>
                                        <input 
                                            type="radio" 
                                            name="filterType" 
                                            checked={filterType === 'name'} 
                                            onChange={() => handleFilterTypeChange('name')} 
                                        />
                                        Filter by Name
                                    </label>
                                    <label>
                                        <input 
                                            type="radio" 
                                            name="filterType" 
                                            checked={filterType === 'date'} 
                                            onChange={() => handleFilterTypeChange('date')} 
                                        />
                                        Filter by Date
                                    </label>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder={`Enter ${filterType || 'value'} to filter...`}
                                    value={filterValue}
                                    onChange={handleFilterValueChange}
                                    className={styles.filterInput}
                                />
                                <div className={styles.filterActions}>
                                    <button onClick={applyFilter} className={styles.applyFilterButton}>Apply Filter</button>
                                    <button onClick={clearFilter} className={styles.clearFilterButton}>Clear Filter</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.trialsTable}>
                    <div className={styles.tableHeader}>
                        <div>ID</div>
                        <div>Name</div>
                        <div>Date</div>
                        <div>Feedback</div>
                        <div>Actions</div>
                    </div>
                    {filteredTrials.map((trial) => (
                        <div key={trial.id} className={styles.tableRow}>
                            <div className={styles.videoCell}>
                                <div className={styles.videoThumbnail}>
                                    <img 
                                        src="/Images/VideoIcon.png" 
                                        alt="Video" 
                                        className={styles.videoIcon}
                                    />
                                    <div className={styles.playIcon}></div>
                                </div>
                                {trial.id}
                            </div>
                            <div>{trial.name}</div>
                            <div>{trial.date}</div>
                            <div className={styles.feedbackCell}>
                                {trial.feedback}
                                <button className={styles.viewMore}>view more</button>
                            </div>
                            <div className={styles.actions}>
                                <button className={styles.downloadButton}></button>
                                <button className={styles.deleteButton}>
                                  <img 
                                      src="/Images/TrashIcon.png"
                                      className={styles.trashIcon}
                                  />
                              </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default SubmittedTrials;