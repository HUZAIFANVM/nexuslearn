/**
 * NexusMark — the NexusLearn brand glyph.
 *
 * A central knowledge hub with three connected satellite nodes. The top-right
 * satellite is intentionally pulled higher and rendered larger to suggest
 * upward growth (the "Learn" half of the name). The hub sits inside a faint
 * orbital ring for depth. Renders in `currentColor`, so it inherits whatever
 * text color the parent sets — designed to live on top of the brand
 * blue→purple gradient chip in white, but works in any monochrome context.
 */
export default function NexusMark({ size = 20, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="NexusLearn"
      {...rest}
    >
      {/* Faint orbital ring around the central hub — adds depth at hero size, fades at favicon size */}
      <circle cx="12" cy="12.2" r="5.6" stroke="currentColor" strokeWidth="0.9" opacity="0.22" />

      {/* Edge to the growth satellite (top-right) — emphasized */}
      <line x1="12" y1="12.2" x2="19" y2="4.5"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.95" />
      {/* Edge to the left satellite */}
      <line x1="12" y1="12.2" x2="4.5" y2="9"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      {/* Edge to the lower satellite */}
      <line x1="12" y1="12.2" x2="10.8" y2="20.5"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />

      {/* Central hub */}
      <circle cx="12" cy="12.2" r="3.4" fill="currentColor" />

      {/* Growth satellite — larger, fully opaque (the "rising" focal point) */}
      <circle cx="19" cy="4.5" r="2.3" fill="currentColor" />

      {/* Other satellites — slightly muted */}
      <circle cx="4.5" cy="9" r="1.7" fill="currentColor" opacity="0.8" />
      <circle cx="10.8" cy="20.5" r="1.7" fill="currentColor" opacity="0.8" />
    </svg>
  );
}
