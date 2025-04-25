"use client";
import React, { useState } from 'react';
import styles from "./page.module.css";
import styles1 from "../Login/page.module.css";
import SideBar from "../UploadRecordVideos/components/SideBar";
import Header from "./components/Header";
import HeaderActions from './components/HeaderActions';
import FilterModal from './components/FilterModal';
import TrialsTable from './components/TrialsTable';

interface Trial {
    id: string;
    name: string;
    date: string;
    feedback: string;
}

// Mock data for trials
const mockTrials: Trial[] = [
    { id: "TR001", name: "Trial 1", date: "2023-05-15", feedback: "Good performance, needs minor adjustments..." },
    { id: "TR002", name: "Trial 2", date: "2023-05-16", feedback: "Excellent work, no changes needed..." },
    { id: "TR003", name: "Trial 3", date: "2023-05-17", feedback: "Needs improvement in several areas..." },
    { id: "TR004", name: "Trial 4", date: "2023-05-18", feedback: "Average performance, some changes required..." },
    { id: "TR005", name: "Trial 5", date: "2023-05-19", feedback: "Poor performance, major revisions needed..." },
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
        <div className={styles1.container}>
            <SideBar />
            <Header />
            <div className={styles.mainContent}>
                <HeaderActions handleFilterClick={handleFilterClick} />
                
                <FilterModal 
                    showFilterModal={showFilterModal}
                    filterType={filterType}
                    filterValue={filterValue}
                    handleFilterTypeChange={handleFilterTypeChange}
                    handleFilterValueChange={handleFilterValueChange}
                    applyFilter={applyFilter}
                    clearFilter={clearFilter}
                />

                <TrialsTable trials={filteredTrials} />
            </div>
        </div>
    );
}

export default SubmittedTrials;