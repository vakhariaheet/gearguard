/**
 * Custom confirmation dialog component
 */

import { ButtonWithLoading } from './LoadingComponents';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getConfirmButtonStyles = () => {
    const baseStyles = {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontWeight: 600,
      fontSize: '0.95rem',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    };

    switch (confirmVariant) {
      case 'danger':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
        };
      case 'warning':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
        };
      case 'primary':
      default:
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
        };
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '450px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '1px solid #f1f5f9',
          animation: 'modalFadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: confirmVariant === 'danger' ? '#fee2e2' : 
                              confirmVariant === 'warning' ? '#fef3c7' : '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '1.5rem',
            }}
          >
            {confirmVariant === 'danger' ? '⚠️' : 
             confirmVariant === 'warning' ? '⚠️' : 'ℹ️'}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#111827',
            }}
          >
            {title}
          </h3>
        </div>

        {/* Message */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              color: '#6b7280',
              fontSize: '1rem',
              lineHeight: 1.5,
            }}
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '2px solid #e2e8f0',
              backgroundColor: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              color: '#64748b',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.5 : 1,
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            {cancelText}
          </button>
          
          <ButtonWithLoading
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText="Processing..."
            disabled={isLoading}
            style={getConfirmButtonStyles()}
            onMouseOver={(e: any) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = confirmVariant === 'danger' 
                  ? '0 6px 16px rgba(220, 38, 38, 0.4)'
                  : confirmVariant === 'warning'
                  ? '0 6px 16px rgba(245, 158, 11, 0.4)'
                  : '0 6px 16px rgba(37, 99, 235, 0.4)';
              }
            }}
            onMouseOut={(e: any) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = confirmVariant === 'danger'
                  ? '0 4px 12px rgba(220, 38, 38, 0.3)'
                  : confirmVariant === 'warning'
                  ? '0 4px 12px rgba(245, 158, 11, 0.3)'
                  : '0 4px 12px rgba(37, 99, 235, 0.3)';
              }
            }}
          >
            {confirmText}
          </ButtonWithLoading>
        </div>
      </div>
    </div>
  );
}