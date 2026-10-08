import { useEffect, useRef, useState } from 'react';

// Animated counter for dashboard numbers. Jumps straight to the value when the user prefers reduced motion.
export function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || target === prev.current) { setValue(target); prev.current = target; return undefined; }
    const from = prev.current;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setValue(Math.round(from + (target - from) * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
