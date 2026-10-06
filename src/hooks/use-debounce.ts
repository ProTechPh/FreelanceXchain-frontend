'use client';

import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce a value by a specified delay in milliseconds.
 * Commonly used for search inputs, filters, or form values to avoid
 * excessive re-renders and network requests.
 *
 * @param value The value to debounce.
 * @param delay The delay in milliseconds (default: 300ms).
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
