/**
 * Glassmorphism + aurora-background style helpers.
 *
 * Pass a MUI theme to each helper; it returns an `sx`-compatible object that
 * adapts to light/dark mode. Use the spread pattern:
 *   sx={{ ...glassCard(theme), p: 3 }}
 */

const isDark = (theme) => theme.palette.mode === 'dark';

/* ------------------------------------------------------------------ */
/* Cards / panels — frosted, ~70% opaque, blurred                     */
/* ------------------------------------------------------------------ */
export const glassCard = (theme) => ({
  background: isDark(theme)
    ? 'rgba(17, 24, 39, 0.55)'
    : 'rgba(255, 255, 255, 0.62)',
  backdropFilter: 'blur(22px) saturate(160%)',
  WebkitBackdropFilter: 'blur(22px) saturate(160%)',
  border: '1px solid',
  borderColor: isDark(theme)
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.55)',
  boxShadow: isDark(theme)
    ? '0 12px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.04)'
    : '0 12px 40px -10px rgba(31, 38, 135, 0.18), inset 0 1px 0 rgba(255,255,255,0.7)',
});

/* Slightly less opaque variant (good for navbar / sticky surfaces) */
export const glassNavbar = (theme) => ({
  background: isDark(theme)
    ? 'rgba(11, 15, 26, 0.55)'
    : 'rgba(255, 255, 255, 0.55)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid',
  borderColor: isDark(theme)
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.6)',
  boxShadow: isDark(theme)
    ? '0 8px 32px rgba(0, 0, 0, 0.4)'
    : '0 8px 32px rgba(99, 102, 241, 0.10)',
});

/* ------------------------------------------------------------------ */
/* Glass button — for outlined / secondary CTAs                       */
/* ------------------------------------------------------------------ */
export const glassButton = (theme) => ({
  background: isDark(theme)
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(255, 255, 255, 0.45)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid',
  borderColor: isDark(theme)
    ? 'rgba(255, 255, 255, 0.14)'
    : 'rgba(255, 255, 255, 0.7)',
  color: isDark(theme) ? 'rgba(255,255,255,0.9)' : 'text.primary',
  boxShadow: isDark(theme)
    ? '0 4px 16px rgba(0, 0, 0, 0.3)'
    : '0 4px 16px rgba(99, 102, 241, 0.08)',
  transition: 'transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    background: isDark(theme)
      ? 'rgba(255, 255, 255, 0.10)'
      : 'rgba(255, 255, 255, 0.7)',
    transform: 'translateY(-1px)',
    boxShadow: isDark(theme)
      ? '0 8px 24px rgba(99, 102, 241, 0.25)'
      : '0 8px 24px rgba(99, 102, 241, 0.18)',
  },
});

/* ------------------------------------------------------------------ */
/* Aurora background — soft radial-gradient blobs                     */
/*                                                                    */
/* Use as the page background OR as a layered ::before / Box behind   */
/* content. Hits ~70-80% saturation in the blob centres, fades to     */
/* near-transparent at the edges.                                      */
/* ------------------------------------------------------------------ */
export const auroraBackground = (theme) => ({
  background: isDark(theme)
    ? `
        radial-gradient(circle at 12% 18%, rgba(59, 130, 246, 0.22) 0%, transparent 42%),
        radial-gradient(circle at 88% 12%, rgba(139, 92, 246, 0.26) 0%, transparent 45%),
        radial-gradient(circle at 78% 78%, rgba(236, 72, 153, 0.14) 0%, transparent 48%),
        radial-gradient(circle at 18% 82%, rgba(34, 211, 238, 0.14) 0%, transparent 42%),
        linear-gradient(180deg, #0B0F1A 0%, #111827 50%, #0B0F1A 100%)
      `
    : `
        radial-gradient(circle at 12% 18%, rgba(96, 165, 250, 0.45) 0%, transparent 45%),
        radial-gradient(circle at 88% 12%, rgba(167, 139, 250, 0.50) 0%, transparent 48%),
        radial-gradient(circle at 78% 78%, rgba(251, 191, 36, 0.28) 0%, transparent 48%),
        radial-gradient(circle at 18% 82%, rgba(45, 212, 191, 0.25) 0%, transparent 45%),
        linear-gradient(180deg, #FAFBFF 0%, #F5F3FF 50%, #FAFBFF 100%)
      `,
});

/* ------------------------------------------------------------------ */
/* Primary brand-gradient pill button                                  */
/*                                                                    */
/* Apply to a `<Button variant="contained">` for the canonical look. */
/* ------------------------------------------------------------------ */
export const brandPillButton = {
  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
  borderRadius: '999px',
  px: 3,
  py: 1.1,
  boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
    boxShadow: '0 12px 32px rgba(99,102,241,0.50)',
    transform: 'translateY(-1px)',
  },
  '&.Mui-disabled': {
    background: 'rgba(99,102,241,0.25)',
    color: '#fff',
    boxShadow: 'none',
  },
};

/* ------------------------------------------------------------------ */
/* Animation primitives                                                */
/*                                                                    */
/* All wrapped in @media (prefers-reduced-motion: no-preference) so   */
/* users who opted out of motion get a static UI.                     */
/* ------------------------------------------------------------------ */

/**
 * Apply to a card / element to fade-up on mount.
 * Use `delay={n * 50}` on staggered lists to cascade entries.
 */
export const fadeInUp = (delayMs = 0) => ({
  '@media (prefers-reduced-motion: no-preference)': {
    opacity: 0,
    transform: 'translateY(12px)',
    animation: 'nl-fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    animationDelay: `${delayMs}ms`,
  },
  '@keyframes nl-fadeInUp': {
    to: { opacity: 1, transform: 'translateY(0)' },
  },
});

/**
 * Slow gentle float for hero icons / decorative elements.
 */
export const floatGently = {
  '@media (prefers-reduced-motion: no-preference)': {
    animation: 'nl-float 6s ease-in-out infinite',
  },
  '@keyframes nl-float': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-6px)' },
  },
};

/**
 * Apply to an element that already has an `auroraBackground` to make the
 * aurora blobs slowly drift. Adds movement to an otherwise static background.
 */
export const auroraDrift = {
  '@media (prefers-reduced-motion: no-preference)': {
    animation: 'nl-aurora-drift 28s ease-in-out infinite alternate',
  },
  '@keyframes nl-aurora-drift': {
    '0%':   { backgroundPosition: '0% 0%, 100% 0%, 100% 100%, 0% 100%, 50% 50%' },
    '50%':  { backgroundPosition: '20% 30%, 70% 10%, 80% 90%, 30% 80%, 50% 50%' },
    '100%': { backgroundPosition: '0% 0%, 100% 0%, 100% 100%, 0% 100%, 50% 50%' },
  },
};

/**
 * Card hover: lift + soft brand-tinted glow shadow.
 * Combine with glassCard / fadeInUp etc.
 */
export const cardHoverLift = {
  transition: 'transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.35s ease, border-color 0.35s ease',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 24px 60px -18px rgba(99,102,241,0.35)',
    borderColor: 'rgba(139,92,246,0.45)',
  },
};

/**
 * Spring an icon inside a card when the card is hovered.
 * Apply this to the icon container; expects the parent card to use `.MuiCard-root:hover &` or similar.
 * Easiest pattern: parent card has `&:hover .nl-card-icon { ... }` already set up via this style.
 */
export const cardIconSpring = {
  className: 'nl-card-icon',
  transition: 'transform 0.45s cubic-bezier(0.34, 1.6, 0.64, 1)',
};

/**
 * Reveal helper for scroll-triggered animations — apply to any element
 * along with `inView` from useInView. Element starts invisible + translated,
 * snaps to visible state when `inView` becomes true.
 */
export const revealOnScroll = (inView, delayMs = 0) => ({
  opacity: inView ? 1 : 0,
  transform: inView ? 'translateY(0)' : 'translateY(24px)',
  transition: `opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1) ${delayMs}ms, transform 0.7s cubic-bezier(0.4, 0, 0.2, 1) ${delayMs}ms`,
  // Respect prefers-reduced-motion — show immediately.
  '@media (prefers-reduced-motion: reduce)': {
    opacity: 1,
    transform: 'none',
    transition: 'none',
  },
});

/**
 * Subtle "shine sweep" overlay that animates on hover.
 * Apply to a glass card; the card needs `position: relative; overflow: hidden`.
 */
export const glassShineHover = {
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background:
      'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
    transition: 'left 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  '&:hover::before': {
    '@media (prefers-reduced-motion: no-preference)': {
      left: '100%',
    },
  },
};

/**
 * Generic hover lift — translateY + shadow intensify.
 * Combine with a glass card.
 */
export const hoverLift = (theme) => ({
  transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: isDark(theme)
      ? '0 16px 40px rgba(99,102,241,0.25)'
      : '0 16px 40px -10px rgba(99,102,241,0.20)',
  },
});

/* Lighter version for sections that aren't the hero */
export const auroraBackgroundSubtle = (theme) => ({
  background: isDark(theme)
    ? `
        radial-gradient(ellipse 50% 40% at 90% 30%, rgba(139, 92, 246, 0.14) 0%, transparent 70%),
        radial-gradient(ellipse 50% 40% at 10% 70%, rgba(59, 130, 246, 0.12) 0%, transparent 70%),
        ${theme.palette.background.paper}
      `
    : `
        radial-gradient(ellipse 50% 40% at 90% 30%, rgba(167, 139, 250, 0.22) 0%, transparent 70%),
        radial-gradient(ellipse 50% 40% at 10% 70%, rgba(96, 165, 250, 0.18) 0%, transparent 70%),
        ${theme.palette.background.paper}
      `,
});
