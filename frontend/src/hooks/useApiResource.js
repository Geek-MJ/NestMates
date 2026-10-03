import { useCallback, useEffect, useState } from 'react';

/**
 * Loads one API resource. `load` must be stable (wrap it in useCallback) and
 * should accept an AbortSignal. A cancelled request does not become an error.
 */
export function useApiResource(load) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  const retry = useCallback(() => {
    setState({ status: 'loading', data: null, error: null });
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    load(controller.signal)
      .then((data) => {
        if (active) setState({ status: 'ready', data, error: null });
      })
      .catch((error) => {
        if (!active || error?.code === 'ERR_CANCELED') return;
        setState({ status: 'error', data: null, error });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [load, attempt]);

  return { ...state, retry };
}
