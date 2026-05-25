import { useCallback, useEffect, useState } from 'react';

/**
 * Tiny typed localStorage hook. Reads on first render, writes back on
 * every set, and survives JSON parse failures by falling back to the
 * initial value (so a corrupt cache entry can't wedge the UI).
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (next: T) => void] {
  const read = useCallback((): T => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  }, [key, initial]);

  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage quota / private mode — silently fail; the in-memory
      // state is still the source of truth for the current session.
    }
  }, [key, value]);

  return [value, setValue];
}
