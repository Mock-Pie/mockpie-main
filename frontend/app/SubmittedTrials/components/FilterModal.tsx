import React from 'react';
import styles from "../page.module.css";
import { IoCloseOutline } from 'react-icons/io5';

interface FilterModalProps {
    showFilterModal: boolean;
    filterType: 'id' | 'name' | 'date' | null;
    filterValue: string;
    handleFilterTypeChange: (type: 'id' | 'name' | 'date') => void;
    handleFilterValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    applyFilter: () => void;
    clearFilter: () => void;
}

const FilterModal = ({ 
    showFilterModal, 
    filterType, 
    filterValue, 
    handleFilterTypeChange, 
    handleFilterValueChange, 
    applyFilter, 
    clearFilter 
}: FilterModalProps) => {
    if (!showFilterModal) return null;
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            applyFilter();
        }
    };
    
    return (
        <div className={styles.filterModal} onClick={clearFilter}>
            <div className={styles.filterModalContent} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Filter Videos</h3>
                    <button 
                        onClick={clearFilter} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}
                    >
                        <IoCloseOutline size={24} />
                    </button>
                </div>
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
                        onKeyDown={handleKeyDown}
                        className={styles.filterInput}
                    />
                    <div className={styles.filterActions}>
                        <button onClick={applyFilter} className={styles.applyFilterButton}>Apply Filter</button>
                        <button onClick={clearFilter} className={styles.clearFilterButton}>Clear Filter</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;