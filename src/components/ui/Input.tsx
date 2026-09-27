'use client';

import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  testId?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, testId, style, ...props }, ref) => {
    const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontSize: 13, fontWeight: 500, color: '#3f3f46' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          data-testid={testId}
          style={{
            padding: '10px 14px',
            fontSize: 14,
            borderRadius: 6,
            border: `1px solid ${error ? '#ef4444' : '#d4d4d8'}`,
            outline: 'none',
            backgroundColor: '#ffffff',
            color: '#18181b',
            boxSizing: 'border-box',
            width: '100%',
            fontFamily: 'inherit',
            ...style,
          }}
          {...props}
        />
        {error && (
          <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
