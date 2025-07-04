import React, { useEffect, useState } from 'react';
import styles from '../page.module.css';
import PresentationService from '../../services/presentationService';

const MODEL_LABELS: Record<string, string> = {
  wpm_analysis: 'Speaking Pace',
  pitch_analysis: 'Pitch Variety',
  filler_detection: 'Filler Words',
  stutter_detection: 'Speech Fluency',
  facial_emotion: 'Facial Expression',
  eye_contact: 'Eye Contact',
  hand_gesture: 'Hand Gestures',
  posture_analysis: 'Posture',
  keyword_relevance: 'Content Relevance',
  confidence_detector: 'Confidence',
  lexical_richness: 'Vocabulary Richness',
};

const getWeaknessModels = (enhanced: any) => {
  if (!enhanced?.individual_model_scores) return [];
  const models = enhanced.individual_model_scores;
  return Object.entries(models)
    .filter(([_, data]: [string, any]) => typeof data === 'object' && data.score !== undefined && data.score < 3)
    .map(([model]) => model);
};

const readable = (models: string[]) =>
  models.length === 0 ? null : (
    <div>
      {models.map((m, i) => (
        <div key={m} style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: '#F0C419', fontWeight: 700, marginRight: 6 }}>{i + 1}-</span>
          <span className={styles.weaknessModel}>{MODEL_LABELS[m] || m}</span>
        </div>
      ))}
    </div>
  );

const StatsSummary = () => {
  const [stats, setStats] = useState({
    points: 0,
    newWeaknesses: [] as string[],
    newWeaknessesChange: [] as string[],
    repeatedWeaknesses: [] as string[],
    repeatedWeaknessesChange: [] as string[],
  });
  const [dates, setDates] = useState<{ label: string, value: number }[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const response = await PresentationService.getUserPresentations();
      if (response.success && response.data) {
        const presentations = (response.data as any).videos || [];
        const now = new Date();
        const submitted = presentations.filter((p: any) => new Date(p.uploaded_at) <= now);
        const sorted = submitted.sort((a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
        setDates(sorted.map((p: any, idx: number) => ({
          label: `${p.title || 'Untitled'} — ${formatDate(p.uploaded_at)}`,
          value: idx
        })));
        const feedbacks = await Promise.all(
          sorted.map(async (presentation: any) => {
            try {
              const feedbackResponse = await fetch(`http://localhost:8081/feedback/presentation/${presentation.id}/feedback`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                  'Content-Type': 'application/json',
                },
              });
              if (feedbackResponse.ok) {
                return await feedbackResponse.json();
              }
            } catch {}
            return null;
          })
        );
        const latest = feedbacks[selectedIdx]?.enhanced_feedback;
        const previous = feedbacks[selectedIdx + 1]?.enhanced_feedback;
        const points = latest?.overall_score ? Math.round(latest.overall_score * 100) : 0;
        const latestWeak = getWeaknessModels(latest);
        const prevWeak = getWeaknessModels(previous);
        // New Weaknesses: in latest but not in previous
        const newWeaknesses = latestWeak.filter(w => !prevWeak.includes(w));
        // Repeated Weaknesses: in both
        const repeatedWeaknesses = latestWeak.filter(w => prevWeak.includes(w));
        setStats({
          points,
          newWeaknesses: latestWeak,
          newWeaknessesChange: newWeaknesses,
          repeatedWeaknesses,
          repeatedWeaknessesChange: repeatedWeaknesses,
        });
      }
      setLoading(false);
    };
    fetchStats();
  }, [selectedIdx]);

  return (
    <div className={styles.pieChartSection}>
      <select
        className={styles.timeRangeSelector}
        value={selectedIdx}
        onChange={e => setSelectedIdx(Number(e.target.value))}
        disabled={loading || dates.length <= 1}
        title={dates.length <= 1 ? 'Only one presentation available' : ''}
      >
        {loading ? (
          <option>Loading...</option>
        ) : (
          dates.map(({ label, value }) => (
            <option key={label + '-' + value} value={value}>{label}</option>
          ))
        )}
      </select>
      <div className={styles.statsSummary}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Points Scored</span>
          <span className={styles.statValue}>{stats.points} pts</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>New Weaknesses</span>
          <span className={styles.statValue}>
            {stats.newWeaknesses.length > 0 ? readable(stats.newWeaknesses) : 'None'}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Repeated Weaknesses</span>
          <span className={styles.statValue}>
            {stats.repeatedWeaknesses.length > 0 ? readable(stats.repeatedWeaknesses) : 'None'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatsSummary;