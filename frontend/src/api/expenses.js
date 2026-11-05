import { request, fail, me, nextId, logActivity, requireMember } from './client';
import { membersOf } from './ledger';
import { computeSplits } from '../lib/split';
import { CATEGORIES } from '../lib/categories';
import { formatINR, MAX_EXPENSE_PAISE } from '../lib/money';
import { todayISO } from '../lib/dates';

/*
 Expense body sent by the form (the backend computes the paise per person, never trusts the client's maths):
 {
   "description": "Dinner", "amount_paise": 120000, "paid_by": 1, "category": "food",
   "date": "2026-11-05", "note": "", "split_type": "equal" | "exact" | "shares",
   "splits": [{ "member_id": 1 }]                       // equal
          or [{ "member_id": 1, "amount_paise": 60000 }] // exact
          or [{ "member_id": 1, "shares": 2 }]           // shares
 paid_by and member_id are MEMBER ids (people in this group, joined or added by name).
 }
*/
function validate(s, groupId, body) {
  const description = (body.description || '').trim();
  if (!description) fail(422, 'Add a description.');
  if (description.length > 60) fail(422, 'Keep the description under 60 characters.');
  const amount = body.amount_paise;
  if (!Number.isInteger(amount) || amount <= 0) fail(422, 'Enter an amount above ₹0.');
  if (amount > MAX_EXPENSE_PAISE) fail(422, `One expense can be at most ${formatINR(MAX_EXPENSE_PAISE)}.`);
  const memberIds = new Set(membersOf(s, groupId).map((m) => m.id));
  if (!memberIds.has(body.paid_by)) fail(422, 'The person who paid must be in the group.');
  if (!['equal', 'exact', 'shares'].includes(body.split_type)) fail(422, 'Unknown split type.');
  if (!CATEGORIES.some((c) => c.id === body.category)) fail(422, 'Unknown category.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date || '') || body.date > todayISO()) fail(422, 'Pick a date that is not in the future.');
  if ((body.note || '').length > 200) fail(422, 'Keep the note under 200 characters.');
  const rows = body.splits || [];
  if (!rows.length) fail(422, 'Pick at least one person to split with.');
  const ids = rows.map((r) => r.member_id);
  if (new Set(ids).size !== ids.length) fail(422, 'A person appears twice in the split.');
  if (ids.some((id) => !memberIds.has(id))) fail(422, 'Everyone in the split must be in the group.');
  if (body.split_type === 'exact') {
    if (rows.some((r) => !Number.isInteger(r.amount_paise) || r.amount_paise < 0)) fail(422, 'Split amounts must be ₹0 or more.');
    const sum = rows.reduce((t, r) => t + r.amount_paise, 0);
    if (sum !== amount) fail(422, `The split adds up to ${formatINR(sum)}, but the expense is ${formatINR(amount)}.`);
  }
  if (body.split_type === 'shares') {
    if (rows.some((r) => !Number.isInteger(r.shares) || r.shares < 0)) fail(422, 'Shares must be whole numbers.');
    if (!rows.some((r) => r.shares > 0)) fail(422, 'Give at least one person a share.');
  }
  return {
    description,
    amount_paise: amount,
    paid_by: body.paid_by,
    split_type: body.split_type,
    category: body.category,
    date: body.date,
    note: (body.note || '').trim(),
    splits: computeSplits({ amount_paise: amount, split_type: body.split_type, splits: rows }),
  };
}

function findExpense(s, expenseId, userId, { allowDeleted = false } = {}) {
  const e = s.expenses.find((x) => x.id === Number(expenseId));
  if (!e) fail(404, 'This expense does not exist.');
  requireMember(s, e.group_id, userId);
  if (e.deleted_at && !allowDeleted) fail(404, 'This expense was deleted.');
  return e;
}

/** POST /api/groups/{id}/expenses -> expense (expense + its splits are saved together in one transaction) */
export function createExpense(groupId, body) {
  return request((s) => {
    const user = me(s);
    const { group } = requireMember(s, groupId, user.id);
    const clean = validate(s, group.id, body);
    const now = new Date().toISOString();
    const e = { id: nextId(s, 'expense'), group_id: group.id, ...clean, created_by: user.id, created_at: now, updated_at: now, deleted_at: null };
    s.expenses.push(e);
    logActivity(s, group.id, user.id, 'expense_added', { expense_id: e.id, description: e.description, amount_paise: e.amount_paise });
    return e;
  }, { write: true });
}

/** PUT /api/expenses/{id} -> expense (the full expense body, like create; any member can edit; the change is logged) */
export function updateExpense(expenseId, body) {
  return request((s) => {
    const user = me(s);
    const e = findExpense(s, expenseId, user.id);
    const clean = validate(s, e.group_id, body);
    const labels = { description: 'description', amount_paise: 'amount', paid_by: 'payer', category: 'category', date: 'date', note: 'note' };
    const changes = Object.keys(labels).filter((k) => clean[k] !== e[k]).map((k) => labels[k]);
    if (JSON.stringify(clean.splits) !== JSON.stringify(e.splits) || clean.split_type !== e.split_type) changes.push('split');
    Object.assign(e, clean, { updated_at: new Date().toISOString() });
    if (changes.length) logActivity(s, e.group_id, user.id, 'expense_edited', { expense_id: e.id, description: e.description, changes });
    return e;
  }, { write: true });
}

/** DELETE /api/expenses/{id} -> soft delete (sets deleted_at), so it can be undone */
export function deleteExpense(expenseId) {
  return request((s) => {
    const user = me(s);
    const e = findExpense(s, expenseId, user.id);
    e.deleted_at = new Date().toISOString();
    logActivity(s, e.group_id, user.id, 'expense_deleted', { expense_id: e.id, description: e.description, amount_paise: e.amount_paise });
  }, { write: true });
}

/** POST /api/expenses/{id}/restore -> undo a delete */
export function restoreExpense(expenseId) {
  return request((s) => {
    const user = me(s);
    const e = findExpense(s, expenseId, user.id, { allowDeleted: true });
    if (!e.deleted_at) return e;
    e.deleted_at = null;
    logActivity(s, e.group_id, user.id, 'expense_restored', { expense_id: e.id, description: e.description, amount_paise: e.amount_paise });
    return e;
  }, { write: true });
}
