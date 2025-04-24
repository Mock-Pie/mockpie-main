import React from 'react';
import TableHeader from './TableHeader';
import TableRow from './TableRow';
import styles from "../page.module.css";

interface Trial {
    id: string;
    name: string;
    date: string;
    feedback: string;
}

interface TrialsTableProps {
    trials: Trial[];
}

const TrialsTable = ({ trials }: TrialsTableProps) => {
    return (
        <div className={styles.trialsTable}>
            <TableHeader />
            {trials.map((trial) => (
                <TableRow key={trial.id} trial={trial} />
            ))}
        </div>
    );
};

export default TrialsTable;