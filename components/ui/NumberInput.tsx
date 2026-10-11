'use client';

import { InputHTMLAttributes, useEffect, useState } from 'react';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number;
  onValueChange: (n: number) => void;
  /** Parse as whole number (parseInt) instead of decimal. */
  integer?: boolean;
  /** Show an empty field (with placeholder) instead of "0". */
  emptyWhenZero?: boolean;
}

/**
 * Numeric input that keeps the typed text separately from the numeric value,
 * so there are no leading zeros ("0100") and the field can be empty while typing.
 */
export default function NumberInput({ value, onValueChange, integer, emptyWhenZero, onBlur, ...rest }: NumberInputProps) {
  const fmt = (n: number) => (!Number.isFinite(n) || (n === 0 && emptyWhenZero) ? '' : String(n));
  const [text, setText] = useState(fmt(value));

  useEffect(() => {
    const parsed = integer ? parseInt(text, 10) : parseFloat(text);
    // Re-sync only when the outside value changed to something the text doesn't represent.
    if (!(Number.isNaN(parsed) ? value === 0 || text === '' : parsed === value)) setText(fmt(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      {...rest}
      type="number"
      inputMode={integer ? 'numeric' : 'decimal'}
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const n = integer ? parseInt(raw, 10) : parseFloat(raw);
        onValueChange(Number.isNaN(n) ? 0 : n);
      }}
      onBlur={(e) => {
        setText(fmt(value));
        onBlur?.(e);
      }}
    />
  );
}
