import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  border = true,
  hover = false,
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const borderStyles = border ? 'border border-gray-200' : '';
  const hoverStyles = hover ? 'hover:shadow-lg transition-shadow duration-200' : '';

  return (
    <div
      className={`
        bg-white rounded-lg
        ${paddingStyles[padding]}
        ${shadowStyles[shadow]}
        ${borderStyles}
        ${hoverStyles}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card; 