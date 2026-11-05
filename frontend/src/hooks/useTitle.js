import { useEffect } from 'react';

/** Sets the browser tab title, which screen readers also announce on navigation. */
export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Hisaab` : 'Hisaab';
  }, [title]);
}
