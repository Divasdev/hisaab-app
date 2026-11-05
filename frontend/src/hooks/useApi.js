import { useCallback, useEffect, useRef, useState } from 'react';
import { onChange } from '../api/events';

/**
 * Loads data for a screen: const { data, error, loading } = useApi(() => gql(GROUP_SCREEN, { id }), [id])
 * - shows a loading state the first time
 * - reloads quietly (keeps old data on screen) whenever any write happens anywhere in the app
 * - ignores out-of-date responses if the inputs changed while a request was in flight
 */
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const requestId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback((quiet = false) => {
    const id = ++requestId.current;
    if (!quiet) setState({ data: undefined, error: null, loading: true });
    return Promise.resolve()
      .then(() => fnRef.current())
      .then(
        (data) => id === requestId.current && setState({ data, error: null, loading: false }),
        (error) => id === requestId.current && setState((s) => ({ data: quiet ? s.data : undefined, error, loading: false })),
      );
  }, deps);

  useEffect(() => {
    run(false);
    return onChange(() => run(true));
  }, [run]);

  return { ...state, reload: () => run(true) };
}
