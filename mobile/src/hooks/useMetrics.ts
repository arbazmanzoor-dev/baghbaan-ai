import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { fetchMetrics, type Metrics } from '@/api/client';

const CACHE_KEY = 'baghbaan.metrics.v1';

type State = { metrics: Metrics | null; fetchedAt: string | null; loading: boolean };

/** Model metrics from GET /metrics, cached so the About screen still works offline. */
export function useMetrics(): State {
  const [state, setState] = useState<State>({ metrics: null, fetchedAt: null, loading: true });

  useEffect(() => {
    let active = true;
    (async () => {
      const cached = await AsyncStorage.getItem(CACHE_KEY).catch(() => null);
      if (cached && active) {
        const { metrics, fetchedAt } = JSON.parse(cached) as { metrics: Metrics; fetchedAt: string };
        setState({ metrics, fetchedAt, loading: true });
      }
      try {
        const metrics = await fetchMetrics();
        const fetchedAt = new Date().toISOString();
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ metrics, fetchedAt })).catch(() => undefined);
        if (active) setState({ metrics, fetchedAt, loading: false });
      } catch {
        if (active) setState((s) => ({ ...s, loading: false })); // keep cached values, if any
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return state;
}
