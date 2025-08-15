import * as React from 'react';

export function useIsMobile(query = '(max-width: 768px') {
  const [isMobile, setIsMobile] = React.useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setIsMobile(mql.matches);
    onChange(); // Set initial state
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, [query]);
  return isMobile;
}