import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseStyles = `
      w-full px-3 py-2
      border rounded-lg
      text-sm
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variantStyles = {
      default: `
        border-gray-300
        focus:border-purple-500 focus:ring-purple-500
        bg-white
      `,
      filled: `
        border-transparent
        focus:border-purple-500 focus:ring-purple-500
        bg-gray-50 focus:bg-white
      `,
    };

    const errorStyles = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : '';

    const iconStyles = leftIcon || rightIcon ? 'pl-10' : '';
    const rightIconStyles = rightIcon ? 'pr-10' : '';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">{leftIcon}</div>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={`
              ${baseStyles}
              ${variantStyles[variant]}
              ${errorStyles}
              ${iconStyles}
              ${rightIconStyles}
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">{rightIcon}</div>
            </div>
          )}
        </div>
        
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 