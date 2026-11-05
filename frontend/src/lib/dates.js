const dayFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const dayYearFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const longFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** Local date as "YYYY-MM-DD" (expense dates have no time or timezone). */
export function toISODate(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export const todayISO = () => toISODate(new Date());

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function daysAgo(iso) {
  return Math.round((parseDate(todayISO()) - parseDate(iso)) / 86400000);
}

/** "Today", "Yesterday", "Mon, 2 Nov", or "2 Nov 2025" for other years. */
export function dayLabel(iso) {
  const ago = daysAgo(iso);
  if (ago === 0) return 'Today';
  if (ago === 1) return 'Yesterday';
  const d = parseDate(iso);
  return d.getFullYear() === new Date().getFullYear() ? dayFmt.format(d) : dayYearFmt.format(d);
}

export const longDate = (iso) => longFmt.format(parseDate(iso));

/** For timestamps: "just now", "5 min ago", "3 h ago", "Yesterday", "2 Nov". */
export function timeAgo(isoDateTime) {
  const diff = (Date.now() - new Date(isoDateTime).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400 && new Date(isoDateTime).getDate() === new Date().getDate()) return `${Math.floor(diff / 3600)} h ago`;
  const day = toISODate(new Date(isoDateTime));
  if (daysAgo(day) === 1) return 'Yesterday';
  return shortFmt.format(new Date(isoDateTime));
}

/** "23 h 12 m" until an ISO timestamp, or null if it has passed. */
export function timeLeft(isoDateTime) {
  const ms = new Date(isoDateTime).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h} h ${m} m` : `${m} m`;
}
