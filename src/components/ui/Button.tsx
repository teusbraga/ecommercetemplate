'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  testId?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      testId,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      fontWeight: 500,
      borderRadius: 6,
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      opacity: disabled || isLoading ? 0.6 : 1,
      border: '1px solid transparent',
      transition: 'background-color 0.15s ease, border-color 0.15s ease',
      fontFamily: 'inherit',
      textDecoration: 'none',
      ...style,
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: '#0070f3',
        color: '#ffffff',
      },
      secondary: {
        backgroundColor: '#f4f4f5',
        color: '#18181b',
        borderColor: '#e4e4e7',
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#18181b',
        borderColor: '#d4d4d8',
      },
      danger: {
        backgroundColor: '#ef4444',
        color: '#ffffff',
      },
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { padding: '6px 12px', fontSize: 13 },
      md: { padding: '10px 18px', fontSize: 14 },
      lg: { padding: '14px 24px', fontSize: 16 },
    };

    return (
      <button
        ref={ref}
        data-testid={testId}
        disabled={disabled || isLoading}
        style={{
          ...baseStyle,
          ...variantStyles[variant],
          ...sizeStyles[size],
        }}
        {...props}
      >
        {isLoading && (
          <span
            style={{
              width: 14,
              height: 14,
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.6s linear infinite',
            }}
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
