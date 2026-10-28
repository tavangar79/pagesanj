// Load data for a screen with loading, error and reload (every list needs all three states, PRD §9).
import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncState<T> = {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  reload: () => void;
  setData: (update: (prev: T | undefined) => T | undefined) => void;
};

export function useAsync<T>(load: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [data, setDataState] = useState<T>();
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    const call = ++latest.current;
    setLoading(true);
    setError(null);
    load().then(
      (result) => {
        if (call !== latest.current) return;
        setDataState(result);
        setLoading(false);
      },
      (err: unknown) => {
        if (call !== latest.current) return;
        setError(err);
        setLoading(false);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((update: (prev: T | undefined) => T | undefined) => setDataState(update), []);
  return { data, error, loading, reload, setData };
}

/** Tracks one action's pending flag (every action button shows a pending state). */
export function usePending() {
  const [pending, setPending] = useState<string | null>(null);
  const run = useCallback(async <R,>(key: string, fn: () => Promise<R>) => {
    setPending(key);
    try {
      return await fn();
    } finally {
      setPending(null);
    }
  }, []);
  return [pending, run] as const;
}
