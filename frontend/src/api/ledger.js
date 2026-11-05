// Server-side helpers (mock only; the backend does this with SQL).
import { netBalances, simplifyDebts, pairwiseDebts } from '../lib/settle';

/** Active members of a group (joined or added by name), not removed ones. */
export const membersOf = (state, groupId) => state.members.filter((m) => m.group_id === groupId && !m.removed_at);
export const memberById = (state, id) => state.members.find((m) => m.id === id);

/** A joined member shows their account name; someone added by name shows that name. */
export function memberName(state, m) {
  if (!m) return 'Former member';
  const u = m.user_id && state.users.find((x) => x.id === m.user_id);
  return u ? u.name : m.name;
}

export const liveExpenses = (state, groupId) => state.expenses.filter((e) => e.group_id === groupId && !e.deleted_at);
export const settlementsOf = (state, groupId) => state.settlements.filter((p) => p.group_id === groupId);

/** { member_id: net_paise } for one group. */
export function groupNet(state, groupId) {
  const ids = membersOf(state, groupId).map((m) => m.id);
  return netBalances(ids, liveExpenses(state, groupId), settlementsOf(state, groupId));
}

export function groupLedger(state, groupId) {
  const net = groupNet(state, groupId);
  return {
    net,
    suggested: simplifyDebts(net),
    pairwise: pairwiseDebts(liveExpenses(state, groupId), settlementsOf(state, groupId)),
  };
}

export function lastActivityAt(state, groupId) {
  return state.activity.filter((a) => a.group_id === groupId).reduce((max, a) => (a.created_at > max ? a.created_at : max), '');
}
