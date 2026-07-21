import { useState } from "react";

export function useLocalStorageState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      try {
        return JSON.parse(saved) as T;
      } catch {
        console.error(`Error parsing localStorage key "${key}"`);
      }
    }
    return defaultValue;
  });

  const setWithPersist = (value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  return [state, setWithPersist];
}
