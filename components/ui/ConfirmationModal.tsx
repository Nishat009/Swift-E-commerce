'use client';

import React, { ReactNode } from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}: ConfirmationModalProps) {
  const confirmButtonClass = {
    danger: 'bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500',
    warning: '',
    primary: '',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center p-4">
        <h3 className="text-2xl font-serif font-medium tracking-tight text-ink mb-2">
          {title}
        </h3>

        <div className="text-sm text-stone-600 dark:text-stone-400 mb-7 leading-relaxed w-full">
          {message}
        </div>

        <div className="flex flex-row justify-center gap-3 w-full">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm} loading={isLoading} className={confirmButtonClass[variant]}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
