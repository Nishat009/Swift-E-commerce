'use client';

import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
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
  const iconMap = {
    danger: <AlertTriangle className="w-8 h-8 text-red-500" />,
    warning: <AlertTriangle className="w-8 h-8 text-amber-500" />,
    primary: <HelpCircle className="w-8 h-8 text-primary" />,
  };

  const confirmButtonClass = {
    danger: 'bg-red-600 hover:bg-red-700 text-white border-0 rounded-full font-bold px-6 shadow-md',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white border-0 rounded-full font-bold px-6 shadow-md',
    primary: 'bg-primary hover:bg-primary-dark text-white border-0 rounded-full font-bold px-6 shadow-md',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center p-4">
        {/* Decorative Icon */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-full">
          {iconMap[variant]}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold font-serif text-gray-900 dark:text-white mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-650 dark:text-gray-400 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-row justify-center gap-3 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-full px-6 text-xs font-bold"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            loading={isLoading}
            className={`${confirmButtonClass[variant]} text-xs font-bold`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
