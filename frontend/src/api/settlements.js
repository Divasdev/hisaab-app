import { request, fail, me, nextId, logActivity, requireMember } from './client';
import { membersOf } from './ledger';

/**
 * POST /api/groups/{id}/settlements  { from_member_id, to_member_id, amount_paise, method: "upi" | "cash" }
 * Only the two people involved, or an admin, can record it.
 */
export function createSettlement(groupId, body) {
  return request((s) => {
    const user = me(s);
    const { group, membership } = requireMember(s, groupId, user.id);
    const ids = new Set(membersOf(s, group.id).map((m) => m.id));
    const { from_member_id: from, to_member_id: to, amount_paise: amount, method = 'upi' } = body;
    if (!ids.has(from) || !ids.has(to)) fail(422, 'Both people must be in the group.');
    if (from === to) fail(422, 'Pick two different people.');
    if (!Number.isInteger(amount) || amount <= 0) fail(422, 'Enter an amount above ₹0.');
    if (![from, to].includes(membership.id) && membership.role !== 'admin') fail(403, 'Only the two people involved or an admin can record this payment.');
    if (!['upi', 'cash'].includes(method)) fail(422, 'Unknown payment method.');
    const p = { id: nextId(s, 'settlement'), group_id: group.id, from_member_id: from, to_member_id: to, amount_paise: amount, method, created_by: user.id, created_at: new Date().toISOString() };
    s.settlements.push(p);
    logActivity(s, group.id, user.id, 'payment_added', { settlement_id: p.id, from_member_id: from, to_member_id: to, amount_paise: amount });
    return p;
  }, { write: true });
}

/** DELETE /api/settlements/{id} -> undo a payment that was marked by mistake */
export function deleteSettlement(settlementId) {
  return request((s) => {
    const user = me(s);
    const p = s.settlements.find((x) => x.id === Number(settlementId));
    if (!p) fail(404, 'This payment does not exist.');
    const { membership } = requireMember(s, p.group_id, user.id);
    if (![p.from_member_id, p.to_member_id].includes(membership.id) && p.created_by !== user.id && membership.role !== 'admin')
      fail(403, 'Only the people involved or an admin can remove this payment.');
    s.settlements = s.settlements.filter((x) => x !== p);
    logActivity(s, p.group_id, user.id, 'payment_removed', { from_member_id: p.from_member_id, to_member_id: p.to_member_id, amount_paise: p.amount_paise });
  }, { write: true });
}
