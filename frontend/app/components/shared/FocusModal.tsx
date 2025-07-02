"use client";
import React, { useState, useEffect } from 'react';
import { FiX, FiTarget, FiMic, FiEye, FiFileText } from 'react-icons/fi';
import styles from './FocusModal.module.css';

export interface FocusOption {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedFocus: string[]) => void;
  selectedFocus: string[];
}

const focusOptions: FocusOption[] = [
  // Speech Analysis
  { id: 'speech_emotion', name: 'Speech Emotion', category: 'speech', description: 'Analyze emotional tone in voice' },
  { id: 'speaking_rate', name: 'Speaking Rate (WPM)', category: 'speech', description: 'Words per minute analysis' },
  { id: 'pitch_analysis', name: 'Pitch Analysis', category: 'speech', description: 'Voice pitch variation and patterns' },
  { id: 'filler_words', name: 'Filler Word Detection', category: 'speech', description: 'Detect "um", "uh", and other fillers' },
  { id: 'stutter_detection', name: 'Stutter Detection', category: 'speech', description: 'Identify speech disruptions' },
  
  // Visual Analysis
  { id: 'facial_emotion', name: 'Facial Emotion', category: 'visual', description: 'Facial expression analysis' },
  { id: 'eye_contact', name: 'Eye Contact', category: 'visual', description: 'Monitor audience engagement' },
  { id: 'hand_gestures', name: 'Hand Gestures', category: 'visual', description: 'Hand movement and gestures' },
  { id: 'posture_analysis', name: 'Posture Analysis', category: 'visual', description: 'Body positioning and stance' },
  
  // Content Analysis
  { id: 'lexical_richness', name: 'Lexical Richness', category: 'content', description: 'Vocabulary diversity analysis' },
  { id: 'keyword_relevance', name: 'Keyword Relevance', category: 'content', description: 'Topic alignment assessment' },
];

const FocusModal: React.FC<FocusModalProps> = ({ isOpen, onClose, onSave, selectedFocus }) => {
  const [localSelectedFocus, setLocalSelectedFocus] = useState<string[]>(selectedFocus);

  useEffect(() => {
    setLocalSelectedFocus(selectedFocus);
  }, [selectedFocus]);

  if (!isOpen) return null;

  const handleToggleFocus = (focusId: string) => {
    setLocalSelectedFocus(prev => {
      if (prev.includes(focusId)) {
        return prev.filter(id => id !== focusId);
      } else {
        return [...prev, focusId];
      }
    });
  };

  const handleSelectAllCategory = (category: string) => {
    const categoryOptions = focusOptions.filter(option => option.category === category);
    const categoryIds = categoryOptions.map(option => option.id);
    
    setLocalSelectedFocus(prev => {
      const allCategorySelected = categoryIds.every(id => prev.includes(id));
      
      if (allCategorySelected) {
        // If all are selected, deselect all in this category
        return prev.filter(id => !categoryIds.includes(id));
      } else {
        // If not all are selected, select all in this category
        const otherCategories = prev.filter(id => !categoryIds.includes(id));
        return [...otherCategories, ...categoryIds];
      }
    });
  };

  const handleSave = () => {
    onSave(localSelectedFocus);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'speech': return <FiMic />;
      case 'visual': return <FiEye />;
      case 'content': return <FiFileText />;
      default: return <FiTarget />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'speech': return 'Speech Analysis';
      case 'visual': return 'Visual Analysis';
      case 'content': return 'Content Analysis';
      default: return 'Analysis';
    }
  };

  const isAllCategorySelected = (category: string) => {
    const categoryOptions = focusOptions.filter(option => option.category === category);
    const categoryIds = categoryOptions.map(option => option.id);
    return categoryIds.every(id => localSelectedFocus.includes(id));
  };

  const isSomeCategorySelected = (category: string) => {
    const categoryOptions = focusOptions.filter(option => option.category === category);
    const categoryIds = categoryOptions.map(option => option.id);
    return categoryIds.some(id => localSelectedFocus.includes(id));
  };

  const speechOptions = focusOptions.filter(option => option.category === 'speech');
  const visualOptions = focusOptions.filter(option => option.category === 'visual');
  const contentOptions = focusOptions.filter(option => option.category === 'content');

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <FiTarget className={styles.titleIcon} />
            My focus analytics
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <div className={styles.modalSubtitle}>
          Choose any number of analytics to focus on improving. You can change them any time!
        </div>

        <div className={styles.selectedCount}>
          Selected: {localSelectedFocus.length} focus area{localSelectedFocus.length !== 1 ? 's' : ''}
        </div>

        <div className={styles.categoriesContainer}>
          {/* Speech Analysis */}
          <div className={styles.category}>
            <div className={styles.categoryHeader}>
              {getCategoryIcon('speech')}
              <h3>{getCategoryTitle('speech')}</h3>
              <div className={styles.selectAllContainer}>
                <label className={styles.selectAllLabel}>
                  <input
                    type="checkbox"
                    checked={isAllCategorySelected('speech')}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isSomeCategorySelected('speech') && !isAllCategorySelected('speech');
                      }
                    }}
                    onChange={() => handleSelectAllCategory('speech')}
                    className={styles.selectAllCheckbox}
                  />
                  <span className={styles.selectAllText}>Select All</span>
                </label>
              </div>
            </div>
            <div className={styles.optionsList}>
              {speechOptions.map((option) => (
                <div
                  key={option.id}
                  className={`${styles.optionItem} ${localSelectedFocus.includes(option.id) ? styles.selected : ''}`}
                  onClick={() => handleToggleFocus(option.id)}
                >
                  <div className={styles.optionContent}>
                    <div className={styles.optionName}>{option.name}</div>
                    <div className={styles.optionDescription}>{option.description}</div>
                  </div>
                  <div className={styles.optionCheckbox}>
                    {localSelectedFocus.includes(option.id) && <FiTarget />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Analysis */}
          <div className={styles.category}>
            <div className={styles.categoryHeader}>
              {getCategoryIcon('visual')}
              <h3>{getCategoryTitle('visual')}</h3>
              <div className={styles.selectAllContainer}>
                <label className={styles.selectAllLabel}>
                  <input
                    type="checkbox"
                    checked={isAllCategorySelected('visual')}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isSomeCategorySelected('visual') && !isAllCategorySelected('visual');
                      }
                    }}
                    onChange={() => handleSelectAllCategory('visual')}
                    className={styles.selectAllCheckbox}
                  />
                  <span className={styles.selectAllText}>Select All</span>
                </label>
              </div>
            </div>
            <div className={styles.optionsList}>
              {visualOptions.map((option) => (
                <div
                  key={option.id}
                  className={`${styles.optionItem} ${localSelectedFocus.includes(option.id) ? styles.selected : ''}`}
                  onClick={() => handleToggleFocus(option.id)}
                >
                  <div className={styles.optionContent}>
                    <div className={styles.optionName}>{option.name}</div>
                    <div className={styles.optionDescription}>{option.description}</div>
                  </div>
                  <div className={styles.optionCheckbox}>
                    {localSelectedFocus.includes(option.id) && <FiTarget />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Analysis */}
          <div className={styles.category}>
            <div className={styles.categoryHeader}>
              {getCategoryIcon('content')}
              <h3>{getCategoryTitle('content')}</h3>
              <div className={styles.selectAllContainer}>
                <label className={styles.selectAllLabel}>
                  <input
                    type="checkbox"
                    checked={isAllCategorySelected('content')}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isSomeCategorySelected('content') && !isAllCategorySelected('content');
                      }
                    }}
                    onChange={() => handleSelectAllCategory('content')}
                    className={styles.selectAllCheckbox}
                  />
                  <span className={styles.selectAllText}>Select All</span>
                </label>
              </div>
            </div>
            <div className={styles.optionsList}>
              {contentOptions.map((option) => (
                <div
                  key={option.id}
                  className={`${styles.optionItem} ${localSelectedFocus.includes(option.id) ? styles.selected : ''}`}
                  onClick={() => handleToggleFocus(option.id)}
                >
                  <div className={styles.optionContent}>
                    <div className={styles.optionName}>{option.name}</div>
                    <div className={styles.optionDescription}>{option.description}</div>
                  </div>
                  <div className={styles.optionCheckbox}>
                    {localSelectedFocus.includes(option.id) && <FiTarget />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.saveButton} onClick={handleSave}>
            Update Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusModal; 