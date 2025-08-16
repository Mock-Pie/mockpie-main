'use client';

import React from 'react';
import { FiZap, FiTarget, FiCheckCircle } from 'react-icons/fi';

interface RecommendationItem {
    text: string;
    category?: string;
    priority?: 'high' | 'medium' | 'low';
}

interface RecommendationsCardProps {
    title: string;
    recommendations: RecommendationItem[];
    icon?: React.ReactNode;
    color?: string;
    type?: 'recommendations' | 'insights' | 'nextSteps';
}

const RecommendationsCard: React.FC<RecommendationsCardProps> = ({ 
    title, 
    recommendations, 
    icon,
    color = '#9966FF',
    type = 'recommendations'
}) => {
    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'high':
                return '#EF4444';
            case 'medium':
                return '#F59E0B';
            case 'low':
                return '#10B981';
            default:
                return '#6B7280';
        }
    };

    const getTypeIcon = () => {
        switch (type) {
            case 'insights':
                return <FiZap />;
            case 'nextSteps':
                return <FiTarget />;
            default:
                return <FiCheckCircle />;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
                {icon && (
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                        <div style={{ color }}>{icon}</div>
                    </div>
                )}
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            </div>
            
            <div className="space-y-3">
                {recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div 
                            className="p-1 rounded-full mt-1"
                            style={{ backgroundColor: `${color}20` }}
                        >
                            <div style={{ color }} className="text-sm">
                                {getTypeIcon()}
                            </div>
                        </div>
                        
                        <div className="flex-1">
                            <p className="text-gray-800 text-sm leading-relaxed">
                                {recommendation.text}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-2">
                                {recommendation.category && (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                        {recommendation.category}
                                    </span>
                                )}
                                {recommendation.priority && (
                                    <span 
                                        className="px-2 py-1 text-xs font-medium rounded-full"
                                        style={{ 
                                            backgroundColor: `${getPriorityColor(recommendation.priority)}20`,
                                            color: getPriorityColor(recommendation.priority)
                                        }}
                                    >
                                        {recommendation.priority.charAt(0).toUpperCase() + recommendation.priority.slice(1)} Priority
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendationsCard; 