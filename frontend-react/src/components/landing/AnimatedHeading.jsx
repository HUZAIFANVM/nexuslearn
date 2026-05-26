import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

/**
 * AnimatedHeading — two-bar wipe-reveal text animation.
 *
 * Each line is wrapped in a relatively-positioned span with the text
 * underneath and TWO absolutely-positioned bars on top. Phases:
 *   A (cover):   scaleX 0→1, origin 0% 50%, 425 ms, ease-in-out
 *   B (uncover): scaleX 1→0, origin 100% 50%, 190 ms, ease-out
 * Text opacity flips 0→1 at the crossover. Trail bar lags lead by ~30 ms.
 * Colors default to NexusLearn brand (blue→purple gradient + dark navy trail).
 */

const COVER_MS = 425;
const UNCOVER_MS = 190;
const TRAIL_LAG_MS = 30;
const DEFAULT_STAGGER = 138;

function HeadingLine({ text, startDelay, triggered, leadBar, trailBar }) {
  // 0 = idle, 1 = covering, 2 = uncovering, 3 = done
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!triggered) return undefined;
    const t1 = setTimeout(() => setPhase(1), startDelay);
    const t2 = setTimeout(() => setPhase(2), startDelay + COVER_MS);
    const t3 = setTimeout(() => setPhase(3), startDelay + COVER_MS + UNCOVER_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [triggered, startDelay]);

  const barStyle = (isTrail) => {
    const lag = isTrail ? TRAIL_LAG_MS : 0;
    switch (phase) {
      case 1:
        return {
          transform: 'scaleX(1)',
          transformOrigin: '0% 50%',
          transition: `transform ${COVER_MS}ms cubic-bezier(0.85, 0, 0.15, 1) ${lag}ms`,
        };
      case 2:
        return {
          transform: 'scaleX(0)',
          transformOrigin: '100% 50%',
          transition: `transform ${UNCOVER_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${lag}ms`,
        };
      case 3:
        return { transform: 'scaleX(0)', transformOrigin: '100% 50%' };
      default:
        return { transform: 'scaleX(0)', transformOrigin: '0% 50%' };
    }
  };

  // Span visible once uncover phase begins — bars are still at scale=1 covering it.
  const spanVisible = phase >= 2;

  return (
    <Box
      component="span"
      sx={{ position: 'relative', display: 'inline-block', verticalAlign: 'baseline' }}
    >
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          opacity: spanVisible ? 1 : 0,
          '@media (prefers-reduced-motion: reduce)': { opacity: 1 },
        }}
      >
        {text}
      </Box>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: '-0.08em', bottom: '-0.08em',
          left: '-0.05em', right: '-0.05em',
          background: leadBar,
          willChange: 'transform',
          '@media (prefers-reduced-motion: reduce)': { display: 'none' },
          ...barStyle(false),
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: '-0.08em', bottom: '-0.08em',
          left: '-0.05em', right: '-0.05em',
          background: trailBar,
          willChange: 'transform',
          '@media (prefers-reduced-motion: reduce)': { display: 'none' },
          ...barStyle(true),
        }}
      />
    </Box>
  );
}

export default function AnimatedHeading({
  lines = [],
  delay = 600,
  staggerMs = DEFAULT_STAGGER,
  leadBar = 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
  trailBar = '#0F172A',
  triggerOnView = false,
  viewThreshold = 0.3,
  component = 'h1',
  sx,
  lineBreaks = true,
}) {
  const rootRef = useRef(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (!triggerOnView) {
      setTriggered(true);
      return undefined;
    }
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setTriggered(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          obs.disconnect();
        }
      },
      { threshold: viewThreshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [triggerOnView, viewThreshold]);

  return (
    <Box ref={rootRef} component={component} sx={sx}>
      {lines.map((line, i) => (
        <Box key={i} component="span" sx={{ display: 'inline' }}>
          <HeadingLine
            text={line}
            startDelay={delay + i * staggerMs}
            triggered={triggered}
            leadBar={leadBar}
            trailBar={trailBar}
          />
          {i < lines.length - 1 && (lineBreaks ? <Box component="br" /> : ' ')}
        </Box>
      ))}
    </Box>
  );
}
