import { useEffect, useRef, useState } from 'react';

/**
 * useInView — observe an element's viewport intersection.
 *
 * Returns `[ref, inView]`. Attach `ref` to the element you want to watch;
 * `inView` flips to `true` the first time the element enters the viewport
 * and stays true (one-shot reveal). Pass `{ once: false }` to toggle on/off.
 */
export function useInView({ threshold = 0.15, rootMargin = '0px 0px -10% 0px', once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}

/**
 * useCountUp — animate a number from 0 to `target` over `duration` ms,
 * but only after `start` flips to true (typically via useInView).
 */
export function useCountUp(target, { duration = 1500, start = true, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return undefined;
    if (target === 0) { setValue(0); return undefined; }

    const startedAt = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - startedAt) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Number((eased * target).toFixed(decimals)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start, decimals]);

  return value;
}
