// packages/frontend/src/hooks/usePageLoad.ts

import { useState, useEffect } from 'react';

export const usePageLoad = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return isLoaded;
};

export default usePageLoad;