// UPI deep links (NPCI linking spec): upi://pay?pa=<upi id>&pn=<name>&am=<rupees>&cu=INR&tn=<note>
// A link only opens the payment app. It never tells us whether the payment worked,
// so the app asks the user afterwards and they mark it as paid.

export const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;

export function upiLink({ upiId, name, amountPaise, note }) {
  const q = [
    `pa=${encodeURIComponent(upiId)}`,
    `pn=${encodeURIComponent(name)}`,
    `am=${(amountPaise / 100).toFixed(2)}`,
    'cu=INR',
    `tn=${encodeURIComponent(note.slice(0, 50))}`,
  ];
  return `upi://pay?${q.join('&')}`;
}

/** UPI apps only exist on phones. On a laptop the link does nothing, so we show the UPI ID instead. */
export function canOpenUpi() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
}
