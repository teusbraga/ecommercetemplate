import React, { TableHTMLAttributes, ReactNode } from 'react';

export function Table({
  children,
  style,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div style={{ width: '100%', overflowX: 'auto', border: '1px solid #e4e4e7', borderRadius: 8, backgroundColor: '#ffffff' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 14,
          textAlign: 'left',
          ...style,
        }}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e4e4e7' }}>
      {children}
    </thead>
  );
}

export function TableRow({
  children,
  onClick,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid #f1f5f9',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.1s ease',
        ...style,
      }}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <th
      style={{
        padding: '12px 16px',
        fontWeight: 600,
        color: '#475569',
        fontSize: 13,
        ...style,
      }}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: '14px 16px',
        color: '#1e293b',
        ...style,
      }}
    >
      {children}
    </td>
  );
}
