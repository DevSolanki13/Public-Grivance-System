import { useCallback, useEffect, useState } from 'react';
import { grievanceService } from '../services/grievanceService';
import { friendlyError } from '../lib/supabase';

// Runs fetcher() and routes the result into state, ignoring stale responses.
function useFetch(fetcher, enabled, onError) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    fetcher()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError(onError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // onError is a stable module-level formatter supplied by the callers below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, enabled, version]);

  // Re-fetch while keeping the current data on screen.
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data, setData, loading, error, reload };
}

const listError = (err) => `Failed to load grievances: ${friendlyError(err)}`;
const itemError = (err) => friendlyError(err);

// Loads the grievances visible to the signed-in user (RLS does the scoping).
export function useGrievances({ citizenId, enabled = true } = {}) {
  const fetcher = useCallback(() => grievanceService.getGrievances({ citizenId }), [citizenId]);
  const { data, loading, error, reload } = useFetch(fetcher, enabled, listError);
  return { grievances: data || [], loading, error, reload };
}

// Loads one grievance (with its timeline) by UUID or complaint ID.
export function useGrievance(id) {
  const fetcher = useCallback(() => grievanceService.getGrievanceById(id), [id]);
  const { data, setData, loading, error, reload } = useFetch(fetcher, Boolean(id), itemError);
  const notFound = !loading && !error && !data;
  return {
    grievance: data,
    setGrievance: setData,
    loading,
    error: notFound ? 'We could not find this grievance, or you do not have access to it.' : error,
    reload,
  };
}
