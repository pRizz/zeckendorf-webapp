import { useState, useEffect } from "react";

export const useElapsedTime = (isActive: boolean): number => {
  const [elapsedMilliseconds, setElapsedMilliseconds] = useState<number>(0);

  useEffect(() => {
    if (!isActive) {
      setElapsedMilliseconds(0);
      return;
    }

    const startTime = Date.now();
    setElapsedMilliseconds(0);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedMilliseconds(elapsed);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [isActive]);

  return elapsedMilliseconds;
};

