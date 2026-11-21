import { useEffect, useState } from 'react';

const floorMinute = (d: Date) => {
  const c = new Date(d);
  c.setSeconds(0, 0);
  return c;
};

/** Current time, updated once per minute (stamps show minutes, not seconds). */
export function useMinuteClock() {
  const [now, setNow] = useState(() => floorMinute(new Date()));
  useEffect(() => {
    const id = setInterval(() => {
      const next = floorMinute(new Date());
      setNow((prev) => (prev.getTime() === next.getTime() ? prev : next));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
