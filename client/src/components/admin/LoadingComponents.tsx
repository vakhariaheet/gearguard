/**
 * Loading components for admin dashboard
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

export function LoadingSpinner({ size = 16, color = '#fff' }: LoadingSpinnerProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid transparent`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        display: 'inline-block',
      }}
    />
  );
}

interface ButtonWithLoadingProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  onMouseOver?: (e: React.MouseEvent) => void;
  onMouseOut?: (e: React.MouseEvent) => void;
  [key: string]: any;
}

export function ButtonWithLoading({ 
  children, 
  isLoading, 
  loadingText, 
  onClick, 
  disabled, 
  style, 
  onMouseOver,
  onMouseOut,
  ...props 
}: ButtonWithLoadingProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      style={{
        ...style,
        opacity: disabled || isLoading ? 0.7 : 1,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s ease',
      }}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      {...props}
    >
      {isLoading && <LoadingSpinner size={14} color={style?.color || '#fff'} />}
      {isLoading ? loadingText || 'Loading...' : children}
    </button>
  );
}

interface IconButtonWithLoadingProps {
  children: React.ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  onMouseOver?: (e: React.MouseEvent) => void;
  onMouseOut?: (e: React.MouseEvent) => void;
  [key: string]: any;
}

export function IconButtonWithLoading({ 
  children, 
  isLoading, 
  onClick, 
  disabled, 
  style, 
  onMouseOver,
  onMouseOut,
  ...props 
}: IconButtonWithLoadingProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      style={{
        ...style,
        opacity: disabled || isLoading ? 0.7 : 1,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
      }}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size={16} color="currentColor" />
      ) : (
        children
      )}
    </button>
  );
}

export function StatsCardSkeleton() {
  return (
    <div style={{
      padding: '1.75rem',
      backgroundColor: '#fff',
      borderRadius: '1rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid #f1f5f9',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
        animation: 'shimmer 1.5s infinite',
      }} />
      <div style={{
        height: '14px',
        backgroundColor: '#e2e8f0',
        borderRadius: '4px',
        marginBottom: '12px',
        width: '60%',
      }} />
      <div style={{
        height: '32px',
        backgroundColor: '#e2e8f0',
        borderRadius: '6px',
        width: '40%',
      }} />
    </div>
  );
}

export function TableRowSkeleton({ columns }: { columns: number }) {
  return (
    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} style={{ padding: '1rem' }}>
          <div style={{
            height: '20px',
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
            width: index === 0 ? '80%' : '60%',
          }} />
        </td>
      ))}
    </tr>
  );
}