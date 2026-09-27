import React from 'react';

export function Spinner({ size = 24, testId = 'spinner' }: { size?: number; testId?: string }) {
  return (
    <div
      data-testid={testId}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: '3px solid #e4e4e7',
        borderTopColor: '#0070f3',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}
