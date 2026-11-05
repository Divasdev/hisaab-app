// All money in Hisaab is stored as whole paise (integers). ₹1 = 100 paise.
// Floats are never used for money, because 0.1 + 0.2 !== 0.3.

const whole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fraction = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const grouping = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** 12000000 -> "₹1,20,000"   34050 -> "₹340.50"   (always the absolute value) */
export function formatINR(paise) {
  const abs = Math.abs(Math.round(paise || 0));
  return abs % 100 === 0 ? whole.format(abs / 100) : fraction.format(abs / 100);
}

/** "1,200.5" -> 120050. Returns 0 for empty or invalid text. Works on the string, not floats. */
export function parseToPaise(text) {
  const clean = String(text ?? '').replace(/[^\d.]/g, '');
  if (!clean || clean === '.') return 0;
  const [rupees = '0', paise = ''] = clean.split('.');
  return Number(rupees || 0) * 100 + Number((paise + '00').slice(0, 2));
}

/** Formats what the user is typing: "120000.5" -> "1,20,000.5". Keeps one dot and two decimals. */
export function formatAmountInput(text) {
  let clean = String(text ?? '').replace(/[^\d.]/g, '');
  const dot = clean.indexOf('.');
  if (dot !== -1) clean = clean.slice(0, dot + 1) + clean.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  let [rupees, decimals] = clean.split('.');
  rupees = rupees.replace(/^0+(?=\d)/, '').slice(0, 9);
  const grouped = rupees ? grouping.format(Number(rupees)) : dot === 0 ? '0' : '';
  return decimals !== undefined ? `${grouped}.${decimals}` : grouped;
}

/** 120050 -> "1200.50", 120000 -> "1200" (for prefilling inputs) */
export function paiseToInput(paise) {
  if (!paise) return '';
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}

/** CSS width for an amount input so it hugs its text (digits are 1ch wide with tabular numbers). */
export function amountWidth(text) {
  const digits = (text.match(/\d/g) || []).length || 1;
  const marks = (text.match(/[,.]/g) || []).length;
  return `${digits * 0.93 + marks * 0.3 + 0.15}ch`;
}

export const MAX_EXPENSE_PAISE = 10_00_000_00; // ₹10,00,000
