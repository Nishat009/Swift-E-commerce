// Client-side checks shared by the sign-in, sign-up, reset and settings forms. They only give
// instant feedback: the backend validates the same rules again.
export const MIN_PASSWORD_LENGTH = 8;

/** '' when filled in, otherwise "<label> is required". */
export const requiredError = (value: string, label: string) => (value.trim() ? '' : `${label} is required`);

/** '' when the new password is long enough, otherwise the message to show. */
export const newPasswordError = (password: string) => {
  if (!password.trim()) return 'Password is required';
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  return '';
};
