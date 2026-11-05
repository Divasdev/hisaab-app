// Balance maths. In the real app the backend does this (SQL SUM / GROUP BY + the greedy algorithm).
// This copy only powers the mock data so the UI can be built first.
// Everything is keyed by MEMBER id (a person inside one group, joined or not).
//
// net balance of a member = (what they paid) - (their share of expenses)
//                         + (settlements they sent) - (settlements they received)
// net > 0 -> the group owes them (they "get back")
// net < 0 -> they owe the group

export function netBalances(memberIds, expenses, settlements) {
  const net = Object.fromEntries(memberIds.map((id) => [id, 0]));
  const add = (id, v) => (net[id] = (net[id] || 0) + v);
  for (const e of expenses) {
    add(e.paid_by, e.amount_paise);
    for (const s of e.splits) add(s.member_id, -s.amount_paise);
  }
  for (const p of settlements) {
    add(p.from_member_id, p.amount_paise);
    add(p.to_member_id, -p.amount_paise);
  }
  return net;
}

/**
 * Fewest-payments plan (greedy). Repeatedly match the member who is owed the most with the
 * member who owes the most, and pay the smaller of the two amounts. The backend version uses
 * two heaps for the same idea. Ties are broken by member id so the result is stable.
 */
export function simplifyDebts(net) {
  const creditors = [];
  const debtors = [];
  for (const [id, v] of Object.entries(net)) {
    if (v > 0) creditors.push({ id: Number(id), v });
    if (v < 0) debtors.push({ id: Number(id), v: -v });
  }
  const byAmount = (a, b) => b.v - a.v || a.id - b.id;
  const plan = [];
  while (creditors.length && debtors.length) {
    creditors.sort(byAmount);
    debtors.sort(byAmount);
    const c = creditors[0];
    const d = debtors[0];
    const x = Math.min(c.v, d.v);
    plan.push({ from_member_id: d.id, to_member_id: c.id, amount_paise: x });
    c.v -= x;
    d.v -= x;
    if (c.v === 0) creditors.shift();
    if (d.v === 0) debtors.shift();
  }
  return plan;
}

/** Who owes whom without combining debts (one line per pair of members). */
export function pairwiseDebts(expenses, settlements) {
  const owes = new Map(); // "a>b" -> paise a owes b
  const add = (a, b, v) => owes.set(`${a}>${b}`, (owes.get(`${a}>${b}`) || 0) + v);
  for (const e of expenses) for (const s of e.splits) if (s.member_id !== e.paid_by) add(s.member_id, e.paid_by, s.amount_paise);
  for (const p of settlements) add(p.from_member_id, p.to_member_id, -p.amount_paise);
  const seen = new Set();
  const out = [];
  for (const key of owes.keys()) {
    const [a, b] = key.split('>').map(Number);
    const pair = [Math.min(a, b), Math.max(a, b)].join('-');
    if (seen.has(pair)) continue;
    seen.add(pair);
    const diff = (owes.get(`${a}>${b}`) || 0) - (owes.get(`${b}>${a}`) || 0);
    if (diff > 0) out.push({ from_member_id: a, to_member_id: b, amount_paise: diff });
    if (diff < 0) out.push({ from_member_id: b, to_member_id: a, amount_paise: -diff });
  }
  return out.sort((x, y) => y.amount_paise - x.amount_paise);
}
