import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  icon?: ReactNode;
}

/**
 * Shared look for every native <select> in the admin/product UI: same radius, padding,
 * focus ring and chevron (works in light and dark mode). Use: className={selectClass}
 * Add w-full (or leave auto width for inline selects such as sort / per-page).
 */
export const selectClass =
  "pl-3 pr-9 py-2 border border-gray-200 dark:border-gray-700 rounded-xl appearance-none cursor-pointer " +
  "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-medium " +
  "bg-no-repeat bg-[right_0.65rem_center] bg-[length:1rem_1rem] " +
  "bg-[url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%239ca3af%27%20stroke-width=%272.5%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E)] " +
  "focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/40 focus:border-[#8b6f47] transition disabled:opacity-60 disabled:cursor-not-allowed";

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={cn(
              selectClass,
              'w-full',
              icon && 'pl-9',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        {error && <p className="mt-1 text-xs font-bold text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
