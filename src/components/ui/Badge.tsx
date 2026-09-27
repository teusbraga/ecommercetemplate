import React, { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  testId?: string;
}

export function Badge({ children, variant = 'default', testId }: BadgeProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: { backgroundColor: '#f4f4f5', color: '#52525b', border: '1px solid #e4e4e7' },
    success: { backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' },
    warning: { backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' },
    danger: { backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
    info: { backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  };

  return (
    <span
      data-testid={testId}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 9999,
        lineHeight: '18px',
        ...variantStyles[variant],
      }}
    >
      {children}
    </span>
  );
}
