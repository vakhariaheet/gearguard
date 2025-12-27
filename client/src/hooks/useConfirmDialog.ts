/**
 * Hook for managing confirmation dialogs
 */

import { useState, useCallback } from 'react';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm?: () => void;
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showConfirm = useCallback((options: Omit<ConfirmDialogState, 'isOpen'>) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        ...options,
        isOpen: true,
        onConfirm: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
      });
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const confirmDelete = useCallback((itemName: string = 'this item') => {
    return showConfirm({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
  }, [showConfirm]);

  const confirmBan = useCallback((userName: string = 'this user') => {
    return showConfirm({
      title: 'Confirm Ban',
      message: `Are you sure you want to ban ${userName}? They will no longer be able to access the application.`,
      confirmText: 'Ban User',
      cancelText: 'Cancel',
      variant: 'warning',
    });
  }, [showConfirm]);

  const confirmRevoke = useCallback((itemName: string = 'this invitation') => {
    return showConfirm({
      title: 'Revoke Invitation',
      message: `Are you sure you want to revoke ${itemName}? The recipient will no longer be able to use this invitation.`,
      confirmText: 'Revoke',
      cancelText: 'Cancel',
      variant: 'warning',
    });
  }, [showConfirm]);

  return {
    dialogState,
    showConfirm,
    hideConfirm,
    confirmDelete,
    confirmBan,
    confirmRevoke,
  };
}