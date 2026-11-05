// How one expense is divided between the members of a group. Returns [{ member_id, amount_paise, shares }].
// A member is a person inside one group. They may or may not have joined Hisaab yet.
//
// Leftover-paisa rule: when an amount can't be divided evenly (₹100 between 3 = 33.333…),
// everyone gets the rounded-down amount and the leftover paise are handed out one each,
// in order of member id (lowest first). ₹100 / 3 -> 33.34, 33.33, 33.33.
// The backend must use the same rule so totals always add up exactly.

function distribute(amount, rows) {
  // rows: [{ member_id, weight }] -> each gets floor(amount * weight / totalWeight), leftovers by member id
  const total = rows.reduce((s, r) => s + r.weight, 0);
  if (total <= 0) return rows.map((r) => ({ member_id: r.member_id, amount_paise: 0 }));
  const sorted = [...rows].sort((a, b) => a.member_id - b.member_id);
  const out = sorted.map((r) => ({ member_id: r.member_id, amount_paise: Math.floor((amount * r.weight) / total), weight: r.weight }));
  let left = amount - out.reduce((s, r) => s + r.amount_paise, 0);
  for (let i = 0; left > 0; i = (i + 1) % out.length) {
    if (out[i].weight > 0) {
      out[i].amount_paise += 1;
      left -= 1;
    }
  }
  return out.map(({ member_id, amount_paise }) => ({ member_id, amount_paise }));
}

/** Equal split between the given user ids. */
export function splitEqual(amount, memberIds) {
  if (!memberIds.length) return [];
  return distribute(amount, memberIds.map((member_id) => ({ member_id, weight: 1 }))).map((r) => ({ ...r, shares: null }));
}

/** Split by shares, e.g. { 1: 2, 5: 1 } -> member 1 pays two parts, member 5 pays one part. */
export function splitShares(amount, sharesByMember) {
  const rows = Object.entries(sharesByMember)
    .map(([id, s]) => ({ member_id: Number(id), weight: Number(s) || 0 }))
    .filter((r) => r.weight > 0);
  return distribute(amount, rows).map((r) => ({ ...r, shares: sharesByMember[r.member_id] }));
}

/** Exact amounts typed by the user. The caller checks that they add up to the total. */
export function splitExact(amountsByMember) {
  return Object.entries(amountsByMember)
    .map(([id, paise]) => ({ member_id: Number(id), amount_paise: paise, shares: null }))
    .filter((r) => r.amount_paise > 0)
    .sort((a, b) => a.member_id - b.member_id);
}

/** One entry point used by both the form preview and the mock server. */
export function computeSplits({ amount_paise, split_type, splits }) {
  if (split_type === 'equal') return splitEqual(amount_paise, splits.map((s) => s.member_id));
  if (split_type === 'shares') return splitShares(amount_paise, Object.fromEntries(splits.map((s) => [s.member_id, s.shares])));
  if (split_type === 'exact') return splitExact(Object.fromEntries(splits.map((s) => [s.member_id, s.amount_paise])));
  throw new Error(`Unknown split type: ${split_type}`);
}
