'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export type ForgotModalState = { email: string; token: string } | null;

// Forgot / reset password modal: null when closed, otherwise what it opens with.
// Arriving from the emailed reset link (?resetToken=) opens it on the new-password step.
export function useResetTokenModal() {
  const searchParams = useSearchParams();
  const [forgotModal, setForgotModal] = useState<ForgotModalState>(() => {
    const resetToken = searchParams?.get('resetToken') || '';
    return resetToken ? { email: '', token: resetToken } : null;
  });

  return {
    forgotModal,
    openForgotModal: (email: string) => setForgotModal({ email, token: '' }),
    closeForgotModal: () => setForgotModal(null),
  };
}
