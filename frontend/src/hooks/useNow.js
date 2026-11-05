import { useEffect, useState } from 'react';

/** Re-renders every `ms` so countdowns ("expires in 23 h 12 m") stay current. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
