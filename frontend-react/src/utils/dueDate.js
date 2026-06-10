/**
 * Due dates are stored server-side as the UTC instant of end-of-day Pakistan
 * time (UTC+5). The API serializes them as naive ISO (no trailing 'Z'), so we
 * append 'Z' to read them as the real UTC instant, then format/compare in PKT.
 */

const PKT_TZ = 'Asia/Karachi';

function toDate(due) {
  if (!due) return null;
  const iso = /[zZ]|[+-]\d\d:?\d\d$/.test(due) ? due : `${due}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "Jun 15, 2026" in Pakistan time, or '' if no due date. */
export function formatDueDate(due) {
  const d = toDate(due);
  if (!d) return '';
  return d.toLocaleDateString('en-US', {
    timeZone: PKT_TZ, month: 'short', day: 'numeric', year: 'numeric',
  });
}

/** True if the deadline has passed (now is after end-of-day PKT). */
export function isPastDue(due) {
  const d = toDate(due);
  return d ? Date.now() > d.getTime() : false;
}
