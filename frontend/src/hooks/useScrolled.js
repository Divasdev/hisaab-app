import { useEffect, useState } from 'react';

/** true once the page has scrolled past `threshold` px (used to materialise the glass top bar). */
export function useScrolled(threshold = 4) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const check = () => setScrolled(window.scrollY > threshold);
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, [threshold]);
  return scrolled;
}
