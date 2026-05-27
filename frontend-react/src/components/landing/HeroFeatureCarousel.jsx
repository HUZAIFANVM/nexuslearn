import { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { FEATURES, DEMOS } from './featureDemos';

/**
 * HeroFeatureCarousel — coverflow card stack of the 5 feature demos.
 *
 * The active card is centered, focused and runs its animation (it remounts
 * via a nonce key on every navigation so the demo replays). Neighbouring
 * cards fan out behind it, scaled down, rotated in 3D and dimmed.
 *
 * Navigate via prev/next arrows, the dot pager, clicking a side card, or
 * swiping on touch devices. Auto-rotates; pauses while hovered/touched.
 */

const N = FEATURES.length;
const ROTATE_MS = 6000;

// Per-offset 3D placement. translateX is a % of the card's own width.
const PLACEMENT = {
  0:  { x: 0,    scale: 1,    rotateY: 0,   opacity: 1,    z: 50, blur: 0 },
  1:  { x: 52,   scale: 0.84, rotateY: -22, opacity: 0.55, z: 40, blur: 1.2 },
  2:  { x: 92,   scale: 0.68, rotateY: -28, opacity: 0.28, z: 30, blur: 2.4 },
};

function cardTransform(offset) {
  const abs = Math.min(Math.abs(offset), 2);
  const p = PLACEMENT[abs];
  const sign = offset === 0 ? 1 : Math.sign(offset);
  const x = p.x * sign;
  const rotateY = p.rotateY * sign;
  return {
    transform: `translate(-50%, -50%) translateX(${x}%) scale(${p.scale}) rotateY(${rotateY}deg)`,
    opacity: p.opacity,
    zIndex: p.z,
    filter: p.blur ? `blur(${p.blur}px)` : 'none',
    pointerEvents: abs > 2 ? 'none' : 'auto',
  };
}

export default function HeroFeatureCarousel() {
  const [active, setActive] = useState(0);
  const [nonce, setNonce] = useState(0); // bumps each navigation → remounts active demo
  const pausedRef = useRef(false);
  const touchX = useRef(null);

  const goTo = (i) => { setActive(((i % N) + N) % N); setNonce((k) => k + 1); };
  const step = (dir) => goTo(active + dir);

  // Auto-rotate; timer resets whenever active changes.
  useEffect(() => {
    const t = setTimeout(() => { if (!pausedRef.current) step(1); }, ROTATE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, nonce]);

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; pausedRef.current = true; };
  const onTouchEnd = (e) => {
    if (touchX.current != null) {
      const dx = e.changedTouches[0].clientX - touchX.current;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    }
    touchX.current = null;
    pausedRef.current = false;
  };

  // circular offset in range [-2..2] centred on active
  const offsetOf = (i) => {
    let o = i - active;
    if (o > N / 2) o -= N;
    if (o < -N / 2) o += N;
    return o;
  };

  return (
    <Box
      sx={{ width: '100%', maxWidth: 560, mx: 'auto' }}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* 3D stage */}
      <Box
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        sx={{
          position: 'relative',
          height: { xs: 460, md: 480 },
          perspective: '1600px',
          touchAction: 'pan-y',
        }}
      >
        {FEATURES.map((f, i) => {
          const offset = offsetOf(i);
          const isActive = offset === 0;
          const Demo = DEMOS[f.key];
          const place = cardTransform(offset);
          return (
            <Box
              key={f.key}
              onClick={() => { if (!isActive) goTo(i); }}
              role={isActive ? undefined : 'button'}
              aria-label={isActive ? undefined : `Show ${f.label}`}
              sx={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: { xs: 270, md: 300 },
                height: { xs: 430, md: 448 },
                cursor: isActive ? 'default' : 'pointer',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.55s ease, filter 0.55s ease',
                ...place,
              }}
            >
              <Box sx={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                borderRadius: '22px',
                p: { xs: 2, md: 2.5 },
                background: (t) => t.palette.mode === 'dark'
                  ? 'rgba(17,24,39,0.92)' : 'rgba(255,255,255,0.94)',
                border: '1px solid',
                borderColor: isActive ? `${f.color}99` : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
                boxShadow: isActive
                  ? `0 32px 80px -24px ${f.color}66, 0 0 0 1px ${f.color}33`
                  : '0 20px 50px -24px rgba(15,23,42,0.35)',
                overflow: 'hidden',
                transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
              }}>
                {/* card header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.3, mb: 1.75, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{
                    width: 38, height: 38, borderRadius: '11px', flexShrink: 0,
                    background: `linear-gradient(135deg, ${f.color} 0%, ${f.color}AA 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', boxShadow: `0 6px 16px ${f.color}55`,
                  }}>
                    {f.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={700} color="text.primary" sx={{ fontSize: '0.95rem', lineHeight: 1.15 }} noWrap>
                      {f.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                      {isActive ? 'Live preview' : 'Tap to preview'}
                    </Typography>
                  </Box>
                </Box>

                {/* demo body — active card remounts (replays) via nonce key */}
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  <Demo key={isActive ? `live-${nonce}` : `idle-${f.key}`} />
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* controls */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.75, mt: 1 }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {[{ d: -1, Icon: ChevronLeft, label: 'Previous' }, { d: 1, Icon: ChevronRight, label: 'Next' }].map(({ d, Icon, label }) => (
            <IconButton
              key={label}
              onClick={() => step(d)}
              aria-label={label}
              sx={{
                width: 42, height: 42,
                border: '1px solid',
                borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.12)',
                background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
                color: 'text.secondary',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: '#6366F1', color: '#6366F1', transform: 'translateY(-1px)' },
              }}
            >
              <Icon sx={{ fontSize: 22 }} />
            </IconButton>
          ))}
        </Box>
        {/* dot pager */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
          {FEATURES.map((f, i) => {
            const on = i === active;
            return (
              <Box
                key={f.key}
                onClick={() => goTo(i)}
                role="button"
                aria-label={`Show ${f.label}`}
                aria-pressed={on}
                sx={{
                  height: 7,
                  width: on ? 26 : 7,
                  borderRadius: 4,
                  cursor: 'pointer',
                  background: on
                    ? 'linear-gradient(90deg, #3B82F6, #8B5CF6)'
                    : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.16)',
                  transition: 'width 0.4s ease, background 0.4s ease',
                }}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
