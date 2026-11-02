'use client';

import { useState } from 'react';

const MAX_FAILURES = 3;
const DEFAULT_LOCK_SECONDS = 30;

// Mirrors the server's sign-in lock: after MAX_FAILURES wrong passwords (or a 429 from the
// server) the form is disabled and counts down until it can be used again.
export function useLoginLockout() {
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const resetFailures = () => setFailedAttempts(0);

  // Records a failed sign-in and returns the message to show the user
  const recordFailure = (error: { status?: number; retryAfter?: number; message?: string }) => {
    // The server is the source of truth for lockouts (429 + retryAfter seconds)
    const serverLocked = error.status === 429;
    const nextFailCount = serverLocked ? MAX_FAILURES : failedAttempts + 1;
    setFailedAttempts(nextFailCount);

    if (nextFailCount < MAX_FAILURES) {
      return `Invalid email or password. Attempt ${nextFailCount}/${MAX_FAILURES} before lockout.`;
    }

    const seconds = serverLocked && error.retryAfter ? error.retryAfter : DEFAULT_LOCK_SECONDS;
    setIsLocked(true);
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setFailedAttempts(0);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return serverLocked && error.message ? error.message : `Too many failed attempts. Login is locked for ${seconds} seconds.`;
  };

  return { isLocked, cooldown, recordFailure, resetFailures };
}
