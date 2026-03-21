import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook that polls a fetch function at a configurable interval.
 *
 * @param {Function} fetchFn - Async function to call on each tick
 * @param {number} intervalMs - Polling interval in milliseconds (default 15s)
 * @param {boolean} enabled - Whether polling is active
 * @returns {{ data, error, loading, refresh }}
 */
export function usePolling(fetchFn, intervalMs = 15000, enabled = true) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const fetchRef = useRef(fetchFn);

  // Keep fetchFn ref current without re-triggering effect
  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  const doFetch = useCallback(async () => {
    try {
      const result = await fetchRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    doFetch();

    // Set up interval
    intervalRef.current = setInterval(doFetch, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [doFetch, intervalMs, enabled]);

  const refresh = useCallback(() => {
    setLoading(true);
    doFetch();
  }, [doFetch]);

  return { data, error, loading, refresh };
}
